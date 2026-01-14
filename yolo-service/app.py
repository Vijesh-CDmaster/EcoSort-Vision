from __future__ import annotations

import base64
import io
import os
from collections import Counter, deque
from threading import Lock
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

try:
    from ultralytics import YOLO
except Exception as e:  # pragma: no cover
    raise RuntimeError(
        "Failed to import ultralytics. Install deps with: pip install -r yolo-service/requirements.txt"
    ) from e


def _strip_data_uri_prefix(data: str) -> str:
    if data.startswith("data:") and "," in data:
        return data.split(",", 1)[1]
    return data


def _decode_image_from_base64(data: str) -> Image.Image:
    try:
        raw = base64.b64decode(_strip_data_uri_prefix(data), validate=False)
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image payload") from e


class PredictRequest(BaseModel):
    image: str
    conf: float | None = None
    # Optional fields for live-stream stabilization (voting)
    source: str | None = None  # e.g. "camera" | "upload"
    vote: bool | None = None
    streamId: str | None = None
    voteWindow: int | None = None
    voteMin: int | None = None


class Box(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class Detection(BaseModel):
    label: str
    confidence: float
    box: Box | None = None


class StableVote(BaseModel):
    label: str
    votes: int
    window: int
    frames: int
    ready: bool
    isStable: bool


class PredictResponse(BaseModel):
    model: str
    detections: list[Detection]
    top: Detection | None
    stable: StableVote | None = None


app = FastAPI(title="EcoSort YOLO Service")

_model_path = os.getenv("YOLO_MODEL_PATH")
if not _model_path:
    # default: yolo-service/models/yolo_model.pt (relative to this file)
    _model_path = os.path.join(os.path.dirname(__file__), "models", "yolo_model.pt")

_default_conf = float(os.getenv("YOLO_CONF", "0.60"))

_vote_window = int(os.getenv("YOLO_VOTE_WINDOW", "10"))
_vote_min = int(os.getenv("YOLO_VOTE_MIN", "6"))

# Buffers keyed by stream id (or source). This avoids cross-contamination between
# different camera sessions.
_vote_lock = Lock()
_vote_buffers: dict[str, deque[str]] = {}
_last_stable: dict[str, str] = {}

_NO_DETECTION = "__none__"


def _clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else 1.0 if x > 1.0 else x


def get_stable_prediction(key: str, new_label: str | None, *, window: int, min_votes: int) -> StableVote:
    """Return a stable label based on majority vote over the last N frames."""
    window = max(1, int(window))
    min_votes = max(1, int(min_votes))
    with _vote_lock:
        buf = _vote_buffers.get(key)
        if buf is None:
            buf = deque(maxlen=window)
            _vote_buffers[key] = buf
        elif buf.maxlen != window:
            # Recreate buffer to match requested window.
            existing = list(buf)
            buf = deque(existing[-window:], maxlen=window)
            _vote_buffers[key] = buf

        # Count every frame. If no detection, store a sentinel.
        buf.append(new_label if new_label else _NO_DETECTION)

        if not buf:
            return StableVote(label="Thinking...", votes=0, window=window, frames=0, ready=False, isStable=False)

        vote_counts = Counter(buf)
        winner, count = vote_counts.most_common(1)[0]

        frames = len(buf)
        ready = frames >= window

        display_label = "Unknown" if winner == _NO_DETECTION else winner

        if ready and count >= min_votes:
            if winner != _NO_DETECTION:
                _last_stable[key] = winner
            return StableVote(label=display_label, votes=int(count), window=window, frames=frames, ready=True, isStable=True)

        # Optional: keep last stable label to avoid UI flicker.
        last = _last_stable.get(key)
        if last:
            return StableVote(label=last, votes=int(count), window=window, frames=frames, ready=ready, isStable=False)

        # If we've collected the full window but no class is stable, report Unknown.
        if ready:
            return StableVote(label="Unknown", votes=int(count), window=window, frames=frames, ready=True, isStable=False)

        return StableVote(label="Thinking...", votes=int(count), window=window, frames=frames, ready=ready, isStable=False)

try:
    yolo = YOLO(_model_path)
except Exception as e:
    # Keep app booting, but fail predict with a clear message
    yolo = None  # type: ignore[assignment]
    _load_error = str(e)
else:
    _load_error = None


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "service": "EcoSort YOLO Service",
        "endpoints": ["/health", "/predict", "/docs"],
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": yolo is not None,
        "modelPath": _model_path,
        "defaultConf": _default_conf,
        "voteWindow": _vote_window,
        "voteMin": _vote_min,
        "error": _load_error,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    if yolo is None:
        raise HTTPException(
            status_code=500,
            detail=f"YOLO model not loaded from '{_model_path}'. Error: {_load_error}",
        )

    img = _decode_image_from_base64(req.image)
    conf = float(req.conf) if req.conf is not None else _default_conf
    conf = _clamp01(conf)

    results = yolo.predict(img, conf=conf, verbose=False)
    if not results:
        return PredictResponse(model=os.path.basename(_model_path), detections=[], top=None)

    r0 = results[0]
    names = getattr(r0, "names", {}) or {}

    detections: list[Detection] = []
    boxes = getattr(r0, "boxes", None)

    if boxes is not None and len(boxes) > 0:
        for b in boxes:
            cls_id = int(b.cls[0].item()) if hasattr(b, "cls") else -1
            conf_score = float(b.conf[0].item()) if hasattr(b, "conf") else 0.0
            label = str(names.get(cls_id, cls_id))

            xyxy = b.xyxy[0].tolist() if hasattr(b, "xyxy") else None
            box = None
            if xyxy and len(xyxy) == 4:
                box = Box(x1=float(xyxy[0]), y1=float(xyxy[1]), x2=float(xyxy[2]), y2=float(xyxy[3]))

            detections.append(Detection(label=label, confidence=conf_score, box=box))

    detections.sort(key=lambda d: d.confidence, reverse=True)
    top = detections[0] if detections else None

    # Voting is enabled by default for camera streams; can be forced with vote=true.
    vote_enabled = bool(req.vote) if req.vote is not None else (req.source == "camera")
    stable = None
    if vote_enabled:
        vote_key = req.streamId or req.source or "default"
        window = req.voteWindow if req.voteWindow is not None else _vote_window
        min_votes = req.voteMin if req.voteMin is not None else _vote_min
        stable = get_stable_prediction(vote_key, top.label if top else None, window=window, min_votes=min_votes)

    return PredictResponse(model=os.path.basename(_model_path), detections=detections, top=top, stable=stable)

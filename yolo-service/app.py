from __future__ import annotations

import base64
import io
import os
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


class Box(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class Detection(BaseModel):
    label: str
    confidence: float
    box: Box | None = None


class PredictResponse(BaseModel):
    model: str
    detections: list[Detection]
    top: Detection | None


app = FastAPI(title="EcoSort YOLO Service")

_model_path = os.getenv("YOLO_MODEL_PATH")
if not _model_path:
    # default: yolo-service/models/yolo_model.pt (relative to this file)
    _model_path = os.path.join(os.path.dirname(__file__), "models", "yolo_model.pt")

_default_conf = float(os.getenv("YOLO_CONF", "0.25"))

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

    return PredictResponse(model=os.path.basename(_model_path), detections=detections, top=top)

# EcoSort-Vision

## Run the Next.js app

```bash
cd EcoSort-Vision
npm install
npm run dev
```

Then open http://localhost:9002

## Integrate / run the local YOLO model (yolo_model.pt)

This repo includes a small Python inference service under `yolo-service/`.

1) Put your model at `yolo-service/models/yolo_model.pt` (or set `YOLO_MODEL_PATH`).

2) Create a Python venv and install deps:

```bash
cd EcoSort-Vision/yolo-service
python -m venv .venv
## Windows PowerShell:
.\.venv\Scripts\Activate.ps1

## macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

3) Start the YOLO API:

```bash
python -m uvicorn app:app --reload --port 8000
```

4) (Optional) Point Next.js to a different YOLO URL:

Set environment variable `YOLO_SERVICE_URL` (default is `http://127.0.0.1:8000`).

The Waste Scanner uses the local YOLO service for classification. Ensure the YOLO service is running before scanning.

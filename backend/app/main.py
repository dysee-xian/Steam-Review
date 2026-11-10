import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import dataset, persona, prediction, sentiment

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="Steam Review API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router, prefix="/api/dataset", tags=["dataset"])
app.include_router(sentiment.router, prefix="/api/sentiment", tags=["sentiment"])
app.include_router(persona.router, prefix="/api/persona", tags=["persona"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["prediction"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "steam-review-api"}

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.routes import absa, dataset, persona, prediction, sentiment
from app.services.model_loader import (
    ModelLoadError,
    load_dprf_config,
    load_model_bundle,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    application.state.dprf_config = load_dprf_config()
    try:
        application.state.model_bundle = load_model_bundle(
            application.state.dprf_config
        )
        application.state.model_load_error = None
    except ModelLoadError as error:
        application.state.model_bundle = None
        application.state.model_load_error = str(error)
        logger.warning("DPRF model bundle is unavailable: %s", error)
    yield


app = FastAPI(
    title="Steam Review DPRF API",
    version="0.2.0",
    lifespan=lifespan,
)
configured_origins = os.getenv("FRONTEND_ORIGINS")
if configured_origins:
    allowed_origins = [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
else:
    allowed_origins = [
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router, prefix="/api/dataset", tags=["dataset"])
app.include_router(sentiment.router, prefix="/api/sentiment", tags=["sentiment"])
app.include_router(absa.router, prefix="/api/absa", tags=["absa"])
app.include_router(persona.router, prefix="/api/persona", tags=["persona"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["prediction"])


@app.get("/api/health")
def health_check():
    models_loaded = getattr(app.state, "model_bundle", None) is not None
    response = {
        "status": "ok" if models_loaded else "degraded",
        "service": "steam-review-dprf-api",
        "models_loaded": models_loaded,
    }
    if not models_loaded:
        response["model_error"] = getattr(
            app.state,
            "model_load_error",
            "Model belum dimuat.",
        )
    return response

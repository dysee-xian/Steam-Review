from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.models.model import (
    EngagementPredictionRequest,
    EngagementPredictionResponse,
)
from app.services.batch_analytics import (
    BatchAnalyticsDataError,
    build_engagement_batch_status,
)
from app.services.data_processing import prepare_engagement_features
from app.services.engagement_prediction import predict_engagement_decline
from app.services.firebase_database import (
    FirebaseBackendError,
    get_analytics_node,
)
from app.services.model_loader import ModelLoadError, get_model_bundle

router = APIRouter()


@router.get("/batch")
def get_engagement_batch_status(request: Request) -> dict[str, Any]:
    firebase_error = None
    try:
        evaluation_metrics = get_analytics_node(
            "engagement_prediction/evaluation_metrics"
        )
    except FirebaseBackendError as error:
        evaluation_metrics = None
        firebase_error = str(error)

    try:
        return build_engagement_batch_status(
            request.app.state.dprf_config,
            evaluation_metrics,
            firebase_error,
        )
    except BatchAnalyticsDataError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.post("")
def predict_engagement(
    payload: EngagementPredictionRequest,
    request: Request,
) -> EngagementPredictionResponse:
    config = request.app.state.dprf_config

    try:
        columns = config["engagement_prediction"]["feature_columns"]
        values = prepare_engagement_features(payload.features, columns)
        ordered_features = dict(zip(columns, values, strict=True))
        result = predict_engagement_decline(
            ordered_features,
            get_model_bundle(request.app),
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except ModelLoadError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Prediksi engagement decline gagal diproses.",
        ) from error

    return EngagementPredictionResponse(**result)

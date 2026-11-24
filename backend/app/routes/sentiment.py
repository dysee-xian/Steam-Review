from fastapi import APIRouter, HTTPException, Request

from app.models.model import ReviewRequest, SentimentResponse
from app.services.model_loader import ModelLoadError, get_model_bundle
from app.services.sentiment_analysis import predict_sentiment

router = APIRouter()


@router.post("")
def analyze_sentiment(
    payload: ReviewRequest,
    request: Request,
) -> SentimentResponse:
    try:
        result = predict_sentiment(
            payload.review,
            get_model_bundle(request.app),
        )
    except ModelLoadError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Analisis sentimen gagal diproses.",
        ) from error

    return SentimentResponse(**result)

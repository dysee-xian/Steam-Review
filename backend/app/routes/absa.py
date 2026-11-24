from fastapi import APIRouter, HTTPException, Request

from app.models.model import ABSAResponse, ReviewRequest
from app.services.absa import analyze_review
from app.services.model_loader import ModelLoadError, get_model_bundle

router = APIRouter()


@router.post("")
def analyze_aspects(
    payload: ReviewRequest,
    request: Request,
) -> ABSAResponse:
    try:
        result = analyze_review(
            payload.review,
            get_model_bundle(request.app),
        )
    except ModelLoadError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Analisis ABSA gagal diproses.",
        ) from error

    return ABSAResponse(**result)

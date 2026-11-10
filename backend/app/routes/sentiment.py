from fastapi import APIRouter, HTTPException

from app.models.model import ReviewRequest

router = APIRouter()


@router.post("")
def analyze_sentiment(payload: ReviewRequest):
    raise HTTPException(
        status_code=501,
        detail="Analisis sentimen belum diimplementasikan.",
    )

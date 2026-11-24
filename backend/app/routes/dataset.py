from typing import Any

from fastapi import APIRouter, HTTPException

from app.services.firebase_database import (
    FirebaseBackendError,
    get_analytics_data,
)

router = APIRouter()


@router.get("")
def get_dataset() -> Any:
    try:
        data = get_analytics_data()
    except FirebaseBackendError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Node steam_review_analytics/v1 tidak ditemukan.",
        )
    return data

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("")
def predict_playtime(payload: dict):
    raise HTTPException(
        status_code=501,
        detail="Prediksi waktu bermain belum diimplementasikan.",
    )

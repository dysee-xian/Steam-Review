from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("")
def get_player_persona(payload: dict):
    raise HTTPException(
        status_code=501,
        detail="Analisis persona pemain belum diimplementasikan.",
    )

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("")
def get_dataset():
    raise HTTPException(
        status_code=501,
        detail="Endpoint dataset belum diimplementasikan.",
    )

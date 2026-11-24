from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.models.model import PersonaRequest, PersonaResponse
from app.services.batch_analytics import (
    BatchAnalyticsDataError,
    build_persona_batch_analysis,
)
from app.services.firebase_database import (
    FirebaseBackendError,
    get_analytics_node,
)
from app.services.persona_scoring import score_persona

router = APIRouter()


@router.get("/batch")
def get_persona_batch_analysis(request: Request) -> dict[str, Any]:
    try:
        source = get_analytics_node("saw/persona_summary")
    except FirebaseBackendError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    try:
        return build_persona_batch_analysis(
            source,
            request.app.state.dprf_config,
        )
    except BatchAnalyticsDataError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.post("")
def get_player_persona(
    payload: PersonaRequest,
    request: Request,
) -> PersonaResponse:
    try:
        result = score_persona(
            payload.model_dump(),
            request.app.state.dprf_config,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return PersonaResponse(**result)

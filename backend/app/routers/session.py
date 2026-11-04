import uuid
from fastapi import APIRouter, Request

from app.models import APIError, APIResponse
from app.services.session_manager import session_manager

router = APIRouter(prefix="/session", tags=["session"])

@router.get("")
async def get_session(request: Request):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)
    if not session:
        session = session_manager.create_session(session_id)

    return APIResponse(
        success=True,
        data=session,
        request_id=req_id,
    )

@router.delete("")
async def delete_session(request: Request):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session_manager.delete_session(session_id)

    return APIResponse(
        success=True,
        data={"deleted": True},
        request_id=req_id,
    )


import uuid
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.models import APIError, APIResponse, VisualStyle
from app.services.qa_engine import QAEngine
from app.services.session_manager import session_manager

router = APIRouter(prefix="/qa", tags=["qa"])
qa_engine = QAEngine()

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC
    language: str = "en"

@router.post("/ask")
async def ask_question(request: Request, body: QuestionRequest):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)

    if not session or not session.get("policy_document"):
        return APIResponse(
            success=False,
            error=APIError(
                code="NO_DOCUMENT",
                message="No document or text has been uploaded for this session.",
                retryable=False,
            ),
            request_id=req_id,
        )

    result = qa_engine.ask(
        question=body.question,
        session_id=session_id,
        style=body.style,
        language=body.language,
    )

    return APIResponse(
        success=True,
        data=result,
        request_id=req_id,
    )

@router.get("/history")
async def get_qa_history(request: Request):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)

    history = session.get("qa_history", []) if session else []
    return APIResponse(
        success=True,
        data={"history": history},
        request_id=req_id,
    )

@router.delete("/history")
async def clear_qa_history(request: Request):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)

    if session:
        session["qa_history"] = []

    return APIResponse(
        success=True,
        data={"cleared": True},
        request_id=req_id,
    )


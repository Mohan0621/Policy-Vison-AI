import uuid
from fastapi import APIRouter, Request, Response
from fastapi.responses import Response

from app.models import APIError, APIResponse, ExportError
from app.services.export_service import ExportService
from app.services.session_manager import session_manager

router = APIRouter(prefix="/export", tags=["export"])
export_service = ExportService()

@router.get("/image/{image_id}")
async def export_image(request: Request, image_id: str):
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)
    doc_name = (session.get("policy_document") or {}).get("filename", "Policy_Document.pdf") if session else "Policy.pdf"

    try:
        exported = export_service.export_image(
            session_id=session_id,
            image_id=image_id,
            document_name=doc_name,
            policy_id=f"POL-{image_id[:6].upper()}",
        )
        return Response(
            content=exported.file_bytes,
            media_type=exported.mime_type,
            headers={"Content-Disposition": f'inline; filename="{exported.filename}"'},
        )
    except ExportError as e:
        return Response(
            content=f"Error: {e.message}".encode(),
            status_code=400,
            media_type="text/plain",
        )

@router.post("/session-zip")
async def export_session_zip(request: Request):
    session_id = request.state.session_id
    try:
        exported = export_service.export_session_zip(session_id=session_id)
        return Response(
            content=exported.file_bytes,
            media_type=exported.mime_type,
            headers={"Content-Disposition": f'attachment; filename="{exported.filename}"'},
        )
    except ExportError as e:
        return Response(
            content=f"Error: {e.message}".encode(),
            status_code=500 if e.retryable else 400,
            media_type="text/plain",
        )


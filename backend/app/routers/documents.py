import uuid
from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field

from app.models import APIError, APIResponse, DocumentProcessingError, IndexingError
from app.services.document_processor import DocumentProcessor
from app.services.rag_pipeline import rag_pipeline
from app.services.session_manager import session_manager

router = APIRouter(prefix="/documents", tags=["documents"])
doc_processor = DocumentProcessor()

class TextInputRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

@router.post("/upload")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id

    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        return APIResponse(
            success=False,
            error=APIError(
                code="UNSUPPORTED_FORMAT",
                message="Only PDF files are supported. Please convert your document to PDF.",
                retryable=False,
            ),
            request_id=req_id,
        )

    file_bytes = await file.read()

    try:
        processed_doc = doc_processor.process_pdf(file_bytes, filename)
    except DocumentProcessingError as e:
        return APIResponse(
            success=False,
            error=APIError(code=e.code, message=e.message, retryable=False),
            request_id=req_id,
        )

    # Initialize session document status
    session_manager.update_session(session_id, {
        "policy_document": {
            "filename": filename,
            "page_count": processed_doc.page_count,
            "index_status": "indexing",
        }
    })

    # Start indexing in background / sync for reliability
    try:
        rag_pipeline.index_document(processed_doc, session_id)
        session_manager.update_session(session_id, {
            "policy_document": {
                "filename": filename,
                "page_count": processed_doc.page_count,
                "index_status": "ready",
            }
        })
        index_status = "ready"
    except IndexingError as e:
        session_manager.update_session(session_id, {
            "policy_document": {
                "filename": filename,
                "page_count": processed_doc.page_count,
                "index_status": "failed",
            }
        })
        return APIResponse(
            success=False,
            error=APIError(code=e.code, message=e.message, retryable=True),
            request_id=req_id,
        )

    return APIResponse(
        success=True,
        data={
            "session_id": session_id,
            "document_name": filename,
            "page_count": processed_doc.page_count,
            "index_status": index_status,
        },
        request_id=req_id,
    )

@router.post("/text")
async def submit_text(request: Request, body: TextInputRequest):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id

    try:
        processed_doc = doc_processor.process_text(body.text)
    except DocumentProcessingError as e:
        return APIResponse(
            success=False,
            error=APIError(code=e.code, message=e.message, retryable=False),
            request_id=req_id,
        )

    session_manager.update_session(session_id, {
        "text_description": body.text,
        "policy_document": {
            "filename": "Free Text Policy",
            "page_count": 0,
            "index_status": "indexing",
        }
    })

    try:
        rag_pipeline.index_document(processed_doc, session_id)
        session_manager.update_session(session_id, {
            "policy_document": {
                "filename": "Free Text Policy",
                "page_count": 0,
                "index_status": "ready",
            }
        })
        index_status = "ready"
    except IndexingError as e:
        return APIResponse(
            success=False,
            error=APIError(code=e.code, message=e.message, retryable=True),
            request_id=req_id,
        )

    return APIResponse(
        success=True,
        data={
            "session_id": session_id,
            "character_count": len(body.text),
            "index_status": index_status,
        },
        request_id=req_id,
    )

@router.get("/status")
async def get_document_status(request: Request):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)
    if not session or not session.get("policy_document"):
        return APIResponse(
            success=True,
            data={"index_status": "no_document"},
            request_id=req_id,
        )
    return APIResponse(
        success=True,
        data=session["policy_document"],
        request_id=req_id,
    )


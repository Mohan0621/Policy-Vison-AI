import uuid
import concurrent.futures
from typing import Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.models import (
    APIError,
    APIResponse,
    ImageGenerationError,
    LLMTimeoutError,
    SimplifiedExplanation,
    VisualStyle,
)
from app.services.image_generator import ImageGenerator
from app.services.llm_engine import LLMEngine
from app.services.rag_pipeline import rag_pipeline
from app.services.session_manager import session_manager
from app.services.visual_prompt_builder import VisualPromptBuilder

router = APIRouter(prefix="/generate", tags=["generate"])

llm_engine = LLMEngine()
prompt_builder = VisualPromptBuilder()
image_generator = ImageGenerator()
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

class ExplanationRequest(BaseModel):
    language: str = "en"
    style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC

class VisualRequest(BaseModel):
    style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC
    language: str = "en"

@router.post("/explanation")
async def generate_explanation(request: Request, body: ExplanationRequest):
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

    # 1. Retrieve top passages
    passages = rag_pipeline.retrieve(
        query="policy coverage benefits limits exclusions claim procedure",
        session_id=session_id,
        top_k=8,
        min_score=0.1,  # Broader retrieval for full summary
    )

    if not passages:
        # Fallback dummy passage from session text if available
        raw_text = session.get("text_description") or "Insurance policy coverage"
        passages = rag_pipeline.retrieve(query=raw_text[:50], session_id=session_id, top_k=3, min_score=0.0)

    try:
        # 2. Extract fields
        fields = llm_engine.extract_fields(passages)
        # 3. Simplify
        explanation = llm_engine.simplify(fields, passages, language=body.language)
        
        # 4. Verify statements (RAG Grounding)
        statements = [explanation.what_is_covered, explanation.what_is_not_covered, explanation.how_to_claim]
        verifications = rag_pipeline.verify_statements(statements, session_id=session_id)

        # Store in session
        expl_dict = {
            "what_is_covered": explanation.what_is_covered,
            "what_is_not_covered": explanation.what_is_not_covered,
            "how_to_claim": explanation.how_to_claim,
            "language": explanation.language,
            "fk_grade_level": explanation.fk_grade_level,
            "fallback_language": explanation.fallback_language,
        }
        session_manager.update_session(session_id, {
            "simplified_explanation": expl_dict,
            "selected_language": body.language,
            "selected_style": body.style.value,
        })

        return APIResponse(
            success=True,
            data={
                "explanation": expl_dict,
                "citations": [
                    {
                        "document_name": c.document_name,
                        "page_number": c.page_number,
                        "section_heading": c.section_heading,
                        "passage_text": c.passage_text,
                        "relevance_score": c.relevance_score,
                    }
                    for c in explanation.source_citations
                ],
                "verifications": [
                    {"statement": v.statement, "supported": v.supported, "score": v.relevance_score}
                    for v in verifications
                ],
            },
            request_id=req_id,
        )
    except LLMTimeoutError as e:
        return APIResponse(
            success=False,
            error=APIError(code=e.code, message=e.message, retryable=True),
            request_id=req_id,
        )

@router.post("/coverage-visual")
async def generate_coverage_visual(request: Request, body: VisualRequest):
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

    task_id = str(uuid.uuid4())
    tasks = session.setdefault("active_tasks", {})
    tasks[task_id] = {"status": "pending", "result": None}

    def _task_worker():
        try:
            tasks[task_id]["status"] = "running"
            passages = rag_pipeline.retrieve("coverage limits inpatient benefits", session_id=session_id, top_k=5, min_score=0.1)
            fields = llm_engine.extract_fields(passages)
            prompt = prompt_builder.build_coverage_prompt(fields, style=body.style, language=body.language)
            
            gen_img = image_generator.generate(prompt, session_id=session_id, visual_type="coverage")
            
            res_payload = {
                "image_id": gen_img.image_id,
                "image_url": f"/api/v1/export/image/{gen_img.image_id}",
                "width": gen_img.width,
                "height": gen_img.height,
                "citations": [
                    {"document_name": c.document_name, "page_number": c.page_number, "section_heading": c.section_heading, "passage_text": c.passage_text, "relevance_score": c.relevance_score}
                    for c in prompt.source_citations
                ],
            }
            tasks[task_id] = {"status": "complete", "result": res_payload}
            session.setdefault("visual_explainers", []).append({
                "image_id": gen_img.image_id,
                "type": "coverage",
                "citations": res_payload["citations"],
            })
        except Exception as e:
            tasks[task_id] = {"status": "failed", "error": str(e)}

    executor.submit(_task_worker)

    return APIResponse(
        success=True,
        data={"task_id": task_id, "status": "pending"},
        request_id=req_id,
    )

@router.post("/claims-visual")
async def generate_claims_visual(request: Request, body: VisualRequest):
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

    task_id = str(uuid.uuid4())
    tasks = session.setdefault("active_tasks", {})
    tasks[task_id] = {"status": "pending", "result": None}

    def _task_worker():
        try:
            tasks[task_id]["status"] = "running"
            passages = rag_pipeline.retrieve("claim procedure cashless reimbursement", session_id=session_id, top_k=5, min_score=0.1)
            steps = llm_engine.extract_claim_steps(passages)
            prompt = prompt_builder.build_claims_prompt(steps, style=body.style, has_dual_path=True, language=body.language)
            
            gen_img = image_generator.generate(prompt, session_id=session_id, visual_type="claims")
            
            res_payload = {
                "image_id": gen_img.image_id,
                "image_url": f"/api/v1/export/image/{gen_img.image_id}",
                "width": gen_img.width,
                "height": gen_img.height,
                "citations": [
                    {"document_name": c.document_name, "page_number": c.page_number, "section_heading": c.section_heading, "passage_text": c.passage_text, "relevance_score": c.relevance_score}
                    for c in prompt.source_citations
                ],
            }
            tasks[task_id] = {"status": "complete", "result": res_payload}
            session.setdefault("visual_explainers", []).append({
                "image_id": gen_img.image_id,
                "type": "claims",
                "citations": res_payload["citations"],
            })
        except Exception as e:
            tasks[task_id] = {"status": "failed", "error": str(e)}

    executor.submit(_task_worker)

    return APIResponse(
        success=True,
        data={"task_id": task_id, "status": "pending"},
        request_id=req_id,
    )

@router.get("/status/{task_id}")
async def get_task_status(request: Request, task_id: str):
    req_id = str(uuid.uuid4())
    session_id = request.state.session_id
    session = session_manager.get_session(session_id)

    if not session:
        return APIResponse(
            success=False,
            error=APIError(code="SESSION_EXPIRED", message="Session has expired.", retryable=False),
            request_id=req_id,
        )

    task = session.get("active_tasks", {}).get(task_id)
    if not task:
        return APIResponse(
            success=False,
            error=APIError(code="TASK_NOT_FOUND", message=f"Task {task_id} not found.", retryable=False),
            request_id=req_id,
        )

    return APIResponse(
        success=True,
        data=task,
        request_id=req_id,
    )


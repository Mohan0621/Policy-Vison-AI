import uuid
import concurrent.futures
from typing import Any, Dict, Optional

from app.config import settings
from app.models import (
    QAAnswer,
    QAMessage,
    SourceCitation,
    VisualStyle,
)
from app.services.llm_engine import LLMEngine
from app.services.rag_pipeline import RAGPipeline, rag_pipeline as shared_rag_pipeline
from app.services.session_manager import SessionManager, session_manager
from app.services.visual_prompt_builder import VisualPromptBuilder
from app.services.image_generator import ImageGenerator

class QAEngine:
    def __init__(
        self,
        rag_pipeline: Optional[RAGPipeline] = None,
        llm_engine: Optional[LLMEngine] = None,
        prompt_builder: Optional[VisualPromptBuilder] = None,
        image_generator: Optional[ImageGenerator] = None,
        session_mgr: Optional[SessionManager] = None,
        executor: Optional[concurrent.futures.ThreadPoolExecutor] = None,
    ):
        self.rag = rag_pipeline or shared_rag_pipeline
        self.llm = llm_engine or LLMEngine()
        self.prompt_builder = prompt_builder or VisualPromptBuilder()
        self.image_generator = image_generator or ImageGenerator()
        self.session_mgr = session_mgr or session_manager
        self.executor = executor or concurrent.futures.ThreadPoolExecutor(max_workers=4)

    def ask(
        self,
        question: str,
        session_id: str,
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Processes a multi-turn Q&A question:
        1. Retrieve top-5 passages from RAGPipeline.
        2. If none found: return no-relevant-content message.
        3. Answer question with LLMEngine.
        4. Append Q&A interaction to session history.
        5. If is_visual_needed: trigger visual explainer and return task_id.
        """
        session = self.session_mgr.get_session(session_id)
        if not session:
            session = self.session_mgr.create_session(session_id)

        # Retrieve relevant passages
        passages = self.rag.retrieve(query=question, session_id=session_id, top_k=5, min_score=0.35)
        
        if not passages:
            answer_text = (
                "This information is not available in the provided document. "
                "Try rephrasing or uploading a more complete document."
            )
            # Record question and response
            self.session_mgr.add_qa_message(session_id, role="user", content=question)
            self.session_mgr.add_qa_message(session_id, role="assistant", content=answer_text)
            return {
                "answer": answer_text,
                "citations": [],
                "visual_task_id": None,
                "no_content_message": True,
            }

        # Convert session history to QAMessage objects
        raw_history = session.get("qa_history", [])
        history_msgs = [
            QAMessage(
                role=m["role"],
                content=m["content"],
                citations=[],
                timestamp=m["timestamp"],
            )
            for m in raw_history[-10:]
        ]

        # Call LLM Engine with timeout
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                self.llm.answer_question,
                question,
                passages,
                history_msgs,
                settings.LLM_QA_TIMEOUT_SEC,
            )
            try:
                qa_answer: QAAnswer = future.result(timeout=settings.LLM_QA_TIMEOUT_SEC)
            except concurrent.futures.TimeoutError:
                qa_answer = QAAnswer(
                    text="Request timed out while formulating response. Please try again.",
                    is_visual_needed=False,
                    citations=[],
                )

        citation_dicts = [
            {
                "document_name": c.document_name,
                "page_number": c.page_number,
                "section_heading": c.section_heading,
                "passage_text": c.passage_text,
                "relevance_score": c.relevance_score,
            }
            for c in qa_answer.citations
        ]

        # Save to history
        self.session_mgr.add_qa_message(session_id, role="user", content=question)
        self.session_mgr.add_qa_message(
            session_id,
            role="assistant",
            content=qa_answer.text,
            citations=citation_dicts,
        )

        visual_task_id = None
        if qa_answer.is_visual_needed:
            visual_task_id = str(uuid.uuid4())
            prompt = self.prompt_builder.build_qa_visual_prompt(
                answer=qa_answer,
                style=style,
                language=language,
            )
            if prompt:
                # Store task and run generation
                tasks = session.setdefault("active_tasks", {})
                tasks[visual_task_id] = {"status": "pending", "result": None}

                def _run_gen():
                    try:
                        tasks[visual_task_id]["status"] = "running"
                        gen_img = self.image_generator.generate(
                            prompt=prompt,
                            session_id=session_id,
                            visual_type="qa_answer",
                        )
                        tasks[visual_task_id] = {
                            "status": "complete",
                            "result": {
                                "image_id": gen_img.image_id,
                                "image_url": f"/api/v1/export/image/{gen_img.image_id}",
                                "width": gen_img.width,
                                "height": gen_img.height,
                                "citations": citation_dicts,
                            },
                        }
                        session.setdefault("visual_explainers", []).append({
                            "image_id": gen_img.image_id,
                            "type": "qa_answer",
                            "citations": citation_dicts,
                        })
                    except Exception as e:
                        tasks[visual_task_id] = {
                            "status": "failed",
                            "error": str(e),
                        }

                self.executor.submit(_run_gen)

        return {
            "answer": qa_answer.text,
            "citations": citation_dicts,
            "visual_task_id": visual_task_id,
            "no_content_message": False,
        }


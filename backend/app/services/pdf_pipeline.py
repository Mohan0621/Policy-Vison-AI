"""
pdf_pipeline.py
---------------
End-to-end pipeline: PDF bytes → extracted policy fields → multilingual
simplified explanation → language-adapted image prompt.

Pipeline stages
---------------
1. DocumentProcessor.process_pdf()   — parse PDF, extract structured chunks
2. RAGPipeline.index_document()       — embed chunks into vector store
3. RAGPipeline.retrieve()             — pull top-k passages per field query
4. LLMEngine.extract_fields()         — structured field extraction
5. LLMEngine.simplify()               — plain-language three-section explanation
6. MultilingualPromptBuilder.build()  — language-adapted image generation prompts

Every stage runs inside a hard timeout enforced by concurrent.futures.
If any stage exceeds its allotted seconds, a PipelineTimeoutError is raised
and the pipeline stops cleanly — no dangling threads, no partial state saved.
"""

import concurrent.futures
import time
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from app.config import settings
from app.models import (
    ClaimStep,
    ImagePrompt,
    PolicyFields,
    ProcessedDocument,
    RetrievedPassage,
    SimplifiedExplanation,
    VisualStyle,
)
from app.services.document_processor import DocumentProcessor
from app.services.llm_engine import LLMEngine
from app.services.multilingual_prompt_builder import MultilingualPromptBuilder
from app.services.rag_pipeline import RAGPipeline, rag_pipeline as shared_rag


# ---------------------------------------------------------------------------
# Pipeline result dataclass
# ---------------------------------------------------------------------------

@dataclass
class PipelineResult:
    """Complete output produced by PolicyExtractionPipeline.run()."""

    # Stage outputs — all fields are populated on success
    processed_doc: Optional[ProcessedDocument] = None
    passages: List[RetrievedPassage] = field(default_factory=list)
    fields: Optional[PolicyFields] = None
    explanation: Optional[SimplifiedExplanation] = None
    coverage_prompt: Optional[ImagePrompt] = None
    claims_prompt: Optional[ImagePrompt] = None
    claim_steps: List[ClaimStep] = field(default_factory=list)

    # Diagnostics
    elapsed_seconds: float = 0.0
    timed_out: bool = False
    timed_out_stage: Optional[str] = None
    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return not self.timed_out and self.error is None and self.explanation is not None


# ---------------------------------------------------------------------------
# Pipeline timeout error
# ---------------------------------------------------------------------------

class PipelineTimeoutError(Exception):
    """Raised when a pipeline stage exceeds its allotted time."""
    def __init__(self, stage: str, timeout_sec: int):
        self.stage = stage
        self.timeout_sec = timeout_sec
        super().__init__(
            f"Pipeline stage '{stage}' exceeded {timeout_sec}s timeout and was stopped."
        )


# ---------------------------------------------------------------------------
# Main pipeline class
# ---------------------------------------------------------------------------

class PolicyExtractionPipeline:
    """
    Orchestrates the full policy-to-visual pipeline with per-stage timeouts.

    Usage
    -----
    pipeline = PolicyExtractionPipeline()
    result = pipeline.run(
        file_bytes=pdf_bytes,
        filename="health_policy.pdf",
        session_id="abc123",
        language="hi",
        style=VisualStyle.PROFESSIONAL_INFOGRAPHIC,
    )
    if result.success:
        coverage_prompt = result.coverage_prompt
        claims_prompt   = result.claims_prompt
    elif result.timed_out:
        print(f"Stopped at stage: {result.timed_out_stage}")
    """

    # Per-stage timeout budgets (seconds)
    STAGE_TIMEOUTS = {
        "pdf_parse":       60,   # DocumentProcessor.process_pdf
        "rag_index":       30,   # RAGPipeline.index_document
        "rag_retrieve":    10,   # RAGPipeline.retrieve (fast embedding lookup)
        "field_extract":  120,   # LLMEngine.extract_fields
        "simplify":        15,   # LLMEngine.simplify
        "claim_steps":     15,   # LLMEngine.extract_claim_steps
        "prompt_build":     5,   # MultilingualPromptBuilder (deterministic, fast)
    }

    def __init__(
        self,
        doc_processor: Optional[DocumentProcessor] = None,
        rag: Optional[RAGPipeline] = None,
        llm: Optional[LLMEngine] = None,
        prompt_builder: Optional[MultilingualPromptBuilder] = None,
    ):
        self.doc_processor = doc_processor or DocumentProcessor()
        self.rag = rag or shared_rag
        self.llm = llm or LLMEngine()
        self.prompt_builder = prompt_builder or MultilingualPromptBuilder()

    # ------------------------------------------------------------------
    # Internal helper: run a callable in a thread with a hard timeout
    # ------------------------------------------------------------------

    @staticmethod
    def _run_with_timeout(stage_name: str, timeout_sec: int, fn, *args, **kwargs):
        """
        Executes fn(*args, **kwargs) in a ThreadPoolExecutor.
        Raises PipelineTimeoutError if it does not complete within timeout_sec.
        Re-raises any exception raised inside fn.
        """
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(fn, *args, **kwargs)
            try:
                return future.result(timeout=timeout_sec)
            except concurrent.futures.TimeoutError:
                # Cancel is advisory on CPython but prevents result() blocking
                future.cancel()
                raise PipelineTimeoutError(stage_name, timeout_sec)

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def run(
        self,
        file_bytes: bytes,
        filename: str,
        session_id: str,
        language: str = "en",
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        total_timeout_sec: int = 240,
    ) -> PipelineResult:
        """
        Run all pipeline stages.  If the cumulative wall-clock time exceeds
        total_timeout_sec the pipeline stops at the current stage boundary
        and returns a PipelineResult with timed_out=True.
        """
        result = PipelineResult()
        pipeline_start = time.monotonic()

        def _budget_remaining() -> float:
            return total_timeout_sec - (time.monotonic() - pipeline_start)

        def _stage_timeout(stage: str) -> int:
            """Return the smaller of the stage budget and remaining total budget."""
            return min(self.STAGE_TIMEOUTS[stage], max(1, int(_budget_remaining())))

        try:
            # ----------------------------------------------------------------
            # Stage 1: Parse PDF
            # ----------------------------------------------------------------
            processed_doc: ProcessedDocument = self._run_with_timeout(
                "pdf_parse",
                _stage_timeout("pdf_parse"),
                self.doc_processor.process_pdf,
                file_bytes,
                filename,
            )
            result.processed_doc = processed_doc

            # ----------------------------------------------------------------
            # Stage 2: Index into RAG vector store
            # ----------------------------------------------------------------
            self._run_with_timeout(
                "rag_index",
                _stage_timeout("rag_index"),
                self.rag.index_document,
                processed_doc,
                session_id,
            )

            # ----------------------------------------------------------------
            # Stage 3: Retrieve passages (broad + targeted queries)
            # ----------------------------------------------------------------
            passages: List[RetrievedPassage] = self._run_with_timeout(
                "rag_retrieve",
                _stage_timeout("rag_retrieve"),
                self._retrieve_all_fields,
                session_id,
            )
            result.passages = passages

            # ----------------------------------------------------------------
            # Stage 4: Extract structured policy fields
            # ----------------------------------------------------------------
            fields: PolicyFields = self._run_with_timeout(
                "field_extract",
                _stage_timeout("field_extract"),
                self.llm.extract_fields,
                passages,
            )
            result.fields = fields

            # ----------------------------------------------------------------
            # Stage 5: Generate simplified explanation (with language)
            # ----------------------------------------------------------------
            explanation: SimplifiedExplanation = self._run_with_timeout(
                "simplify",
                _stage_timeout("simplify"),
                self.llm.simplify,
                fields,
                passages,
                language,
            )
            result.explanation = explanation

            # ----------------------------------------------------------------
            # Stage 6: Extract claim steps (for claims flowchart)
            # ----------------------------------------------------------------
            claim_passages: List[RetrievedPassage] = self._run_with_timeout(
                "rag_retrieve",
                _stage_timeout("rag_retrieve"),
                self.rag.retrieve,
                "claim procedure cashless reimbursement intimation",
                session_id,
                5,    # top_k
                0.1,  # low threshold to capture any claim text
            )
            steps: List[ClaimStep] = self._run_with_timeout(
                "claim_steps",
                _stage_timeout("claim_steps"),
                self.llm.extract_claim_steps,
                claim_passages,
            )
            result.claim_steps = steps

            # ----------------------------------------------------------------
            # Stage 7: Build language-adapted image generation prompts
            # ----------------------------------------------------------------
            coverage_prompt, claims_prompt = self._run_with_timeout(
                "prompt_build",
                _stage_timeout("prompt_build"),
                self._build_prompts,
                fields,
                steps,
                style,
                language,
            )
            result.coverage_prompt = coverage_prompt
            result.claims_prompt = claims_prompt

        except PipelineTimeoutError as e:
            result.timed_out = True
            result.timed_out_stage = e.stage
            result.error = str(e)

        except Exception as e:
            result.error = str(e)

        finally:
            result.elapsed_seconds = round(time.monotonic() - pipeline_start, 2)

        return result

    # ------------------------------------------------------------------
    # Text-only variant (no PDF bytes needed)
    # ------------------------------------------------------------------

    def run_from_text(
        self,
        text: str,
        session_id: str,
        language: str = "en",
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        total_timeout_sec: int = 120,
    ) -> PipelineResult:
        """
        Same pipeline for free-text policy input (no PDF stage).
        Skips pdf_parse and rag_index; uses provided text directly.
        """
        result = PipelineResult()
        pipeline_start = time.monotonic()

        def _budget_remaining() -> float:
            return total_timeout_sec - (time.monotonic() - pipeline_start)

        def _stage_timeout(stage: str) -> int:
            return min(self.STAGE_TIMEOUTS[stage], max(1, int(_budget_remaining())))

        try:
            processed_doc = self.doc_processor.process_text(text)
            result.processed_doc = processed_doc

            self._run_with_timeout(
                "rag_index",
                _stage_timeout("rag_index"),
                self.rag.index_document,
                processed_doc,
                session_id,
            )

            passages = self._run_with_timeout(
                "rag_retrieve",
                _stage_timeout("rag_retrieve"),
                self._retrieve_all_fields,
                session_id,
            )
            result.passages = passages

            fields = self._run_with_timeout(
                "field_extract",
                _stage_timeout("field_extract"),
                self.llm.extract_fields,
                passages,
            )
            result.fields = fields

            explanation = self._run_with_timeout(
                "simplify",
                _stage_timeout("simplify"),
                self.llm.simplify,
                fields,
                passages,
                language,
            )
            result.explanation = explanation

            steps: List[ClaimStep] = self._run_with_timeout(
                "claim_steps",
                _stage_timeout("claim_steps"),
                self.llm.extract_claim_steps,
                passages,
            )
            result.claim_steps = steps

            coverage_prompt, claims_prompt = self._run_with_timeout(
                "prompt_build",
                _stage_timeout("prompt_build"),
                self._build_prompts,
                fields,
                steps,
                style,
                language,
            )
            result.coverage_prompt = coverage_prompt
            result.claims_prompt = claims_prompt

        except PipelineTimeoutError as e:
            result.timed_out = True
            result.timed_out_stage = e.stage
            result.error = str(e)

        except Exception as e:
            result.error = str(e)

        finally:
            result.elapsed_seconds = round(time.monotonic() - pipeline_start, 2)

        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _retrieve_all_fields(self, session_id: str) -> List[RetrievedPassage]:
        """
        Issues multiple targeted queries and deduplicates by chunk_id.
        Captures broader policy coverage than a single generic query.
        """
        queries = [
            "coverage type benefits hospitalization inpatient outpatient",
            "sum insured coverage limit maximum benefit amount rupees",
            "premium payment annual deductible co-payment",
            "exclusion what is not covered waiting period permanent exclusion",
            "claim procedure reimbursement cashless intimation settlement",
        ]
        seen_ids: set = set()
        combined: List[RetrievedPassage] = []

        for query in queries:
            passages = self.rag.retrieve(
                query=query,
                session_id=session_id,
                top_k=3,
                min_score=0.1,
            )
            for p in passages:
                if p.chunk_id not in seen_ids:
                    seen_ids.add(p.chunk_id)
                    combined.append(p)

        # Sort by relevance descending, cap at 15 for LLM context window
        combined.sort(key=lambda p: p.relevance_score, reverse=True)
        return combined[:15]

    def _build_prompts(
        self,
        fields: PolicyFields,
        steps: List[ClaimStep],
        style: VisualStyle,
        language: str,
    ) -> Tuple[ImagePrompt, ImagePrompt]:
        has_dual_path = any(
            s.path_label in ("cashless", "reimbursement") for s in steps
        )
        coverage_prompt = self.prompt_builder.build_coverage_prompt(
            fields=fields, style=style, language=language
        )
        claims_prompt = self.prompt_builder.build_claims_prompt(
            steps=steps, style=style, has_dual_path=has_dual_path, language=language
        )
        return coverage_prompt, claims_prompt

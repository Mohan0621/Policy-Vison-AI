from dataclasses import dataclass, field
from enum import Enum
from typing import Generic, Literal, TypeVar, Optional, List, Tuple, Dict, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class VisualStyle(str, Enum):
    PROFESSIONAL_INFOGRAPHIC = "professional_infographic"
    ILLUSTRATED_CARTOON = "illustrated_cartoon"
    FLOWCHART_DIAGRAM = "flowchart_diagram"

@dataclass
class DocumentChunk:
    chunk_id: str
    text: str
    page_number: int
    section_heading: str
    block_type: Literal["paragraph", "heading", "list_item", "table_row"]
    token_count: int

@dataclass
class ProcessedDocument:
    source_type: Literal["pdf", "text"]
    filename: Optional[str]
    page_count: int
    chunks: List[DocumentChunk]
    raw_markdown: str

@dataclass
class PolicyField:
    value: Optional[str]
    status: Literal["found", "not_found"]
    source_passage_ids: List[str] = field(default_factory=list)

@dataclass
class PolicyFields:
    coverage_type: PolicyField
    coverage_limits: PolicyField
    premium_details: PolicyField
    exclusions: PolicyField
    claim_procedures: PolicyField

@dataclass
class SourceCitation:
    document_name: str
    page_number: int
    section_heading: str
    passage_text: str
    relevance_score: float

@dataclass
class RetrievedPassage:
    chunk_id: str
    text: str
    document_name: str
    page_number: int
    section_heading: str
    relevance_score: float

@dataclass
class SimplifiedExplanation:
    what_is_covered: str
    what_is_not_covered: str
    how_to_claim: str
    language: str
    fk_grade_level: float
    source_citations: List[SourceCitation]
    fallback_language: Optional[str] = None

@dataclass
class TextOverlay:
    text: str
    position: Tuple[int, int]
    font_size: int
    font_path: str
    color: str

@dataclass
class VisualSection:
    heading: str
    amount_or_metric: Optional[str] = None
    description: str = ""
    badge: Optional[str] = None
    subbadge: Optional[str] = None
    visual_representation: str = "card"  # "3d_artwork", "card", "gauge", "pill", "warning"
    accent_color: Optional[str] = None

@dataclass
class VisualProcessStep:
    step_number: int
    title: str
    description: str
    time_sla: Optional[str] = None  # e.g., "Within 1 Hour", "24-48 Hours"
    path_label: str = "general"     # "cashless", "reimbursement", "general"
    status_badge: Optional[str] = None

@dataclass
class VisualPlan:
    title: str
    subtitle: str
    language: str
    visual_type: str  # "coverage", "claims", "exclusions", "comparison"
    art_direction: str
    composition_style: str  # "asymmetric_bento", "split_comparison", "sequential_process", "metric_grid"
    color_palette: Dict[str, str]
    hero_artwork_prompt: str
    hero_metric: Optional[Dict[str, str]] = None
    sections: List[VisualSection] = field(default_factory=list)
    process_steps: Optional[List[VisualProcessStep]] = None
    decision_question: Optional[str] = None
    compliance_footer: Dict[str, str] = field(default_factory=dict)
    source_citations: List[SourceCitation] = field(default_factory=list)

@dataclass
class VLMQualityResult:
    passed: bool
    quality_score: float
    scores: Dict[str, float]
    critique: str
    correction_instructions: List[str] = field(default_factory=list)
    model_used: str = "vlm"

@dataclass
class ImagePrompt:
    prompt_text: str
    negative_prompt: str
    style: VisualStyle
    language: str
    text_overlays: List[TextOverlay]
    source_citations: List[SourceCitation]
    compiled_prompts: Optional[Dict[str, str]] = None
    structured_data: Optional[Dict[str, Any]] = None
    visual_plan: Optional[VisualPlan] = None

@dataclass
class GeneratedImage:
    image_id: str
    session_id: str
    image_bytes: bytes
    width: int
    height: int
    prompt: ImagePrompt
    generation_timestamp_utc: str
    visual_type: Literal["coverage", "claims", "qa_answer"]

@dataclass
class QAMessage:
    role: Literal["user", "assistant"]
    content: str
    citations: List[SourceCitation]
    timestamp: str

@dataclass
class QAAnswer:
    text: str
    is_visual_needed: bool
    citations: List[SourceCitation]
    visual_rationale: Optional[str] = None

@dataclass
class ClaimStep:
    step_number: int
    title: str
    description: str
    path_label: Optional[str] = None  # "cashless" | "reimbursement" | None
    is_branch_point: bool = False

@dataclass
class VerificationResult:
    statement: str
    supported: bool
    source_chunk_id: Optional[str] = None
    relevance_score: float = 0.0

@dataclass
class IndexResult:
    session_id: str
    chunk_count: int
    status: str

@dataclass
class ExportedFile:
    filename: str
    file_bytes: bytes
    mime_type: str

@dataclass
class APIError:
    code: str
    message: str
    retryable: bool

@dataclass
class APIResponse(Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[APIError] = None
    request_id: str = ""

# Exceptions
class DocumentProcessingError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

class IndexingError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

class LLMTimeoutError(Exception):
    def __init__(self, code: str = "LLM_TIMEOUT", message: str = "LLM generation timed out"):
        super().__init__(message)
        self.code = code
        self.message = message

class ImageGenerationError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

class ExportError(Exception):
    def __init__(self, code: str = "EXPORT_FAILED", message: str = "Export operation failed", retryable: bool = True):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


from dataclasses import dataclass, field
from enum import Enum
from typing import Generic, Literal, TypeVar, Optional, List, Tuple
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
class ImagePrompt:
    prompt_text: str
    negative_prompt: str
    style: VisualStyle
    language: str
    text_overlays: List[TextOverlay]
    source_citations: List[SourceCitation]

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


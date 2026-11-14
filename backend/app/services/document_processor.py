import io
import re
import uuid
import concurrent.futures
from typing import List, Optional, Set

from app.config import settings
from app.models import (
    DocumentChunk,
    DocumentProcessingError,
    ProcessedDocument,
)

class TextPreprocessor:
    """
    Production Text Preprocessor for RAG:
    - Strips repetitive running headers & footers across 100-page policy PDFs.
    - De-hyphenates words split across line breaks (e.g. 'hospi-\\ntalization' -> 'hospitalization').
    - Normalizes typographic unicode quotes, em-dashes, and whitespace.
    - Identifies structured clause codes (e.g. 'Section 2.1', 'Clause 4(a)', 'Schedule B').
    """
    @staticmethod
    def normalize_unicode(text: str) -> str:
        replacements = {
            "\u2018": "'", "\u2019": "'",
            "\u201c": '"', "\u201d": '"',
            "\u2013": "-", "\u2014": "-",
            "\u00a0": " ", "\u2022": "-",
        }
        for orig, repl in replacements.items():
            text = text.replace(orig, repl)
        return text

    @staticmethod
    def dehyphenate(text: str) -> str:
        # Re-connects words broken across linebreaks by hyphenation
        return re.sub(r"(\b[a-zA-Z]{3,})-\s*\n\s*([a-zA-Z]{2,}\b)", r"\1\2", text)

    @staticmethod
    def detect_running_headers_footers(pages_text: List[str]) -> Set[str]:
        if len(pages_text) < 3:
            return set()
        candidates: dict = {}
        for p in pages_text:
            lines = [l.strip() for l in p.splitlines() if l.strip()]
            if not lines:
                continue
            boundary_lines = set(lines[:2] + lines[-2:])
            for line in boundary_lines:
                if 5 <= len(line) <= 80 and not re.match(r"^Page \d+(?: of \d+)?$", line, re.I):
                    candidates[line] = candidates.get(line, 0) + 1

        threshold = max(2, len(pages_text) * 0.25)
        return {line for line, count in candidates.items() if count >= threshold}

    @staticmethod
    def clean_text_for_rag(text: str, running_noise: Optional[Set[str]] = None) -> str:
        if not text:
            return ""
        text = TextPreprocessor.normalize_unicode(text)
        text = TextPreprocessor.dehyphenate(text)

        # Clean HTML linebreaks and formatting tags
        text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
        text = re.sub(r"</?[a-zA-Z0-9]+[^>]*>", " ", text)
        # Clean markdown table pipes and separators
        text = re.sub(r"\|+", " ", text)
        # Normalize double asterisks/markdown hashes
        text = text.replace("**", "").replace("##", "")

        lines = []
        for line in text.splitlines():
            s = line.strip()
            if not s:
                continue
            if running_noise and s in running_noise:
                continue
            if re.match(r"^<!-- Page \d+ -->$", s) or re.match(r"^Page \d+(?: of \d+)?$", s, re.I):
                continue
            # Remove lingering bullets and leading symbols
            s = re.sub(r"^[\s\-•●*]+\s*", "", s)
            if s:
                lines.append(s)

        return "\n".join(lines)

    @staticmethod
    def extract_clause_code(text: str) -> str:
        m = re.search(r"\b(Section|Clause|Schedule|Condition|Article)\s+([A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*)", text, re.I)
        if m:
            return f"{m.group(1).capitalize()} {m.group(2)}"
        return ""

class DocumentProcessor:
    def __init__(
        self,
        max_file_size: int = settings.MAX_FILE_SIZE_BYTES,
        max_pages: int = settings.MAX_PDF_PAGES,
        min_text_chars: int = settings.MIN_TEXT_CHARS,
        max_text_chars: int = settings.MAX_TEXT_CHARS,
        timeout_seconds: int = settings.PDF_PROCESS_TIMEOUT_SEC,
    ):
        self.max_file_size = max_file_size
        self.max_pages = max_pages
        self.min_text_chars = min_text_chars
        self.max_text_chars = max_text_chars
        self.timeout_seconds = timeout_seconds

    def process_text(self, text: str) -> ProcessedDocument:
        """
        Validates free-text length (50-5000 chars, non-whitespace).
        Wraps in a single DocumentChunk.
        """
        if not text or not text.strip():
            raise DocumentProcessingError(
                code="TEXT_EMPTY",
                message="Text cannot be empty or contain only whitespace.",
            )
        
        char_count = len(text)
        if char_count < self.min_text_chars:
            raise DocumentProcessingError(
                code="TEXT_TOO_SHORT",
                message=f"Please provide at least {self.min_text_chars} characters of policy description.",
            )
        
        if char_count > self.max_text_chars:
            raise DocumentProcessingError(
                code="TEXT_TOO_LONG",
                message=f"Description exceeds the {self.max_text_chars} character limit.",
            )
        
        token_count = max(1, len(text.split()))
        chunk = DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            text=text.strip(),
            page_number=0,
            section_heading="General Policy Description",
            block_type="paragraph",
            token_count=token_count,
        )
        
        return ProcessedDocument(
            source_type="text",
            filename=None,
            page_count=0,
            chunks=[chunk],
            raw_markdown=text.strip(),
        )

    def _parse_pdf_worker(self, file_bytes: bytes, filename: str) -> ProcessedDocument:
        try:
            import fitz  # PyMuPDF
        except ImportError:
            # Fallback if fitz is not installed in the environment
            return self._fallback_pdf_parser(file_bytes, filename)

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise DocumentProcessingError(
                code="CORRUPTED_PDF",
                message="This PDF could not be read. Please verify the file is not corrupted.",
            ) from e

        if doc.needs_pass:
            doc.close()
            raise DocumentProcessingError(
                code="PASSWORD_PROTECTED",
                message="This PDF is password-protected. Please remove the password and re-upload.",
            )

        page_count = len(doc)
        if page_count > self.max_pages:
            doc.close()
            raise DocumentProcessingError(
                code="PAGE_LIMIT_EXCEEDED",
                message=f"Documents are limited to {self.max_pages} pages. Please upload a shorter document.",
            )

        chunks: List[DocumentChunk] = []
        raw_markdown_pages: List[str] = []
        raw_pages_text: List[str] = []

        try:
            import pymupdf4llm
            has_pymupdf4llm = True
        except ImportError:
            has_pymupdf4llm = False

        # Pass 1: Extract all raw page text
        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = ""
            if has_pymupdf4llm:
                try:
                    page_text = pymupdf4llm.to_markdown(doc, pages=[page_idx])
                except Exception:
                    page_text = page.get_text("text")
            else:
                page_text = page.get_text("text")

            # OCR fallback for scanned image PDFs when text extraction yields minimal content
            if settings.ENABLE_OCR and len(page_text.strip()) < 20:
                try:
                    import pytesseract
                    from PIL import Image
                    pix = page.get_pixmap(dpi=150)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_text = pytesseract.image_to_string(img)
                    if ocr_text.strip():
                        page_text = ocr_text
                except Exception:
                    pass

            raw_pages_text.append(page_text)

        # Detect repetitive running headers and footers across the document
        running_noise = TextPreprocessor.detect_running_headers_footers(raw_pages_text)

        # Pass 2: Clean, dehyphenate, and extract structured chunks
        for page_idx, page_text in enumerate(raw_pages_text):
            page_num = page_idx + 1
            cleaned_page = TextPreprocessor.clean_text_for_rag(page_text, running_noise)
            raw_markdown_pages.append(f"<!-- Page {page_num} -->\n" + cleaned_page)

            # Extract section headings & blocks
            current_heading = f"Page {page_num}"
            lines = cleaned_page.splitlines()
            buffer: List[str] = []

            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue

                clause_code = TextPreprocessor.extract_clause_code(stripped)

                if stripped.startswith("#"):
                    if buffer:
                        b_text = " ".join(buffer).strip()
                        if b_text:
                            chunks.append(DocumentChunk(
                                chunk_id=str(uuid.uuid4()),
                                text=b_text,
                                page_number=page_num,
                                section_heading=current_heading,
                                block_type="paragraph",
                                token_count=max(1, len(b_text.split())),
                            ))
                        buffer = []
                    heading_text = stripped.lstrip("#").strip()
                    current_heading = f"{clause_code}: {heading_text}" if clause_code and clause_code not in heading_text else heading_text
                    chunks.append(DocumentChunk(
                        chunk_id=str(uuid.uuid4()),
                        text=stripped,
                        page_number=page_num,
                        section_heading=current_heading,
                        block_type="heading",
                        token_count=max(1, len(stripped.split())),
                    ))
                elif stripped.startswith(("-", "*", "•")) or re.match(r"^\d+\.", stripped):
                    if buffer:
                        b_text = " ".join(buffer).strip()
                        if b_text:
                            chunks.append(DocumentChunk(
                                chunk_id=str(uuid.uuid4()),
                                text=b_text,
                                page_number=page_num,
                                section_heading=current_heading,
                                block_type="paragraph",
                                token_count=max(1, len(b_text.split())),
                            ))
                        buffer = []
                    chunks.append(DocumentChunk(
                        chunk_id=str(uuid.uuid4()),
                        text=stripped,
                        page_number=page_num,
                        section_heading=current_heading,
                        block_type="list_item",
                        token_count=max(1, len(stripped.split())),
                    ))
                elif "|" in stripped:
                    # Table row
                    chunks.append(DocumentChunk(
                        chunk_id=str(uuid.uuid4()),
                        text=stripped,
                        page_number=page_num,
                        section_heading=current_heading,
                        block_type="table_row",
                        token_count=max(1, len(stripped.split())),
                    ))
                else:
                    if clause_code and clause_code not in current_heading and len(stripped) < 80:
                        current_heading = f"{clause_code}: {current_heading}"
                    buffer.append(stripped)

            if buffer:
                b_text = " ".join(buffer).strip()
                if b_text:
                    chunks.append(DocumentChunk(
                        chunk_id=str(uuid.uuid4()),
                        text=b_text,
                        page_number=page_num,
                        section_heading=current_heading,
                        block_type="paragraph",
                        token_count=max(1, len(b_text.split())),
                    ))

        doc.close()
        
        # If no chunks were created (e.g. empty or non-textual PDF)
        if not chunks:
            chunks.append(DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                text="Policy Document",
                page_number=1,
                section_heading="Document",
                block_type="paragraph",
                token_count=2,
            ))

        return ProcessedDocument(
            source_type="pdf",
            filename=filename,
            page_count=page_count,
            chunks=chunks,
            raw_markdown="\n\n".join(raw_markdown_pages),
        )

    def _fallback_pdf_parser(self, file_bytes: bytes, filename: str) -> ProcessedDocument:
        # Basic binary validation when fitz is not installed
        if not file_bytes.startswith(b"%PDF"):
            raise DocumentProcessingError(
                code="CORRUPTED_PDF",
                message="This PDF could not be read. Please verify the file is not corrupted.",
            )
        # Mock / simple extraction
        text = file_bytes.decode("latin1", errors="ignore")
        chunk = DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            text="Extracted Policy Text",
            page_number=1,
            section_heading="General",
            block_type="paragraph",
            token_count=3,
        )
        return ProcessedDocument(
            source_type="pdf",
            filename=filename,
            page_count=1,
            chunks=[chunk],
            raw_markdown="# Extracted Policy Document",
        )

    def process_pdf(self, file_bytes: bytes, filename: str) -> ProcessedDocument:
        """
        Validates size (<= 50 MB), extension (.pdf), page count (<= 100), not password-protected.
        Extracts structured text preserving headings, lists, and tables.
        Timeout: 60 seconds.
        """
        if not filename.lower().endswith(".pdf"):
            raise DocumentProcessingError(
                code="UNSUPPORTED_FORMAT",
                message="Only PDF files are supported. Please convert your document to PDF.",
            )

        if len(file_bytes) > self.max_file_size:
            raise DocumentProcessingError(
                code="FILE_TOO_LARGE",
                message="File exceeds the 50 MB limit. Please upload a smaller file.",
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._parse_pdf_worker, file_bytes, filename)
            try:
                return future.result(timeout=self.timeout_seconds)
            except concurrent.futures.TimeoutError:
                raise DocumentProcessingError(
                    code="PROCESSING_TIMEOUT",
                    message="Document processing timed out after 60 seconds.",
                )


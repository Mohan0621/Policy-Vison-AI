import logging
import math
import os
import re
import uuid
import concurrent.futures
from typing import Dict, List, Optional

from app.config import settings
from app.models import (
    IndexResult,
    IndexingError,
    ProcessedDocument,
    RetrievedPassage,
    VerificationResult,
)

logger = logging.getLogger("rag_pipeline")

class SimpleSemanticEmbedder:
    """
    Lightweight, fast multilingual-aware embedding fallback when torch/sentence-transformers
    is not installed or to ensure snappy unit/property tests.
    Uses n-gram term frequency with subword hash embeddings and normalized vectors.
    """
    def __init__(self, dim: int = 128):
        self.dim = dim

    def encode_one(self, text: str) -> List[float]:
        tokens = re.findall(r"[\w']+", text.lower())
        vec = [0.0] * self.dim
        if not tokens:
            return vec
        for token in tokens:
            h = hash(token) % self.dim
            vec[h] += 1.0
            # Also hash bigrams for sequence matching
            for i in range(len(token) - 2):
                tri = token[i:i+3]
                h_tri = hash(tri) % self.dim
                vec[h_tri] += 0.5
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def encode(self, texts: List[str]) -> List[List[float]]:
        return [self.encode_one(t) for t in texts]


class RAGPipeline:
    def __init__(
        self,
        min_score: float = 0.35,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        timeout_seconds: int = settings.INDEXING_TIMEOUT_SEC,
    ):
        self.min_score = min_score
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.timeout_seconds = timeout_seconds
        
        # Session index store: session_id -> list of chunk dicts with embeddings
        self._store: Dict[str, List[dict]] = {}
        self._embedder = None
        self._chroma_client = None
        self._init_chroma()
        self._init_embedder()

    def _init_chroma(self):
        try:
            import chromadb
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            self._chroma_client = chromadb.PersistentClient(path=str(settings.CHROMA_PERSIST_DIR))
            logger.info("ChromaDB persistent vector store initialized at %s", settings.CHROMA_PERSIST_DIR)
        except Exception as e:
            logger.warning("ChromaDB not available or failed to initialize (%s). Using session memory store.", str(e))
            self._chroma_client = None

    def _init_embedder(self):
        try:
            from sentence_transformers import SentenceTransformer
            self._embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
            self._is_st = True
            logger.info("SentenceTransformer model loaded: %s", settings.EMBEDDING_MODEL)
        except Exception as e:
            self._embedder = SimpleSemanticEmbedder()
            self._is_st = False
            logger.warning("sentence-transformers not available (%s). Using fallback SimpleSemanticEmbedder.", str(e))

    def _compute_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        if self._is_st and self._embedder is not None:
            try:
                embeddings = self._embedder.encode(texts, normalize_embeddings=True)
                return [e.tolist() for e in embeddings]
            except Exception:
                fallback = SimpleSemanticEmbedder()
                return fallback.encode(texts)
        else:
            return self._embedder.encode(texts)

    def _chunk_document(self, doc: ProcessedDocument) -> List[dict]:
        """
        Chunks ProcessedDocument:
        - Respects H2 / section boundaries (does not span across distinct sections)
        - Keeps table rows/tables atomic up to 1024 tokens
        - Overlapping segments for regular paragraphs
        """
        chunks: List[dict] = []
        doc_name = doc.filename or "Text Description"
        
        # Group by section_heading
        section_groups: Dict[str, List] = {}
        for c in doc.chunks:
            section_groups.setdefault(c.section_heading, []).append(c)

        for heading, group in section_groups.items():
            current_tokens: List[str] = []
            page_numbers: List[int] = []
            
            for item in group:
                if item.block_type == "table_row":
                    # Emit previous tokens if any
                    if current_tokens:
                        text = " ".join(current_tokens)
                        chunks.append({
                            "chunk_id": str(uuid.uuid4()),
                            "text": text,
                            "page_number": page_numbers[0] if page_numbers else 1,
                            "section_heading": heading,
                            "token_count": len(current_tokens),
                        })
                        current_tokens = []
                        page_numbers = []
                    # Keep table atomic
                    chunks.append({
                        "chunk_id": item.chunk_id,
                        "text": item.text,
                        "page_number": item.page_number,
                        "section_heading": heading,
                        "token_count": item.token_count,
                    })
                    continue

                words = item.text.split()
                if len(current_tokens) + len(words) <= self.chunk_size:
                    current_tokens.extend(words)
                    page_numbers.append(item.page_number)
                else:
                    # Flush with overlap
                    if current_tokens:
                        text = " ".join(current_tokens)
                        chunks.append({
                            "chunk_id": str(uuid.uuid4()),
                            "text": text,
                            "page_number": page_numbers[0] if page_numbers else 1,
                            "section_heading": heading,
                            "token_count": len(current_tokens),
                        })
                        overlap_words = current_tokens[-self.chunk_overlap:] if len(current_tokens) > self.chunk_overlap else []
                        current_tokens = overlap_words + words
                        page_numbers = [item.page_number]
                    else:
                        current_tokens = words
                        page_numbers = [item.page_number]

            if current_tokens:
                text = " ".join(current_tokens)
                chunks.append({
                    "chunk_id": str(uuid.uuid4()),
                    "text": text,
                    "page_number": page_numbers[0] if page_numbers else 1,
                    "section_heading": heading,
                    "token_count": len(current_tokens),
                })

        return chunks

    def _index_worker(self, doc: ProcessedDocument, session_id: str) -> IndexResult:
        doc_name = doc.filename or "Text Description"
        raw_chunks = self._chunk_document(doc)
        if not raw_chunks:
            raw_chunks = [{
                "chunk_id": str(uuid.uuid4()),
                "text": doc.raw_markdown or "Policy Document",
                "page_number": 1,
                "section_heading": "General",
                "token_count": len((doc.raw_markdown or "").split()),
            }]

        texts = [c["text"] for c in raw_chunks]
        embeddings = self._compute_embeddings(texts)

        stored_items = []
        for idx, (chunk, emb) in enumerate(zip(raw_chunks, embeddings)):
            stored_items.append({
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "document_name": doc_name,
                "page_number": chunk["page_number"],
                "section_heading": chunk["section_heading"],
                "embedding": emb,
                "chunk_index": idx,
            })

        self._store[session_id] = stored_items

        if self._chroma_client:
            try:
                col_name = f"sess_{session_id.replace('-', '_')}"
                collection = self._chroma_client.get_or_create_collection(name=col_name)
                collection.upsert(
                    ids=[item["chunk_id"] for item in stored_items],
                    documents=[item["text"] for item in stored_items],
                    embeddings=[item["embedding"] for item in stored_items],
                    metadatas=[
                        {
                            "document_name": item["document_name"],
                            "page_number": item["page_number"],
                            "section_heading": item["section_heading"],
                            "chunk_index": item["chunk_index"],
                        }
                        for item in stored_items
                    ],
                )
            except Exception as e:
                logger.warning("Failed to persist to ChromaDB: %s. Relying on memory store.", str(e))

        return IndexResult(session_id=session_id, chunk_count=len(stored_items), status="ready")

    def index_document(self, doc: ProcessedDocument, session_id: str) -> IndexResult:
        """
        Chunks and embeds document; indexes with metadata.
        Enforces 30-second timeout.
        """
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._index_worker, doc, session_id)
            try:
                return future.result(timeout=self.timeout_seconds)
            except concurrent.futures.TimeoutError:
                raise IndexingError(
                    code="INDEX_TIMEOUT",
                    message="Indexing took too long. Please re-upload the document.",
                )
            except Exception as e:
                raise IndexingError(
                    code="INDEX_FAILED",
                    message=f"Document indexing failed: {str(e)}",
                )

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b:
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        return max(0.0, min(1.0, dot))

    def retrieve(
        self,
        query: str,
        session_id: str,
        top_k: int = 5,
        min_score: Optional[float] = None,
    ) -> List[RetrievedPassage]:
        """
        Embeds query, performs cosine similarity search.
        Returns up to top_k passages with score >= min_score.
        """
        threshold = self.min_score if min_score is None else min_score
        items = self._store.get(session_id, [])
        if not items:
            return []

        query_emb = self._compute_embeddings([query])[0]
        scored_passages = []

        for item in items:
            score = self._cosine_similarity(query_emb, item["embedding"])
            # Keyword / substring boost for exact term matching only when semantic floor is met
            query_terms = set(re.findall(r"\w+", query.lower()))
            chunk_terms = set(re.findall(r"\w+", item["text"].lower()))
            overlap = len(query_terms.intersection(chunk_terms))
            if score >= 0.15 and query_terms and overlap > 0:
                boost = 0.2 * (overlap / len(query_terms))
                score = min(1.0, score + boost)

            if score >= threshold:
                passage = RetrievedPassage(
                    chunk_id=item["chunk_id"],
                    text=item["text"],
                    document_name=item["document_name"],
                    page_number=item["page_number"],
                    section_heading=item["section_heading"],
                    relevance_score=round(score, 4),
                )
                scored_passages.append(passage)

        scored_passages.sort(key=lambda p: p.relevance_score, reverse=True)
        return scored_passages[:top_k]

    def verify_statements(
        self,
        statements: List[str],
        session_id: str,
    ) -> List[VerificationResult]:
        """
        For each statement, retrieves top-1 passage and checks score >= min_score.
        Returns supported=True/False per statement.
        """
        results: List[VerificationResult] = []
        for stmt in statements:
            if not stmt.strip():
                continue
            passages = self.retrieve(stmt, session_id=session_id, top_k=1, min_score=self.min_score)
            if passages and passages[0].relevance_score >= self.min_score:
                results.append(VerificationResult(
                    statement=stmt,
                    supported=True,
                    source_chunk_id=passages[0].chunk_id,
                    relevance_score=passages[0].relevance_score,
                ))
            else:
                results.append(VerificationResult(
                    statement=stmt,
                    supported=False,
                    source_chunk_id=None,
                    relevance_score=passages[0].relevance_score if passages else 0.0,
                ))
        return results

rag_pipeline = RAGPipeline()



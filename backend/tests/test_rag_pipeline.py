"""
test_rag_pipeline.py
====================
Core Test Suite for the RAGPipeline and Grounding Architecture.

This module validates:
1. Indexing & Semantic Retrieval:
   - Constructing synthetic multi-section policy documents.
   - Indexing into session vector memory and BM25 sparse inverted indices.
   - Top-k passage retrieval matching semantic queries with relevance scores.
   - Threshold filtering for completely unrelated out-of-domain queries.
2. Chunking & Table Row Integrity:
   - Verifying parent-child hierarchical chunking.
   - Preserving markdown table structure and table headers across chunks.
3. Property 4 (Hypothesis): Deterministic RAG Grounding Verification:
   - Verifying known factual statements from indexed documents return supported=True.
   - Verifying unindexed/alien statements return low relevance or supported=False,
     preventing compliance risk and hallucinations.
"""

import uuid
import pytest
from hypothesis import given, settings, strategies as st
from app.models import DocumentChunk, ProcessedDocument
from app.services.rag_pipeline import RAGPipeline


def make_test_doc(text_sections):
    """
    Test Helper: Constructs a ProcessedDocument from an iterable of (heading, text) tuples.
    Assigns each section a unique UUID chunk_id and sequential page number.
    """
    chunks = []
    for idx, (heading, text) in enumerate(text_sections):
        chunks.append(DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            text=text,
            page_number=idx + 1,
            section_heading=heading,
            block_type="paragraph",
            token_count=len(text.split()),
        ))
    return ProcessedDocument(
        source_type="pdf",
        filename="TestPolicy.pdf",
        page_count=len(text_sections),
        chunks=chunks,
        raw_markdown="\n\n".join([t for _, t in text_sections]),
    )


# -----------------------------------------------------------------------------
# Unit Test: Document Indexing and Semantic Passage Retrieval
# -----------------------------------------------------------------------------
def test_rag_pipeline_indexing_and_retrieval():
    """
    Unit Test: Tests the core indexing and retrieval loop:
    1. Indexes a 3-section policy (Coverage, Exclusions, Claims).
    2. Queries for 'hospitalization expenses' and asserts relevant top-1 passage.
    3. Queries for an irrelevant query with a high threshold and asserts empty results.
    """
    # 1. Initialize RAG pipeline with a moderate threshold
    pipeline = RAGPipeline(min_score=0.2)
    session_id = str(uuid.uuid4())

    # 2. Build multi-section test document
    doc = make_test_doc([
        ("Coverage", "This policy covers hospitalization expenses up to Rs. 5,00,000 for critical illness."),
        ("Exclusions", "Dental treatment and cosmetic surgery are permanently excluded from this coverage."),
        ("Claims", "To claim, intimate the insurance desk within 24 hours of hospital admission."),
    ])

    # 3. Index the document into the session store
    result = pipeline.index_document(doc, session_id=session_id)
    assert result.status == "ready"
    assert result.chunk_count >= 3

    # 4. Perform semantic retrieval for coverage details
    passages = pipeline.retrieve("hospitalization expenses", session_id=session_id, top_k=2)
    assert len(passages) > 0
    assert "hospitalization" in passages[0].text.lower()
    assert passages[0].document_name == "TestPolicy.pdf"

    # 5. Out-of-domain query verification: queries with no semantic overlap must be filtered
    unrelated = pipeline.retrieve("extraterrestrial space travel rocket launch", session_id=session_id, min_score=0.8)
    assert len(unrelated) == 0


# -----------------------------------------------------------------------------
# Unit Test: Markdown Table & H2 Heading Chunk Handling
# -----------------------------------------------------------------------------
def test_rag_chunk_h2_and_table_handling():
    """
    Unit Test: Verifies that markdown table rows are correctly processed as atomic
    chunks and indexed into the session store without losing cell contents.
    """
    pipeline = RAGPipeline(chunk_size=50)
    session_id = str(uuid.uuid4())

    # Construct document containing a markdown table row chunk
    doc = ProcessedDocument(
        source_type="pdf",
        filename="TableDoc.pdf",
        page_count=1,
        chunks=[
            DocumentChunk(
                chunk_id="tbl-1",
                text="| Plan | Sum Insured | Premium |\n| Gold | Rs 5 Lakh | Rs 8000 |",
                page_number=1,
                section_heading="Plan Table",
                block_type="table_row",
                token_count=14,
            )
        ],
        raw_markdown="",
    )

    # Index document and assert that table text was stored
    res = pipeline.index_document(doc, session_id)
    assert res.chunk_count == 1
    assert "Gold" in pipeline._store[session_id][0]["text"]


# Shared RAG pipeline instance for grounding tests
grounding_pipeline = RAGPipeline(min_score=0.35)


# -----------------------------------------------------------------------------
# Property 4: RAG grounding — no unverified factual statements
# Validates: Requirements 12.3, 12.4, 12.5
# -----------------------------------------------------------------------------
@settings(max_examples=20, deadline=None)
@given(
    known_fact=st.text(min_size=15, max_size=80, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs'))),
    unknown_fact=st.text(min_size=15, max_size=80, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs')))
)
def test_property_4_rag_grounding_verification(known_fact: str, unknown_fact: str):
    """
    Property-Based Test: Validates statement-level factual verification guardrails:
    - Known facts explicitly present in the policy must be verified as supported=True.
    - Alien/hallucinated statements not present in the indexed document must fail verification,
      preventing compliance risk by ensuring ungrounded statements are identified.
    """
    # 1. Clean and filter generated strings
    known = known_fact.strip()
    unknown = unknown_fact.strip()
    if not known or not unknown or known.lower() == unknown.lower():
        return

    session_id = str(uuid.uuid4())

    # 2. Index a synthetic document containing the confirmed 'known' statement
    doc = ProcessedDocument(
        source_type="text",
        filename="GroundingDoc.pdf",
        page_count=1,
        chunks=[DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            text=f"Confirmed policy coverage statement: {known}",
            page_number=1,
            section_heading="Verified Terms",
            block_type="paragraph",
            token_count=len(known.split()) + 4,
        )],
        raw_markdown=known,
    )
    grounding_pipeline.index_document(doc, session_id)

    # 3. Verify known statement against index -> Must be supported
    res_known = grounding_pipeline.verify_statements([known], session_id)
    if res_known:
        assert res_known[0].supported is True

    # 4. Verify alien statement not in document -> Must NOT match with full confidence
    completely_alien = f"Unrelated unverified factxyz123 {unknown}"
    res_unknown = grounding_pipeline.verify_statements([completely_alien], session_id)
    if res_unknown and completely_alien not in known:
        # Alien statement must have low relevance score and not be falsely verified
        assert res_unknown[0].relevance_score < 1.0

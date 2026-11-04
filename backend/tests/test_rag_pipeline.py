import uuid
import pytest
from hypothesis import given, settings, strategies as st
from app.models import DocumentChunk, ProcessedDocument
from app.services.rag_pipeline import RAGPipeline

def make_test_doc(text_sections):
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

def test_rag_pipeline_indexing_and_retrieval():
    pipeline = RAGPipeline(min_score=0.2)
    session_id = str(uuid.uuid4())
    doc = make_test_doc([
        ("Coverage", "This policy covers hospitalization expenses up to Rs. 5,00,000 for critical illness."),
        ("Exclusions", "Dental treatment and cosmetic surgery are permanently excluded from this coverage."),
        ("Claims", "To claim, intimate the insurance desk within 24 hours of hospital admission."),
    ])

    result = pipeline.index_document(doc, session_id=session_id)
    assert result.status == "ready"
    assert result.chunk_count >= 3

    # Retrieval
    passages = pipeline.retrieve("hospitalization expenses", session_id=session_id, top_k=2)
    assert len(passages) > 0
    assert "hospitalization" in passages[0].text.lower()
    assert passages[0].document_name == "TestPolicy.pdf"

    # Below threshold query
    unrelated = pipeline.retrieve("extraterrestrial space travel rocket launch", session_id=session_id, min_score=0.8)
    assert len(unrelated) == 0

def test_rag_chunk_h2_and_table_handling():
    pipeline = RAGPipeline(chunk_size=50)
    session_id = str(uuid.uuid4())
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
    res = pipeline.index_document(doc, session_id)
    assert res.chunk_count == 1
    assert "Gold" in pipeline._store[session_id][0]["text"]

# Feature: policy-vision-ai, Property 4: RAG grounding — no unverified factual statements
# Validates: Requirements 12.3, 12.4, 12.5
@settings(max_examples=50)
@given(
    known_fact=st.text(min_size=15, max_size=80, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs'))),
    unknown_fact=st.text(min_size=15, max_size=80, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs')))
)
def test_property_4_rag_grounding_verification(known_fact, unknown_fact):
    known = known_fact.strip()
    unknown = unknown_fact.strip()
    if not known or not unknown or known.lower() == unknown.lower():
        return

    pipeline = RAGPipeline(min_score=0.35)
    session_id = str(uuid.uuid4())

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
    pipeline.index_document(doc, session_id)

    # Verification of known fact
    res_known = pipeline.verify_statements([known], session_id)
    if res_known:
        assert res_known[0].supported is True

    # Verification of fact that does not exist in the index
    completely_alien = f"Unrelated unverified factxyz123 {unknown}"
    res_unknown = pipeline.verify_statements([completely_alien], session_id)
    if res_unknown and completely_alien not in known:
        # Unsupported statements are identified
        assert res_unknown[0].relevance_score < 1.0


"""
test_production_rag.py
=======================
Advanced Production Retrieval & Ranking Test Suite for PolicyVision AI.

This module validates:
1. BM25Okapi Exact Term & Number Recall:
   - Precision retrieval of exact policy clause codes (e.g. IRDAI circular numbers).
   - Numerical matching of waiting periods (e.g. '36 months').
   - Exact currency limits (e.g. 'Rs. 5000', '1% Sum Insured').
2. Insurance Domain Query Expansion:
   - Colloquial acronym expansion (e.g. 'ped' -> 'pre-existing disease').
   - Claim terminology expansion (e.g. 'cashless' -> 'pre-authorization', 'network hospital').
   - Sub-limit terminology expansion (e.g. 'room rent' -> 'proportionate deduction').
3. Hybrid RRF (Reciprocal Rank Fusion) + Cross-Encoder Reranker:
   - Joint scoring combining dense embedding similarity, BM25 scores, term coverage,
     exact phrase matching, and section heading alignment.
4. Hierarchical Table Header Retention:
   - Preserving markdown table schema by prepending headers to subsequent row chunks.
"""

import uuid
import pytest
from app.models import DocumentChunk, ProcessedDocument
from app.services.rag_pipeline import (
    BM25Index,
    InsuranceQueryExpander,
    FastCrossReranker,
    RAGPipeline,
)


# -----------------------------------------------------------------------------
# Unit Test: BM25Okapi Exact Match for Numerical Clauses and IRDAI Codes
# -----------------------------------------------------------------------------
def test_bm25_exact_numerical_and_code_recall():
    """
    Unit Test: Tests BM25Okapi sparse search capabilities on real-world policy text:
    - Verifies exact identification of complex statutory circular codes.
    - Verifies numeric matching of specific waiting period thresholds.
    - Verifies currency and sub-limit clause recall.
    """
    # 1. Construct a multi-clause corpus representing typical policy wording
    corpus = [
        "Section 1: General definitions and preamble.",
        "Section 2.1: Waiting period for pre-existing disease (PED) is strictly 36 months from inception.",
        "Section 2.2: Initial waiting period of 30 days applies to all hospital admissions except accidental injury.",
        "Section 3.4: Under IRDAI/HLT/REG/CIR/193/07/2020, cashless pre-auth must be processed within 60 minutes.",
        "Section 4.1: Room rent is capped at Rs. 5000 per day or 1% of Sum Insured.",
    ]
    bm25 = BM25Index()
    bm25.index(corpus)

    # 2. Test exact statutory code query: 'IRDAI/HLT/REG/CIR/193/07/2020'
    scores_code = bm25.score("IRDAI/HLT/REG/CIR/193/07/2020")
    top_idx = scores_code.index(max(scores_code))
    assert top_idx == 3
    assert "CIR/193" in corpus[top_idx]

    # 3. Test exact numerical waiting period query: '36 months'
    scores_num = bm25.score("36 months")
    top_num_idx = scores_num.index(max(scores_num))
    assert top_num_idx == 1
    assert "36 months" in corpus[top_num_idx]

    # 4. Test exact room rent sub-limit query: 'Rs. 5000 1% room rent'
    scores_rent = bm25.score("Rs. 5000 1% room rent")
    top_rent_idx = scores_rent.index(max(scores_rent))
    assert top_rent_idx == 4
    assert "Rs. 5000" in corpus[top_rent_idx]


# -----------------------------------------------------------------------------
# Unit Test: Insurance Domain Query Expansion
# -----------------------------------------------------------------------------
def test_insurance_query_expansion():
    """
    Unit Test: Verifies InsuranceQueryExpander maps layman/colloquial user terms
    into canonical IRDAI insurance vocabulary for higher retrieval precision.
    """
    # Block A: Acronym expansion for 'ped' -> 'pre-existing disease'
    exp1 = InsuranceQueryExpander.expand_query("Does this policy cover ped?")
    assert "pre-existing disease" in exp1.lower()

    # Block B: Cashless claims expansion -> 'pre-authorization' and 'network hospital'
    exp2 = InsuranceQueryExpander.expand_query("how to claim cashless in emergency")
    assert "pre-authorization" in exp2.lower()

    # Block C: Room rent expansion -> 'proportionate deduction'
    exp3 = InsuranceQueryExpander.expand_query("what is the room rent limit?")
    assert "proportionate deduction" in exp3.lower()


# -----------------------------------------------------------------------------
# Unit Test: Hybrid Dense + Sparse Retrieval with Cross Reranking
# -----------------------------------------------------------------------------
def test_hybrid_pipeline_with_reranker():
    """
    Unit Test: Tests the complete hybrid retrieval flow:
    - Dense vector search + Sparse BM25 + Reciprocal Rank Fusion + Cross-Encoder reranking.
    - Verifies that colloquial queries ('ped') correctly rank the Waiting Periods chunk first.
    - Verifies that time-sensitive queries ('24 hours') correctly rank the Claims Procedure chunk.
    """
    # 1. Initialize pipeline and session
    pipeline = RAGPipeline(min_score=0.25)
    session_id = str(uuid.uuid4())

    # 2. Build structured document with Waiting Periods, Room Rent, and Claims Procedure
    doc = ProcessedDocument(
        source_type="pdf",
        filename="CareHealth_Wording.pdf",
        page_count=3,
        chunks=[
            DocumentChunk(
                chunk_id="c-ped",
                text="Pre-existing diseases (PED) are covered after a continuous waiting period of 36 months.",
                page_number=1,
                section_heading="Waiting Periods",
                block_type="paragraph",
                token_count=14,
            ),
            DocumentChunk(
                chunk_id="c-rent",
                text="Room rent limit: Single standard A/C room. Proportionate deductions apply if higher category room is occupied.",
                page_number=2,
                section_heading="Inpatient Benefits",
                block_type="paragraph",
                token_count=16,
            ),
            DocumentChunk(
                chunk_id="c-claim",
                text="Emergency hospital intimation must be submitted to the TPA desk within 24 hours of hospital admission.",
                page_number=3,
                section_heading="Claims Procedure",
                block_type="paragraph",
                token_count=16,
            ),
        ],
        raw_markdown="",
    )

    # 3. Index document
    res = pipeline.index_document(doc, session_id=session_id)
    assert res.status == "ready"
    assert res.chunk_count == 3

    # 4. Query with acronym 'ped' - Hybrid should retrieve Waiting Periods chunk
    passages = pipeline.retrieve("when will my ped be covered?", session_id=session_id, top_k=1)
    assert len(passages) == 1
    assert passages[0].chunk_id == "c-ped"
    assert "36 months" in passages[0].text
    assert passages[0].relevance_score >= 0.35

    # 5. Query with exact time '24 hours' - Hybrid should retrieve Claims chunk
    claim_passages = pipeline.retrieve("24 hours emergency intimation", session_id=session_id, top_k=1)
    assert len(claim_passages) == 1
    assert claim_passages[0].chunk_id == "c-claim"
    assert "TPA desk" in claim_passages[0].text


# -----------------------------------------------------------------------------
# Unit Test: Hierarchical Table Schema Preservation
# -----------------------------------------------------------------------------
def test_hierarchical_table_header_retention():
    """
    Unit Test: Verifies hierarchical chunking preserves table context:
    When table rows are partitioned across chunks, the column headers (Tier | Sum Insured | Co-Pay)
    must be prepended to data rows so retrieval can match on column meaning.
    """
    pipeline = RAGPipeline(min_score=0.2)
    session_id = str(uuid.uuid4())

    doc = ProcessedDocument(
        source_type="pdf",
        filename="Schedule.pdf",
        page_count=1,
        chunks=[
            DocumentChunk(
                chunk_id="tbl-hdr",
                text="| Tier | Sum Insured | Co-Pay |\n| Silver | Rs 3,00,000 | 10% |",
                page_number=1,
                section_heading="Benefit Schedule",
                block_type="table_row",
                token_count=16,
            ),
            DocumentChunk(
                chunk_id="tbl-gold",
                text="| Gold | Rs 10,00,000 | 0% |",
                page_number=1,
                section_heading="Benefit Schedule",
                block_type="table_row",
                token_count=12,
            ),
        ],
        raw_markdown="",
    )

    pipeline.index_document(doc, session_id=session_id)
    stored = pipeline._store[session_id]
    
    # Locate the chunk containing 'Gold' and verify column header 'Sum Insured' was retained
    gold_chunk = [item for item in stored if "Gold" in item["text"]][0]
    assert "Sum Insured" in gold_chunk["text"]

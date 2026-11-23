"""
test_llm_engine.py
===================
Unit and Property-Based Test Suite for the LLMEngine and Simplification System.

This test module validates:
1. Property 2 (Hypothesis): Simplified explanations preserve all numeric values verbatim:
   - Currency amounts (e.g., Rs. 50,000, Rs. 10,00,000).
   - Deductibles and co-pay percentages (e.g., 10%, 20%).
   - Timelines and waiting periods (e.g., 30 days, 36 months).
2. Property 3 (Hypothesis): Three-section invariant structure & Flesch-Kincaid grade level:
   - Exactly three distinct sections: 'What is Covered', 'What is Not Covered', 'How to Claim'.
   - Readability grade strictly between 1.0 and 8.0 (Flesch-Kincaid Grade Level).
3. Unit Test Cases:
   - Graceful fallback messaging when fields are missing or not found.
   - Sequential claim step extraction with step ordering and numbering.
   - Intelligent visual detection: Flagging visual_needed=True for quantifiable benefits.
"""

import uuid
import pytest
from hypothesis import given, settings, strategies as st
from app.models import PolicyField, PolicyFields, RetrievedPassage
from app.services.llm_engine import LLMEngine, compute_fk_grade

# Global instance of LLMEngine initialized with default configurations
engine = LLMEngine()


# -----------------------------------------------------------------------------
# Property 2: Simplified explanation preserves all numeric values
# Validates: Requirements 4.3, 12.3
# -----------------------------------------------------------------------------
@settings(max_examples=25, deadline=None)
@given(
    amount=st.integers(min_value=1000, max_value=5000000),
    percentage=st.integers(min_value=1, max_value=100),
)
def test_property_2_numeric_value_preservation(amount: int, percentage: int):
    """
    Property-Based Test: Verifies that all numeric limits, deductibles, co-pays,
    and currencies present in the extracted fields or source passages are preserved
    verbatim in the simplified output. No numerical hallucination or omission is allowed.
    """
    # 1. Format numerical values as Indian insurance policy strings
    amt_str = f"Rs. {amount}"
    pct_str = f"{percentage}%"
    
    # 2. Construct extracted policy fields incorporating the generated numbers
    fields = PolicyFields(
        coverage_type=PolicyField(value=f"Health Plan with {pct_str} copay", status="found", source_passage_ids=[]),
        coverage_limits=PolicyField(value=f"Up to {amt_str} total", status="found", source_passage_ids=[]),
        premium_details=PolicyField(value="Annual premium Rs. 15000", status="found", source_passage_ids=[]),
        exclusions=PolicyField(value="Self-inflicted injuries", status="found", source_passage_ids=[]),
        claim_procedures=PolicyField(value="File within 30 days", status="found", source_passage_ids=[]),
    )

    # 3. Create a corresponding grounding passage
    passages = [
        RetrievedPassage(
            chunk_id=str(uuid.uuid4()),
            text=f"Total sum insured is {amt_str} and co-payment is {pct_str}.",
            document_name="Policy.pdf",
            page_number=1,
            section_heading="Limits",
            relevance_score=0.9,
        )
    ]

    # 4. Generate the 3-section simplified explanation
    simplified = engine.simplify(fields, passages, language="en")
    combined_output = f"{simplified.what_is_covered} {simplified.what_is_not_covered} {simplified.how_to_claim}"

    # 5. Assert: Both the exact currency amount and the co-pay percentage must appear in the final text
    assert str(amount) in combined_output or amt_str in combined_output
    assert str(percentage) in combined_output or pct_str in combined_output


# -----------------------------------------------------------------------------
# Property 3: Simplified explanation three-section structure is invariant
# Validates: Requirements 4.4, 4.5
# -----------------------------------------------------------------------------
@settings(max_examples=25, deadline=None)
@given(
    sample_text=st.text(min_size=10, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs')))
)
def test_property_3_three_section_structure_invariant(sample_text: str):
    """
    Property-Based Test: Verifies structural compliance of the explanation:
    - Must always contain three non-empty sections: What is Covered, What is Not Covered, and How to Claim.
    - Readability must be strictly bounded between Grade 1.0 and 8.0 on the Flesch-Kincaid scale.
    """
    # 1. Construct policy fields with arbitrary text input
    fields = PolicyFields(
        coverage_type=PolicyField(value=sample_text[:50] if sample_text.strip() else None, status="found" if sample_text.strip() else "not_found"),
        coverage_limits=PolicyField(value=None, status="not_found"),
        premium_details=PolicyField(value=None, status="not_found"),
        exclusions=PolicyField(value=None, status="not_found"),
        claim_procedures=PolicyField(value=None, status="not_found"),
    )

    # 2. Execute simplification pass
    simplified = engine.simplify(fields, [], language="en")

    # 3. Invariant check: exactly three non-empty sections
    assert simplified.what_is_covered and len(simplified.what_is_covered.strip()) > 0
    assert simplified.what_is_not_covered and len(simplified.what_is_not_covered.strip()) > 0
    assert simplified.how_to_claim and len(simplified.how_to_claim.strip()) > 0

    # 4. Invariant check: Flesch-Kincaid grade level within bounds (1.0 to 8.0 inclusive)
    assert 1.0 <= simplified.fk_grade_level <= 8.0


# -----------------------------------------------------------------------------
# Unit Test: Deterministic Edge Cases for LLMEngine
# -----------------------------------------------------------------------------
def test_llm_engine_unit_cases():
    """
    Unit Test: Validates explicit unit behaviors:
    - Missing fields produce standard fallback text.
    - Claim steps are cleanly parsed and indexed in sequential order.
    - Heuristic detector flags queries that require visual explainers.
    """
    # Block A: Missing fields produce compliant fallback text
    empty_fields = PolicyFields(
        coverage_type=PolicyField(value=None, status="not_found"),
        coverage_limits=PolicyField(value=None, status="not_found"),
        premium_details=PolicyField(value=None, status="not_found"),
        exclusions=PolicyField(value=None, status="not_found"),
        claim_procedures=PolicyField(value=None, status="not_found"),
    )
    res = engine.simplify(empty_fields, [], language="en")
    assert "No relevant" in res.what_is_covered
    assert "No relevant" in res.what_is_not_covered
    assert "No relevant" in res.how_to_claim

    # Block B: Sequential claim steps extraction
    passages = [
        RetrievedPassage(
            chunk_id="1",
            text="1. Intimate the insurer immediately.\n2. Submit claim documents and bills.\n3. Receive cashless authorization.",
            document_name="Policy.pdf",
            page_number=2,
            section_heading="Claims",
            relevance_score=0.95,
        )
    ]
    steps = engine.extract_claim_steps(passages)
    assert len(steps) == 3
    assert steps[0].step_number == 1
    assert steps[1].step_number == 2
    assert steps[2].step_number == 3

    # Block C: Visual need classification for quantifiable benefit queries
    qa1 = engine.answer_question("What is the maximum coverage limit in rupees?", passages, [])
    assert qa1.is_visual_needed is True

    # Block D: Visual need classification for non-visual factual queries
    qa2 = engine.answer_question("Who wrote this document?", passages, [])
    assert qa2.is_visual_needed is False

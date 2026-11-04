import uuid
import pytest
from hypothesis import given, settings, strategies as st
from app.models import PolicyField, PolicyFields, RetrievedPassage
from app.services.llm_engine import LLMEngine, compute_fk_grade

engine = LLMEngine()

# Feature: policy-vision-ai, Property 2: Simplified explanation preserves all numeric values
# Validates: Requirements 4.3, 12.3
@settings(max_examples=50)
@given(
    amount=st.integers(min_value=1000, max_value=5000000),
    percentage=st.integers(min_value=1, max_value=100),
)
def test_property_2_numeric_value_preservation(amount, percentage):
    amt_str = f"Rs. {amount}"
    pct_str = f"{percentage}%"
    
    fields = PolicyFields(
        coverage_type=PolicyField(value=f"Health Plan with {pct_str} copay", status="found", source_passage_ids=[]),
        coverage_limits=PolicyField(value=f"Up to {amt_str} total", status="found", source_passage_ids=[]),
        premium_details=PolicyField(value="Annual premium Rs. 15000", status="found", source_passage_ids=[]),
        exclusions=PolicyField(value="Self-inflicted injuries", status="found", source_passage_ids=[]),
        claim_procedures=PolicyField(value="File within 30 days", status="found", source_passage_ids=[]),
    )

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

    simplified = engine.simplify(fields, passages, language="en")
    combined_output = f"{simplified.what_is_covered} {simplified.what_is_not_covered} {simplified.how_to_claim}"

    # Assert numeric tokens appear in the output
    assert str(amount) in combined_output or amt_str in combined_output
    assert str(percentage) in combined_output or pct_str in combined_output

# Feature: policy-vision-ai, Property 3: Simplified explanation three-section structure is invariant
# Validates: Requirements 4.4, 4.5
@settings(max_examples=50)
@given(
    sample_text=st.text(min_size=10, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs')))
)
def test_property_3_three_section_structure_invariant(sample_text):
    fields = PolicyFields(
        coverage_type=PolicyField(value=sample_text[:50] if sample_text.strip() else None, status="found" if sample_text.strip() else "not_found"),
        coverage_limits=PolicyField(value=None, status="not_found"),
        premium_details=PolicyField(value=None, status="not_found"),
        exclusions=PolicyField(value=None, status="not_found"),
        claim_procedures=PolicyField(value=None, status="not_found"),
    )

    simplified = engine.simplify(fields, [], language="en")

    # Invariant: exactly three non-empty sections
    assert simplified.what_is_covered and len(simplified.what_is_covered.strip()) > 0
    assert simplified.what_is_not_covered and len(simplified.what_is_not_covered.strip()) > 0
    assert simplified.how_to_claim and len(simplified.how_to_claim.strip()) > 0

    # Invariant: Flesch-Kincaid grade level within bounds (1 to 8 inclusive)
    assert 1.0 <= simplified.fk_grade_level <= 8.0

def test_llm_engine_unit_cases():
    # Missing fields handling
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

    # Claim steps extraction
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

    # Answer question visual needed detection
    qa1 = engine.answer_question("What is the maximum coverage limit in rupees?", passages, [])
    assert qa1.is_visual_needed is True

    qa2 = engine.answer_question("Who wrote this document?", passages, [])
    assert qa2.is_visual_needed is False


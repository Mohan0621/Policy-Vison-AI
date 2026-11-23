"""
test_visual_prompt_builder.py
==============================
Unit and Property-Based Test Suite for Visual Prompt Construction.

This test module validates:
1. Property 6 (Hypothesis): Coverage visual prompt completeness:
   - Verified that extracted currency amounts (e.g. sum insured and sub-limits)
     are synthesized into the descriptive prompt text.
   - Text overlays are automatically populated for card headings and values.
2. Property 9 (Hypothesis): Claims step ordering is preserved:
   - Shuffled or reverse-ordered claim steps are deterministically sorted by step_number.
   - Steps appear sequentially in the prompt text (Stage 1 -> Stage 2 -> Stage 3).
3. Visual Style Modifiers:
   - Differentiating prompt positive/negative keywords for:
     * Professional Infographic (flat vector, corporate palette, high contrast).
     * Illustrated Cartoon (friendly shapes, rounded cards, approachable art).
     * Flowchart Diagram (technical flowchart, decision diamond, process boxes).
4. Conditional Q&A Visual Prompt Generation:
   - None returned when is_visual_needed=False.
   - High-fidelity prompt generated when is_visual_needed=True.
"""

import pytest
from hypothesis import given, settings, strategies as st
from app.models import ClaimStep, PolicyField, PolicyFields, QAAnswer, VisualStyle
from app.services.visual_prompt_builder import VisualPromptBuilder

# Global builder instance
builder = VisualPromptBuilder()


# -----------------------------------------------------------------------------
# Property 6: Coverage visual prompt completeness
# Validates: Requirements 5.4
# -----------------------------------------------------------------------------
@settings(max_examples=30, deadline=None)
@given(
    amount1=st.integers(min_value=50000, max_value=1000000),
    amount2=st.integers(min_value=10000, max_value=50000),
)
def test_property_6_coverage_prompt_completeness(amount1: int, amount2: int):
    """
    Property-Based Test: Verifies that coverage prompts always synthesize
    extracted limits, categories, and typography overlays regardless of the numerical range.
    """
    amt1_str = f"Rs. {amount1}"
    amt2_str = f"Rs. {amount2}"
    
    # 1. Construct policy fields with numerical limits
    fields = PolicyFields(
        coverage_type=PolicyField(value="Comprehensive Health", status="found"),
        coverage_limits=PolicyField(value=f"{amt1_str} main limit and {amt2_str} sublimit", status="found"),
        premium_details=PolicyField(value="Annual premium", status="found"),
        exclusions=PolicyField(value="None", status="found"),
        claim_procedures=PolicyField(value="Standard", status="found"),
    )

    # 2. Build coverage prompt
    prompt = builder.build_coverage_prompt(fields, style=VisualStyle.PROFESSIONAL_INFOGRAPHIC)
    
    # 3. Assert coverage categories and numeric amounts appear in the prompt text
    assert "Infographic" in prompt.prompt_text
    assert str(amount1) in prompt.prompt_text
    assert str(amount2) in prompt.prompt_text
    
    # 4. Assert at least 3 text overlays are generated for titles and metrics
    assert len(prompt.text_overlays) >= 3


# -----------------------------------------------------------------------------
# Property 9: Claims step ordering is preserved
# Validates: Requirements 6.3
# -----------------------------------------------------------------------------
@settings(max_examples=30, deadline=None)
@given(
    step_count=st.integers(min_value=2, max_value=10)
)
def test_property_9_claims_step_ordering(step_count: int):
    """
    Property-Based Test: Validates that regardless of the initial input order
    (even if reversed or shuffled), the claims prompt builder sorts steps in
    ascending numerical sequence (Stage 1 -> Stage 2 -> Stage 3).
    """
    # 1. Create sequential claim steps
    steps = [
        ClaimStep(
            step_number=i,
            title=f"Action Stage {i}",
            description=f"Description for step {i}",
            path_label="cashless" if i % 2 == 0 else "reimbursement",
        )
        for i in range(1, step_count + 1)
    ]
    
    # 2. Intentionally reverse the list to test sorting robustness
    reversed_steps = list(reversed(steps))

    # 3. Build claims prompt
    prompt = builder.build_claims_prompt(reversed_steps, style=VisualStyle.FLOWCHART_DIAGRAM)
    
    # 4. Assert each step number appears in strictly ascending sequential position
    indices = [prompt.prompt_text.find(f"Stage {i}") for i in range(1, step_count + 1)]
    assert all(idx != -1 for idx in indices)
    assert indices == sorted(indices)


# -----------------------------------------------------------------------------
# Unit Test: Multi-Style Modifier Verification
# -----------------------------------------------------------------------------
def test_visual_prompt_builder_styles():
    """
    Unit Test: Verifies positive and negative prompt style keywords across the 3 supported visual styles:
    - Professional Infographic: clean flat design, structured cards.
    - Illustrated Cartoon: approachable vector cartoon, friendly colors.
    - Flowchart Diagram: technical process flow, decision nodes.
    """
    fields = PolicyFields(
        coverage_type=PolicyField(value="Medical Cover", status="found"),
        coverage_limits=PolicyField(value="Rs. 500000", status="found"),
        premium_details=PolicyField(value="Rs. 5000", status="found"),
        exclusions=PolicyField(value="None", status="found"),
        claim_procedures=PolicyField(value="Online", status="found"),
    )

    # Style 1: Professional Infographic
    p1 = builder.build_coverage_prompt(fields, style=VisualStyle.PROFESSIONAL_INFOGRAPHIC)
    assert "flat design infographic" in p1.prompt_text
    assert "photorealistic" in p1.negative_prompt

    # Style 2: Illustrated Cartoon
    p2 = builder.build_coverage_prompt(fields, style=VisualStyle.ILLUSTRATED_CARTOON)
    assert "cartoon style" in p2.prompt_text

    # Style 3: Flowchart Diagram
    p3 = builder.build_coverage_prompt(fields, style=VisualStyle.FLOWCHART_DIAGRAM)
    assert "flowchart" in p3.prompt_text


# -----------------------------------------------------------------------------
# Unit Test: Conditional Q&A Visual Prompt Generation
# -----------------------------------------------------------------------------
def test_qa_visual_prompt_none_when_unneeded():
    """
    Unit Test: Validates that visual prompts for Q&A are only built when
    the answer is flagged with is_visual_needed=True.
    """
    # Block A: Text-only answer -> returns None
    ans_no_visual = QAAnswer(text="Yes, policy is valid.", is_visual_needed=False, citations=[])
    res = builder.build_qa_visual_prompt(ans_no_visual)
    assert res is None

    # Block B: Quantifiable answer -> builds prompt
    ans_with_visual = QAAnswer(text="The coverage limit is Rs. 10 Lakh.", is_visual_needed=True, citations=[])
    res2 = builder.build_qa_visual_prompt(ans_with_visual)
    assert res2 is not None
    assert "infographic" in res2.prompt_text.lower()

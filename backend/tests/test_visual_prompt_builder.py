import pytest
from hypothesis import given, settings, strategies as st
from app.models import ClaimStep, PolicyField, PolicyFields, QAAnswer, VisualStyle
from app.services.visual_prompt_builder import VisualPromptBuilder

builder = VisualPromptBuilder()

# Feature: policy-vision-ai, Property 6: Coverage visual prompt completeness
# Validates: Requirements 5.4
@settings(max_examples=50)
@given(
    amount1=st.integers(min_value=50000, max_value=1000000),
    amount2=st.integers(min_value=10000, max_value=50000),
)
def test_property_6_coverage_prompt_completeness(amount1, amount2):
    amt1_str = f"Rs. {amount1}"
    amt2_str = f"Rs. {amount2}"
    
    fields = PolicyFields(
        coverage_type=PolicyField(value="Comprehensive Health", status="found"),
        coverage_limits=PolicyField(value=f"{amt1_str} main limit and {amt2_str} sublimit", status="found"),
        premium_details=PolicyField(value="Annual premium", status="found"),
        exclusions=PolicyField(value="None", status="found"),
        claim_procedures=PolicyField(value="Standard", status="found"),
    )

    prompt = builder.build_coverage_prompt(fields, style=VisualStyle.PROFESSIONAL_INFOGRAPHIC)
    
    # Assert coverage categories and numeric amounts appear in the prompt text
    assert "Infographic" in prompt.prompt_text
    assert str(amount1) in prompt.prompt_text
    assert str(amount2) in prompt.prompt_text
    # Overlays generated
    assert len(prompt.text_overlays) >= 3

# Feature: policy-vision-ai, Property 9: Claims step ordering is preserved
# Validates: Requirements 6.3
@settings(max_examples=50)
@given(
    step_count=st.integers(min_value=2, max_value=10)
)
def test_property_9_claims_step_ordering(step_count):
    # Pass shuffled steps
    steps = [
        ClaimStep(
            step_number=i,
            title=f"Action Stage {i}",
            description=f"Description for step {i}",
            path_label="cashless" if i % 2 == 0 else "reimbursement",
        )
        for i in range(1, step_count + 1)
    ]
    # Reverse to test that builder sorts properly
    reversed_steps = list(reversed(steps))

    prompt = builder.build_claims_prompt(reversed_steps, style=VisualStyle.FLOWCHART_DIAGRAM)
    
    # Assert each step number appears in ascending sequential order in prompt_text
    indices = [prompt.prompt_text.find(f"Stage {i}") for i in range(1, step_count + 1)]
    assert all(idx != -1 for idx in indices)
    assert indices == sorted(indices)

def test_visual_prompt_builder_styles():
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

def test_qa_visual_prompt_none_when_unneeded():
    ans_no_visual = QAAnswer(text="Yes, policy is valid.", is_visual_needed=False, citations=[])
    res = builder.build_qa_visual_prompt(ans_no_visual)
    assert res is None

    ans_with_visual = QAAnswer(text="The coverage limit is Rs. 10 Lakh.", is_visual_needed=True, citations=[])
    res2 = builder.build_qa_visual_prompt(ans_with_visual)
    assert res2 is not None
    assert "infographic" in res2.prompt_text.lower()


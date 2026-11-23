"""
test_session_and_qa.py
======================
Unit and Property-Based Test Suite for Session Management and Q&A Engine.

This test module validates:
1. Property 7 (Hypothesis): Q&A Context Window FIFO Eviction:
   - Ensuring the Q&A message history never exceeds 10 messages (MAX_QA_HISTORY).
   - Validating that older messages are evicted first-in, first-out (FIFO).
2. Session Inactivity Expiry:
   - Complete session termination after 4 hours of inactivity.
3. Q&A Context Window Inactivity Purge:
   - Preserving the active session while purging conversational Q&A history
     after 30 minutes of chat inactivity.
4. Grounded Fallback Behavior:
   - Returning compliant 'no relevant content' messages when questions
     have no matching policy passages.
"""

import datetime
import uuid
import pytest
from hypothesis import given, settings, strategies as st
from app.services.session_manager import SessionManager
from app.services.qa_engine import QAEngine


# -----------------------------------------------------------------------------
# Property 7: Q&A context window FIFO eviction
# Validates: Requirements 9.4
# -----------------------------------------------------------------------------
@settings(max_examples=30, deadline=None)
@given(
    message_count=st.integers(min_value=5, max_value=25)
)
def test_property_7_qa_fifo_eviction(message_count: int):
    """
    Property-Based Test: Verifies that adding arbitrary numbers of messages to the
    session history never causes the context window to exceed 10 entries.
    When message_count >= 10, the oldest remaining message must match the tail of the stream.
    """
    # 1. Initialize session manager with a fixed max history of 10
    sm = SessionManager(max_qa_history=10)
    session_id = str(uuid.uuid4())
    sm.create_session(session_id)

    # 2. Add sequential user messages
    messages = [f"Message text #{i}" for i in range(1, message_count + 1)]
    for m in messages:
        sm.add_qa_message(session_id, role="user", content=m)

    # 3. Retrieve session history
    session = sm.get_session(session_id)
    history = session["qa_history"]

    # 4. Invariant check: history length never exceeds 10
    assert len(history) <= 10

    # 5. Invariant check: FIFO eviction retains the most recent 10 messages
    if message_count >= 10:
        assert len(history) == 10
        expected_first = messages[message_count - 10]
        assert history[0]["content"] == expected_first


# -----------------------------------------------------------------------------
# Unit Test: 4-Hour Total Session Inactivity Expiry
# -----------------------------------------------------------------------------
def test_session_manager_inactivity_expiry():
    """
    Unit Test: Tests that a session inactive for > 4 hours is automatically
    purged from the session store when accessed.
    """
    # 1. Initialize session manager and create session
    sm = SessionManager(inactivity_hours=4, qa_inactivity_minutes=30)
    session_id = str(uuid.uuid4())
    session = sm.create_session(session_id)
    assert session["session_id"] == session_id

    # 2. Simulate 5 hours of inactivity by rewinding last_active_at
    past = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=5)).isoformat()
    sm._sessions[session_id]["last_active_at"] = past

    # 3. Accessing the session must detect expiry and return None
    assert sm.get_session(session_id) is None


# -----------------------------------------------------------------------------
# Unit Test: 30-Minute Q&A Conversational Inactivity Purge
# -----------------------------------------------------------------------------
def test_qa_inactivity_context_clearing():
    """
    Unit Test: Tests that 30 minutes of chat inactivity clears conversational
    context (qa_history) while keeping the document session intact.
    """
    # 1. Initialize session and record a message
    sm = SessionManager(inactivity_hours=4, qa_inactivity_minutes=30)
    session_id = str(uuid.uuid4())
    sm.create_session(session_id)
    sm.add_qa_message(session_id, "user", "What is my copay?")
    assert len(sm.get_session(session_id)["qa_history"]) == 1

    # 2. Simulate 35 minutes of chat inactivity
    past_qa = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=35)).isoformat()
    sm._sessions[session_id]["last_qa_active_at"] = past_qa

    # 3. Session remains valid, but Q&A history context was reset
    sess = sm.get_session(session_id)
    assert sess is not None
    assert len(sess["qa_history"]) == 0


# -----------------------------------------------------------------------------
# Unit Test: Q&A Engine No Relevant Content Fallback
# -----------------------------------------------------------------------------
def test_qa_engine_no_relevant_content():
    """
    Unit Test: Tests that asking questions about topics not present in the indexed
    document produces a standard compliance refusal without hallucination.
    """
    qa = QAEngine()
    session_id = str(uuid.uuid4())
    
    # Query unrelated to insurance
    res = qa.ask("Completely unrelated query about galaxies and constellations", session_id)
    assert res["no_content_message"] is True
    assert "not available" in res["answer"].lower()

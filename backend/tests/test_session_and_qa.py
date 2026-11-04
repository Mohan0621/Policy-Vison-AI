import datetime
import uuid
import pytest
from hypothesis import given, settings, strategies as st
from app.services.session_manager import SessionManager
from app.services.qa_engine import QAEngine

# Feature: policy-vision-ai, Property 7: Q&A context window FIFO eviction
# Validates: Requirements 9.4
@settings(max_examples=50)
@given(
    message_count=st.integers(min_value=5, max_value=25)
)
def test_property_7_qa_fifo_eviction(message_count):
    sm = SessionManager(max_qa_history=10)
    session_id = str(uuid.uuid4())
    sm.create_session(session_id)

    messages = [f"Message text #{i}" for i in range(1, message_count + 1)]
    for m in messages:
        sm.add_qa_message(session_id, role="user", content=m)

    session = sm.get_session(session_id)
    history = session["qa_history"]

    # History length never exceeds 10
    assert len(history) <= 10

    if message_count >= 10:
        assert len(history) == 10
        # The oldest remaining message must match the tail of the message sequence
        expected_first = messages[message_count - 10]
        assert history[0]["content"] == expected_first

def test_session_manager_inactivity_expiry():
    sm = SessionManager(inactivity_hours=4, qa_inactivity_minutes=30)
    session_id = str(uuid.uuid4())
    session = sm.create_session(session_id)
    assert session["session_id"] == session_id

    # Simulate 5 hours of inactivity
    past = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=5)).isoformat()
    sm._sessions[session_id]["last_active_at"] = past

    # Calling get_session should return None (session expired)
    assert sm.get_session(session_id) is None

def test_qa_inactivity_context_clearing():
    sm = SessionManager(inactivity_hours=4, qa_inactivity_minutes=30)
    session_id = str(uuid.uuid4())
    sm.create_session(session_id)
    sm.add_qa_message(session_id, "user", "What is my copay?")
    assert len(sm.get_session(session_id)["qa_history"]) == 1

    # Simulate 35 minutes of QA inactivity
    past_qa = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=35)).isoformat()
    sm._sessions[session_id]["last_qa_active_at"] = past_qa

    # Session is still valid, but Q&A history context was purged
    sess = sm.get_session(session_id)
    assert sess is not None
    assert len(sess["qa_history"]) == 0

def test_qa_engine_no_relevant_content():
    qa = QAEngine()
    session_id = str(uuid.uuid4())
    res = qa.ask("Completely unrelated query about galaxies and constellations", session_id)
    assert res["no_content_message"] is True
    assert "not available" in res["answer"].lower()


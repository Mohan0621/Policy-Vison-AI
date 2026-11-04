import uuid
import datetime
from typing import Any, Dict, List, Optional

from app.config import settings
from app.models import QAMessage, SourceCitation

class SessionManager:
    def __init__(
        self,
        inactivity_hours: int = settings.SESSION_INACTIVITY_HOURS,
        qa_inactivity_minutes: int = settings.QA_INACTIVITY_MINUTES,
        max_qa_history: int = settings.MAX_QA_HISTORY,
    ):
        self.inactivity_hours = inactivity_hours
        self.qa_inactivity_minutes = qa_inactivity_minutes
        self.max_qa_history = max_qa_history
        self._sessions: Dict[str, dict] = {}

    def _now(self) -> datetime.datetime:
        return datetime.datetime.now(datetime.timezone.utc)

    def _iso_now(self) -> str:
        return self._now().isoformat()

    def create_session(self, session_id: Optional[str] = None) -> dict:
        sid = session_id or str(uuid.uuid4())
        now_str = self._iso_now()
        session_data = {
            "session_id": sid,
            "created_at": now_str,
            "last_active_at": now_str,
            "last_qa_active_at": now_str,
            "policy_document": None,  # { filename, page_count, index_status }
            "text_description": None,
            "simplified_explanation": None,
            "visual_explainers": [],
            "qa_history": [],
            "selected_language": "en",
            "selected_style": "professional_infographic",
            "active_tasks": {},
        }
        self._sessions[sid] = session_data
        return session_data

    def get_session(self, session_id: str) -> Optional[dict]:
        session = self._sessions.get(session_id)
        if not session:
            return None

        # Check 4-hour total inactivity
        last_active = datetime.datetime.fromisoformat(session["last_active_at"])
        if (self._now() - last_active).total_seconds() > self.inactivity_hours * 3600:
            self.delete_session(session_id)
            return None

        # Check 30-minute Q&A context expiry
        last_qa = datetime.datetime.fromisoformat(session.get("last_qa_active_at", session["last_active_at"]))
        if (self._now() - last_qa).total_seconds() > self.qa_inactivity_minutes * 60:
            session["qa_history"] = []

        return session

    def reset_activity_timer(self, session_id: str) -> None:
        session = self._sessions.get(session_id)
        if session:
            session["last_active_at"] = self._iso_now()

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> dict:
        session = self.get_session(session_id)
        if not session:
            session = self.create_session(session_id)
        session.update(updates)
        session["last_active_at"] = self._iso_now()
        return session

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def add_qa_message(
        self,
        session_id: str,
        role: str,
        content: str,
        citations: Optional[List[dict]] = None,
    ) -> List[dict]:
        session = self.get_session(session_id)
        if not session:
            session = self.create_session(session_id)

        now_str = self._iso_now()
        session["last_active_at"] = now_str
        session["last_qa_active_at"] = now_str

        msg = {
            "role": role,
            "content": content,
            "citations": citations or [],
            "timestamp": now_str,
        }
        
        history = session.setdefault("qa_history", [])
        history.append(msg)
        
        # FIFO eviction: maintain at most max_qa_history (10)
        while len(history) > self.max_qa_history:
            history.pop(0)

        return history

session_manager = SessionManager()


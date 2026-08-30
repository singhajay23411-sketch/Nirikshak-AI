"""
Nirikshak AI — Assistant Pydantic Schemas
============================================
Request/response models for the assistant API.
"""

import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

try:
    from pydantic import field_validator
    USE_V2 = True
except ImportError:
    from pydantic import validator
    USE_V2 = False


# ─── Request Constants ───────────────────────────────────────────────────────

MAX_MESSAGE_LENGTH = 2000
ALLOWED_CONTEXT_FIELDS = {
    "current_page", "selected_work_id", "selected_mp_id",
    "selected_constituency", "selected_state", "selected_vendor",
}

CONVERSATION_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


class AssistantContext(BaseModel):
    """Structured context from the frontend page state."""
    current_page: Optional[str] = None
    selected_work_id: Optional[str] = None
    selected_mp_id: Optional[str] = None
    selected_constituency: Optional[str] = None
    selected_state: Optional[str] = None
    selected_vendor: Optional[str] = None


class AssistantQueryRequest(BaseModel):
    """Incoming assistant query from the frontend."""
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    conversation_id: Optional[str] = Field(None, max_length=64)
    context: Optional[AssistantContext] = None

    if USE_V2:
        @field_validator("message")
        @classmethod
        def validate_message(cls, v: str) -> str:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Message cannot be empty")
            if len(stripped) > MAX_MESSAGE_LENGTH:
                raise ValueError(f"Message exceeds {MAX_MESSAGE_LENGTH} characters")
            return stripped

        @field_validator("conversation_id")
        @classmethod
        def validate_conversation_id(cls, v: Optional[str]) -> Optional[str]:
            if v is not None and not CONVERSATION_ID_PATTERN.match(v):
                raise ValueError("Invalid conversation_id format")
            return v
    else:
        @validator("message")
        def validate_message(cls, v):
            stripped = v.strip()
            if not stripped:
                raise ValueError("Message cannot be empty")
            if len(stripped) > MAX_MESSAGE_LENGTH:
                raise ValueError(f"Message exceeds {MAX_MESSAGE_LENGTH} characters")
            return stripped

        @validator("conversation_id")
        def validate_conversation_id(cls, v):
            if v is not None and not CONVERSATION_ID_PATTERN.match(v):
                raise ValueError("Invalid conversation_id format")
            return v


# ─── Response ────────────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    """A single piece of evidence supporting the answer."""
    label: str
    value: str
    source: str
    record_id: Optional[str] = None


class DataSnapshot(BaseModel):
    """Metadata about the precomputed data used."""
    generated_at: Optional[str] = None
    version: Optional[str] = None
    total_records_analyzed: Optional[int] = None


class AssistantQueryResponse(BaseModel):
    """Response from the assistant."""
    status: str = "success"
    intent: str = "unknown"
    answer: str = ""
    entities: Dict[str, Any] = Field(default_factory=dict)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    related_records: List[Dict[str, Any]] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    data_snapshot: Optional[DataSnapshot] = None
    disclaimer: Optional[str] = None
    clarification: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response for failed requests."""
    status: str = "error"
    message: str
    code: Optional[str] = None

"""models.py

Data models and schemas for Nirikshak AI's Investigation Hub.
Supports human-in-the-loop escalation, field verification tasks, and audit logging.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import uuid

from shared.types import CaseStatus, RiskLevel, VerificationStatus


@dataclass
class OfficerNote:
    """Note or observation entered by an investigating officer."""
    note_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    author: str = "System"
    content: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "note_id": self.note_id,
            "author": self.author,
            "content": self.content,
            "timestamp": self.timestamp,
        }


@dataclass
class EvidenceItem:
    """Attached evidence record (photo, document, inspection report)."""
    evidence_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str = ""
    evidence_type: str = "PHOTO"  # PHOTO, DOCUMENT, SATELLITE_IMG, INSPECTION_REPORT
    file_path: Optional[str] = None
    uploaded_by: str = "System"
    uploaded_at: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evidence_id": self.evidence_id,
            "title": self.title,
            "evidence_type": self.evidence_type,
            "file_path": self.file_path,
            "uploaded_by": self.uploaded_by,
            "uploaded_at": self.uploaded_at,
            "metadata": self.metadata,
        }


@dataclass
class FieldVerificationTask:
    """Physical ground verification assigned to a district nodal officer."""
    task_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    assigned_to: str = ""
    target_location: str = ""
    due_date: Optional[str] = None
    status: VerificationStatus = VerificationStatus.PENDING
    findings: Optional[str] = None
    completed_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "assigned_to": self.assigned_to,
            "target_location": self.target_location,
            "due_date": self.due_date,
            "status": self.status.value if isinstance(self.status, VerificationStatus) else self.status,
            "findings": self.findings,
            "completed_at": self.completed_at,
        }


@dataclass
class AuditEntry:
    """Immutable audit trail log entry for every action taken on a case."""
    entry_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    actor: str = "System"
    action: str = ""
    details: str = ""
    previous_state: Optional[str] = None
    new_state: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entry_id": self.entry_id,
            "timestamp": self.timestamp,
            "actor": self.actor,
            "action": self.action,
            "details": self.details,
            "previous_state": self.previous_state,
            "new_state": self.new_state,
        }


@dataclass
class InvestigationCase:
    """Core Investigation Case entity for Nirikshak AI."""
    case_id: str
    work_id: int
    project_title: str
    constituency: str
    state: str
    unified_risk_score: int  # 0 to 100
    risk_level: RiskLevel
    status: CaseStatus = CaseStatus.UNDER_REVIEW
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    assigned_officer: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    resolution_summary: Optional[str] = None
    risk_breakdown: Dict[str, Any] = field(default_factory=dict)
    notes: List[OfficerNote] = field(default_factory=list)
    evidence: List[EvidenceItem] = field(default_factory=list)
    field_tasks: List[FieldVerificationTask] = field(default_factory=list)
    audit_log: List[AuditEntry] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "work_id": self.work_id,
            "project_title": self.project_title,
            "constituency": self.constituency,
            "state": self.state,
            "unified_risk_score": self.unified_risk_score,
            "risk_level": self.risk_level.value if isinstance(self.risk_level, RiskLevel) else self.risk_level,
            "status": self.status.value if isinstance(self.status, CaseStatus) else self.status,
            "priority": self.priority,
            "assigned_officer": self.assigned_officer,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "resolution_summary": self.resolution_summary,
            "risk_breakdown": self.risk_breakdown,
            "notes": [n.to_dict() for n in self.notes],
            "evidence": [e.to_dict() for e in self.evidence],
            "field_tasks": [t.to_dict() for t in self.field_tasks],
            "audit_log": [a.to_dict() for a in self.audit_log],
        }

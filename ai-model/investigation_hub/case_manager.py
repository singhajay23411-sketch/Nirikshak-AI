"""case_manager.py

Case Manager for Nirikshak AI's Investigation Hub.
Manages the complete lifecycle of investigative cases, field verifications,
evidence attachments, and audit trails.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from shared.types import CaseStatus, RiskLevel, VerificationStatus
from .models import (
    InvestigationCase,
    OfficerNote,
    EvidenceItem,
    FieldVerificationTask,
    AuditEntry,
)
from .workflow import WorkflowEngine


class CaseManager:
    """Production case manager providing decoupled case lifecycle operations."""

    def __init__(self):
        # In-memory case repository (can be backed by Postgres in backend)
        self.cases: Dict[str, InvestigationCase] = {}

    def create_case(
        self,
        work_id: int,
        project_title: str,
        constituency: str,
        state: str,
        unified_risk_score: int,
        risk_level: RiskLevel,
        priority: str = "MEDIUM",
        risk_breakdown: Optional[Dict[str, Any]] = None,
        actor: str = "System"
    ) -> InvestigationCase:
        """Create and initialize a new investigative case."""
        case_id = f"CASE-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
        case = InvestigationCase(
            case_id=case_id,
            work_id=work_id,
            project_title=project_title,
            constituency=constituency,
            state=state,
            unified_risk_score=unified_risk_score,
            risk_level=risk_level,
            priority=priority,
            risk_breakdown=risk_breakdown or {},
        )

        # Audit initial creation
        audit_entry = AuditEntry(
            actor=actor,
            action="CREATE_CASE",
            details=f"Case created for Work ID {work_id} with risk score {unified_risk_score} ({risk_level.value if isinstance(risk_level, RiskLevel) else risk_level}).",
            new_state=case.status.value,
        )
        case.audit_log.append(audit_entry)

        self.cases[case_id] = case
        return case

    def get_case(self, case_id: str) -> Optional[InvestigationCase]:
        """Retrieve case by ID."""
        return self.cases.get(case_id)

    def list_cases(
        self,
        status: Optional[CaseStatus] = None,
        risk_level: Optional[RiskLevel] = None,
        assigned_officer: Optional[str] = None,
        state: Optional[str] = None
    ) -> List[InvestigationCase]:
        """Query and filter cases."""
        results = list(self.cases.values())
        if status:
            results = [c for c in results if c.status == status]
        if risk_level:
            results = [c for c in results if c.risk_level == risk_level]
        if assigned_officer:
            results = [c for c in results if c.assigned_officer == assigned_officer]
        if state:
            results = [c for c in results if c.state.lower() == state.lower()]
        return sorted(results, key=lambda c: c.unified_risk_score, reverse=True)

    def assign_case(
        self,
        case_id: str,
        officer_name: str,
        actor: str = "System"
    ) -> InvestigationCase:
        """Assign case to an officer."""
        case = self._get_or_raise(case_id)
        prev_officer = case.assigned_officer
        case.assigned_officer = officer_name
        case.updated_at = datetime.now().isoformat()

        case.audit_log.append(AuditEntry(
            actor=actor,
            action="ASSIGN_OFFICER",
            details=f"Assigned from '{prev_officer}' to '{officer_name}'."
        ))
        return case

    def update_status(
        self,
        case_id: str,
        target_status: CaseStatus,
        actor: str = "System",
        reason: str = ""
    ) -> InvestigationCase:
        """Transition case status while enforcing workflow rules."""
        case = self._get_or_raise(case_id)
        prev_status = case.status

        WorkflowEngine.validate_transition(prev_status, target_status)

        case.status = target_status
        case.updated_at = datetime.now().isoformat()

        case.audit_log.append(AuditEntry(
            actor=actor,
            action="UPDATE_STATUS",
            details=f"Status transitioned from {prev_status.value} to {target_status.value}. Reason: {reason or 'N/A'}",
            previous_state=prev_status.value,
            new_state=target_status.value,
        ))
        return case

    def add_note(
        self,
        case_id: str,
        author: str,
        content: str
    ) -> OfficerNote:
        """Add an officer observation note to the case."""
        case = self._get_or_raise(case_id)
        note = OfficerNote(author=author, content=content)
        case.notes.append(note)
        case.updated_at = datetime.now().isoformat()

        case.audit_log.append(AuditEntry(
            actor=author,
            action="ADD_NOTE",
            details=f"Officer note added (ID: {note.note_id})."
        ))
        return note

    def add_evidence(
        self,
        case_id: str,
        title: str,
        evidence_type: str = "PHOTO",
        file_path: Optional[str] = None,
        uploaded_by: str = "System",
        metadata: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        """Attach evidence item to the case."""
        case = self._get_or_raise(case_id)
        item = EvidenceItem(
            title=title,
            evidence_type=evidence_type,
            file_path=file_path,
            uploaded_by=uploaded_by,
            metadata=metadata or {}
        )
        case.evidence.append(item)
        case.updated_at = datetime.now().isoformat()

        case.audit_log.append(AuditEntry(
            actor=uploaded_by,
            action="ATTACH_EVIDENCE",
            details=f"Evidence attached: '{title}' ({evidence_type})."
        ))
        return item

    def assign_field_verification(
        self,
        case_id: str,
        assigned_to: str,
        target_location: str,
        due_date: Optional[str] = None,
        actor: str = "System"
    ) -> FieldVerificationTask:
        """Dispatch a physical field inspection task."""
        case = self._get_or_raise(case_id)
        task = FieldVerificationTask(
            assigned_to=assigned_to,
            target_location=target_location,
            due_date=due_date,
            status=VerificationStatus.PENDING
        )
        case.field_tasks.append(task)

        # Transition status to FIELD_VERIFICATION if allowed
        if WorkflowEngine.is_transition_allowed(case.status, CaseStatus.FIELD_VERIFICATION):
            prev_status = case.status
            case.status = CaseStatus.FIELD_VERIFICATION
            case.audit_log.append(AuditEntry(
                actor=actor,
                action="UPDATE_STATUS",
                details=f"Auto-transitioned to FIELD_VERIFICATION on task creation.",
                previous_state=prev_status.value,
                new_state=CaseStatus.FIELD_VERIFICATION.value,
            ))

        case.updated_at = datetime.now().isoformat()
        case.audit_log.append(AuditEntry(
            actor=actor,
            action="ASSIGN_FIELD_TASK",
            details=f"Field verification task assigned to {assigned_to} for location: {target_location}."
        ))
        return task

    def complete_field_verification(
        self,
        case_id: str,
        task_id: str,
        status: VerificationStatus,
        findings: str,
        actor: str = "FieldOfficer"
    ) -> InvestigationCase:
        """Record findings of completed physical ground verification."""
        case = self._get_or_raise(case_id)
        task = next((t for t in case.field_tasks if t.task_id == task_id), None)
        if not task:
            raise ValueError(f"Task with ID {task_id} not found in case {case_id}")

        task.status = status
        task.findings = findings
        task.completed_at = datetime.now().isoformat()
        case.updated_at = datetime.now().isoformat()

        case.audit_log.append(AuditEntry(
            actor=actor,
            action="COMPLETE_FIELD_TASK",
            details=f"Field task {task_id} completed with status {status.value}. Findings: {findings[:100]}..."
        ))
        return case

    def escalate_case(
        self,
        case_id: str,
        reason: str,
        actor: str = "System"
    ) -> InvestigationCase:
        """Escalate case to higher authority."""
        case = self.update_status(
            case_id=case_id,
            target_status=CaseStatus.ESCALATED,
            actor=actor,
            reason=reason
        )
        case.priority = "URGENT"
        return case

    def resolve_case(
        self,
        case_id: str,
        resolution_summary: str,
        actor: str = "SeniorOfficer"
    ) -> InvestigationCase:
        """Resolve and close case."""
        case = self._get_or_raise(case_id)
        case.resolution_summary = resolution_summary
        return self.update_status(
            case_id=case_id,
            target_status=CaseStatus.RESOLVED,
            actor=actor,
            reason=resolution_summary
        )

    def _get_or_raise(self, case_id: str) -> InvestigationCase:
        case = self.cases.get(case_id)
        if not case:
            raise KeyError(f"Case '{case_id}' does not exist.")
        return case

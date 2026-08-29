"""workflow.py

State machine and transition guards for Nirikshak AI's Investigation Hub.
Ensures that case status transitions adhere to standard governance workflows.
"""

from typing import Dict, Set, Tuple, Optional
from shared.types import CaseStatus


# Directed graph of allowed state transitions
ALLOWED_TRANSITIONS: Dict[CaseStatus, Set[CaseStatus]] = {
    CaseStatus.UNDER_REVIEW: {
        CaseStatus.INVESTIGATION_OPENED,
        CaseStatus.DISMISSED,
        CaseStatus.FIELD_VERIFICATION,
    },
    CaseStatus.INVESTIGATION_OPENED: {
        CaseStatus.FIELD_VERIFICATION,
        CaseStatus.ESCALATED,
        CaseStatus.RESOLVED,
        CaseStatus.DISMISSED,
    },
    CaseStatus.FIELD_VERIFICATION: {
        CaseStatus.INVESTIGATION_OPENED,
        CaseStatus.ESCALATED,
        CaseStatus.RESOLVED,
    },
    CaseStatus.ESCALATED: {
        CaseStatus.FIELD_VERIFICATION,
        CaseStatus.RESOLVED,
    },
    CaseStatus.RESOLVED: {
        CaseStatus.INVESTIGATION_OPENED,  # Allow reopening if new discrepancy emerges
    },
    CaseStatus.DISMISSED: {
        CaseStatus.UNDER_REVIEW,  # Allow reopening
    },
}


class WorkflowEngine:
    """Validates and applies case state transitions."""

    @staticmethod
    def is_transition_allowed(current_status: CaseStatus, target_status: CaseStatus) -> bool:
        """Check if transitioning from current_status to target_status is permitted."""
        if current_status == target_status:
            return True
        allowed_next = ALLOWED_TRANSITIONS.get(current_status, set())
        return target_status in allowed_next

    @staticmethod
    def validate_transition(current_status: CaseStatus, target_status: CaseStatus) -> None:
        """Raise ValueError if transition is forbidden."""
        if not WorkflowEngine.is_transition_allowed(current_status, target_status):
            curr_str = current_status.value if isinstance(current_status, CaseStatus) else current_status
            target_str = target_status.value if isinstance(target_status, CaseStatus) else target_status
            raise ValueError(
                f"Invalid case transition from '{curr_str}' to '{target_str}'. "
                f"Allowed target states: {[s.value for s in ALLOWED_TRANSITIONS.get(current_status, set())]}"
            )

"""Unit tests for Investigation Hub workflow and case manager."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from shared.types import CaseStatus, RiskLevel, VerificationStatus
from investigation_hub import CaseManager, WorkflowEngine, InvestigationCase


def test_create_and_query_case():
    hub = CaseManager()
    case = hub.create_case(
        work_id=5001,
        project_title="Construction of Community Hall at Block A",
        constituency="Jaunpur",
        state="Uttar Pradesh",
        unified_risk_score=85,
        risk_level=RiskLevel.CRITICAL,
        priority="HIGH",
        risk_breakdown={"delay_risk": 90, "financial_risk": 80},
        actor="AlertEngine"
    )

    assert isinstance(case, InvestigationCase)
    assert case.status == CaseStatus.UNDER_REVIEW
    assert case.work_id == 5001
    assert case.unified_risk_score == 85
    assert len(case.audit_log) == 1
    assert case.audit_log[0].action == "CREATE_CASE"

    fetched = hub.get_case(case.case_id)
    assert fetched is not None
    assert fetched.case_id == case.case_id


def test_assign_and_add_notes():
    hub = CaseManager()
    case = hub.create_case(
        work_id=5002,
        project_title="Drinking Water Pipeline",
        constituency="Varanasi",
        state="Uttar Pradesh",
        unified_risk_score=72,
        risk_level=RiskLevel.HIGH
    )

    hub.assign_case(case.case_id, officer_name="Officer Sharma", actor="Admin")
    assert hub.get_case(case.case_id).assigned_officer == "Officer Sharma"

    note = hub.add_note(
        case_id=case.case_id,
        author="Officer Sharma",
        content="Inspected MoSPI records; work stalled in vendor tender for 210 days."
    )
    assert note.content.startswith("Inspected MoSPI")
    assert len(case.notes) == 1


def test_field_verification_lifecycle():
    hub = CaseManager()
    case = hub.create_case(
        work_id=5003,
        project_title="CC Road Construction",
        constituency="Prayagraj",
        state="Uttar Pradesh",
        unified_risk_score=78,
        risk_level=RiskLevel.HIGH
    )

    # 1. Open investigation
    hub.update_status(case.case_id, CaseStatus.INVESTIGATION_OPENED, actor="Officer Sharma")
    assert case.status == CaseStatus.INVESTIGATION_OPENED

    # 2. Dispatch field verification task
    task = hub.assign_field_verification(
        case_id=case.case_id,
        assigned_to="Nodal Inspector Verma",
        target_location="GPS: 25.4358, 81.8463 (Ward 12)",
        due_date="2026-09-15",
        actor="Officer Sharma"
    )
    assert task.status == VerificationStatus.PENDING
    assert case.status == CaseStatus.FIELD_VERIFICATION

    # 3. Complete field verification
    hub.complete_field_verification(
        case_id=case.case_id,
        task_id=task.task_id,
        status=VerificationStatus.VERIFIED_DELAYED,
        findings="Physical road construction only 20% complete despite 100% funds disbursement.",
        actor="Nodal Inspector Verma"
    )
    assert task.status == VerificationStatus.VERIFIED_DELAYED

    # 4. Escalate case
    hub.escalate_case(case.case_id, reason="Severe financial-progress mismatch verified on ground.", actor="Officer Sharma")
    assert case.status == CaseStatus.ESCALATED
    assert case.priority == "URGENT"

    # 5. Resolve case
    hub.resolve_case(case.case_id, resolution_summary="Formal recovery proceedings initiated against vendor.", actor="DistrictMagistrate")
    assert case.status == CaseStatus.RESOLVED
    assert case.resolution_summary is not None


def test_invalid_transition_guard():
    hub = CaseManager()
    case = hub.create_case(
        work_id=5004,
        project_title="Solar High Mast Light",
        constituency="Patna",
        state="Bihar",
        unified_risk_score=40,
        risk_level=RiskLevel.MEDIUM
    )

    # Directly jumping from UNDER_REVIEW to RESOLVED without investigation is forbidden
    with pytest.raises(ValueError) as exc:
        hub.update_status(case.case_id, CaseStatus.RESOLVED)
    assert "Invalid case transition" in str(exc.value)


def test_list_and_filter_cases():
    hub = CaseManager()
    hub.create_case(1, "Title 1", "Jaunpur", "UP", 90, RiskLevel.CRITICAL)
    hub.create_case(2, "Title 2", "Patna", "Bihar", 30, RiskLevel.LOW)
    hub.create_case(3, "Title 3", "Varanasi", "UP", 75, RiskLevel.HIGH)

    critical_cases = hub.list_cases(risk_level=RiskLevel.CRITICAL)
    assert len(critical_cases) == 1
    assert critical_cases[0].work_id == 1

    up_cases = hub.list_cases(state="UP")
    assert len(up_cases) == 2
    assert up_cases[0].unified_risk_score >= up_cases[1].unified_risk_score

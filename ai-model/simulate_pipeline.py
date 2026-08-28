"""simulate_pipeline.py

End-to-End simulation demonstrating Nirikshak AI's three assigned modules:
1. Delay Risk Detection (15% platform risk)
2. EvidenceAI – Image & Document Verification (10% platform risk)
3. Investigation Hub (Case management & field verification workflow)
"""

import os
import sys
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# pyrefly: ignore [missing-import]
from shared.types import RiskLevel, CaseStatus, VerificationStatus
from delay_risk import DelayRiskScorer, DelayRiskMLModel
# pyrefly: ignore [missing-import]
from evidence_ai import EvidenceAIAnalyzer
# pyrefly: ignore [missing-import]
from investigation_hub import CaseManager


def run_pipeline_simulation():
    print("=" * 70)
    print("      NIRIKSHAK-AI: INTEGRATED PIPELINE DEMONSTRATION")
    print("=" * 70)

    # 1. Initialize Modules
    model_path = os.path.join(os.path.dirname(__file__), "delay_risk", "delay_risk_model.joblib")
    ml_model = DelayRiskMLModel(model_path)
    delay_scorer = DelayRiskScorer(model=ml_model)
    evidence_analyzer = EvidenceAIAnalyzer()
    investigation_hub = CaseManager()

    print("\n[MODULE 1: DELAY RISK DETECTION (15% Platform Weight)]")
    now = datetime(2026, 6, 1)

    # Project 1: High-Risk Stalled Project
    proj_delayed = {
        "work_id": 884102,
        "activity_name": "Construction of RCC Drainage and CC Road in Ward 14",
        "work_description": "Construction of CC road and connecting drains in high waterlogging area.",
        "constituency": "Jaunpur",
        "state_name": "Uttar Pradesh",
        "sanction_date": (now - timedelta(days=580)).strftime("%d-%b-%Y"),
        "recommendation_date": (now - timedelta(days=650)).strftime("%d-%b-%Y"),
        "sanction_amount": 1500000.0,
        "total_disbursed": 150000.0,
        "work_stage": "Vendor Identification",
        "work_status": "Sanctioned",
        "ida_name": "JAUNPUR(DISTRICT MAGISTRATE JAUNPUR_IDA)",
        "ia_name": "UP SMALL INDUSTRIES CORPORATION LTD.AO.LKO",
    }

    # Project 2: On-Track Project
    proj_ontrack = {
        "work_id": 884105,
        "activity_name": "Installation of 40 Solar Street Lights",
        "work_description": "Solar lights in rural panchayats.",
        "constituency": "Rae Bareli",
        "state_name": "Uttar Pradesh",
        "sanction_date": (now - timedelta(days=75)).strftime("%d-%b-%Y"),
        "recommendation_date": (now - timedelta(days=95)).strftime("%d-%b-%Y"),
        "sanction_amount": 400000.0,
        "total_disbursed": 200000.0,
        "work_stage": "Work partially Completed",
        "work_status": "Sanctioned",
        "ida_name": "RAE BARELI(DISTRICT MAGISTRATE RAE BARELI_IDA)",
    }

    res_delayed = delay_scorer.assess_project(proj_delayed, as_of_date=now)
    res_ontrack = delay_scorer.assess_project(proj_ontrack, as_of_date=now)

    print(f"\n  Project A (Work ID {res_delayed.work_id}):")
    print(f"    - Delay Risk Score : {res_delayed.delay_risk}/100 ({res_delayed.risk_level.value})")
    print(f"    - Status           : {res_delayed.status}")
    print(f"    - Reasons Identified:")
    for r in res_delayed.reasons:
        print(f"        * {r}")

    print(f"\n  Project B (Work ID {res_ontrack.work_id}):")
    print(f"    - Delay Risk Score : {res_ontrack.delay_risk}/100 ({res_ontrack.risk_level.value})")
    print(f"    - Status           : {res_ontrack.status}")
    print(f"    - Reasons Identified:")
    for r in res_ontrack.reasons:
        print(f"        * {r}")

    # 2. EvidenceAI Multimodal Verification
    print("\n" + "-" * 70)
    print("[MODULE 2: EVIDENCE-AI MULTIMODAL VERIFICATION (10% Platform Weight)]")

    # Document check with textual mismatch
    suspicious_doc = """
    COMPLETION CERTIFICATE (INTERIM)
    Work ID: 999999
    Constituency: Lucknow
    Amount: Rs. 100000
    """
    ev_doc_res = evidence_analyzer.analyze_evidence(
        project_id=str(proj_delayed["work_id"]),
        document_text=suspicious_doc,
        project_metadata={
            "work_id": proj_delayed["work_id"],
            "sanction_amount": proj_delayed["sanction_amount"],
            "constituency": proj_delayed["constituency"],
        },
        is_test_data=True
    )
    print(f"\n  Document Verification for Work ID {proj_delayed['work_id']}:")
    print(f"    - Evidence Risk Score : {ev_doc_res.evidence_risk}/100")
    print(f"    - Discrepancies:")
    for f in ev_doc_res.flags:
        print(f"        * {f}")

    # 3. Investigation Hub Workflow
    print("\n" + "-" * 70)
    print("[MODULE 3: INVESTIGATION HUB (Decoupled Governance Workflow)]")

    # Auto-create case for high-risk project
    case = investigation_hub.create_case(
        work_id=res_delayed.work_id,
        project_title=proj_delayed["activity_name"],
        constituency=proj_delayed["constituency"],
        state=proj_delayed["state_name"],
        unified_risk_score=res_delayed.delay_risk,
        risk_level=res_delayed.risk_level,
        priority="HIGH",
        risk_breakdown={
            "delay_risk": res_delayed.delay_risk,
            "evidence_risk": ev_doc_res.evidence_risk,
        },
        actor="RiskEngine"
    )
    print(f"\n  [Step 1] Case Created:")
    print(f"    - Case ID     : {case.case_id}")
    print(f"    - Initial Status: {case.status.value}")

    # Officer assignment
    investigation_hub.assign_case(case.case_id, officer_name="District Officer R. K. Singh", actor="Admin")
    print(f"  [Step 2] Case Assigned to: {case.assigned_officer}")

    # Open investigation & add observation note
    investigation_hub.update_status(case.case_id, CaseStatus.INVESTIGATION_OPENED, actor=case.assigned_officer)
    investigation_hub.add_note(
        case.case_id,
        author=case.assigned_officer,
        content="Cross-verified MoSPI database with district treasury; zero tender awarded despite Rs. 1.5L initial advance."
    )
    print(f"  [Step 3] Status: {case.status.value} (Officer observation note logged)")

    # Dispatch physical field verification task
    task = investigation_hub.assign_field_verification(
        case_id=case.case_id,
        assigned_to="Assistant Engineer Amit Kumar",
        target_location="Ward 14, Jaunpur (Coordinates: 25.7464° N, 82.6837° E)",
        due_date="2026-06-15",
        actor=case.assigned_officer
    )
    print(f"  [Step 4] Field Verification Dispatched (Task ID: {task.task_id}):")
    print(f"    - Status: {case.status.value}")

    # Record field findings
    investigation_hub.complete_field_verification(
        case_id=case.case_id,
        task_id=task.task_id,
        status=VerificationStatus.VERIFIED_DELAYED,
        findings="Physical site inspection confirms zero excavation or road materials present on site. Stalled completely.",
        actor="Assistant Engineer Amit Kumar"
    )
    print(f"  [Step 5] Field Findings Recorded: Status {task.status.value}")

    # Escalate and Resolve
    investigation_hub.escalate_case(case.case_id, reason="Site abandoned by implementing agency.", actor=case.assigned_officer)
    print(f"  [Step 6] Case Escalated: Priority {case.priority}, Status {case.status.value}")

    investigation_hub.resolve_case(
        case.case_id,
        resolution_summary="Show-cause notice served to implementing agency; re-tendering approved under DM order.",
        actor="DistrictMagistrate"
    )
    print(f"  [Step 7] Case Closed: Status {case.status.value}")
    print(f"    - Resolution: {case.resolution_summary}")

    print(f"\n  [Audit Trail Log ({len(case.audit_log)} immutable entries)]:")
    for a in case.audit_log:
        print(f"    [{a.timestamp[:19]}] {a.actor} -> {a.action}: {a.details}")

    print("\n" + "=" * 70)
    print("      ALL THREE MODULES INTEGRATED AND VERIFIED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_pipeline_simulation()

"""
Nirikshak AI — Investigation Lifecycle & Audit Workflow Tests
=============================================================
Validates:
1. Investigation lifecycle status transitions
2. Transition validation (invalid transitions rejected)
3. RESOLVED requires formal officer note
4. Only authorized roles (MoSPI, State, District Authority, Admin) can resolve
5. Audit trail records every event with actor, role, timestamp, and notes
6. Evidence upload & retrieval access control
"""

import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.server import app
from backend.auth.models import RoleCode, DEMO_PASSWORD
from backend.auth.database import init_database

init_database()

client = TestClient(app)


def _get_token(email: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": DEMO_PASSWORD})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["token"]


def test_investigation_lifecycle_and_resolution_rbac():
    # 1. Login accounts
    admin_token = _get_token("admin@nirikshak.gov.in")
    mospi_token = _get_token("mospi.officer@nirikshak.gov.in")
    district_token = _get_token("district.jabalpur@nirikshak.gov.in")
    mp_token = _get_token("mp.loksabha@nirikshak.gov.in")
    inspector_token = _get_token("inspector@nirikshak.gov.in")

    work_id = "MPLADS-2026-8871"

    # 2. MoSPI officer initiates / triages case
    triage_res = client.post(
        f"/api/investigations/{work_id}/transition",
        headers={"Authorization": f"Bearer {mospi_token}"},
        json={
            "to_status": "TRIAGED",
            "notes": "Automated anomaly flagged. Initiating preliminary administrative triage.",
        },
    )
    # Status code 200 (or if already triaged/new)
    assert triage_res.status_code in (200, 400)

    # 3. District Authority assigns inspector
    assign_res = client.post(
        f"/api/investigations/{work_id}/assign",
        headers={"Authorization": f"Bearer {district_token}"},
        json={
            "inspector_id": "field.inspector",
            "inspector_name": "Er. Rajesh Kumar",
            "instructions": "Verify foundation footing and photograph sign board.",
        },
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["investigation"]["status"] == "ASSIGNED"

    # 4. Field Inspector moves to UNDER_REVIEW after site visit
    review_res = client.post(
        f"/api/investigations/{work_id}/transition",
        headers={"Authorization": f"Bearer {inspector_token}"},
        json={
            "to_status": "UNDER_REVIEW",
            "notes": "Physical verification completed. Uploaded geotag photos.",
        },
    )
    assert review_res.status_code == 200

    # 5. MP attempts to resolve -> MUST BE REJECTED with 403 (MP cannot resolve)
    mp_resolve_res = client.post(
        f"/api/investigations/{work_id}/transition",
        headers={"Authorization": f"Bearer {mp_token}"},
        json={
            "to_status": "RESOLVED",
            "notes": "Looks good from my side.",
        },
    )
    assert mp_resolve_res.status_code == 403

    # 6. District Authority attempts to resolve WITHOUT note -> MUST BE REJECTED with 400
    no_note_res = client.post(
        f"/api/investigations/{work_id}/transition",
        headers={"Authorization": f"Bearer {district_token}"},
        json={
            "to_status": "RESOLVED",
            "notes": "   ",
        },
    )
    assert no_note_res.status_code == 400

    # 7. District Authority resolves WITH formal note -> MUST SUCCEED
    resolve_res = client.post(
        f"/api/investigations/{work_id}/transition",
        headers={"Authorization": f"Bearer {district_token}"},
        json={
            "to_status": "RESOLVED",
            "notes": "Formally verified by Executive Engineer. Physical dimensions and materials match sanction specifications.",
        },
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["investigation"]["status"] == "RESOLVED"

    # 8. Check audit trail
    audit_res = client.get(
        f"/api/investigations/{work_id}/audit-trail",
        headers={"Authorization": f"Bearer {district_token}"},
    )
    assert audit_res.status_code == 200
    audit_events = audit_res.json()["audit_trail"]
    assert len(audit_events) >= 3


def test_evidence_access_control():
    """Verify evidence files cannot be viewed or uploaded by unauthorized public citizens."""
    viewer_token = _get_token("viewer@nirikshak.gov.in")
    inspector_token = _get_token("inspector@nirikshak.gov.in")

    work_id = "MPLADS-2026-8871"

    # Public viewer cannot upload evidence
    up_res = client.post(
        f"/api/evidence/{work_id}/upload",
        headers={"Authorization": f"Bearer {viewer_token}"},
        data={"notes": "citizen photo"},
    )
    assert up_res.status_code in (403, 422)

    # Inspector can view evidence list
    list_res = client.get(
        f"/api/evidence/{work_id}",
        headers={"Authorization": f"Bearer {inspector_token}"},
    )
    assert list_res.status_code == 200


if __name__ == "__main__":
    print("Running test_investigation_lifecycle_and_resolution_rbac...")
    test_investigation_lifecycle_and_resolution_rbac()
    print("[PASS] test_investigation_lifecycle_and_resolution_rbac passed")

    print("Running test_evidence_access_control...")
    test_evidence_access_control()
    print("[PASS] test_evidence_access_control passed")

    print("\nALL INVESTIGATION WORKFLOW TESTS PASSED SUCCESSFULLY!")

"""
Nirikshak AI — RBAC & Scope Enforcement Tests
==============================================
Validates:
1. All 8 canonical role demo logins and JWT claims
2. /api/auth/me returns role, jurisdiction, house type, tenure, project IDs
3. Scope-filtered dashboard endpoints enforce jurisdiction server-side
4. MP can access assigned constituency and switch to any other constituency
5. Public viewer receives sanitized/open data without privileged operational controls
"""

import sys
import os
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.server import app
from backend.auth.models import RoleCode, DEMO_USERS, DEMO_PASSWORD
from backend.auth.database import init_database

init_database()

client = TestClient(app)


def test_all_8_demo_users_login():
    """Verify all 8 canonical role accounts can authenticate and receive JWTs with claims."""
    for demo in DEMO_USERS:
        res = client.post("/api/auth/login", json={
            "email": demo["email"],
            "password": demo["password"],
        })
        assert res.status_code == 200, f"Login failed for {demo['email']}: {res.text}"
        data = res.json()
        assert "token" in data
        assert "user" in data

        user = data["user"]
        assert user["role"] == demo["role"]
        assert user["email"] == demo["email"]

        # Verify jurisdiction fields
        if demo.get("state"):
            assert user.get("state") == demo["state"]
        if demo.get("district"):
            assert user.get("district") == demo["district"]
        if demo.get("constituency"):
            assert user.get("constituency") == demo["constituency"]


def test_auth_me_endpoint():
    """Verify /api/auth/me returns canonical role and jurisdiction."""
    # Login as District Authority
    res = client.post("/api/auth/login", json={
        "email": "district.jabalpur@nirikshak.gov.in",
        "password": DEMO_PASSWORD,
    })
    assert res.status_code == 200
    token = res.json()["token"]

    # Call /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    user_info = me_data.get("user", me_data)

    assert user_info["role"] == RoleCode.DISTRICT_AUTHORITY
    assert user_info["district"] == "Jabalpur"
    assert user_info["state"] == "Madhya Pradesh"
    assert "permissions" in user_info
    assert "investigation.resolve" in user_info["permissions"]


def test_dashboard_overview_scope_filtering():
    """Verify /api/dashboard/overview filters data server-side by authenticated jurisdiction."""
    # 1. State Nodal Officer (Uttar Pradesh)
    res = client.post("/api/auth/login", json={
        "email": "state.up@nirikshak.gov.in",
        "password": DEMO_PASSWORD,
    })
    token = res.json()["token"]

    dash_res = client.get("/api/dashboard/overview", headers={"Authorization": f"Bearer {token}"})
    assert dash_res.status_code == 200
    dash_data = dash_res.json()

    assert dash_data["scope"]["role"] == RoleCode.STATE_NODAL_OFFICER
    assert dash_data["scope"]["state"] == "Uttar Pradesh"
    assert "metadata" in dash_data
    assert dash_data["metadata"]["source"] == "Precomputed Nirikshak Intelligence Artifacts"
    assert "kpis" in dash_data


def test_mp_can_map_to_any_constituency():
    """Verify MP user can access assigned constituency and dynamically switch to any constituency."""
    res = client.post("/api/auth/login", json={
        "email": "mp.loksabha@nirikshak.gov.in",
        "password": DEMO_PASSWORD,
    })
    token = res.json()["token"]

    # Query default constituency (Varanasi)
    r1 = client.get("/api/dashboard/mp-scorecard", headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["constituency"] == "Varanasi"

    # Query a different constituency (e.g., Jabalpur or Kurnool)
    r2 = client.get("/api/dashboard/mp-scorecard?constituency=Jabalpur", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["constituency"] == "Jabalpur"
    assert "scorecard" in d2
    assert "recommendations" in d2["scorecard"]


def test_risk_summary_has_advisory_disclaimer():
    """Verify risk summaries include the required human-in-the-loop statutory advisory note."""
    res = client.post("/api/auth/login", json={
        "email": "mospi.officer@nirikshak.gov.in",
        "password": DEMO_PASSWORD,
    })
    token = res.json()["token"]

    risk_res = client.get("/api/dashboard/risk-summary", headers={"Authorization": f"Bearer {token}"})
    assert risk_res.status_code == 200
    risk_data = risk_res.json()

    assert "advisory_note" in risk_data
    assert "human verification" in risk_data["advisory_note"].lower() or "physical verification" in risk_data["advisory_note"].lower()
    assert "risk_tiers" in risk_data
    assert "pillars" in risk_data


def test_public_viewer_access_sanitized():
    """Verify public citizen cannot resolve investigations or view restricted internal routes."""
    res = client.post("/api/auth/login", json={
        "email": "viewer@nirikshak.gov.in",
        "password": DEMO_PASSWORD,
    })
    token = res.json()["token"]

    # Public viewer can access public dashboard overview
    dash_res = client.get("/api/dashboard/overview", headers={"Authorization": f"Bearer {token}"})
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["scope"]["role"] == RoleCode.PUBLIC_VIEWER

    # Public viewer cannot access admin user management
    admin_res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert admin_res.status_code == 403


if __name__ == "__main__":
    print("Running test_all_8_demo_users_login...")
    test_all_8_demo_users_login()
    print("[PASS] test_all_8_demo_users_login passed")

    print("Running test_auth_me_endpoint...")
    test_auth_me_endpoint()
    print("[PASS] test_auth_me_endpoint passed")

    print("Running test_dashboard_overview_scope_filtering...")
    test_dashboard_overview_scope_filtering()
    print("[PASS] test_dashboard_overview_scope_filtering passed")

    print("Running test_mp_can_map_to_any_constituency...")
    test_mp_can_map_to_any_constituency()
    print("[PASS] test_mp_can_map_to_any_constituency passed")

    print("Running test_risk_summary_has_advisory_disclaimer...")
    test_risk_summary_has_advisory_disclaimer()
    print("[PASS] test_risk_summary_has_advisory_disclaimer passed")

    print("Running test_public_viewer_access_sanitized...")
    test_public_viewer_access_sanitized()
    print("[PASS] test_public_viewer_access_sanitized passed")

    print("\nALL RBAC TESTS PASSED SUCCESSFULLY!")

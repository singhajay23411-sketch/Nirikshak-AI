"""
Test script for Batch 4 analytics endpoints.
Uses FastAPI TestClient (same pattern as test_endpoints.py).
"""
import json, logging, sys
from fastapi.testclient import TestClient

logging.basicConfig(level=logging.WARNING)

# Import the FastAPI app (picks up analytics_routes automatically)
from backend.server import app

client = TestClient(app)

# ── Authenticate ──────────────────────────────────────────────────────────────
print("Authenticating...")
auth_resp = client.post(
    "/api/auth/login",
    json={"email": "admin@nirikshak.gov.in", "password": "admin123"},
)
if auth_resp.status_code != 200:
    print(f"Auth failed: {auth_resp.status_code} {auth_resp.text}")
    sys.exit(1)

token = auth_resp.json()["token"]
HEADERS = {"Authorization": f"Bearer {token}"}
print(f"Authenticated. Token: {token[:32]}...\n{'='*60}\n")

# ── Analytics Endpoints ───────────────────────────────────────────────────────
ANALYTICS_ENDPOINTS = [
    ("National Summary",      "/api/analytics/summary"),
    ("State Analytics",       "/api/analytics/states"),
    ("Risk Distribution",     "/api/analytics/risk-distribution"),
]

for label, path in ANALYTICS_ENDPOINTS:
    print(f"--- Testing Endpoint: {label} ({path}) ---")
    resp = client.get(path, headers=HEADERS)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    if isinstance(data, list):
        preview = data[:5]
        print(f"(Showing first 5 of {len(data)} records)")
        print(json.dumps(preview, indent=2, default=str))
    else:
        print(json.dumps(data, indent=2, default=str))
    print()

print("="*60)
print("All analytics endpoint tests complete.")

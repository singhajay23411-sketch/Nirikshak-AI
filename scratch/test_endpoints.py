import sys
import json
import logging
from fastapi.testclient import TestClient

# Configure logging to see any errors
logging.basicConfig(level=logging.INFO)

# Import the FastAPI app
from backend.server import app

client = TestClient(app)

def test_endpoints():
    print("=========================================")
    print("Testing Nirikshak AI GET Endpoints")
    print("=========================================")

    # 1. Login to get JWT Token
    print("\n--- 1. Authenticating as admin ---")
    login_payload = {
        "email": "admin@nirikshak.gov.in",
        "password": "admin123"
    }
    response = client.post("/api/auth/login", json=login_payload)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)
        
    login_data = response.json()
    token = login_data["token"]
    print("Login successful! JWT Token acquired.")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    work_id = 60423
    endpoints = {
        "Work Details": f"/api/works/{work_id}",
        "Delay Risk": f"/api/works/{work_id}/delay-risk",
        "Financial Risk": f"/api/works/{work_id}/financial-risk",
        "Progress Risk": f"/api/works/{work_id}/progress-risk",
        "Cost Risk": f"/api/works/{work_id}/cost-risk",
        "Duplicate Risk": f"/api/works/{work_id}/duplicate-risk",
        "Agency Risk": f"/api/works/{work_id}/agency-risk",
        "Payment Risk": f"/api/works/{work_id}/payment-risk",
        "Evidence Risk": f"/api/works/{work_id}/evidence-risk",
        "Unified Risk": f"/api/works/{work_id}/risk"
    }

    # 2. Test each endpoint
    for name, path in endpoints.items():
        print(f"\n--- Testing Endpoint: {name} ({path}) ---")
        res = client.get(path, headers=headers)
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            print("Response:")
            print(json.dumps(res.json(), indent=2))
        else:
            print("Failed Response:")
            print(res.text)

if __name__ == "__main__":
    test_endpoints()

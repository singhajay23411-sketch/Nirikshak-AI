import requests, time, sys
time.sleep(3)
try:
    r = requests.get("http://127.0.0.1:8001/api/health", timeout=5)
    print("Health:", r.json())
except Exception as e:
    print("Error:", e)
    sys.exit(1)

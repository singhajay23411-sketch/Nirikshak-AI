import json
import os
import psycopg2
from backend.database import get_connection

output_path = r"d:\code\Nirakshak AI\Nirikshak-AI\frontend\public\data\real_projects.json"

print("Connecting to PostgreSQL...")
conn = get_connection()
cur = conn.cursor()

# Query 10,000 representative projects with valid state, constituency, and MP names
query = """
    SELECT 
        w.work_id,
        COALESCE(w.activity_name, w.work_description, 'Infrastructure Development Work') as title,
        COALESCE(w.work_category, 'Normal/Others') as category,
        COALESCE(w.sanction_amount, 0) as cost,
        COALESCE(w.ida_name, 'DISTRICT PLANNING OFFICE') as agency,
        w.sanction_date,
        w.work_status,
        s.state_name,
        c.constituency_name,
        m.mp_name,
        COALESCE(w.actual_amount, 0) as actual_amount
    FROM works w
    JOIN states s ON w.state_id = s.state_id
    JOIN constituencies c ON w.constituency_id = c.constituency_id
    JOIN mps m ON w.mp_id = m.mp_id AND w.house_type = m.house_type AND w.tenure = m.tenure
    WHERE w.sanction_amount > 0
    ORDER BY w.sanction_amount DESC
    LIMIT 10000
"""

print("Executing query...")
cur.execute(query)
rows = cur.fetchall()
print(f"Retrieved {len(rows)} projects.")

projects = []
months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

for idx, r in enumerate(rows):
    work_id, title, category, cost, agency, sanction_date, work_status, state_name, const_name, mp_name, actual_amount = r
    
    # Format Date
    date_str = "15 Jun 2024"
    year = 2024
    if sanction_date:
        year = sanction_date.year
        date_str = f"{sanction_date.day:02d} {months[sanction_date.month - 1]} {sanction_date.year}"
        
    # Project Type
    p_type = 'recommended'
    if work_status == 'Completed':
        p_type = 'completed'
    elif work_status == 'Sanctioned':
        p_type = 'sanctioned'
        
    # Status string
    status_str = 'Recommended & Pending'
    if work_status == 'Completed':
        status_str = 'Completed & Verified'
    elif work_status == 'Sanctioned':
        status_str = 'Sanctioned & In Progress'
        
    # Cost & Disbursed
    cost_val = float(cost)
    disbursed = float(actual_amount) if actual_amount else (cost_val if work_status == 'Completed' else cost_val * 0.5)
    
    # Clean string helper
    def clean_str(s):
        return s.strip() if s else ""
        
    projects.append({
        "id": f"MPLADS-{state_name[:2].upper()}-{work_id}",
        "title": clean_str(title),
        "category": clean_str(category),
        "cost": int(cost_val),
        "agency": clean_str(agency),
        "date": date_str,
        "year": int(year),
        "mp": clean_str(mp_name),
        "constituency": clean_str(const_name),
        "state": clean_str(state_name),
        "type": p_type,
        "disbursed": int(disbursed),
        "installments": 3 if cost_val > 1000000 else (2 if cost_val > 500000 else 1),
        "status": status_str
    })

print(f"Writing to {output_path}...")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2)

# Write to live_exports as well
live_exports_path = r"d:\code\Nirakshak AI\Nirikshak-AI\data\live_exports\real_projects.json"
print(f"Writing to {live_exports_path}...")
os.makedirs(os.path.dirname(live_exports_path), exist_ok=True)
with open(live_exports_path, "w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2)

print("SUCCESS: real_projects.json generated.")
conn.close()

import psycopg2
import psycopg2.extras
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

try:
    cur.execute("SELECT COUNT(*) FROM project_risk_evaluations;")
    count = cur.fetchone()[0]
    print(f"Total rows in project_risk_evaluations: {count}")
    
    cur.execute("SELECT * FROM project_risk_evaluations WHERE work_id = 60423;")
    row = cur.fetchone()
    print("EVALUATION FOR 60423:")
    if row:
        print(dict(row))
    else:
        print("Not found")
except Exception as e:
    print("Error querying project_risk_evaluations:", e)

cur.close()
conn.close()

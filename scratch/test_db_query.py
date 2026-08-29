import psycopg2
import psycopg2.extras
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

work_id = 60423

# Query works table
cur.execute("SELECT * FROM works WHERE work_id = %s;", (work_id,))
work = cur.fetchone()
print("WORKS TABLE:")
if work:
    print(dict(work))
else:
    print("Not found")

# Query works_analytical_features
try:
    cur.execute("SELECT * FROM works_analytical_features WHERE work_id = %s;", (work_id,))
    feat = cur.fetchone()
    print("\nWORKS_ANALYTICAL_FEATURES TABLE:")
    if feat:
        print(dict(feat))
    else:
        print("Not found")
except Exception as e:
    print("Failed to query works_analytical_features:", e)
    conn.rollback()

# Query finguard_financial_anomalies
try:
    cur.execute("SELECT * FROM finguard_financial_anomalies WHERE work_id = %s;", (work_id,))
    anom = cur.fetchone()
    print("\nFINGUARD_FINANCIAL_ANOMALIES TABLE:")
    if anom:
        print(dict(anom))
    else:
        print("Not found")
except Exception as e:
    print("Failed to query finguard_financial_anomalies:", e)

cur.close()
conn.close()

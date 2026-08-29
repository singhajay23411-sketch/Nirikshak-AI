import psycopg2
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor()

tables = ["works_analytical_features", "finguard_financial_anomalies"]
for t in tables:
    try:
        cur.execute(f"SELECT COUNT(*) FROM {t};")
        count = cur.fetchone()[0]
        print(f"Table '{t}' count: {count}")
    except Exception as e:
        print(f"Error querying '{t}': {e}")
        conn.rollback()

cur.close()
conn.close()

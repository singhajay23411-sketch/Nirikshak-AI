import psycopg2
import psycopg2.extras
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

try:
    cur.execute("SELECT COUNT(*) FROM duplicate_alerts;")
    count = cur.fetchone()[0]
    print(f"Total rows in duplicate_alerts: {count}")
    
    cur.execute('SELECT * FROM duplicate_alerts WHERE "work_id_A" = 60423 OR "work_id_B" = 60423;')
    rows = cur.fetchall()
    print("ALERTS FOR 60423:")
    for r in rows:
        print(dict(r))
except Exception as e:
    print("Error querying duplicate_alerts:", e)

cur.close()
conn.close()

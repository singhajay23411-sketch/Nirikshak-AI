import psycopg2
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor()

constituency_id = 1
query = """
WITH vendor_totals AS (
    SELECT w.constituency_id, v.vendor_id, SUM(e.fund_disbursed_amount) as vendor_disbursed
    FROM works w
    JOIN expenditures e ON w.work_id = e.work_id
    JOIN vendors v ON e.vendor_id = v.vendor_id
    WHERE w.constituency_id = %s
    GROUP BY w.constituency_id, v.vendor_id
),
const_totals AS (
    SELECT constituency_id, SUM(vendor_disbursed) as total_disbursed
    FROM vendor_totals
    GROUP BY constituency_id
)
SELECT 
    COALESCE(SUM( POWER((v.vendor_disbursed / NULLIF(c.total_disbursed, 0)) * 100, 2) ), 0.0) as hhi
FROM vendor_totals v
JOIN const_totals c ON v.constituency_id = c.constituency_id
GROUP BY v.constituency_id;
"""

try:
    cur.execute(query, (constituency_id,))
    row = cur.fetchone()
    hhi = row[0] if row else 0.0
    print(f"HHI for constituency {constituency_id}: {hhi}")
except Exception as e:
    print("Error:", e)

cur.close()
conn.close()

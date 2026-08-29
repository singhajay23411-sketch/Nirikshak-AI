"""Final analytics query design - fixed."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.database import get_connection

conn = get_connection()
cur = conn.cursor()

# States full list
cur.execute("SELECT state_id, state_name FROM states ORDER BY state_id;")
print("all states:", cur.fetchall())

# State query joined with states table
cur.execute("""
    SELECT 
        s.state_id, s.state_name,
        COUNT(w.work_id) AS project_count,
        COALESCE(SUM(w.sanction_amount), 0) AS total_allocated
    FROM works w
    JOIN states s ON w.state_id = s.state_id
    GROUP BY s.state_id, s.state_name
    ORDER BY project_count DESC
    LIMIT 10;
""")
print("states with names:", cur.fetchall())

# finguard risk distribution
cur.execute("""
    SELECT
        SUM(CASE WHEN financial_risk_score >= 50 THEN 1 ELSE 0 END) AS high_risk,
        SUM(CASE WHEN financial_risk_score >= 25 AND financial_risk_score < 50 THEN 1 ELSE 0 END) AS moderate_risk,
        SUM(CASE WHEN financial_risk_score < 25 THEN 1 ELSE 0 END) AS low_risk,
        COUNT(*) AS total_scored
    FROM finguard_financial_anomalies;
""")
r = cur.fetchone()
print("finguard risk dist (high/moderate/low/total):", r)

# agency risk tier distribution (from works table)
cur.execute("""
    SELECT agency_risk_tier, COUNT(*) FROM works WHERE agency_risk_tier IS NOT NULL GROUP BY agency_risk_tier;
""")
print("works agency_risk_tier:", cur.fetchall())

cur.close()
conn.close()
print("Done.")

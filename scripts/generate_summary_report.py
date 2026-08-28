import os
import pandas as pd
from backend.database import get_connection

def generate_report():
    conn = get_connection()
    
    # Query to get summary stats grouped by state and constituency
    query = """
    SELECT 
        s.state_name,
        COUNT(DISTINCT c.constituency_id) as total_constituencies,
        COUNT(DISTINCT m.mp_id) as total_mps,
        COUNT(DISTINCT w.work_id) as total_works_fetched,
        COUNT(DISTINCT e.expenditure_id) as total_expenditure_records,
        COALESCE(SUM(w.recommended_amount), 0) / 10000000 AS total_recommended_cr,
        COALESCE(SUM(w.sanction_amount), 0) / 10000000 AS total_sanctioned_cr,
        COALESCE(SUM(e.fund_disbursed_amount), 0) / 10000000 AS total_disbursed_cr
    FROM states s
    LEFT JOIN constituencies c ON s.state_id = c.state_id
    LEFT JOIN mps m ON c.constituency_id = m.constituency_id
    LEFT JOIN works w ON m.mp_id = w.mp_id
    LEFT JOIN expenditures e ON w.work_id = e.work_id
    GROUP BY s.state_name
    ORDER BY s.state_name;
    """
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    # 1. Save as CSV for teammates
    csv_path = "data_summary_report.csv"
    df.to_csv(csv_path, index=False)
    
    # 2. Save as Markdown for easy viewing in Workspace
    md_path = "data_summary_report.md"
    with open(md_path, "w") as f:
        f.write("# MPLADS Data Collection Summary\n\n")
        f.write("This report summarizes the data currently fetched and stored in the database.\n\n")
        f.write(df.to_markdown(index=False))
        f.write("\n\n*Note: Financial amounts are shown in Crores (Cr).*")
        
    print(f"✅ Reports generated successfully:\n- {csv_path}\n- {md_path}")

if __name__ == "__main__":
    generate_report()

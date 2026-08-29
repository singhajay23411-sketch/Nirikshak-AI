import os
import sys
import pandas as pd
import numpy as np
import psycopg2
import psycopg2.extras
from datetime import datetime

# Ensure project root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import get_connection

def sanitize_value(val):
    """Convert pandas NaN, NaT, and numpy numeric types to native Python types for psycopg2."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, pd.Timestamp):
        if pd.isna(val):
            return None
        return val.strftime("%Y-%m-%d")
    return val

def seed_table(cur, table_name, file_path, columns, conflict_clause="", drop_null_col=None):
    print(f"Loading {table_name} from {file_path}...")
    df = pd.read_parquet(file_path)
    
    if drop_null_col:
        df = df.dropna(subset=[drop_null_col])
        
    print(f"  -> Loaded {len(df):,} rows.")
    
    # Filter columns to only those that exist in the target schema
    existing_cols = [c for c in columns if c in df.columns]
    sub_df = df[existing_cols].copy()
    
    # Prepare rows
    rows = []
    for row in sub_df.itertuples(index=False, name=None):
        rows.append(tuple(sanitize_value(v) for v in row))
        
    col_names = ", ".join(existing_cols)
    
    query = f"INSERT INTO {table_name} ({col_names}) VALUES %s {conflict_clause}"
    
    print(f"  -> Batch inserting into {table_name}...")
    psycopg2.extras.execute_values(
        cur,
        query,
        rows,
        page_size=2000
    )
    print(f"  -> Successfully seeded {table_name}.")

def main():
    print("=" * 60)
    print("NIRIKSHAK AI — PARQUET TO POSTGRESQL DATABASE SEEDER")
    print("=" * 60)
    
    data_dir = os.path.join("data", "parquet")
    
    # Verify Parquet files exist
    files = {
        "states": os.path.join(data_dir, "states.parquet"),
        "constituencies": os.path.join(data_dir, "constituencies.parquet"),
        "mps": os.path.join(data_dir, "mps.parquet"),
        "mp_allocations": os.path.join(data_dir, "mp_allocations.parquet"),
        "vendors": os.path.join(data_dir, "vendors.parquet"),
        "works": os.path.join(data_dir, "works.parquet"),
        "expenditures": os.path.join(data_dir, "expenditures.parquet")
    }
    
    for k, v in files.items():
        if not os.path.exists(v):
            print(f"Error: Required Parquet file {v} not found!")
            sys.exit(1)
            
    print("Connecting to PostgreSQL...")
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Start transaction block
        print("Starting seeding transaction...")
        
        # 1. States
        seed_table(
            cur, 
            "states", 
            files["states"], 
            ["state_id", "state_name"], 
            "ON CONFLICT (state_id) DO NOTHING"
        )
        
        # 2. Constituencies
        seed_table(
            cur, 
            "constituencies", 
            files["constituencies"], 
            ["constituency_id", "constituency_name", "state_id"], 
            "ON CONFLICT (constituency_id) DO NOTHING"
        )
        
        # 3. MPs
        seed_table(
            cur, 
            "mps", 
            files["mps"], 
            ["mp_id", "mp_name", "constituency_id", "house_type", "tenure", "allocated_limit", "calamity_amount"], 
            "ON CONFLICT (mp_id, house_type, tenure) DO NOTHING"
        )
        
        # 4. MP Allocations
        seed_table(
            cur, 
            "mp_allocations", 
            files["mp_allocations"], 
            ["allocation_id", "mp_id", "allocated_amount", "house_name", "tenure", "house_type"], 
            "ON CONFLICT (allocation_id) DO NOTHING"
        )
        
        # 5. Vendors
        seed_table(
            cur, 
            "vendors", 
            files["vendors"], 
            ["vendor_id", "vendor_name"], 
            "ON CONFLICT (vendor_id) DO NOTHING"
        )
        
        # 6. Works
        seed_table(
            cur, 
            "works", 
            files["works"], 
            [
                "work_id", "activity_name", "work_description", "work_category", "mp_id", 
                "house_type", "tenure", "constituency_id", "state_id", "recommended_amount", 
                "sanction_amount", "actual_amount", "recommendation_date", "sanction_date", 
                "actual_end_date", "work_stage", "work_status", "average_rating", "flag",
                "agency_risk_score", "agency_risk_tier", "agency_risk_contribution"
            ], 
            "ON CONFLICT (work_id) DO NOTHING"
        )
        
        # 7. Expenditures
        seed_table(
            cur, 
            "expenditures", 
            files["expenditures"], 
            [
                "expenditure_id", "work_id", "vendor_id", "fund_disbursed_amount", "expenditure_date", 
                "ia_name", "mp_id", "house_type", "tenure", "constituency", "work_status"
            ], 
            "ON CONFLICT (expenditure_id) DO NOTHING",
            drop_null_col="work_id"
        )
        
        # Verify Row Counts
        print("\nVerifying database row counts...")
        tables = ["states", "constituencies", "mps", "mp_allocations", "vendors", "works", "expenditures"]
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t};")
            count = cur.fetchone()[0]
            print(f"  Table '{t}' count: {count:,} rows")
            
        # Commit transaction
        conn.commit()
        print("\nAll tables successfully seeded. Transaction COMMITTED!")
        
    except Exception as e:
        print("\nFatal Error occurred! Rolling back transaction...")
        conn.rollback()
        print(f"Error Details: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()

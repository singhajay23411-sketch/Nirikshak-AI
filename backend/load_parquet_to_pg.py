"""
load_parquet_to_pg.py — Bulk-load all 7 parquet tables into PostgreSQL.

Insertion order respects foreign key dependencies:
  states → constituencies → mps → mp_allocations → works → vendors → expenditures

Usage:
    python -m backend.load_parquet_to_pg
"""

import os
import sys
import math
import time
import logging

import pandas as pd
import numpy as np
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("parquet_loader")

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
PARQUET_DIR = os.path.join(PROJECT_ROOT, "data", "parquet")

load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"))


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "nirikshak"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )


def _safe(val):
    """Convert numpy/pandas types to Python native for psycopg2."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, pd.Timestamp):
        return val.to_pydatetime()
    if isinstance(val, np.bool_):
        return bool(val)
    return val


def _batch_insert(conn, table, columns, rows, page_size=500):
    """Generic batch insert using execute_values."""
    if not rows:
        return
    cur = conn.cursor()
    cols_str = ", ".join(columns)
    template = "(" + ", ".join(["%s"] * len(columns)) + ")"
    query = f"INSERT INTO {table} ({cols_str}) VALUES %s ON CONFLICT DO NOTHING"
    psycopg2.extras.execute_values(cur, query, rows, template=template, page_size=page_size)
    conn.commit()
    cur.close()


def load_states(conn):
    log.info("Loading states...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "states.parquet"))
    rows = [(_safe(r.state_id), _safe(r.state_name)) for r in df.itertuples()]
    _batch_insert(conn, "states", ["state_id", "state_name"], rows)
    log.info(f"  → {len(rows)} states loaded.")


def load_constituencies(conn):
    log.info("Loading constituencies...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "constituencies.parquet"))
    rows = [(_safe(r.constituency_id), _safe(r.constituency_name), _safe(r.state_id))
            for r in df.itertuples()]
    _batch_insert(conn, "constituencies",
                  ["constituency_id", "constituency_name", "state_id"], rows)
    log.info(f"  → {len(rows)} constituencies loaded.")


def load_mps(conn):
    log.info("Loading MPs...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "mps.parquet"))
    rows = []
    for r in df.itertuples():
        rows.append((
            _safe(r.mp_id), _safe(r.mp_name), _safe(r.constituency_id),
            _safe(r.house_type), _safe(r.tenure),
            _safe(r.allocated_limit), _safe(r.calamity_amount),
        ))
    cur = conn.cursor()
    psycopg2.extras.execute_values(cur, """
        INSERT INTO mps (mp_id, mp_name, constituency_id, house_type, tenure,
                         allocated_limit, calamity_amount)
        VALUES %s
        ON CONFLICT (mp_id, house_type, tenure) DO UPDATE SET
            mp_name = EXCLUDED.mp_name,
            constituency_id = EXCLUDED.constituency_id,
            allocated_limit = COALESCE(EXCLUDED.allocated_limit, mps.allocated_limit),
            calamity_amount = COALESCE(EXCLUDED.calamity_amount, mps.calamity_amount);
    """, rows, page_size=500)
    conn.commit()
    cur.close()
    log.info(f"  → {len(rows)} MP records loaded.")


def load_mp_allocations(conn):
    log.info("Loading MP allocations...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "mp_allocations.parquet"))
    rows = []
    for r in df.itertuples():
        rows.append((
            _safe(r.mp_id), _safe(r.house_type), _safe(r.tenure),
            _safe(r.allocated_amount), _safe(r.house_name),
        ))
    cur = conn.cursor()
    psycopg2.extras.execute_values(cur, """
        INSERT INTO mp_allocations (mp_id, house_type, tenure, allocated_amount, house_name)
        VALUES %s
        ON CONFLICT DO NOTHING;
    """, rows, page_size=500)
    conn.commit()
    cur.close()
    log.info(f"  → {len(rows)} allocation records loaded.")


def load_works(conn):
    log.info("Loading works (218K+ records)...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "works.parquet"))

    # Convert date columns
    for col in ("recommendation_date", "sanction_date", "actual_end_date"):
        df[col] = pd.to_datetime(df[col], errors="coerce")

    cols = [
        "work_id", "activity_name", "work_description", "work_category",
        "mp_id", "house_type", "tenure", "constituency_id", "state_id",
        "ida_name", "letter_no", "recommended_amount", "sanction_amount",
        "actual_amount", "recommendation_date", "sanction_date",
        "actual_end_date", "work_stage", "work_status", "average_rating", "flag"
    ]

    batch_size = 2000
    total = len(df)
    for start in range(0, total, batch_size):
        chunk = df.iloc[start:start + batch_size]
        rows = []
        for r in chunk.itertuples():
            rows.append(tuple(_safe(getattr(r, c)) for c in cols))
        cur = conn.cursor()
        cols_str = ", ".join(cols)
        psycopg2.extras.execute_values(cur, f"""
            INSERT INTO works ({cols_str}) VALUES %s
            ON CONFLICT (work_id) DO NOTHING;
        """, rows, page_size=500)
        conn.commit()
        cur.close()
        loaded = min(start + batch_size, total)
        if loaded % 10000 == 0 or loaded == total:
            log.info(f"  → works: {loaded:,} / {total:,} loaded")

    log.info(f"  → {total:,} works loaded.")


def load_vendors(conn):
    log.info("Loading vendors...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "vendors.parquet"))
    rows = [(_safe(r.vendor_id), _safe(r.vendor_name)) for r in df.itertuples()]
    _batch_insert(conn, "vendors", ["vendor_id", "vendor_name"], rows)
    log.info(f"  → {len(rows)} vendors loaded.")


def load_expenditures(conn):
    log.info("Loading expenditures (238K+ records)...")
    df = pd.read_parquet(os.path.join(PARQUET_DIR, "expenditures.parquet"))

    df["expenditure_date"] = pd.to_datetime(df["expenditure_date"], errors="coerce")

    # Map float columns to safe ints where needed
    for col in ("work_id", "vendor_id", "mp_id", "house_type"):
        if col in df.columns:
            df[col] = df[col].where(df[col].notna(), None)

    cols = [
        "work_id", "vendor_id", "fund_disbursed_amount", "expenditure_date",
        "ia_name", "mp_id", "house_type", "tenure", "constituency", "work_status"
    ]

    batch_size = 2000
    total = len(df)
    for start in range(0, total, batch_size):
        chunk = df.iloc[start:start + batch_size]
        rows = []
        for r in chunk.itertuples():
            row_vals = []
            for c in cols:
                val = _safe(getattr(r, c, None))
                # Convert float IDs to int
                if c in ("work_id", "vendor_id", "mp_id", "house_type") and val is not None:
                    try:
                        val = int(val)
                    except (ValueError, TypeError):
                        val = None
                row_vals.append(val)
            rows.append(tuple(row_vals))

        cur = conn.cursor()
        cols_str = ", ".join(cols)
        psycopg2.extras.execute_values(cur, f"""
            INSERT INTO expenditures ({cols_str}) VALUES %s;
        """, rows, page_size=500)
        conn.commit()
        cur.close()
        loaded = min(start + batch_size, total)
        if loaded % 10000 == 0 or loaded == total:
            log.info(f"  → expenditures: {loaded:,} / {total:,} loaded")

    log.info(f"  → {total:,} expenditures loaded.")


def main():
    start = time.time()
    log.info("=" * 60)
    log.info("  NIRIKSHAK AI — Parquet → PostgreSQL Data Loader")
    log.info("=" * 60)

    conn = get_connection()

    # Import and run schema creation
    sys.path.insert(0, PROJECT_ROOT)
    from backend.database import initialise_schema
    log.info("Initializing schema (8 tables)...")
    initialise_schema(conn)

    # Load in FK-dependency order
    load_states(conn)
    load_constituencies(conn)
    load_mps(conn)
    load_mp_allocations(conn)
    load_works(conn)
    load_vendors(conn)
    load_expenditures(conn)

    # Verify
    from backend.database import get_table_counts
    counts = get_table_counts(conn)
    log.info("=" * 60)
    log.info("  FINAL TABLE COUNTS:")
    for table, count in counts.items():
        log.info(f"    {table:20s}: {count:>10,} rows")
    log.info("=" * 60)

    conn.close()
    elapsed = time.time() - start
    log.info(f"Total loading time: {elapsed:.1f}s")


if __name__ == "__main__":
    main()

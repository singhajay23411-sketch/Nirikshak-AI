"""database.py

PostgreSQL database module for the Nirikshak AI / MPLADS data pipeline.
Provides schema creation, upsert helpers, and analytics queries
using 8 normalized tables.
"""

import os
import psycopg2
import psycopg2.extras
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import date, datetime
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class State:
    state_id: int
    state_name: str

@dataclass
class Constituency:
    constituency_id: int
    constituency_name: str
    state_id: int

@dataclass
class MP:
    mp_id: int
    mp_name: str
    constituency_id: int
    house_type: int
    tenure: str
    allocated_limit: Optional[float] = None
    calamity_amount: Optional[float] = None
    tenure_start_date: Optional[str] = None
    tenure_end_date: Optional[str] = None

@dataclass
class MPAllocation:
    mp_id: int
    allocated_amount: float
    house_name: str = "Lok Sabha"
    tenure: str = ""
    house_type: Optional[int] = None

@dataclass
class Work:
    work_id: int
    activity_name: Optional[str] = None
    work_description: Optional[str] = None
    work_category: Optional[str] = None
    mp_id: Optional[int] = None
    house_type: Optional[int] = None
    tenure: Optional[str] = None
    constituency_id: Optional[int] = None
    state_id: Optional[int] = None
    ida_name: Optional[str] = None
    letter_no: Optional[str] = None
    recommended_amount: Optional[float] = None
    sanction_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    recommendation_date: Optional[str] = None
    sanction_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    work_stage: Optional[str] = None
    work_status: Optional[str] = None
    average_rating: Optional[float] = None
    flag: Optional[int] = None
    agency_risk_score: Optional[float] = None
    agency_risk_tier: Optional[str] = None
    agency_risk_contribution: Optional[float] = None

@dataclass
class Vendor:
    vendor_id: int
    vendor_name: str

@dataclass
class Expenditure:
    work_id: int
    vendor_id: Optional[int] = None
    fund_disbursed_amount: Optional[float] = None
    expenditure_date: Optional[str] = None
    ia_name: Optional[str] = None
    mp_id: Optional[int] = None
    house_type: Optional[int] = None
    tenure: Optional[str] = None
    constituency: Optional[str] = None
    work_status: Optional[str] = None

# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def get_connection_params() -> dict:
    """Read DB connection params from environment."""
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", 5432)),
        "dbname": os.getenv("DB_NAME", "nirikshak"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres"),
    }


def get_connection(dbname: Optional[str] = None) -> psycopg2.extensions.connection:
    """Create a PostgreSQL connection."""
    params = get_connection_params()
    if dbname:
        params["dbname"] = dbname
    conn = psycopg2.connect(**params)
    conn.autocommit = False
    return conn


def ensure_database_exists():
    """Create the nirikshak database if it doesn't exist."""
    params = get_connection_params()
    db_name = params["dbname"]
    # Connect to the default 'postgres' database to create ours
    params["dbname"] = "postgres"
    conn = psycopg2.connect(**params)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (db_name,))
    if not cur.fetchone():
        cur.execute(f'CREATE DATABASE "{db_name}";')
        print(f"  Created database '{db_name}'.")
    else:
        print(f"  Database '{db_name}' already exists.")
    cur.close()
    conn.close()


# ---------------------------------------------------------------------------
# Schema initialisation
# ---------------------------------------------------------------------------

def initialise_schema(conn) -> None:
    """Create all 8 tables with proper foreign keys and indexes."""
    cur = conn.cursor()

    # -- states --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS states (
            state_id    INTEGER PRIMARY KEY,
            state_name  TEXT NOT NULL
        );
    """)

    # -- constituencies --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS constituencies (
            constituency_id   INTEGER PRIMARY KEY,
            constituency_name TEXT NOT NULL,
            state_id          INTEGER NOT NULL REFERENCES states(state_id) ON DELETE CASCADE
        );
    """)

    # -- mps --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS mps (
            mp_id             INTEGER,
            mp_name           TEXT NOT NULL,
            constituency_id   INTEGER REFERENCES constituencies(constituency_id) ON DELETE SET NULL,
            house_type        INTEGER DEFAULT 2,
            tenure            TEXT,
            allocated_limit   REAL,
            calamity_amount   REAL,
            PRIMARY KEY (mp_id, house_type, tenure)
        );
    """)

    # -- mp_allocations --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS mp_allocations (
            allocation_id    SERIAL PRIMARY KEY,
            mp_id            INTEGER NOT NULL,
            house_type       INTEGER,
            tenure           TEXT,
            allocated_amount NUMERIC(15, 2),
            house_name       TEXT,
            record_hash      TEXT,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mp_id, house_type, tenure) REFERENCES mps(mp_id, house_type, tenure) ON DELETE CASCADE
        );
    """)

    # -- works --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS works (
            work_id                  INTEGER PRIMARY KEY,
            activity_name            TEXT,
            work_description         TEXT,
            work_category            TEXT,
            mp_id                    INTEGER,
            house_type               INTEGER,
            tenure                   TEXT,
            constituency_id          INTEGER REFERENCES constituencies(constituency_id) ON DELETE SET NULL,
            state_id                 INTEGER REFERENCES states(state_id) ON DELETE SET NULL,
            ida_name                 TEXT,
            letter_no                TEXT,
            recommended_amount       NUMERIC(15, 2),
            sanction_amount          NUMERIC(15, 2),
            actual_amount            NUMERIC(15, 2),
            recommendation_date      DATE,
            sanction_date            DATE,
            actual_end_date          DATE,
            work_stage               TEXT,
            work_status              TEXT,
            average_rating           REAL,
            flag                     INTEGER,
            agency_risk_score        DOUBLE PRECISION,
            agency_risk_tier         TEXT,
            agency_risk_contribution DOUBLE PRECISION,
            record_hash              TEXT,
            updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mp_id, house_type, tenure) REFERENCES mps(mp_id, house_type, tenure) ON DELETE SET NULL
        );
    """)

    # -- vendors --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            vendor_id   INTEGER PRIMARY KEY,
            vendor_name TEXT NOT NULL

        );
    """)

    # -- expenditures --
    cur.execute("""
        CREATE TABLE IF NOT EXISTS expenditures (
            expenditure_id        SERIAL PRIMARY KEY,
            work_id               INTEGER REFERENCES works(work_id) ON DELETE CASCADE,
            vendor_id             INTEGER REFERENCES vendors(vendor_id) ON DELETE SET NULL,
            fund_disbursed_amount NUMERIC(15, 2),
            expenditure_date      DATE,
            ia_name               TEXT,
            mp_id                 INTEGER,
            house_type            INTEGER,
            tenure                TEXT,
            constituency          TEXT,
            work_status           TEXT,
            record_hash           TEXT,
            updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mp_id, house_type, tenure) REFERENCES mps(mp_id, house_type, tenure) ON DELETE SET NULL
        );
    """)

    # -- Indexes for fast lookups --
    index_statements = [
        "CREATE INDEX IF NOT EXISTS idx_const_state ON constituencies(state_id);",
        "CREATE INDEX IF NOT EXISTS idx_mp_const ON mps(constituency_id);",
        "CREATE INDEX IF NOT EXISTS idx_mp_alloc_mp ON mp_allocations(mp_id, house_type, tenure);",
        "CREATE INDEX IF NOT EXISTS idx_work_mp ON works(mp_id, house_type, tenure);",
        "CREATE INDEX IF NOT EXISTS idx_work_const ON works(constituency_id);",
        "CREATE INDEX IF NOT EXISTS idx_work_state ON works(state_id);",
        "CREATE INDEX IF NOT EXISTS idx_work_status ON works(work_status);",
        "CREATE INDEX IF NOT EXISTS idx_work_category ON works(work_category);",
        "CREATE INDEX IF NOT EXISTS idx_exp_work ON expenditures(work_id);",
        "CREATE INDEX IF NOT EXISTS idx_exp_vendor ON expenditures(vendor_id);",
        "CREATE INDEX IF NOT EXISTS idx_exp_mp ON expenditures(mp_id, house_type, tenure);",
        "CREATE INDEX IF NOT EXISTS idx_exp_date ON expenditures(expenditure_date);",
    ]
    for stmt in index_statements:
        cur.execute(stmt)

    conn.commit()
    cur.close()


# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------

def upsert_state(conn, state: State) -> None:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO states (state_id, state_name)
        VALUES (%s, %s)
        ON CONFLICT (state_id) DO UPDATE SET state_name = EXCLUDED.state_name;
    """, (state.state_id, state.state_name))
    conn.commit()
    cur.close()


def upsert_constituency(conn, constituency: Constituency) -> None:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO constituencies (constituency_id, constituency_name, state_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (constituency_id) DO UPDATE
            SET constituency_name = EXCLUDED.constituency_name,
                state_id = EXCLUDED.state_id;
    """, (constituency.constituency_id, constituency.constituency_name, constituency.state_id))
    conn.commit()
    cur.close()


def upsert_mp(conn, mp: MP) -> None:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO mps (mp_id, mp_name, constituency_id, house_type, tenure, allocated_limit, calamity_amount)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (mp_id, house_type, tenure) DO UPDATE SET
            mp_name = EXCLUDED.mp_name,
            constituency_id = EXCLUDED.constituency_id,
            allocated_limit = COALESCE(EXCLUDED.allocated_limit, mps.allocated_limit),
            calamity_amount = COALESCE(EXCLUDED.calamity_amount, mps.calamity_amount);
    """, (mp.mp_id, mp.mp_name, mp.constituency_id, mp.house_type, mp.tenure, mp.allocated_limit, mp.calamity_amount))
    conn.commit()
    cur.close()


def upsert_mp_allocation(conn, alloc: MPAllocation) -> None:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO mp_allocations (mp_id, house_type, tenure, allocated_amount, house_name)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (mp_id, house_type, tenure) DO UPDATE
            SET allocated_amount = EXCLUDED.allocated_amount,
                house_name = EXCLUDED.house_name;
    """, (alloc.mp_id, alloc.house_type, alloc.tenure, alloc.allocated_amount, alloc.house_name))
    conn.commit()
    cur.close()


def upsert_work(conn, work: Work) -> None:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO works (work_id, activity_name, work_description, work_category,
                           mp_id, house_type, tenure, constituency_id, state_id, ida_name, letter_no,
                           recommended_amount, sanction_amount, actual_amount,
                           recommendation_date, sanction_date, actual_end_date,
                           work_stage, work_status, average_rating, flag)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (work_id) DO UPDATE
            SET activity_name = COALESCE(EXCLUDED.activity_name, works.activity_name),
                work_description = COALESCE(EXCLUDED.work_description, works.work_description),
                work_category = COALESCE(EXCLUDED.work_category, works.work_category),
                mp_id = COALESCE(EXCLUDED.mp_id, works.mp_id),
                house_type = COALESCE(EXCLUDED.house_type, works.house_type),
                tenure = COALESCE(EXCLUDED.tenure, works.tenure),
                constituency_id = COALESCE(EXCLUDED.constituency_id, works.constituency_id),
                state_id = COALESCE(EXCLUDED.state_id, works.state_id),
                ida_name = COALESCE(EXCLUDED.ida_name, works.ida_name),
                letter_no = COALESCE(EXCLUDED.letter_no, works.letter_no),
                recommended_amount = COALESCE(EXCLUDED.recommended_amount, works.recommended_amount),
                sanction_amount = COALESCE(EXCLUDED.sanction_amount, works.sanction_amount),
                actual_amount = COALESCE(EXCLUDED.actual_amount, works.actual_amount),
                recommendation_date = COALESCE(EXCLUDED.recommendation_date, works.recommendation_date),
                sanction_date = COALESCE(EXCLUDED.sanction_date, works.sanction_date),
                actual_end_date = COALESCE(EXCLUDED.actual_end_date, works.actual_end_date),
                work_stage = COALESCE(EXCLUDED.work_stage, works.work_stage),
                work_status = COALESCE(EXCLUDED.work_status, works.work_status),
                average_rating = COALESCE(EXCLUDED.average_rating, works.average_rating),
                flag = COALESCE(EXCLUDED.flag, works.flag);
    """, (work.work_id, work.activity_name, work.work_description, work.work_category,
          work.mp_id, work.house_type, work.tenure, work.constituency_id, work.state_id, work.ida_name, work.letter_no,
          work.recommended_amount, work.sanction_amount, work.actual_amount,
          work.recommendation_date, work.sanction_date, work.actual_end_date,
          work.work_stage, work.work_status, work.average_rating, work.flag))
    conn.commit()
    cur.close()


def batch_upsert_works(conn, works: List[Work]) -> None:
    """Bulk upsert works using execute_values for performance."""
    if not works:
        return
    cur = conn.cursor()
    values = [
        (w.work_id, w.activity_name, w.work_description, w.work_category,
         w.mp_id, w.house_type, w.tenure, w.constituency_id, w.state_id, w.ida_name, w.letter_no,
         w.recommended_amount, w.sanction_amount, w.actual_amount,
         w.recommendation_date, w.sanction_date, w.actual_end_date,
         w.work_stage, w.work_status, w.average_rating, w.flag)
        for w in works
    ]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO works (work_id, activity_name, work_description, work_category,
                           mp_id, house_type, tenure, constituency_id, state_id, ida_name, letter_no,
                           recommended_amount, sanction_amount, actual_amount,
                           recommendation_date, sanction_date, actual_end_date,
                           work_stage, work_status, average_rating, flag)
        VALUES %s
        ON CONFLICT (work_id) DO UPDATE
            SET activity_name = COALESCE(EXCLUDED.activity_name, works.activity_name),
                work_description = COALESCE(EXCLUDED.work_description, works.work_description),
                work_category = COALESCE(EXCLUDED.work_category, works.work_category),
                mp_id = COALESCE(EXCLUDED.mp_id, works.mp_id),
                house_type = COALESCE(EXCLUDED.house_type, works.house_type),
                tenure = COALESCE(EXCLUDED.tenure, works.tenure),
                constituency_id = COALESCE(EXCLUDED.constituency_id, works.constituency_id),
                state_id = COALESCE(EXCLUDED.state_id, works.state_id),
                ida_name = COALESCE(EXCLUDED.ida_name, works.ida_name),
                letter_no = COALESCE(EXCLUDED.letter_no, works.letter_no),
                recommended_amount = COALESCE(EXCLUDED.recommended_amount, works.recommended_amount),
                sanction_amount = COALESCE(EXCLUDED.sanction_amount, works.sanction_amount),
                actual_amount = COALESCE(EXCLUDED.actual_amount, works.actual_amount),
                recommendation_date = COALESCE(EXCLUDED.recommendation_date, works.recommendation_date),
                sanction_date = COALESCE(EXCLUDED.sanction_date, works.sanction_date),
                actual_end_date = COALESCE(EXCLUDED.actual_end_date, works.actual_end_date),
                work_stage = COALESCE(EXCLUDED.work_stage, works.work_stage),
                work_status = COALESCE(EXCLUDED.work_status, works.work_status),
                average_rating = COALESCE(EXCLUDED.average_rating, works.average_rating),
                flag = COALESCE(EXCLUDED.flag, works.flag);
    """, values, page_size=500)
    conn.commit()
    cur.close()


def upsert_vendor(conn, vendor: Vendor) -> None:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO vendors (vendor_id, vendor_name)
        VALUES (%s, %s)
        ON CONFLICT (vendor_id) DO UPDATE SET vendor_name = EXCLUDED.vendor_name;
    """, (vendor.vendor_id, vendor.vendor_name))
    conn.commit()
    cur.close()


def batch_upsert_vendors(conn, vendors: List[Vendor]) -> None:
    if not vendors:
        return
    cur = conn.cursor()
    values = [(v.vendor_id, v.vendor_name) for v in vendors]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO vendors (vendor_id, vendor_name)
        VALUES %s
        ON CONFLICT (vendor_id) DO UPDATE SET vendor_name = EXCLUDED.vendor_name;
    """, values, page_size=500)
    conn.commit()
    cur.close()


def batch_insert_expenditures(conn, expenditures: List[Expenditure]) -> None:
    if not expenditures:
        return
    cur = conn.cursor()
    values = [
        (e.work_id, e.vendor_id, e.fund_disbursed_amount, e.expenditure_date,
         e.ia_name, e.mp_id, e.house_type, e.tenure, e.constituency, e.work_status)
        for e in expenditures
    ]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO expenditures (work_id, vendor_id, fund_disbursed_amount,
                                  expenditure_date, ia_name, mp_id, house_type, tenure, constituency, work_status)
        VALUES %s;
    """, values, page_size=500)
    conn.commit()
    cur.close()


# ---------------------------------------------------------------------------
# Analytics helpers
# ---------------------------------------------------------------------------

def fetch_all_for_analytics(conn):
    """Return a denormalised DataFrame joining works with states, constituencies, and MPs."""
    import pandas as pd
    query = """
        SELECT
            w.work_id,
            w.activity_name,
            w.work_description,
            w.work_category,
            w.recommended_amount,
            w.sanction_amount,
            w.actual_amount,
            w.recommendation_date,
            w.sanction_date,
            w.actual_end_date,
            w.work_stage,
            w.work_status,
            w.average_rating,
            w.ida_name,
            s.state_id,
            s.state_name,
            c.constituency_id,
            c.constituency_name,
            m.mp_id,
            m.mp_name
        FROM works w
        LEFT JOIN states s ON w.state_id = s.state_id
        LEFT JOIN constituencies c ON w.constituency_id = c.constituency_id
        LEFT JOIN mps m ON w.mp_id = m.mp_id
        ORDER BY w.work_id;
    """
    return pd.read_sql_query(query, conn)


def fetch_expenditure_analytics(conn):
    """Return expenditure records joined with vendors and works."""
    import pandas as pd
    query = """
        SELECT
            e.expenditure_id,
            e.fund_disbursed_amount,
            e.expenditure_date,
            e.ia_name,
            e.work_status,
            e.constituency,
            v.vendor_id,
            v.vendor_name,
            w.work_id,
            w.activity_name,
            w.work_description,
            w.sanction_amount,
            m.mp_id,
            m.mp_name
        FROM expenditures e
        LEFT JOIN vendors v ON e.vendor_id = v.vendor_id
        LEFT JOIN works w ON e.work_id = w.work_id
        LEFT JOIN mps m ON e.mp_id = m.mp_id
        ORDER BY e.expenditure_date;
    """
    return pd.read_sql_query(query, conn)


def get_table_counts(conn) -> dict:
    """Return row counts for all tables."""
    cur = conn.cursor()
    tables = ["states", "constituencies", "mps", "mp_allocations",
              "works", "vendors", "expenditures"]
    counts = {}
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table};")
        counts[table] = cur.fetchone()[0]
    cur.close()
    return counts


def fetch_work_for_delay_scoring(conn, work_id: int) -> Optional[dict]:
    """Retrieve work metadata and expenditures for delay risk scoring.
    Excludes leakage columns (actual_end_date, actual_amount, work_stage, work_status).
    """
    cur = conn.cursor()
    
    # 1. Fetch work details
    query = """
        SELECT
            work_id,
            recommendation_date,
            sanction_date,
            sanction_amount,
            recommended_amount,
            work_category,
            house_type,
            tenure,
            state_id,
            constituency_id
        FROM works
        WHERE work_id = %s;
    """
    cur.execute(query, (work_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        return None
        
    work_id_val, recom_date, sanc_date, sanc_amt, recom_amt, category, house_type, tenure, state_id, const_id = row
    
    # Format dates to YYYY-MM-DD
    recom_date_str = recom_date.strftime("%Y-%m-%d") if recom_date else None
    sanc_date_str = sanc_date.strftime("%Y-%m-%d") if sanc_date else None
    
    # 2. Fetch expenditures
    exp_query = """
        SELECT
            expenditure_date,
            fund_disbursed_amount
        FROM expenditures
        WHERE work_id = %s;
    """

    cur.execute(exp_query, (work_id,))
    exp_rows = cur.fetchall()
    cur.close()
    
    expenditures = []
    total_disbursed = 0.0
    for exp_row in exp_rows:
        exp_date, exp_amt = exp_row
        exp_date_str = exp_date.strftime("%Y-%m-%d") if exp_date else None
        exp_amt_float = float(exp_amt) if exp_amt is not None else 0.0
        expenditures.append({
            "expenditure_date": exp_date_str,
            "fund_disbursed_amount": exp_amt_float
        })
        total_disbursed += exp_amt_float
        
    work_data = {
        "work_id": work_id_val,
        "recommendation_date": recom_date_str,
        "sanction_date": sanc_date_str,
        "sanction_amount": float(sanc_amt) if sanc_amt is not None else 0.0,
        "recommended_amount": float(recom_amt) if recom_amt is not None else 0.0,
        "work_category": category,
        "house_type": house_type,
        "tenure": tenure,
        "state_id": state_id,
        "constituency_id": const_id,
        "expenditures": expenditures,
        "total_disbursed": total_disbursed
    }
    
    return work_data


# ---------------------------------------------------------------------------
# CLI sanity-check
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    print("Ensuring database exists...")
    ensure_database_exists()
    print("Connecting and creating schema...")
    conn = get_connection()
    initialise_schema(conn)
    print("Schema created successfully!")
    counts = get_table_counts(conn)
    for table, count in counts.items():
        print(f"  {table}: {count} rows")
    conn.close()
    print("Done.")

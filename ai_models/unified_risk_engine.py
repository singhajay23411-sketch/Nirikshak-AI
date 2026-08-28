import os
import time
import json
import logging
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

from ai_models.stall_predictor import predict_stall_probabilities

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
log = logging.getLogger("unified_risk_engine")

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
PARQUET_DIR = os.path.join(DATA_DIR, "parquet")

def get_db_connection():
    from dotenv import load_dotenv
    load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"))
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "nirikshak"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )

def _get_hhi_from_db():
    """Fetches fast constituency-level HHI from expenditures table."""
    conn = get_db_connection()
    query = """
    WITH vendor_totals AS (
        SELECT w.constituency_id, v.vendor_name, SUM(e.fund_disbursed_amount) as vendor_disbursed
        FROM works w
        JOIN expenditures e ON w.work_id = e.work_id
        JOIN vendors v ON e.vendor_id = v.vendor_id
        GROUP BY w.constituency_id, v.vendor_name
    ),
    const_totals AS (
        SELECT constituency_id, SUM(vendor_disbursed) as total_disbursed
        FROM vendor_totals
        GROUP BY constituency_id
    )
    SELECT 
        v.constituency_id, 
        SUM( POWER((v.vendor_disbursed / NULLIF(c.total_disbursed, 0)) * 100, 2) ) as hhi
    FROM vendor_totals v
    JOIN const_totals c ON v.constituency_id = c.constituency_id
    GROUP BY v.constituency_id;
    """
    try:
        df = pd.read_sql(query, conn)
    except Exception as e:
        log.warning(f"Could not load HHI from DB: {e}. Defaulting to empty.")
        df = pd.DataFrame(columns=['constituency_id', 'hhi'])
    finally:
        conn.close()
    return df

def generate_unified_risk_scores() -> pd.DataFrame:
    start_time = time.time()
    
    # 1. Load Data
    log.info("Loading analytical features...")
    feat_path = os.path.join(PARQUET_DIR, "analytical_features.parquet")
    df = pd.read_parquet(feat_path)
    
    log.info("Loading duplicate alerts...")
    dup_path = os.path.join(PARQUET_DIR, "duplicate_alerts.parquet")
    df_dupes = pd.read_parquet(dup_path) if os.path.exists(dup_path) else pd.DataFrame()

    log.info("Fetching vendor HHI metrics...")
    df_hhi = _get_hhi_from_db()
    df = df.merge(df_hhi, on='constituency_id', how='left')

    log.info("Predicting stall probabilities...")
    df['stall_prob'] = predict_stall_probabilities(df)
    
    log.info("Calculating unified risk pillars...")
    
    # 1. Financial Risk (0-100, 20%)
    util = pd.to_numeric(df['utilization_rate'], errors='coerce').fillna(0)
    fin_score = np.clip((util - 1.0) * 200, 0, 100)
    fin_score = np.where(fin_score < 0, 0, fin_score)
    df['financial_risk_score'] = fin_score.astype(float)
    
    # 2. Progress Risk (0-100, 20%)
    prog_score = df['stall_prob'] * 100
    phantom_mask = (df['work_status'] == 'Completed') & (util < 0.1)
    prog_score = np.where(phantom_mask, 100.0, prog_score)
    df['progress_risk_score'] = np.clip(prog_score, 0, 100).astype(float)
    
    # 3. Cost Risk (0-100, 15%)
    z_cost = pd.to_numeric(df['cost_z_score'], errors='coerce').fillna(0)
    cost_score = np.clip(np.abs(z_cost) * 25.0, 0, 100)
    df['cost_risk_score'] = cost_score.astype(float)
    
    # 4. Delay Risk (0-100, 15%)
    delay_days = pd.to_numeric(df['completion_delay_days'], errors='coerce').fillna(0)
    delay_score = np.clip(delay_days / 365.0 * 100, 0, 100)
    df['delay_risk_score'] = delay_score.astype(float)
    
    # 5. Duplicate Risk (0-100, 10%)
    df['duplicate_risk_score'] = 0.0
    if not df_dupes.empty:
        dup_a = df_dupes[['work_id_A', 'risk_confidence_score']].rename(columns={'work_id_A': 'work_id'})
        dup_b = df_dupes[['work_id_B', 'risk_confidence_score']].rename(columns={'work_id_B': 'work_id'})
        dup_scores = pd.concat([dup_a, dup_b]).groupby('work_id')['risk_confidence_score'].max().reset_index()
        df = df.merge(dup_scores, on='work_id', how='left')
        df['duplicate_risk_score'] = df['risk_confidence_score'].fillna(0.0).astype(float)
    
    # 6. Evidence & Compliance Risk (0-100, 10%)
    prohibited = df['flag_prohibited_work'].fillna(False).astype(bool)
    df['evidence_risk_score'] = np.where(prohibited, 80.0, 0.0)
    
    # 7. Agency Risk (0-100, 5%)
    df['agency_risk_score'] = pd.to_numeric(df['agency_risk_score'], errors='coerce').fillna(0).astype(float)
    
    # 8. Payment Risk (0-100, 5%)
    pay_score = np.zeros(len(df))
    pay_score += np.where(df['hhi'].fillna(0) > 2500, 50.0, 0.0)
    pay_score += np.where(pd.to_numeric(df['num_payments'], errors='coerce').fillna(0) > 10, 50.0, 0.0)
    df['payment_risk_score'] = np.clip(pay_score, 0, 100).astype(float)
    
    # Final Formula
    df['final_risk_score'] = (
        0.20 * df['financial_risk_score'] +
        0.20 * df['progress_risk_score'] +
        0.15 * df['cost_risk_score'] +
        0.15 * df['delay_risk_score'] +
        0.10 * df['duplicate_risk_score'] +
        0.10 * df['evidence_risk_score'] +
        0.05 * df['agency_risk_score'] +
        0.05 * df['payment_risk_score']
    ).round(2)
    
    # Risk Tiers
    conditions = [
        (df['final_risk_score'] >= 75),
        (df['final_risk_score'] >= 50) & (df['final_risk_score'] < 75),
        (df['final_risk_score'] >= 25) & (df['final_risk_score'] < 50),
        (df['final_risk_score'] < 25)
    ]
    choices = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW']
    df['risk_tier'] = np.select(conditions, choices, default='LOW')
    
    log.info("Generating explainable narratives & recommendations...")
    
    summaries = []
    actions = []
    top_drivers = []
    
    pillars = [
        ('financial_risk_score', 'financial over-disbursements'),
        ('progress_risk_score', 'project stall probability'),
        ('cost_risk_score', 'severe cost escalation'),
        ('delay_risk_score', 'chronic completion delays'),
        ('duplicate_risk_score', 'duplicate/split-work alerts'),
        ('evidence_risk_score', 'prohibited asset guidelines violation'),
        ('agency_risk_score', 'poor executing agency track record'),
        ('payment_risk_score', 'high cartel or micro-payment fragmentation')
    ]
    
    df_narr = df[['final_risk_score', 'risk_tier', 'financial_risk_score', 'progress_risk_score', 'cost_risk_score', 'delay_risk_score', 'duplicate_risk_score', 'evidence_risk_score', 'agency_risk_score', 'payment_risk_score', 'stall_prob']].copy()
    
    for row in df_narr.itertuples():
        scores = {
            'financial_risk_score': row.financial_risk_score,
            'progress_risk_score': row.progress_risk_score,
            'cost_risk_score': row.cost_risk_score,
            'delay_risk_score': row.delay_risk_score,
            'duplicate_risk_score': row.duplicate_risk_score,
            'evidence_risk_score': row.evidence_risk_score,
            'agency_risk_score': row.agency_risk_score,
            'payment_risk_score': row.payment_risk_score
        }
        
        sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        t_drivers = [{"pillar": k, "score": v} for k, v in sorted_scores[:3] if v > 0]
        
        driver_texts = []
        for d in t_drivers:
            d_name = next(name for key, name in pillars if key == d["pillar"])
            driver_texts.append(d_name)
            
        if len(driver_texts) == 0:
            summary = "Nominal project execution with no significant risk flags detected."
        else:
            summary = f"Flagged {row.risk_tier} Risk ({row.final_risk_score}/100) primarily driven by {', '.join(driver_texts)}."
            
        rec_actions = []
        if row.progress_risk_score >= 50:
            rec_actions.append("Initiate immediate physical ground audit by District Nodal Officer.")
        if row.evidence_risk_score >= 50:
            rec_actions.append("Review compliance with MPLADS Para 5.1 durable community asset guidelines.")
        if row.duplicate_risk_score >= 50:
            rec_actions.append("Cross-verify tender specification against Work ID matched to confirm distinct asset creation.")
        if row.payment_risk_score >= 50:
            rec_actions.append("Audit vendor bidding records and voucher disbursements for potential structuring/cartel behavior.")
            
        summaries.append(summary)
        actions.append(json.dumps(rec_actions))
        top_drivers.append(json.dumps(t_drivers))
        
    df['project_summary'] = summaries
    df['recommended_actions'] = actions
    df['top_risk_drivers'] = top_drivers
    
    elapsed = time.time() - start_time
    log.info(f"Scored {len(df)} projects in {elapsed:.2f} seconds.")
    
    return df

def save_to_postgres(df: pd.DataFrame):
    log.info("Creating table and persisting to PostgreSQL...")
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_risk_evaluations (
            work_id BIGINT PRIMARY KEY,
            final_risk_score FLOAT,
            risk_tier TEXT,
            financial_risk_score FLOAT,
            progress_risk_score FLOAT,
            cost_risk_score FLOAT,
            delay_risk_score FLOAT,
            duplicate_risk_score FLOAT,
            evidence_risk_score FLOAT,
            agency_risk_score FLOAT,
            payment_risk_score FLOAT,
            top_risk_drivers JSONB,
            project_summary TEXT,
            recommended_actions JSONB,
            evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cols = [
        'work_id', 'final_risk_score', 'risk_tier', 'financial_risk_score',
        'progress_risk_score', 'cost_risk_score', 'delay_risk_score',
        'duplicate_risk_score', 'evidence_risk_score', 'agency_risk_score',
        'payment_risk_score', 'top_risk_drivers', 'project_summary', 'recommended_actions'
    ]
    
    df_insert = df[cols].copy()
    df_insert = df_insert.dropna(subset=['work_id'])
    df_insert['work_id'] = df_insert['work_id'].astype(int)
    
    now = datetime.now()
    values = [
        (
            row.work_id, row.final_risk_score, row.risk_tier,
            row.financial_risk_score, row.progress_risk_score, row.cost_risk_score,
            row.delay_risk_score, row.duplicate_risk_score, row.evidence_risk_score,
            row.agency_risk_score, row.payment_risk_score,
            row.top_risk_drivers, row.project_summary, row.recommended_actions, now
        )
        for row in df_insert.itertuples(index=False)
    ]
    
    query = """
        INSERT INTO project_risk_evaluations (
            work_id, final_risk_score, risk_tier, financial_risk_score,
            progress_risk_score, cost_risk_score, delay_risk_score, duplicate_risk_score,
            evidence_risk_score, agency_risk_score, payment_risk_score,
            top_risk_drivers, project_summary, recommended_actions, evaluated_at
        ) VALUES %s
        ON CONFLICT (work_id) DO UPDATE SET
            final_risk_score = EXCLUDED.final_risk_score,
            risk_tier = EXCLUDED.risk_tier,
            financial_risk_score = EXCLUDED.financial_risk_score,
            progress_risk_score = EXCLUDED.progress_risk_score,
            cost_risk_score = EXCLUDED.cost_risk_score,
            delay_risk_score = EXCLUDED.delay_risk_score,
            duplicate_risk_score = EXCLUDED.duplicate_risk_score,
            evidence_risk_score = EXCLUDED.evidence_risk_score,
            agency_risk_score = EXCLUDED.agency_risk_score,
            payment_risk_score = EXCLUDED.payment_risk_score,
            top_risk_drivers = EXCLUDED.top_risk_drivers,
            project_summary = EXCLUDED.project_summary,
            recommended_actions = EXCLUDED.recommended_actions,
            evaluated_at = EXCLUDED.evaluated_at;
    """
    
    execute_values(cur, query, values, page_size=1000)
    conn.commit()
    cur.close()
    conn.close()
    log.info(f"Successfully persisted {len(values)} records to project_risk_evaluations.")

def print_summary(df: pd.DataFrame):
    print("\n" + "="*80)
    print(" UNIFIED PROJECT RISK & SUMMARY ENGINE RESULTS ")
    print("="*80)
    print(f"Total Works Evaluated: {len(df):,}")
    
    print("\nRisk Tier Breakdown:")
    breakdown = df['risk_tier'].value_counts()
    for tier, count in breakdown.items():
        print(f" - {tier:10}: {count:,}")
        
    print("\nTop 5 Highest-Risk Works Nationally:")
    top5 = df.nlargest(5, 'final_risk_score')
    for i, row in enumerate(top5.itertuples(), 1):
        print(f"\n{i}. Work ID: {row.work_id} | Score: {row.final_risk_score:.2f} ({row.risk_tier})")
        print(f"   Summary: {row.project_summary}")
        
    print("="*80 + "\n")

if __name__ == "__main__":
    df_eval = generate_unified_risk_scores()
    save_to_postgres(df_eval)
    print_summary(df_eval)

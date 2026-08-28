"""
finguard.py — FinGuard Financial Intelligence Engine for Nirikshak AI.

Implements 6 financial audit capabilities:
  1. Cost Overrun & Over-Disbursement Detection
  2. Cost Benchmarking (IQR/Z-Score + Isolation Forest)
  3. Expenditure-vs-Progress Mismatch (Ghost/Stalled Project Index)
  4. Budget & Fund Utilization Analysis (MP/Constituency level)
  5. Payment Pattern & "March Rush" Anomaly Detection
  6. Composite Financial Integrity Score (0–100)

Exports results to PostgreSQL and JSON payloads.
"""

import os
import sys
import json
import logging
import warnings
from datetime import datetime
from typing import Dict, Any, List

import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore", category=UserWarning)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("finguard")

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
PARQUET_DIR = os.path.join(DATA_DIR, "parquet")
LIVE_EXPORTS_DIR = os.path.join(DATA_DIR, "live_exports")
os.makedirs(LIVE_EXPORTS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Database Connection
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Data Loading & Hydration
# ---------------------------------------------------------------------------
def load_features() -> pd.DataFrame:
    """Load analytical_features.parquet and coerce numeric columns."""
    path = os.path.join(PARQUET_DIR, "analytical_features.parquet")
    df = pd.read_parquet(path)
    numeric_cols = [
        'sanction_amount', 'actual_amount', 'total_disbursed',
        'cost_overrun_pct', 'cost_z_score', 'completion_delay_days',
        'utilization_rate', 'disbursement_ratio', 'num_payments',
        'avg_payment', 'max_payment', 'project_lifetime_days',
        'recommended_amount', 'num_vendors',
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df


def hydrate_metadata(df: pd.DataFrame) -> pd.DataFrame:
    """Join with PostgreSQL to get state_name, const_name, mp_name, vendor info."""
    log.info("Hydrating metadata from PostgreSQL...")
    query = """
        SELECT
            w.work_id,
            s.state_name,
            c.constituency_name AS const_name,
            m.mp_name,
            (
                SELECT string_agg(DISTINCT v.vendor_name, ', ')
                FROM expenditures e
                JOIN vendors v ON e.vendor_id = v.vendor_id
                WHERE e.work_id = w.work_id
            ) AS vendor_names
        FROM works w
        LEFT JOIN states s ON w.state_id = s.state_id
        LEFT JOIN constituencies c ON w.constituency_id = c.constituency_id
        LEFT JOIN mps m ON w.mp_id = m.mp_id AND w.house_type = m.house_type AND w.tenure = m.tenure
    """
    conn = get_db_connection()
    df_meta = pd.read_sql(query, conn)
    conn.close()
    return df.merge(df_meta, on="work_id", how="left")


# ---------------------------------------------------------------------------
# SIGNAL 1: Cost Overrun & Over-Disbursement Detection
# ---------------------------------------------------------------------------
def detect_cost_overruns(df: pd.DataFrame) -> pd.DataFrame:
    """Flag works with cost_overrun_pct > 15% or disbursement > 120% of sanction."""
    log.info("SIGNAL 1: Cost Overrun & Over-Disbursement Detection...")

    df['flag_cost_overrun'] = df['cost_overrun_pct'].fillna(0) > 15.0

    # Over-disbursement: total_disbursed > 1.20 * sanction_amount
    sanction = df['sanction_amount'].fillna(0)
    disbursed = df['total_disbursed'].fillna(0)
    df['flag_over_disbursement'] = (sanction > 0) & (disbursed > 1.20 * sanction)

    n_overrun = df['flag_cost_overrun'].sum()
    n_over_disb = df['flag_over_disbursement'].sum()
    log.info(f"  -> Cost overrun (>15%%): {n_overrun:,}")
    log.info(f"  -> Over-disbursement (>120%%): {n_over_disb:,}")
    return df


# ---------------------------------------------------------------------------
# SIGNAL 2: Cost Benchmarking (Z-Score + Isolation Forest)
# ---------------------------------------------------------------------------
def benchmark_costs(df: pd.DataFrame) -> pd.DataFrame:
    """Statistical outlier detection and unsupervised ML anomaly scoring."""
    log.info("SIGNAL 2: Cost Benchmarking (Z-Score + Isolation Forest)...")

    # 2a. Z-Score flagging (already computed in features, re-check threshold)
    df['flag_zscore_outlier'] = df['cost_z_score'].abs() > 2.5
    n_zscore = df['flag_zscore_outlier'].sum()
    log.info(f"  -> Extreme Z-score outliers (|z| > 2.5): {n_zscore:,}")

    # 2b. Isolation Forest on multidimensional features
    iso_features = ['sanction_amount', 'actual_amount', 'total_disbursed', 'completion_delay_days']
    df_iso = df[iso_features].copy()
    df_iso = df_iso.fillna(0)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df_iso)

    iso_forest = IsolationForest(contamination=0.03, random_state=42, n_jobs=-1)
    iso_forest.fit(X_scaled)

    # decision_function: negative = more anomalous
    raw_scores = iso_forest.decision_function(X_scaled)
    # Normalize to 0-100 where 100 = most anomalous
    min_s, max_s = raw_scores.min(), raw_scores.max()
    if max_s - min_s > 0:
        df['isolation_forest_score'] = ((max_s - raw_scores) / (max_s - min_s) * 100).round(2)
    else:
        df['isolation_forest_score'] = 0.0

    df['flag_isolation_forest'] = iso_forest.predict(X_scaled) == -1
    n_iso = df['flag_isolation_forest'].sum()
    log.info(f"  -> Isolation Forest anomalies (3%% contamination): {n_iso:,}")
    return df


# ---------------------------------------------------------------------------
# SIGNAL 3: Expenditure-vs-Progress Mismatch (Ghost/Stalled Project Index)
# ---------------------------------------------------------------------------
def detect_progress_mismatch(df: pd.DataFrame) -> pd.DataFrame:
    """Identify ghost disbursals, phantom completions, and stalled capital."""
    log.info("SIGNAL 3: Expenditure-vs-Progress Mismatch...")

    sanction = df['sanction_amount'].fillna(0)
    disbursed = df['total_disbursed'].fillna(0)
    disb_ratio = df['disbursement_ratio'].fillna(0)
    lifetime = df['project_lifetime_days'].fillna(0)
    status = df['work_status'].fillna('')

    # 3a. Ghost Disbursal Risk: Not completed, but >85% funds already disbursed
    df['flag_ghost_disbursal'] = (
        (status.isin(['Recommended', 'Sanctioned'])) &
        (sanction > 0) &
        (disbursed / sanction.replace(0, np.nan) > 0.85)
    ).fillna(False)

    # 3b. Phantom Completion Risk: Completed with sanction > 1,00,000 but disbursed < 10%
    df['flag_phantom_completion'] = (
        (status == 'Completed') &
        (sanction > 100000) &
        ((disbursed == 0) | (disbursed / sanction.replace(0, np.nan) < 0.10))
    ).fillna(False)

    # 3c. Stalled Capital Risk: Age > 365 days, 0 < disbursement ratio < 40%
    df['flag_stalled_capital'] = (
        (lifetime > 365) &
        (disb_ratio > 0) &
        (disb_ratio < 0.40)
    )

    # Composite Progress Mismatch Score (0-100)
    df['progress_mismatch_score'] = 0.0
    df.loc[df['flag_ghost_disbursal'], 'progress_mismatch_score'] += 40
    df.loc[df['flag_phantom_completion'], 'progress_mismatch_score'] += 35
    df.loc[df['flag_stalled_capital'], 'progress_mismatch_score'] += 25

    n_ghost = df['flag_ghost_disbursal'].sum()
    n_phantom = df['flag_phantom_completion'].sum()
    n_stalled = df['flag_stalled_capital'].sum()
    log.info(f"  -> Ghost disbursals: {n_ghost:,}")
    log.info(f"  -> Phantom completions: {n_phantom:,}")
    log.info(f"  -> Stalled capital: {n_stalled:,}")
    return df


# ---------------------------------------------------------------------------
# SIGNAL 4: Budget & Fund Utilization Analysis (MP + Constituency)
# ---------------------------------------------------------------------------
def compute_budget_utilization(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate financial health indices at MP and Constituency level."""
    log.info("SIGNAL 4: Budget & Fund Utilization Analysis...")

    # MP-level aggregation
    mp_agg = df.groupby(['mp_id', 'mp_name', 'const_name', 'state_name']).agg(
        total_sanctioned=('sanction_amount', 'sum'),
        total_actual_spent=('actual_amount', 'sum'),
        total_disbursed=('total_disbursed', 'sum'),
        total_works=('work_id', 'count'),
    ).reset_index()
    mp_agg['mp_utilization_rate'] = (
        mp_agg['total_actual_spent'] / mp_agg['total_sanctioned'].replace(0, np.nan)
    ).round(4)
    mp_agg['mp_unspent_ratio'] = (
        1 - mp_agg['mp_utilization_rate'].fillna(0)
    ).clip(lower=0).round(4)

    # Constituency-level aggregation
    const_agg = df.groupby(['constituency_id', 'const_name', 'state_name']).agg(
        total_sanctioned=('sanction_amount', 'sum'),
        total_actual_spent=('actual_amount', 'sum'),
        total_disbursed=('total_disbursed', 'sum'),
        total_works=('work_id', 'count'),
        overrun_count=('flag_cost_overrun', 'sum'),
        ghost_count=('flag_ghost_disbursal', 'sum'),
        phantom_count=('flag_phantom_completion', 'sum'),
        stalled_count=('flag_stalled_capital', 'sum'),
    ).reset_index()

    const_agg['utilization_rate'] = (
        const_agg['total_actual_spent'] / const_agg['total_sanctioned'].replace(0, np.nan)
    ).round(4)
    const_agg['over_expenditure_count'] = const_agg['overrun_count'] + const_agg['ghost_count']
    const_agg['total_high_risk_leaks'] = (
        const_agg['overrun_count'] + const_agg['ghost_count'] +
        const_agg['phantom_count'] + const_agg['stalled_count']
    )

    # Burn velocity: average monthly capital outflow
    # Approximate: total_disbursed / (max project lifetime in months)
    const_lifetime = df.groupby('constituency_id')['project_lifetime_days'].max().reset_index()
    const_lifetime['lifetime_months'] = (const_lifetime['project_lifetime_days'].fillna(365) / 30.44).clip(lower=1)
    const_agg = const_agg.merge(const_lifetime[['constituency_id', 'lifetime_months']], on='constituency_id', how='left')
    const_agg['burn_velocity_monthly'] = (
        const_agg['total_disbursed'] / const_agg['lifetime_months'].fillna(1)
    ).round(2)

    log.info(f"  -> MP-level profiles computed: {len(mp_agg):,}")
    log.info(f"  -> Constituency-level profiles computed: {len(const_agg):,}")
    return df, const_agg


# ---------------------------------------------------------------------------
# SIGNAL 5: Payment Pattern & "March Rush" Anomaly Detection
# ---------------------------------------------------------------------------
def detect_payment_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """Detect payment fragmentation/structuring and fiscal year-end clustering."""
    log.info("SIGNAL 5: Payment Pattern & March Rush Detection...")

    # 5a. Payment Fragmentation / Structuring
    # High number of micro-disbursements for low-value tenders
    num_payments = df['num_payments'].fillna(0)
    sanction = df['sanction_amount'].fillna(0)

    # Flag: >10 payments overall, or >15 for low-value (<5 lakh) tenders
    df['flag_payment_fragmentation'] = (
        (num_payments > 10) |
        ((sanction < 500000) & (num_payments > 15))
    )

    # 5b. March Rush: >70% of annual disbursements in last 15 days of March
    # We need to query expenditures table to compute per-work March ratios
    log.info("  -> Querying expenditure dates for March Rush analysis...")
    conn = get_db_connection()
    march_query = """
        WITH work_totals AS (
            SELECT work_id, SUM(fund_disbursed_amount) AS annual_total
            FROM expenditures
            WHERE expenditure_date IS NOT NULL
            GROUP BY work_id
        ),
        march_end AS (
            SELECT work_id, SUM(fund_disbursed_amount) AS march_total
            FROM expenditures
            WHERE expenditure_date IS NOT NULL
              AND EXTRACT(MONTH FROM expenditure_date) = 3
              AND EXTRACT(DAY FROM expenditure_date) >= 16
            GROUP BY work_id
        )
        SELECT
            wt.work_id,
            wt.annual_total,
            COALESCE(me.march_total, 0) AS march_total,
            CASE WHEN wt.annual_total > 0
                 THEN COALESCE(me.march_total, 0) / wt.annual_total
                 ELSE 0 END AS march_ratio
        FROM work_totals wt
        LEFT JOIN march_end me ON wt.work_id = me.work_id
        WHERE wt.annual_total > 0
    """
    df_march = pd.read_sql(march_query, conn)
    conn.close()

    # Merge march_ratio back into main df
    df = df.merge(df_march[['work_id', 'march_ratio']], on='work_id', how='left')
    df['march_ratio'] = df['march_ratio'].fillna(0)
    df['flag_march_rush'] = df['march_ratio'] > 0.70

    n_frag = df['flag_payment_fragmentation'].sum()
    n_march = df['flag_march_rush'].sum()
    log.info(f"  -> Payment fragmentation flagged: {n_frag:,}")
    log.info(f"  -> March Rush flagged (>70%%): {n_march:,}")
    return df


# ---------------------------------------------------------------------------
# SIGNAL 6: Composite Financial Integrity Score (0–100)
# ---------------------------------------------------------------------------
def compute_predictive_stall_probability(df: pd.DataFrame) -> pd.DataFrame:
    """Compute predictive stall probability using the trained RandomForest model."""
    log.info("SIGNAL EXTRA: Computing Predictive Stall Probabilities...")
    from ai_models.stall_predictor import predict_stall_probabilities
    
    # Predict probabilities (0.0 to 1.0)
    df['stall_probability'] = predict_stall_probabilities(df)
    
    # Scale to 0-100%
    df['stall_probability_score'] = (df['stall_probability'] * 100).round(2)
    
    # Set a flag if stall probability > 60%
    df['flag_high_stall_risk'] = df['stall_probability'] > 0.60
    
    n_high_risk = df['flag_high_stall_risk'].sum()
    log.info(f"  -> Flagged high stall risk (>60%): {n_high_risk:,}")
    return df


def compute_financial_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    """Ensemble all flags into a unified Financial Risk Score (0-100)."""
    log.info("SIGNAL 6: Computing Composite Financial Risk Score...")

    # Weighted ensemble of individual signals
    # Weights: Cost Overrun (10), Over-Disbursement (10), Z-Score (5),
    #          Isolation Forest (15, continuous), Progress Mismatch (15, continuous),
    #          Payment Fragmentation (10), March Rush (5),
    #          Prohibited Work Compliance (15), Predictive Stall Risk (15)

    score = pd.Series(0.0, index=df.index)

    score += df['flag_cost_overrun'].astype(float) * 10
    score += df['flag_over_disbursement'].astype(float) * 10
    score += df['flag_zscore_outlier'].astype(float) * 5
    # Isolation forest: continuous 0-100, weight at 15%
    score += (df['isolation_forest_score'].fillna(0) / 100) * 15
    # Progress mismatch: continuous 0-100, weight at 15%
    score += (df['progress_mismatch_score'].fillna(0) / 100) * 15
    score += df['flag_payment_fragmentation'].astype(float) * 10
    score += df['flag_march_rush'].astype(float) * 5
    score += df.get('flag_prohibited_work', pd.Series(False, index=df.index)).astype(float) * 15
    score += (df.get('stall_probability_score', pd.Series(0.0, index=df.index)).fillna(0) / 100) * 15

    df['financial_risk_score'] = score.clip(0, 100).round(2)

    # Build anomaly_reasons list and recommended actions
    reasons = []
    actions = []
    for _, row in df.iterrows():
        r = []
        a = []
        if row.get('flag_cost_overrun'):
            r.append(f"Cost overrun {row.get('cost_overrun_pct', 0):.1f}%")
            a.append("Audit project bills against standard state categories")
        if row.get('flag_over_disbursement'):
            r.append("Over-disbursement >120%")
            a.append("Verify disbursement vouchers and physical works validation")
        if row.get('flag_zscore_outlier'):
            r.append(f"Extreme Z-score ({row.get('cost_z_score', 0):.2f})")
            a.append("Validate sanity of extreme cost deviation with District Authority")
        if row.get('flag_isolation_forest'):
            r.append("Isolation Forest anomaly")
            a.append("Review multi-dimensional financial logs for administrative anomalies")
        if row.get('flag_ghost_disbursal'):
            r.append("Ghost disbursal risk")
            a.append("Immediate on-site physical inspection to verify work progress")
        if row.get('flag_phantom_completion'):
            r.append("Phantom completion risk")
            a.append("Cross-reference completion certificate with actual bank records")
        if row.get('flag_stalled_capital'):
            r.append("Stalled capital")
            a.append("Scrutinize project execution timeline and delay justifications")
        if row.get('flag_payment_fragmentation'):
            r.append("Payment fragmentation/structuring")
            a.append("Check for split tenders to bypass higher sanctioning thresholds")
        if row.get('flag_march_rush'):
            r.append(f"March Rush ({row.get('march_ratio', 0)*100:.1f}%)")
            a.append("Audit year-end transaction receipts and invoice dates")
        if row.get('flag_prohibited_work'):
            r.append("Potentially Prohibited Work under MPLADS guidelines")
            a.append("Confirm work compliance against prohibited items listed in official MPLADS guidelines")
        if row.get('flag_high_stall_risk'):
            r.append(f"High predictive stall risk ({row.get('stall_probability_score', 0):.1f}%)")
            a.append("Initiate early-warning audit; review contractor solvency and execution milestones")
        reasons.append(r)
        actions.append(a)

    df['anomaly_reasons'] = reasons
    df['recommended_actions'] = actions

    n_risky = (df['financial_risk_score'] > 30).sum()
    avg_score = df['financial_risk_score'].mean()
    max_score = df['financial_risk_score'].max()
    log.info(f"  -> Average financial risk score: {avg_score:.2f}")
    log.info(f"  -> Max financial risk score: {max_score:.2f}")
    log.info(f"  -> Works with risk > 30: {n_risky:,}")
    return df


# ---------------------------------------------------------------------------
# PostgreSQL Export
# ---------------------------------------------------------------------------
def export_to_postgres(df: pd.DataFrame):
    """Create and populate finguard_financial_anomalies table."""
    log.info("Exporting to PostgreSQL table: finguard_financial_anomalies...")
    conn = get_db_connection()
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS finguard_financial_anomalies;")
    cur.execute("""
        CREATE TABLE finguard_financial_anomalies (
            work_id                    INTEGER PRIMARY KEY,
            financial_risk_score       REAL,
            isolation_forest_score     REAL,
            progress_mismatch_score    REAL,
            stall_probability          REAL,
            flag_cost_overrun          BOOLEAN,
            flag_over_disbursement     BOOLEAN,
            flag_zscore_outlier        BOOLEAN,
            flag_isolation_forest      BOOLEAN,
            flag_ghost_disbursal       BOOLEAN,
            flag_phantom_completion    BOOLEAN,
            flag_stalled_capital       BOOLEAN,
            flag_payment_fragmentation BOOLEAN,
            flag_march_rush            BOOLEAN,
            flag_prohibited_work       BOOLEAN,
            flag_high_stall_risk       BOOLEAN,
            march_ratio                REAL,
            anomaly_reasons            TEXT,
            recommended_actions        TEXT
        );
    """)

    # Only insert works that have at least some risk
    df_export = df[df['financial_risk_score'] > 0].copy()
    df_export['anomaly_reasons_str'] = df_export['anomaly_reasons'].apply(
        lambda x: json.dumps(x) if isinstance(x, list) else '[]'
    )
    df_export['recommended_actions_str'] = df_export['recommended_actions'].apply(
        lambda x: json.dumps(x) if isinstance(x, list) else '[]'
    )

    values = [
        (
            int(row['work_id']),
            float(row['financial_risk_score']),
            float(row.get('isolation_forest_score', 0)),
            float(row.get('progress_mismatch_score', 0)),
            float(row.get('stall_probability', 0)),
            bool(row.get('flag_cost_overrun', False)),
            bool(row.get('flag_over_disbursement', False)),
            bool(row.get('flag_zscore_outlier', False)),
            bool(row.get('flag_isolation_forest', False)),
            bool(row.get('flag_ghost_disbursal', False)),
            bool(row.get('flag_phantom_completion', False)),
            bool(row.get('flag_stalled_capital', False)),
            bool(row.get('flag_payment_fragmentation', False)),
            bool(row.get('flag_march_rush', False)),
            bool(row.get('flag_prohibited_work', False)),
            bool(row.get('flag_high_stall_risk', False)),
            float(row.get('march_ratio', 0)),
            row['anomaly_reasons_str'],
            row['recommended_actions_str'],
        )
        for _, row in df_export.iterrows()
    ]

    psycopg2.extras.execute_values(cur, """
        INSERT INTO finguard_financial_anomalies (
            work_id, financial_risk_score, isolation_forest_score,
            progress_mismatch_score, stall_probability,
            flag_cost_overrun, flag_over_disbursement,
            flag_zscore_outlier, flag_isolation_forest,
            flag_ghost_disbursal, flag_phantom_completion,
            flag_stalled_capital, flag_payment_fragmentation,
            flag_march_rush, flag_prohibited_work, flag_high_stall_risk,
            march_ratio, anomaly_reasons, recommended_actions
        ) VALUES %s
    """, values, page_size=1000)

    cur.close()
    conn.close()
    log.info(f"  -> Inserted {len(values):,} rows into finguard_financial_anomalies")


# ---------------------------------------------------------------------------
# JSON Exports
# ---------------------------------------------------------------------------
def _clean_record(r: dict) -> dict:
    """Sanitize a dict for JSON serialization."""
    clean = {}
    for k, v in r.items():
        if isinstance(v, (pd.Timestamp, datetime)):
            clean[k] = v.isoformat()
        elif isinstance(v, (np.integer,)):
            clean[k] = int(v)
        elif isinstance(v, (np.floating,)):
            clean[k] = float(v) if not np.isnan(v) else None
        elif isinstance(v, (np.bool_,)):
            clean[k] = bool(v)
        elif isinstance(v, float) and np.isnan(v):
            clean[k] = None
        else:
            clean[k] = v
    return clean


def export_json_anomalies(df: pd.DataFrame):
    """Export top high-risk works as finguard_anomalies.json."""
    log.info("Exporting finguard_anomalies.json...")

    export_cols = [
        'work_id', 'activity_name', 'work_description', 'work_category',
        'state_name', 'const_name', 'mp_name', 'house_type', 'tenure',
        'sanction_amount', 'actual_amount', 'total_disbursed',
        'cost_overrun_pct', 'cost_z_score',
        'financial_risk_score', 'isolation_forest_score',
        'progress_mismatch_score', 'stall_probability', 'anomaly_reasons', 'recommended_actions',
        'vendor_names', 'num_payments',
        'flag_cost_overrun', 'flag_over_disbursement',
        'flag_zscore_outlier', 'flag_isolation_forest',
        'flag_ghost_disbursal', 'flag_phantom_completion',
        'flag_stalled_capital', 'flag_payment_fragmentation',
        'flag_march_rush', 'flag_prohibited_work', 'flag_high_stall_risk',
    ]
    existing = [c for c in export_cols if c in df.columns]

    # Take top 2000 by financial_risk_score
    top = df.nlargest(2000, 'financial_risk_score')[existing]
    records = [_clean_record(r) for r in top.to_dict(orient='records')]

    out_path = os.path.join(LIVE_EXPORTS_DIR, "finguard_anomalies.json")
    with open(out_path, "w") as f:
        json.dump(records, f, indent=2)
    log.info(f"  -> Saved {out_path} ({len(records)} records)")


def export_json_constituency_summary(df: pd.DataFrame, const_agg: pd.DataFrame):
    """Export constituency-level financial summary."""
    log.info("Exporting finguard_constituency_summary.json...")

    records = [_clean_record(r) for r in const_agg.to_dict(orient='records')]

    out_path = os.path.join(LIVE_EXPORTS_DIR, "finguard_constituency_summary.json")
    with open(out_path, "w") as f:
        json.dump(records, f, indent=2)
    log.info(f"  -> Saved {out_path} ({len(records)} records)")


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------
def run_finguard_pipeline():
    """Execute the full FinGuard pipeline end-to-end."""
    print("=" * 72)
    print("FINGUARD — Financial Intelligence Engine v1.0")
    print("=" * 72)

    log.info("STEP 1/8: Loading analytical features...")
    df = load_features()
    log.info(f"  -> Loaded {len(df):,} works with {len(df.columns)} features")

    log.info("STEP 2/8: Hydrating metadata...")
    df = hydrate_metadata(df)

    log.info("STEP 3/8: Running Signal 1 — Cost Overrun Detection...")
    df = detect_cost_overruns(df)

    log.info("STEP 4/8: Running Signal 2 — Cost Benchmarking (Z-Score + Isolation Forest)...")
    df = benchmark_costs(df)

    log.info("STEP 5/8: Running Signal 3 — Progress Mismatch Detection...")
    df = detect_progress_mismatch(df)

    log.info("STEP 6/8: Running Signal 4 — Budget Utilization Analysis...")
    df, const_agg = compute_budget_utilization(df)

    log.info("STEP 7/8: Running Signal 5 — Payment Pattern & March Rush...")
    df = detect_payment_anomalies(df)

    log.info("STEP 7.5: Running ML Predictive Stall Classifier...")
    df = compute_predictive_stall_probability(df)

    log.info("STEP 8/8: Computing Composite Financial Risk Score...")
    df = compute_financial_risk_score(df)

    # Export
    log.info("Exporting to PostgreSQL...")
    export_to_postgres(df)

    log.info("Exporting JSON payloads...")
    export_json_anomalies(df)
    export_json_constituency_summary(df, const_agg)

    # Console Summary
    print()
    print("=" * 72)
    print("FINGUARD PIPELINE COMPLETE")
    print("=" * 72)
    print(f"  Total works evaluated:                {len(df):>10,}")
    print(f"  Cost overrun anomalies (>15%):        {df['flag_cost_overrun'].sum():>10,}")
    print(f"  Over-disbursement (>120%):             {df['flag_over_disbursement'].sum():>10,}")
    print(f"  Extreme Z-score outliers (|z|>2.5):   {df['flag_zscore_outlier'].sum():>10,}")
    print(f"  Isolation Forest anomalies:           {df['flag_isolation_forest'].sum():>10,}")
    print(f"  Ghost disbursal risks:                {df['flag_ghost_disbursal'].sum():>10,}")
    print(f"  Phantom completion risks:             {df['flag_phantom_completion'].sum():>10,}")
    print(f"  Stalled capital risks:                {df['flag_stalled_capital'].sum():>10,}")
    print(f"  Payment fragmentation flagged:        {df['flag_payment_fragmentation'].sum():>10,}")
    print(f"  March Rush flagged (>70%):             {df['flag_march_rush'].sum():>10,}")
    print(f"  Avg financial risk score:             {df['financial_risk_score'].mean():>10.2f}")
    print(f"  Max financial risk score:             {df['financial_risk_score'].max():>10.2f}")
    print("=" * 72)

    # File sizes
    for fname in ['finguard_anomalies.json', 'finguard_constituency_summary.json']:
        fpath = os.path.join(LIVE_EXPORTS_DIR, fname)
        if os.path.exists(fpath):
            size_kb = os.path.getsize(fpath) / 1024
            print(f"  {fname}: {size_kb:.1f} KB")

    print("=" * 72)


if __name__ == "__main__":
    run_finguard_pipeline()

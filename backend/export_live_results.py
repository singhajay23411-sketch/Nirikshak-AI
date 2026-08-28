import os
import json
import argparse
import logging
import hashlib
import subprocess
from datetime import datetime
from typing import Dict, Any

import pandas as pd
import psycopg2
import warnings

# Suppress pandas warning about executing SQL strings with DBAPI connection
warnings.filterwarnings("ignore", category=UserWarning)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("export_live_results")

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
PARQUET_DIR = os.path.join(DATA_DIR, "parquet")
LIVE_EXPORTS_DIR = os.path.join(DATA_DIR, "live_exports")

os.makedirs(LIVE_EXPORTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Plugin Registry
# ---------------------------------------------------------------------------
EXPORT_PIPELINES = {}

def register_export_pipeline(name: str):
    """Decorator to register an export handler function."""
    def decorator(func):
        EXPORT_PIPELINES[name] = func
        return func
    return decorator

# ---------------------------------------------------------------------------
# Database & Hydration
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

def load_hydrated_master() -> pd.DataFrame:
    """
    Loads analytical_features.parquet and joins it with Postgres 
    to hydrate state_name, const_name, mp_name, and primary vendor.
    """
    features_path = os.path.join(PARQUET_DIR, "analytical_features.parquet")
    if not os.path.exists(features_path):
        raise FileNotFoundError(f"{features_path} not found.")
    
    log.info("Loading analytical features...")
    df_features = pd.read_parquet(features_path)
    
    log.info("Querying PostgreSQL for hydration metadata...")
    query = """
        SELECT
            w.work_id,
            s.state_name,
            c.constituency_name AS const_name,
            m.mp_name,
            (
                SELECT v.vendor_name 
                FROM expenditures e 
                JOIN vendors v ON e.vendor_id = v.vendor_id 
                WHERE e.work_id = w.work_id 
                GROUP BY v.vendor_name 
                ORDER BY SUM(e.fund_disbursed_amount) DESC NULLS LAST 
                LIMIT 1
            ) AS primary_vendor_name
        FROM works w
        LEFT JOIN states s ON w.state_id = s.state_id
        LEFT JOIN constituencies c ON w.constituency_id = c.constituency_id
        LEFT JOIN mps m ON w.mp_id = m.mp_id AND w.house_type = m.house_type AND w.tenure = m.tenure
    """
    conn = get_db_connection()
    df_meta = pd.read_sql(query, conn)
    conn.close()
    
    log.info("Merging features with metadata...")
    df_hydrated = df_features.merge(df_meta, on="work_id", how="left")
    return df_hydrated

# ---------------------------------------------------------------------------
# Export Pipelines
# ---------------------------------------------------------------------------

@register_export_pipeline("mp_scorecard_summary")
def export_mp_scorecards(df: pd.DataFrame) -> Dict[str, Any]:
    """MP ranking, fund utilization, avg completion delay, anomaly counts."""
    # Ensure numeric types
    df['utilization_rate'] = pd.to_numeric(df['utilization_rate'], errors='coerce')
    df['completion_delay_days'] = pd.to_numeric(df['completion_delay_days'], errors='coerce')
    df['cost_z_score'] = pd.to_numeric(df['cost_z_score'], errors='coerce')
    
    # Identify anomalies
    df['is_anomaly'] = (
        (df['cost_z_score'].abs() > 2.0) | 
        (df['completion_delay_days'] > 365) | 
        (df['utilization_rate'] > 1.2)
    )
    
    agg_funcs = {
        'state_name': 'first',
        'const_name': 'first',
        'utilization_rate': 'mean',
        'completion_delay_days': 'mean',
        'is_anomaly': 'sum',
        'work_id': 'count'
    }
    
    grouped = df.groupby(['mp_id', 'mp_name']).agg(agg_funcs).reset_index()
    grouped.rename(columns={'work_id': 'total_works'}, inplace=True)
    
    # Simple composite integrity score (100 - penalties)
    # penalty = (anomaly_count / total_works) * 100
    grouped['composite_integrity_score'] = 100 - ((grouped['is_anomaly'] / grouped['total_works'].clip(lower=1)) * 100)
    grouped['composite_integrity_score'] = grouped['composite_integrity_score'].clip(lower=0, upper=100).round(2)
    
    # Sort by integrity score desc
    grouped = grouped.sort_values('composite_integrity_score', ascending=False)
    
    out_path = os.path.join(LIVE_EXPORTS_DIR, "mp_scorecard_summary.json")
    records = grouped.to_dict(orient="records")
    
    # Handle NaN values explicitly before JSON export
    records_clean = []
    for r in records:
        clean_r = {}
        for k, v in r.items():
            if pd.isna(v):
                clean_r[k] = None
            elif isinstance(v, (pd.Timestamp, datetime)):
                clean_r[k] = v.isoformat()
            else:
                clean_r[k] = v
        records_clean.append(clean_r)
        
    with open(out_path, "w") as f:
        json.dump(records_clean, f, indent=2)
    
    return {"records_exported": len(records_clean), "file": "mp_scorecard_summary.json"}

@register_export_pipeline("constituency_risk_heatmap")
def export_constituency_heatmap(df: pd.DataFrame) -> Dict[str, Any]:
    """Geo-level aggregation, total sanctioned vs spent, contractor concentration."""
    df['sanction_amount'] = pd.to_numeric(df['sanction_amount'], errors='coerce').fillna(0)
    df['total_disbursed'] = pd.to_numeric(df['total_disbursed'], errors='coerce').fillna(0)
    df['num_vendors'] = pd.to_numeric(df['num_vendors'], errors='coerce').fillna(0)
    
    # High risk projects: >2 cost z-score or >365 delay
    df['is_high_risk'] = (df['cost_z_score'].abs() > 2) | (df['completion_delay_days'] > 365)
    
    grouped = df.groupby(['constituency_id', 'const_name', 'state_name']).agg(
        total_sanctioned=('sanction_amount', 'sum'),
        total_spent=('total_disbursed', 'sum'),
        total_vendors=('num_vendors', 'sum'),
        high_risk_projects=('is_high_risk', 'sum'),
        total_projects=('work_id', 'count')
    ).reset_index()
    
    # HHI Proxy: fewer vendors for more projects = higher concentration
    # Simplified proxy: (total_projects / total_vendors) - 1, scaled
    grouped['contractor_concentration_proxy'] = (grouped['total_projects'] / grouped['total_vendors'].replace(0, 1)).round(2)
    
    out_path = os.path.join(LIVE_EXPORTS_DIR, "constituency_risk_heatmap.json")
    records = grouped.to_dict(orient="records")
    
    records_clean = []
    for r in records:
        clean_r = {}
        for k, v in r.items():
            if pd.isna(v):
                clean_r[k] = None
            elif isinstance(v, (pd.Timestamp, datetime)):
                clean_r[k] = v.isoformat()
            else:
                clean_r[k] = v
        records_clean.append(clean_r)
        
    with open(out_path, "w") as f:
        json.dump(records_clean, f, indent=2)
        
    return {"records_exported": len(records_clean), "file": "constituency_risk_heatmap.json"}

@register_export_pipeline("duplicate_project_alerts")
def export_duplicate_alerts(df: pd.DataFrame) -> Dict[str, Any]:
    """Detailed A/B records for duplicate projects."""
    dupes_path = os.path.join(PARQUET_DIR, "duplicate_alerts.parquet")
    if not os.path.exists(dupes_path):
        log.warning(f"No duplicate alerts parquet found at {dupes_path}")
        return {"records_exported": 0, "file": "duplicate_project_alerts.json"}
        
    df_dupes = pd.read_parquet(dupes_path)
    # Take top 1000 for live export to keep it lightweight
    df_dupes = df_dupes.head(1000)
    
    # Hydrate Work A
    df_a = df.add_prefix("A_")
    df_dupes = df_dupes.merge(df_a, left_on="work_id_A", right_on="A_work_id", how="left")
    
    # Hydrate Work B
    df_b = df.add_prefix("B_")
    df_dupes = df_dupes.merge(df_b, left_on="work_id_B", right_on="B_work_id", how="left")
    
    out_path = os.path.join(LIVE_EXPORTS_DIR, "duplicate_project_alerts.json")
    records = df_dupes.to_dict(orient="records")
    
    records_clean = []
    for r in records:
        clean_r = {}
        for k, v in r.items():
            if pd.isna(v):
                clean_r[k] = None
            elif isinstance(v, (pd.Timestamp, datetime)):
                clean_r[k] = v.isoformat()
            else:
                clean_r[k] = v
        records_clean.append(clean_r)
        
    with open(out_path, "w") as f:
        json.dump(records_clean, f, indent=2)
        
    return {"records_exported": len(records_clean), "file": "duplicate_project_alerts.json"}

@register_export_pipeline("cost_and_delay_anomalies")
def export_cost_delay_anomalies(df: pd.DataFrame) -> Dict[str, Any]:
    """Ranked list of extreme cost overruns, chronic delays, and over-disbursements."""
    # Ensure types
    df['cost_z_score'] = pd.to_numeric(df['cost_z_score'], errors='coerce')
    df['completion_delay_days'] = pd.to_numeric(df['completion_delay_days'], errors='coerce')
    df['utilization_rate'] = pd.to_numeric(df['utilization_rate'], errors='coerce')
    
    anomalies = df[
        (df['cost_z_score'].abs() > 2.0) | 
        (df['completion_delay_days'] > 365) | 
        (df['utilization_rate'] > 1.2)
    ].copy()
    
    # Calculate a simple combined severity score for sorting
    anomalies['severity_score'] = (
        anomalies['cost_z_score'].abs().fillna(0) + 
        (anomalies['completion_delay_days'].clip(lower=0).fillna(0) / 365) + 
        (anomalies['utilization_rate'].clip(lower=0).fillna(0) * 2)
    )
    
    # Take top 1000 anomalies
    anomalies = anomalies.sort_values('severity_score', ascending=False).head(1000)
    
    # Filter to most relevant columns to keep json size down
    export_cols = [
        'work_id', 'work_short_title', 'work_description', 'work_category',
        'state_name', 'const_name', 'mp_name', 'house_type', 'tenure',
        'sanction_amount', 'actual_amount', 'total_disbursed', 'cost_overrun_pct', 'cost_z_score',
        'sanction_date', 'actual_end_date', 'completion_delay_days',
        'ida_name', 'primary_vendor_name', 'num_payments', 'severity_score'
    ]
    
    # Add columns if they are not in df (e.g. work_short_title)
    existing_cols = [c for c in export_cols if c in anomalies.columns]
    anomalies = anomalies[existing_cols]
    
    out_path = os.path.join(LIVE_EXPORTS_DIR, "cost_and_delay_anomalies.json")
    records = anomalies.to_dict(orient="records")
    
    records_clean = []
    for r in records:
        clean_r = {}
        for k, v in r.items():
            if pd.isna(v):
                clean_r[k] = None
            elif isinstance(v, (pd.Timestamp, datetime)):
                clean_r[k] = v.isoformat()
            else:
                clean_r[k] = v
        records_clean.append(clean_r)
        
    with open(out_path, "w") as f:
        json.dump(records_clean, f, indent=2)
        
    return {"records_exported": len(records_clean), "file": "cost_and_delay_anomalies.json"}

@register_export_pipeline("geointel_heatmap")
def export_geointel_heatmap(df: pd.DataFrame) -> Dict[str, Any]:
    from ai_models.geointel import generate_geointel_geojson
    
    geojson = generate_geointel_geojson(df)
    
    out_path = os.path.join(LIVE_EXPORTS_DIR, "geointel_heatmap.geojson")
    with open(out_path, "w") as f:
        json.dump(geojson, f, indent=2)
        
    num_features = len(geojson.get("features", []))
    return {"records_exported": num_features, "file": "geointel_heatmap.geojson"}

@register_export_pipeline("contractor_cartel_network")
def export_contractor_cartel_network(df: pd.DataFrame) -> Dict[str, Any]:
    from ai_models.vendor_network import run_full_analysis
    
    hhi_records, cartels = run_full_analysis()
    
    # Save HHI
    out_hhi = os.path.join(LIVE_EXPORTS_DIR, "constituency_hhi.json")
    with open(out_hhi, "w") as f:
        json.dump(hhi_records, f, indent=2)
        
    # Save Cartels
    out_cartels = os.path.join(LIVE_EXPORTS_DIR, "vendor_risk_network.json")
    with open(out_cartels, "w") as f:
        json.dump(cartels, f, indent=2)
        
    return {"records_exported": len(cartels), "file": "vendor_risk_network.json"}

@register_export_pipeline("finguard")
def export_finguard(df: pd.DataFrame) -> Dict[str, Any]:
    """Run the full FinGuard Financial Intelligence pipeline and export results."""
    from ai_models.finguard import (
        detect_cost_overruns, benchmark_costs, detect_progress_mismatch,
        compute_budget_utilization, detect_payment_anomalies,
        compute_financial_risk_score, export_to_postgres,
        export_json_anomalies, export_json_constituency_summary, _clean_record
    )

    df_fg = df.copy()
    df_fg = detect_cost_overruns(df_fg)
    df_fg = benchmark_costs(df_fg)
    df_fg = detect_progress_mismatch(df_fg)
    df_fg, const_agg = compute_budget_utilization(df_fg)
    df_fg = detect_payment_anomalies(df_fg)
    df_fg = compute_financial_risk_score(df_fg)

    export_to_postgres(df_fg)
    export_json_anomalies(df_fg)
    export_json_constituency_summary(df_fg, const_agg)

    n_risky = int((df_fg['financial_risk_score'] > 30).sum())
    return {"records_exported": n_risky, "file": "finguard_anomalies.json"}

# ---------------------------------------------------------------------------
# Main Orchestration
# ---------------------------------------------------------------------------
def run_sync():
    log.info("Running incremental sync...")
    sync_script = os.path.join(PROJECT_ROOT, "backend", "sync_incremental.py")
    subprocess.run(["python", sync_script], check=True)
    
def generate_manifest(df: pd.DataFrame, pipeline_results: Dict[str, Any]):
    manifest = {
        "sync_timestamp": datetime.now().isoformat(),
        "total_records_analyzed": len(df),
        "total_anomalies_flagged": pipeline_results.get("cost_and_delay_anomalies", {}).get("records_exported", 0),
        "duplicate_pairs_flagged": pipeline_results.get("duplicate_project_alerts", {}).get("records_exported", 0),
        "active_feature_list": df.columns.tolist(),
        "pipelines_executed": list(EXPORT_PIPELINES.keys()),
        "dataset_version_hash": hashlib.sha256(str(len(df)).encode()).hexdigest()[:12]
    }
    
    out_path = os.path.join(LIVE_EXPORTS_DIR, "export_manifest.json")
    with open(out_path, "w") as f:
        json.dump(manifest, f, indent=2)
    log.info(f"Manifest written: {out_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate live UI export JSONs.")
    parser.add_argument("--sync-and-export", action="store_true", help="Run incremental sync before exporting")
    args = parser.parse_args()
    
    if args.sync_and_export:
        try:
            run_sync()
        except Exception as e:
            log.error(f"Sync failed: {e}")
            return
            
    log.info("Starting live export generation...")
    df_hydrated = load_hydrated_master()
    log.info(f"Loaded master hydrated dataframe with {len(df_hydrated)} rows.")
    
    results = {}
    for name, func in EXPORT_PIPELINES.items():
        log.info(f"Executing pipeline: {name}...")
        try:
            res = func(df_hydrated)
            results[name] = res
            log.info(f"  -> Exported {res['records_exported']} records to {res['file']}")
        except Exception as e:
            log.error(f"Pipeline {name} failed: {e}")
            
    generate_manifest(df_hydrated, results)
    log.info("All live exports generated successfully.")

if __name__ == "__main__":
    main()

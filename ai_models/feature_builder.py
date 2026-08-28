"""feature_builder.py

Feature Extraction Pipeline for Nirikshak AI Anomaly Detection.
Computes temporal, financial, statistical baseline, and text features
from the clean Parquet dataset and writes the enriched analytical
feature table back to both Parquet and PostgreSQL.
"""

import os
import sys
import re
import json
import string
import warnings

import numpy as np
import pandas as pd
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    psycopg2 = None

from datetime import datetime


warnings.filterwarnings("ignore", category=UserWarning)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
EXPORT_DIR = os.path.join(PROJECT_ROOT, "data", "export")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data", "parquet")
AI_MODEL_DIR = os.path.join(PROJECT_ROOT, "ai-model")

if AI_MODEL_DIR not in sys.path:
    sys.path.insert(0, AI_MODEL_DIR)


# ---------------------------------------------------------------------------
# 1. Data Ingestion
# ---------------------------------------------------------------------------
def load_datasets() -> dict:
    """Load core Parquet files into DataFrames."""
    print("Loading Parquet datasets...")
    dfs = {}
    for name in ("works", "mps", "expenditures", "vendors", "states", "mp_allocations"):
        path = os.path.join(EXPORT_DIR, f"{name}.parquet")
        if not os.path.exists(path):
            path = os.path.join(OUTPUT_DIR, f"{name}.parquet")
        dfs[name] = pd.read_parquet(path)
        print(f"  -> {name}: {dfs[name].shape[0]:,} rows x {dfs[name].shape[1]} cols")
    return dfs



# ---------------------------------------------------------------------------
# 2. Temporal Features
# ---------------------------------------------------------------------------
def compute_temporal_features(works: pd.DataFrame) -> pd.DataFrame:
    """Compute date-derived delay features."""
    print("\nComputing temporal features...")

    for col in ("recommendation_date", "sanction_date", "actual_end_date"):
        works[col] = pd.to_datetime(works[col], errors="coerce")

    # Sanction delay: days between recommendation and sanction
    works["sanction_delay_days"] = (
        works["sanction_date"] - works["recommendation_date"]
    ).dt.days

    # Completion delay: days between sanction and actual completion
    works["completion_delay_days"] = (
        works["actual_end_date"] - works["sanction_date"]
    ).dt.days

    # Project lifetime: total days from recommendation to completion
    works["project_lifetime_days"] = (
        works["actual_end_date"] - works["recommendation_date"]
    ).dt.days

    n_sanction = works["sanction_delay_days"].notna().sum()
    n_completion = works["completion_delay_days"].notna().sum()
    print(f"  -> sanction_delay_days computed for {n_sanction:,} works")
    print(f"  -> completion_delay_days computed for {n_completion:,} works")
    return works


# ---------------------------------------------------------------------------
# 3. Financial Features
# ---------------------------------------------------------------------------
def compute_financial_features(works: pd.DataFrame, mps: pd.DataFrame) -> pd.DataFrame:
    """Compute cost overrun, utilization rate, and amount ratios."""
    print("\nComputing financial features...")

    # Cost overrun percentage
    mask = (works["sanction_amount"].notna()) & (works["sanction_amount"] > 0)
    works.loc[mask, "cost_overrun_pct"] = (
        (works.loc[mask, "actual_amount"].fillna(0) - works.loc[mask, "sanction_amount"])
        / works.loc[mask, "sanction_amount"]
    ) * 100

    # Sanction-to-recommendation ratio (how much the sanctioned amount deviates from recommended)
    mask_rec = (works["recommended_amount"].notna()) & (works["recommended_amount"] > 0)
    works.loc[mask_rec, "sanction_rec_ratio"] = (
        works.loc[mask_rec, "sanction_amount"].fillna(0)
        / works.loc[mask_rec, "recommended_amount"]
    )

    # Utilization rate: actual_amount / MP's allocated limit
    # Convert allocated_limit from crores (stored as float in lakhs) to raw value
    mp_alloc = mps[["mp_id", "house_type", "tenure", "allocated_limit"]].copy()
    mp_alloc = mp_alloc.rename(columns={"allocated_limit": "allocated_limit_cr"})

    works = works.merge(mp_alloc, on=["mp_id", "house_type", "tenure"], how="left")

    mask_alloc = (works["allocated_limit_cr"].notna()) & (works["allocated_limit_cr"] > 0)
    works.loc[mask_alloc, "utilization_rate"] = (
        works.loc[mask_alloc, "actual_amount"].fillna(0)
        / (works.loc[mask_alloc, "allocated_limit_cr"] * 1e5)  # convert lakhs to rupees
    )

    n_overrun = works["cost_overrun_pct"].notna().sum()
    n_util = works["utilization_rate"].notna().sum()
    print(f"  -> cost_overrun_pct computed for {n_overrun:,} works")
    print(f"  -> utilization_rate computed for {n_util:,} works")
    return works


# ---------------------------------------------------------------------------
# 4. Statistical Baseline Deviations
# ---------------------------------------------------------------------------
def compute_statistical_baselines(works: pd.DataFrame) -> pd.DataFrame:
    """Compute z-scores relative to (work_category, state_id) group medians."""
    print("\nComputing statistical baseline deviations...")

    # Group by (work_category, state_id)
    group_cols = ["work_category", "state_id"]

    # Sanction amount baselines
    group_stats = (
        works.groupby(group_cols)["sanction_amount"]
        .agg(median_cost="median", std_cost="std", count="count")
        .reset_index()
    )

    works = works.merge(group_stats, on=group_cols, how="left", suffixes=("", "_grp"))

    # Z-score: how many standard deviations away from the group median
    mask_std = (works["std_cost"].notna()) & (works["std_cost"] > 0)
    works.loc[mask_std, "cost_z_score"] = (
        (works.loc[mask_std, "sanction_amount"] - works.loc[mask_std, "median_cost"])
        / works.loc[mask_std, "std_cost"]
    )

    # Completion delay z-score per group
    delay_stats = (
        works.groupby(group_cols)["completion_delay_days"]
        .agg(median_delay="median", std_delay="std")
        .reset_index()
    )
    works = works.merge(delay_stats, on=group_cols, how="left")

    mask_delay = (works["std_delay"].notna()) & (works["std_delay"] > 0)
    works.loc[mask_delay, "delay_z_score"] = (
        (works.loc[mask_delay, "completion_delay_days"] - works.loc[mask_delay, "median_delay"])
        / works.loc[mask_delay, "std_delay"]
    )

    n_cost_z = works["cost_z_score"].notna().sum()
    n_delay_z = works["delay_z_score"].notna().sum()
    print(f"  -> cost_z_score computed for {n_cost_z:,} works")
    print(f"  -> delay_z_score computed for {n_delay_z:,} works")
    return works


# ---------------------------------------------------------------------------
# 5. Text Normalization
# ---------------------------------------------------------------------------
# Common boilerplate tokens found in MPLADS work descriptions
BOILERPLATE_TOKENS = {
    "construction", "of", "the", "in", "at", "for", "and", "to", "a", "an",
    "is", "was", "are", "with", "from", "by", "on", "as", "it", "its",
    "be", "that", "this", "which", "or", "not", "but", "also", "has", "had",
    "have", "been", "being", "were", "will", "shall", "may", "can", "could",
    "would", "should", "do", "does", "did", "no", "yes", "na", "nil", "none",
    "under", "above", "below", "near", "towards", "through", "during", "before",
    "after", "between", "into", "within",
    "vide", "ref", "letter", "dated", "subject", "regarding", "hon",
    "shri", "smt", "dr", "mr", "mrs", "ms",
}


def normalize_text(text: str) -> str:
    """Clean a single work description string."""
    if not isinstance(text, str) or not text.strip():
        return ""
    # Lowercase
    text = text.lower()
    # Remove punctuation and digits
    text = text.translate(str.maketrans("", "", string.punctuation + string.digits))
    # Tokenize and remove boilerplate
    tokens = [t for t in text.split() if t not in BOILERPLATE_TOKENS and len(t) > 2]
    return " ".join(tokens)


def compute_text_features(works: pd.DataFrame) -> pd.DataFrame:
    """Normalize work descriptions and compute basic text metrics."""
    print("\nComputing text features...")
    works["clean_description"] = works["work_description"].apply(normalize_text)
    works["desc_word_count"] = works["clean_description"].apply(lambda x: len(x.split()) if x else 0)
    works["desc_char_count"] = works["clean_description"].str.len()

    n_clean = (works["clean_description"].str.len() > 0).sum()
    print(f"  -> Cleaned descriptions for {n_clean:,} works")
    return works


# ---------------------------------------------------------------------------
# 6. Expenditure Aggregation (per-work summary)
# ---------------------------------------------------------------------------
def compute_expenditure_features(works: pd.DataFrame, expenditures: pd.DataFrame) -> pd.DataFrame:
    """Aggregate expenditure data per work_id."""
    print("\nComputing expenditure aggregation features...")

    exp_agg = (
        expenditures.groupby("work_id")
        .agg(
            total_disbursed=("fund_disbursed_amount", "sum"),
            num_payments=("fund_disbursed_amount", "count"),
            num_vendors=("vendor_id", "nunique"),
            avg_payment=("fund_disbursed_amount", "mean"),
            max_payment=("fund_disbursed_amount", "max"),
        )
        .reset_index()
    )

    works = works.merge(exp_agg, on="work_id", how="left")

    # Disbursement ratio: total disbursed / sanctioned amount
    mask = (works["sanction_amount"].notna()) & (works["sanction_amount"] > 0)
    works.loc[mask, "disbursement_ratio"] = (
        works.loc[mask, "total_disbursed"].fillna(0) / works.loc[mask, "sanction_amount"]
    )

    n_exp = works["total_disbursed"].notna().sum()
    print(f"  -> Expenditure features merged for {n_exp:,} works")
    return works


# ---------------------------------------------------------------------------
# 7. Agency Intelligence & Risk Features
# ---------------------------------------------------------------------------
def compute_agency_risk_features(works: pd.DataFrame, expenditures: pd.DataFrame) -> pd.DataFrame:
    """Compute point-in-time Agency Intelligence risk scores, operational tiers, and risk factors."""
    print("\nComputing agency intelligence and risk features...")
    from agency_intelligence.profiling import build_agency_profiles
    from agency_intelligence.scoring import AgencyRiskScorer
    from agency_intelligence.canonicalization import canonicalize_ia, canonicalize_ida
    from agency_intelligence.signals import compute_adaptive_ia_weight

    scorer = AgencyRiskScorer()
    ia_profile_df, ida_profile_df = build_agency_profiles(works, expenditures)

    # Convert profile DFs to fast lookup dictionaries
    ia_lookup = ia_profile_df.set_index("canonical_agency_name").to_dict(orient="index") if len(ia_profile_df) > 0 else {}
    ida_lookup = ida_profile_df.set_index("canonical_ida_name").to_dict(orient="index") if len(ida_profile_df) > 0 else {}

    # Precompute scores for unique IAs
    scored_ias = {}
    for ia_name, p_data in ia_lookup.items():
        scored_ias[ia_name] = scorer.score_agency(
            agency_name=ia_name,
            agency_level="IA",
            agency_type=p_data.get("agency_type", "Other"),
            agency_branch=p_data.get("ia_branch", "General"),
            completed_projects=p_data.get("completed_projects", 0),
            delay_count=p_data.get("delay_count", 0),
            median_duration_days=p_data.get("median_duration_days"),
            workload_pressure=p_data.get("workload_pressure", 1.0),
            data_confidence=p_data.get("data_confidence"),
            top_vendor_share=p_data.get("top_vendor_share")
        )

    # Precompute scores for unique IDAs
    scored_idas = {}
    for ida_name, p_data in ida_lookup.items():
        scored_idas[ida_name] = scorer.score_agency(
            agency_name=ida_name,
            agency_level="IDA",
            agency_type="District Authority",
            agency_branch=p_data.get("district", "General"),
            completed_projects=p_data.get("completed_projects", 0),
            delay_count=p_data.get("delay_count", 0),
            median_duration_days=p_data.get("median_duration_days"),
            workload_pressure=p_data.get("workload_pressure", 1.0),
            data_confidence=p_data.get("data_confidence")
        )

    # Ensure canonical IA and IDA names are present
    if "canonical_ia_parent" not in works.columns:
        raw_ias = expenditures["ia_name"].dropna().unique()
        ia_map = {ia: canonicalize_ia(ia)[0] for ia in raw_ias}
        work_ia = (
            expenditures.dropna(subset=["ia_name"])
            .groupby("work_id")["ia_name"]
            .first()
            .map(ia_map)
            .reset_index()
            .rename(columns={"ia_name": "canonical_ia_parent"})
        )
        works = works.merge(work_ia, on="work_id", how="left")

    if "canonical_ida_name" not in works.columns:
        raw_idas = works["ida_name"].dropna().unique()
        ida_map = {ida: canonicalize_ida(ida)[0] for ida in raw_idas}
        works["canonical_ida_name"] = works["ida_name"].map(ida_map)

    default_neutral_res = scorer.score_agency(None)

    # Fast vectorized lookup for IDA
    ida_scores = works["canonical_ida_name"].map(
        lambda x: scored_idas[x].agency_risk_score if x in scored_idas else default_neutral_res.agency_risk_score
    )
    ida_factors = works["canonical_ida_name"].map(
        lambda x: scored_idas[x].risk_factors if x in scored_idas else default_neutral_res.risk_factors
    )

    # Fast vectorized lookup for IA
    ia_scores = works["canonical_ia_parent"].map(
        lambda x: scored_ias[x].agency_risk_score if pd.notnull(x) and x in scored_ias else default_neutral_res.agency_risk_score
    )
    ia_factors = works["canonical_ia_parent"].map(
        lambda x: scored_ias[x].risk_factors if pd.notnull(x) and x in scored_ias else []
    )
    ia_n = works["canonical_ia_parent"].map(
        lambda x: scored_ias[x].completed_project_count if pd.notnull(x) and x in scored_ias else 0
    )
    has_valid_ia = works["canonical_ia_parent"].notnull() & (works["canonical_ia_parent"] != "UNKNOWN_AGENCY")

    raw_ia_weights = compute_adaptive_ia_weight(ia_n, has_valid_ia=True)
    ia_weights = np.where(has_valid_ia, raw_ia_weights, 0.0)
    ida_weights = 1.0 - ia_weights


    blended_scores = np.round((ida_weights * ida_scores) + (ia_weights * ia_scores), 2)
    blended_contributions = np.round(blended_scores * 0.05, 3)

    def get_tier(score):
        if score < 30.0:
            return "LOW"
        elif score < 50.0:
            return "MODERATE"
        elif score < 70.0:
            return "HIGH"
        else:
            return "CRITICAL"

    tiers = [get_tier(s) for s in blended_scores]

    combined_factors = []
    for ida_w, ia_w, ida_f, ia_f in zip(ida_weights, ia_weights, ida_factors, ia_factors):
        f_list = [f"District Governance Anchor ({int(ida_w*100)}% weight): {f}" for f in (ida_f[:2] if ida_f else [])]
        if ia_w > 0.05 and ia_f:
            f_list += [f"Executing IA Track Record ({int(ia_w*100)}% weight): {f}" for f in ia_f[:2]]
        combined_factors.append(f_list)

    works["agency_risk_score"] = blended_scores
    works["agency_risk_tier"] = tiers
    works["agency_risk_contribution"] = blended_contributions
    works["agency_risk_factors"] = combined_factors

    n_scored = works["agency_risk_score"].notna().sum()
    print(f"  -> agency_risk_score computed for {n_scored:,} works")
    return works


# ---------------------------------------------------------------------------
# 8. Export
# ---------------------------------------------------------------------------
def export_parquet(df: pd.DataFrame):
    """Save enriched dataset to Parquet."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, "analytical_features.parquet")

    # Select the feature columns we want to export
    feature_cols = [
        "work_id", "activity_name", "work_description", "clean_description",
        "work_category", "mp_id", "constituency_id", "state_id",
        "ida_name", "house_type", "tenure",
        "recommended_amount", "sanction_amount", "actual_amount",
        "recommendation_date", "sanction_date", "actual_end_date",
        "work_stage", "work_status", "average_rating", "flag",
        # Temporal features
        "sanction_delay_days", "completion_delay_days", "project_lifetime_days",
        # Financial features
        "cost_overrun_pct", "sanction_rec_ratio", "utilization_rate",
        # Statistical baselines
        "median_cost", "std_cost", "cost_z_score",
        "median_delay", "std_delay", "delay_z_score",
        # Text features
        "desc_word_count", "desc_char_count",
        # Expenditure features
        "total_disbursed", "num_payments", "num_vendors",
        "avg_payment", "max_payment", "disbursement_ratio",
        # Agency Intelligence features
        "agency_risk_score", "agency_risk_tier", "agency_risk_contribution", "agency_risk_factors",
    ]
    # Only keep columns that actually exist
    existing = [c for c in feature_cols if c in df.columns]
    export_df = df[existing].copy()

    export_df.to_parquet(out_path, engine="pyarrow", compression="snappy")
    print(f"\n  -> Saved {out_path} ({export_df.shape[0]:,} rows x {export_df.shape[1]} cols)")


def export_to_postgres(df: pd.DataFrame):
    """Write the analytical features table to PostgreSQL."""
    if psycopg2 is None:
        print("\n  -> psycopg2 not installed; skipping PostgreSQL export (Parquet export succeeded).")
        return

    try:
        from backend.database import get_connection
        print("\nWriting to PostgreSQL table 'works_analytical_features'...")
        conn = get_connection()
        cur = conn.cursor()
    except Exception as e:
        print(f"\n  -> Could not connect to PostgreSQL ({e}); skipping DB export.")
        return


    cur.execute("DROP TABLE IF EXISTS works_analytical_features;")
    cur.execute("""
        CREATE TABLE works_analytical_features (
            work_id                  BIGINT PRIMARY KEY,
            activity_name            TEXT,
            work_category            TEXT,
            state_id                 BIGINT,
            mp_id                    BIGINT,
            house_type               BIGINT,
            tenure                   TEXT,
            sanction_amount          NUMERIC,
            actual_amount            NUMERIC,
            sanction_delay_days      BIGINT,
            completion_delay_days    BIGINT,
            project_lifetime_days    BIGINT,
            cost_overrun_pct         DOUBLE PRECISION,
            sanction_rec_ratio       DOUBLE PRECISION,
            utilization_rate         DOUBLE PRECISION,
            cost_z_score             DOUBLE PRECISION,
            delay_z_score            DOUBLE PRECISION,
            disbursement_ratio       DOUBLE PRECISION,
            total_disbursed          NUMERIC,
            num_payments             BIGINT,
            num_vendors              BIGINT,
            desc_word_count          BIGINT,
            clean_description        TEXT,
            agency_risk_score        DOUBLE PRECISION,
            agency_risk_tier         TEXT,
            agency_risk_contribution DOUBLE PRECISION,
            agency_risk_factors      JSONB
        );
    """)

    # Prepare rows
    insert_cols = [
        "work_id", "activity_name", "work_category", "state_id", "mp_id",
        "house_type", "tenure", "sanction_amount", "actual_amount",
        "sanction_delay_days", "completion_delay_days", "project_lifetime_days",
        "cost_overrun_pct", "sanction_rec_ratio", "utilization_rate",
        "cost_z_score", "delay_z_score", "disbursement_ratio",
        "total_disbursed", "num_payments", "num_vendors",
        "desc_word_count", "clean_description",
        "agency_risk_score", "agency_risk_tier", "agency_risk_contribution", "agency_risk_factors",
    ]

    existing = [c for c in insert_cols if c in df.columns]
    sub = df[existing].copy()

    # Convert numpy types to Python native types for psycopg2 compatibility
    def sanitize_value(val):
        if val is None:
            return None
        if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
            return None
        if isinstance(val, (np.integer,)):
            return int(val)
        if isinstance(val, (np.floating,)):
            return float(val)
        if isinstance(val, pd.Timestamp):
            if pd.isna(val):
                return None
            return val.isoformat()
        if isinstance(val, list):
            return psycopg2.extras.Json(val)
        return val

    rows = []
    for row in sub.itertuples(index=False, name=None):
        rows.append(tuple(sanitize_value(v) for v in row))

    col_names = ", ".join(existing)

    psycopg2.extras.execute_values(
        cur,
        f"INSERT INTO works_analytical_features ({col_names}) VALUES %s ON CONFLICT DO NOTHING",
        rows,
        page_size=1000,
    )

    conn.commit()
    cur.close()
    conn.close()
    print(f"  -> Inserted {len(rows):,} rows into works_analytical_features")


# ---------------------------------------------------------------------------
# 9. Statistical Report
# ---------------------------------------------------------------------------
def print_distribution_report(df: pd.DataFrame):
    """Print a detailed statistical distribution report for computed features."""
    print("\n" + "=" * 70)
    print("STATISTICAL DISTRIBUTION REPORT")
    print("=" * 70)

    feature_cols = [
        "sanction_delay_days", "completion_delay_days", "project_lifetime_days",
        "cost_overrun_pct", "sanction_rec_ratio", "utilization_rate",
        "cost_z_score", "delay_z_score",
        "total_disbursed", "num_payments", "num_vendors", "disbursement_ratio",
        "desc_word_count", "agency_risk_score", "agency_risk_contribution",
    ]

    existing = [c for c in feature_cols if c in df.columns]

    for col in existing:
        series = df[col].dropna()
        if len(series) == 0:
            continue

        print(f"\n--- {col} ---")
        print(f"  Count:       {len(series):>12,}")
        print(f"  Mean:        {series.mean():>12.2f}")
        print(f"  Median:      {series.median():>12.2f}")
        print(f"  Std Dev:     {series.std():>12.2f}")
        print(f"  Min:         {series.min():>12.2f}")
        print(f"  25th pctl:   {series.quantile(0.25):>12.2f}")
        print(f"  75th pctl:   {series.quantile(0.75):>12.2f}")
        print(f"  95th pctl:   {series.quantile(0.95):>12.2f}")
        print(f"  99th pctl:   {series.quantile(0.99):>12.2f}")
        print(f"  Max:         {series.max():>12.2f}")

    # Anomaly & Agency Risk flags summary
    print("\n" + "=" * 70)
    print("ANOMALY & AGENCY RISK SIGNAL SUMMARY")
    print("=" * 70)

    if "cost_overrun_pct" in df.columns:
        overruns = (df["cost_overrun_pct"] > 20).sum()
        print(f"  Works with >20% cost overrun:     {overruns:,}")

    if "cost_z_score" in df.columns:
        outliers = (df["cost_z_score"].abs() > 2).sum()
        print(f"  Works with |cost_z_score| > 2:    {outliers:,}")

    if "delay_z_score" in df.columns:
        delay_outliers = (df["delay_z_score"] > 2).sum()
        print(f"  Works with delay_z_score > 2:     {delay_outliers:,}")

    if "disbursement_ratio" in df.columns:
        over_disbursed = (df["disbursement_ratio"] > 1.2).sum()
        print(f"  Works with disbursement > 120%:   {over_disbursed:,}")

    if "completion_delay_days" in df.columns:
        long_delay = (df["completion_delay_days"] > 365).sum()
        print(f"  Works delayed > 1 year:           {long_delay:,}")

    if "agency_risk_tier" in df.columns:
        tier_counts = df["agency_risk_tier"].value_counts().to_dict()
        print(f"  Agency Risk Tiers: LOW={tier_counts.get('LOW', 0):,}, MODERATE={tier_counts.get('MODERATE', 0):,}, HIGH={tier_counts.get('HIGH', 0):,}, CRITICAL={tier_counts.get('CRITICAL', 0):,}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("NIRIKSHAK AI - FEATURE EXTRACTION PIPELINE")
    print("=" * 70)
    start = datetime.now()

    # 1. Load
    dfs = load_datasets()
    works = dfs["works"].copy()

    # 2. Temporal
    works = compute_temporal_features(works)

    # 3. Financial
    works = compute_financial_features(works, dfs["mps"])

    # 4. Statistical Baselines
    works = compute_statistical_baselines(works)

    # 5. Text
    works = compute_text_features(works)

    # 6. Expenditure Aggregation
    works = compute_expenditure_features(works, dfs["expenditures"])

    # 7. Agency Intelligence & Risk
    works = compute_agency_risk_features(works, dfs["expenditures"])

    # 8. Export
    export_parquet(works)
    export_to_postgres(works)

    # 9. Report
    print_distribution_report(works)

    elapsed = (datetime.now() - start).total_seconds()
    print(f"\n{'=' * 70}")
    print(f"PIPELINE COMPLETE in {elapsed:.1f}s")
    print(f"{'=' * 70}")



if __name__ == "__main__":
    main()

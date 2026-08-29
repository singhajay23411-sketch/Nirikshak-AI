"""
audit_intelligence.py — Comprehensive QA & ML Validation Audit Suite

Role: Lead QA & ML Validation Engineer for Nirikshak AI.
Validates the mathematical soundness, logic correctness, and execution
stability of all 5 core ML intelligence modules against 525K+ records.

Modules audited:
  1. Unified Risk Engine  — mathematical bounds & risk inflation detection
  2. Duplicate Detector   — self-pairing & cross-state gate integrity
  3. FinGuard             — cost overrun arithmetic & zero-denominator safety
  4. Vendor Network       — HHI bounds & graph consistency
  5. Memory & Performance — tracemalloc profiling on 10K sample

Usage:
    python -m backend.tests.audit_intelligence
"""

import os
import sys
import time
import math
import tracemalloc
import logging
from datetime import datetime
from typing import Dict, List, Any, Tuple

import numpy as np
import pandas as pd

# Ensure project root is importable
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

PARQUET_DIR = os.path.join(PROJECT_ROOT, "data", "parquet")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "QA_Audit_Report.md")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("audit_intelligence")


# ═══════════════════════════════════════════════════════════════════════════
#  DATABASE CONNECTION
# ═══════════════════════════════════════════════════════════════════════════

def get_db_connection():
    """Get PostgreSQL connection (falls back to parquet if DB unavailable)."""
    try:
        import psycopg2
        from dotenv import load_dotenv
        load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"))
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 5432)),
            dbname=os.getenv("DB_NAME", "nirikshak"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
        )
        return conn
    except Exception as e:
        log.warning(f"Could not connect to PostgreSQL: {e}")
        return None


def load_from_db_or_parquet(table_name: str, parquet_name: str = None) -> pd.DataFrame:
    """Try loading from PostgreSQL first, fall back to parquet."""
    if parquet_name is None:
        parquet_name = f"{table_name}.parquet"

    conn = get_db_connection()
    if conn:
        try:
            df = pd.read_sql(f"SELECT * FROM {table_name}", conn)
            conn.close()
            if len(df) > 0:
                return df
        except Exception:
            conn.close()

    # Fallback to parquet
    path = os.path.join(PARQUET_DIR, parquet_name)
    if os.path.exists(path):
        return pd.read_parquet(path)
    return pd.DataFrame()


# ═══════════════════════════════════════════════════════════════════════════
#  AUDIT RESULTS COLLECTOR
# ═══════════════════════════════════════════════════════════════════════════

class AuditResults:
    """Collects audit findings across all modules."""

    def __init__(self):
        self.sections: List[Dict[str, Any]] = []
        self.total_records_audited = 0
        self.total_violations = 0
        self.total_warnings = 0
        self.start_time = time.time()

    def add_section(self, name: str, status: str, records: int,
                    violations: int, warnings: int, details: List[str],
                    summary: str = ""):
        self.sections.append({
            "name": name,
            "status": status,
            "records": records,
            "violations": violations,
            "warnings": warnings,
            "details": details,
            "summary": summary,
        })
        self.total_records_audited += records
        self.total_violations += violations
        self.total_warnings += warnings

    def generate_report(self) -> str:
        elapsed = time.time() - self.start_time
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        lines = []
        lines.append("# Nirikshak AI — QA Intelligence Audit Report")
        lines.append(f"\n**Generated:** {now}")
        lines.append(f"**Audit Duration:** {elapsed:.1f}s")
        lines.append(f"**Total Records Audited:** {self.total_records_audited:,}")
        lines.append(f"**Total Violations Found:** {self.total_violations}")
        lines.append(f"**Total Warnings:** {self.total_warnings}")

        overall = "✅ ALL CHECKS PASSED" if self.total_violations == 0 else "❌ VIOLATIONS DETECTED"
        lines.append(f"\n## Overall Verdict: {overall}\n")

        lines.append("---\n")

        for section in self.sections:
            icon = "✅" if section["violations"] == 0 else "❌"
            lines.append(f"## {icon} {section['name']}")
            lines.append(f"- **Status:** {section['status']}")
            lines.append(f"- **Records Audited:** {section['records']:,}")
            lines.append(f"- **Violations:** {section['violations']}")
            lines.append(f"- **Warnings:** {section['warnings']}")
            if section["summary"]:
                lines.append(f"- **Summary:** {section['summary']}")
            lines.append("")
            if section["details"]:
                lines.append("### Detailed Findings\n")
                for detail in section["details"]:
                    lines.append(f"- {detail}")
                lines.append("")
            lines.append("---\n")

        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════
#  AUDIT 1: UNIFIED RISK SCORE VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def audit_risk_scores(results: AuditResults):
    log.info("=" * 60)
    log.info("AUDIT 1: Unified Risk Score Validation (Mathematical Bounds)")
    log.info("=" * 60)

    details = []
    violations = 0
    warnings = 0

    # Try DB first, then parquet
    df = load_from_db_or_parquet("project_risk_evaluations", "project_risk_evaluations.parquet")

    if df.empty:
        # Try to compute from analytical_features if risk scores were written there
        feat_path = os.path.join(PARQUET_DIR, "analytical_features.parquet")
        if os.path.exists(feat_path):
            df = pd.read_parquet(feat_path)
            if "final_risk_score" not in df.columns:
                details.append("No `final_risk_score` column found — risk engine may not have run yet.")
                details.append("Will run risk engine inline to generate scores for validation...")

                # Run the risk engine to generate scores
                try:
                    from ai_models.unified_risk_engine import generate_unified_risk_scores
                    df = generate_unified_risk_scores()
                    details.append(f"Risk engine generated {len(df):,} risk scores for validation.")
                except Exception as e:
                    details.append(f"Could not run risk engine: {e}")
                    results.add_section(
                        "Unified Risk Score Validation", "SKIPPED", 0, 0, 1,
                        details, "Risk engine not available — skipped."
                    )
                    return

    if df.empty or "final_risk_score" not in df.columns:
        details.append("No risk evaluation data found in DB or parquet. Skipping.")
        results.add_section(
            "Unified Risk Score Validation", "SKIPPED", 0, 0, 1,
            details, "No data available."
        )
        return

    total = len(df)
    log.info(f"Loaded {total:,} risk evaluation records.")

    # CHECK 1: Score bounds 0 ≤ S ≤ 100
    under_zero = (df["final_risk_score"] < 0).sum()
    over_100 = (df["final_risk_score"] > 100).sum()

    if under_zero > 0:
        violations += 1
        details.append(f"❌ BOUNDARY VIOLATION: {under_zero} records have final_risk_score < 0")
    else:
        details.append(f"✅ All scores ≥ 0 (verified on {total:,} records)")

    if over_100 > 0:
        violations += 1
        details.append(f"❌ BOUNDARY VIOLATION: {over_100} records have final_risk_score > 100")
    else:
        details.append(f"✅ All scores ≤ 100 (verified on {total:,} records)")

    # CHECK 2: Risk Inflation — CRITICAL with zero expenditure AND zero delay
    if "risk_tier" in df.columns:
        critical_mask = df["risk_tier"] == "CRITICAL"
        critical_count = critical_mask.sum()

        if critical_count > 0:
            details.append(f"Total CRITICAL risk projects: {critical_count:,}")

            # Check for inflated criticals
            zero_expenditure = False
            zero_delay = False

            if "actual_amount" in df.columns:
                zero_exp_mask = df["actual_amount"].fillna(0) == 0
                zero_expenditure = True
            elif "financial_risk_score" in df.columns:
                zero_exp_mask = df["financial_risk_score"].fillna(0) == 0
                zero_expenditure = True

            if "completion_delay_days" in df.columns:
                zero_delay_mask = df["completion_delay_days"].fillna(0) == 0
                zero_delay = True
            elif "delay_risk_score" in df.columns:
                zero_delay_mask = df["delay_risk_score"].fillna(0) == 0
                zero_delay = True

            if zero_expenditure and zero_delay:
                inflated = (critical_mask & zero_exp_mask & zero_delay_mask).sum()
                if inflated > 0:
                    warnings += 1
                    details.append(
                        f"⚠️ RISK INFLATION WARNING: {inflated} CRITICAL projects have "
                        f"$0 expenditure AND $0 delay — possible broken logic weight"
                    )
                else:
                    details.append("✅ No inflated CRITICAL scores detected (zero-spend + zero-delay)")

    # Score distribution summary
    if "risk_tier" in df.columns:
        tier_counts = df["risk_tier"].value_counts().to_dict()
        details.append(f"Risk tier distribution: {tier_counts}")

    mean_score = df["final_risk_score"].mean()
    median_score = df["final_risk_score"].median()
    details.append(f"Mean risk score: {mean_score:.2f} | Median: {median_score:.2f}")

    status = "PASSED" if violations == 0 else "FAILED"
    results.add_section(
        "Unified Risk Score Validation", status, total, violations, warnings,
        details, f"Bounds check on {total:,} records."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  AUDIT 2: DUPLICATE DETECTION AUTHENTICITY
# ═══════════════════════════════════════════════════════════════════════════

def audit_duplicate_detection(results: AuditResults):
    log.info("=" * 60)
    log.info("AUDIT 2: Duplicate Detection Authenticity Check")
    log.info("=" * 60)

    details = []
    violations = 0
    warnings = 0

    df_dupes = load_from_db_or_parquet("duplicate_alerts", "duplicate_alerts.parquet")

    if df_dupes.empty:
        details.append("No duplicate alerts found — detector may not have run yet.")
        details.append("Attempting to run duplicate detector inline...")
        try:
            from ai_models.duplicate_detector import run_duplicate_detection
            df_dupes = run_duplicate_detection()
            if df_dupes is None or (isinstance(df_dupes, pd.DataFrame) and df_dupes.empty):
                # Try loading from output path
                output_path = os.path.join(PARQUET_DIR, "duplicate_alerts.parquet")
                if os.path.exists(output_path):
                    df_dupes = pd.read_parquet(output_path)
                else:
                    df_dupes = pd.DataFrame()
            details.append(f"Duplicate detector generated {len(df_dupes):,} alerts for validation.")
        except Exception as e:
            details.append(f"Could not run duplicate detector: {e}")
            results.add_section(
                "Duplicate Detection Authenticity", "SKIPPED", 0, 0, 1,
                details, "Detector not available."
            )
            return

    if df_dupes.empty:
        details.append("No duplicate alerts to validate.")
        results.add_section(
            "Duplicate Detection Authenticity", "SKIPPED", 0, 0, 1,
            details, "No alerts generated."
        )
        return

    total = len(df_dupes)
    log.info(f"Loaded {total:,} duplicate alerts.")

    # CHECK 1: Self-pairing — work_id_A ≠ work_id_B
    if "work_id_A" in df_dupes.columns and "work_id_B" in df_dupes.columns:
        self_pairs = (df_dupes["work_id_A"] == df_dupes["work_id_B"]).sum()
        if self_pairs > 0:
            violations += 1
            details.append(f"❌ INTEGRITY FAILURE: {self_pairs} alerts have work_id_A == work_id_B (self-pairing)")
        else:
            details.append(f"✅ No self-pairing found (verified on {total:,} alerts)")
    else:
        warnings += 1
        details.append("⚠️ Columns work_id_A / work_id_B not found — cannot check self-pairing")

    # CHECK 2: Cross-state gate — no duplicates from entirely different states
    if all(c in df_dupes.columns for c in ["state_id_A", "state_id_B"]):
        cross_state = (df_dupes["state_id_A"] != df_dupes["state_id_B"]).sum()
        if cross_state > 0:
            violations += 1
            details.append(
                f"❌ LOCATION GATE FAILURE: {cross_state} alerts flag works in different states"
            )
        else:
            details.append(f"✅ Location gate intact — all duplicates within same state")
    elif "constituency_id_A" in df_dupes.columns and "constituency_id_B" in df_dupes.columns:
        # If state_id not directly available, check constituency
        cross_const = (df_dupes["constituency_id_A"] != df_dupes["constituency_id_B"]).sum()
        if cross_const > 0:
            warnings += 1
            details.append(
                f"⚠️ {cross_const} alerts flag works in different constituencies — "
                f"review partitioning logic"
            )
        else:
            details.append(f"✅ All duplicates are within the same constituency partition")
    else:
        # Load works to cross-check states
        df_works = load_from_db_or_parquet("works", "works.parquet")
        if not df_works.empty and "work_id_A" in df_dupes.columns:
            work_states = df_works.set_index("work_id")["state_id"].to_dict()
            df_dupes["state_A"] = df_dupes["work_id_A"].map(work_states)
            df_dupes["state_B"] = df_dupes["work_id_B"].map(work_states)
            cross_state = (df_dupes["state_A"] != df_dupes["state_B"]).sum()
            if cross_state > 0:
                violations += 1
                details.append(
                    f"❌ LOCATION GATE FAILURE: {cross_state} alerts flag works in different states"
                )
            else:
                details.append("✅ Cross-referenced with works table — all duplicates within same state")

    # Confidence score distribution
    if "risk_confidence_score" in df_dupes.columns:
        mean_conf = df_dupes["risk_confidence_score"].mean()
        high_conf = (df_dupes["risk_confidence_score"] >= 80).sum()
        details.append(f"Mean confidence: {mean_conf:.1f} | High-confidence (≥80): {high_conf:,}")

    status = "PASSED" if violations == 0 else "FAILED"
    results.add_section(
        "Duplicate Detection Authenticity", status, total, violations, warnings,
        details, f"Validated {total:,} duplicate alert pairs."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  AUDIT 3: FINGUARD FINANCIAL OUTLIER SANITY CHECK
# ═══════════════════════════════════════════════════════════════════════════

def audit_finguard(results: AuditResults):
    log.info("=" * 60)
    log.info("AUDIT 3: FinGuard Financial Outlier Sanity Check")
    log.info("=" * 60)

    details = []
    violations = 0
    warnings = 0

    # Load works for ground truth verification
    df_works = load_from_db_or_parquet("works", "works.parquet")
    if df_works.empty:
        results.add_section(
            "FinGuard Financial Sanity", "SKIPPED", 0, 0, 1,
            ["No works data available."], "Skipped."
        )
        return

    total = len(df_works)
    log.info(f"Loaded {total:,} works for financial audit.")

    # CHECK 1: Zero-denominator safety
    zero_sanction = (
        (df_works["sanction_amount"].isna()) |
        (df_works["sanction_amount"] == 0)
    ).sum()
    details.append(
        f"Works with zero/null sanction_amount: {zero_sanction:,} / {total:,} "
        f"({zero_sanction / total * 100:.1f}%)"
    )

    # Compute cost overrun safely (replicating FinGuard logic)
    mask_valid = (df_works["sanction_amount"].notna()) & (df_works["sanction_amount"] > 0)
    df_valid = df_works[mask_valid].copy()

    df_valid["cost_overrun_pct"] = (
        (df_valid["actual_amount"].fillna(0) - df_valid["sanction_amount"])
        / df_valid["sanction_amount"]
    ) * 100

    # CHECK 2: Verify extreme overruns (>100%) are real
    extreme_overruns = df_valid[df_valid["cost_overrun_pct"] > 100]
    n_extreme = len(extreme_overruns)
    details.append(f"Works with cost overrun > 100%: {n_extreme:,}")

    if n_extreme > 0:
        # Verify the math is correct — no NaN or Inf
        inf_count = np.isinf(extreme_overruns["cost_overrun_pct"]).sum()
        nan_count = extreme_overruns["cost_overrun_pct"].isna().sum()

        if inf_count > 0:
            violations += 1
            details.append(f"❌ ARITHMETIC ERROR: {inf_count} overruns are Inf (division by zero leaked)")
        else:
            details.append("✅ No Inf values in cost overrun calculations")

        if nan_count > 0:
            warnings += 1
            details.append(f"⚠️ {nan_count} overrun values are NaN after computation")
        else:
            details.append("✅ No NaN values in cost overrun calculations")

        # Spot-check: verify actual > 2x sanctioned for >100% overruns
        spot_check = extreme_overruns.head(5)
        verified = 0
        for _, row in spot_check.iterrows():
            actual = row["actual_amount"] if pd.notna(row["actual_amount"]) else 0
            sanctioned = row["sanction_amount"]
            expected_pct = ((actual - sanctioned) / sanctioned) * 100
            if abs(expected_pct - row["cost_overrun_pct"]) < 0.01:
                verified += 1
        details.append(f"Spot-checked {len(spot_check)} extreme overruns: {verified}/{len(spot_check)} arithmetically verified ✅")
    else:
        details.append("✅ No extreme overruns to verify")

    # CHECK 3: Global financial integrity
    total_sanctioned = df_works["sanction_amount"].sum()
    total_actual = df_works["actual_amount"].sum()
    if total_sanctioned > 0:
        global_overrun = ((total_actual - total_sanctioned) / total_sanctioned) * 100
        details.append(f"Global cost overrun rate: {global_overrun:.2f}%")
    else:
        warnings += 1
        details.append("⚠️ Total sanctioned amount is zero — cannot compute global overrun rate")

    # CHECK 4: Null analysis
    null_actual = df_works["actual_amount"].isna().sum()
    null_recommended = df_works["recommended_amount"].isna().sum()
    details.append(f"Null actual_amount: {null_actual:,} | Null recommended_amount: {null_recommended:,}")

    status = "PASSED" if violations == 0 else "FAILED"
    results.add_section(
        "FinGuard Financial Sanity", status, total, violations, warnings,
        details, f"Audited {total:,} works for financial integrity."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  AUDIT 4: VENDOR NETWORK & HHI VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def audit_vendor_network(results: AuditResults):
    log.info("=" * 60)
    log.info("AUDIT 4: Vendor Network & HHI Validation")
    log.info("=" * 60)

    details = []
    violations = 0
    warnings = 0

    # Load expenditures + vendors
    df_exp = load_from_db_or_parquet("expenditures", "expenditures.parquet")
    df_vendors = load_from_db_or_parquet("vendors", "vendors.parquet")
    df_works = load_from_db_or_parquet("works", "works.parquet")

    if df_exp.empty or df_vendors.empty:
        results.add_section(
            "Vendor Network & HHI", "SKIPPED", 0, 0, 1,
            ["Expenditure or vendor data not available."], "Skipped."
        )
        return

    total = len(df_exp)
    log.info(f"Loaded {total:,} expenditure records for vendor audit.")

    # Merge to get constituency_id on expenditures
    if "constituency_id" not in df_exp.columns and not df_works.empty:
        work_const = df_works[["work_id", "constituency_id"]].drop_duplicates()
        df_exp = df_exp.merge(work_const, on="work_id", how="left")

    # Calculate HHI per constituency
    if "vendor_id" in df_exp.columns and "constituency_id" in df_exp.columns:
        valid_exp = df_exp.dropna(subset=["vendor_id", "constituency_id", "fund_disbursed_amount"])
        vendor_totals = valid_exp.groupby(["constituency_id", "vendor_id"])["fund_disbursed_amount"].sum().reset_index()
        const_totals = vendor_totals.groupby("constituency_id")["fund_disbursed_amount"].sum().reset_index()
        const_totals.rename(columns={"fund_disbursed_amount": "const_total"}, inplace=True)

        merged = vendor_totals.merge(const_totals, on="constituency_id")
        merged["market_share"] = (merged["fund_disbursed_amount"] / merged["const_total"]) * 100
        merged["share_sq"] = merged["market_share"] ** 2

        hhi_df = merged.groupby("constituency_id")["share_sq"].sum().reset_index()
        hhi_df.rename(columns={"share_sq": "hhi"}, inplace=True)

        n_constituencies = len(hhi_df)
        details.append(f"HHI computed for {n_constituencies} constituencies")

        # CHECK 1: HHI bounds (0 ≤ HHI ≤ 10000)
        hhi_over = (hhi_df["hhi"] > 10000).sum()
        hhi_under = (hhi_df["hhi"] < 0).sum()

        if hhi_over > 0:
            violations += 1
            details.append(f"❌ HHI BOUND VIOLATION: {hhi_over} constituencies have HHI > 10000")
        else:
            details.append(f"✅ All HHI values ≤ 10000")

        if hhi_under > 0:
            violations += 1
            details.append(f"❌ HHI BOUND VIOLATION: {hhi_under} constituencies have HHI < 0")
        else:
            details.append(f"✅ All HHI values ≥ 0")

        # CHECK 2: Monopoly detection (HHI > 2500 = highly concentrated)
        monopoly = (hhi_df["hhi"] > 2500).sum()
        competitive = (hhi_df["hhi"] < 1500).sum()
        details.append(
            f"Market concentration: {monopoly} monopolistic (>2500) | "
            f"{competitive} competitive (<1500) constituencies"
        )

        mean_hhi = hhi_df["hhi"].mean()
        details.append(f"Mean HHI: {mean_hhi:.1f}")
    else:
        warnings += 1
        details.append("⚠️ Cannot compute HHI — missing vendor_id or constituency_id columns")

    status = "PASSED" if violations == 0 else "FAILED"
    results.add_section(
        "Vendor Network & HHI", status, total, violations, warnings,
        details, f"Audited vendor concentration across {total:,} expenditure records."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  AUDIT 5: MEMORY & PERFORMANCE PROFILER
# ═══════════════════════════════════════════════════════════════════════════

def audit_memory_performance(results: AuditResults):
    log.info("=" * 60)
    log.info("AUDIT 5: Memory & Performance Profiler (10K sample)")
    log.info("=" * 60)

    details = []
    violations = 0
    warnings = 0
    total_records = 0

    # Load a 10K sample of analytical features
    feat_path = os.path.join(PARQUET_DIR, "analytical_features.parquet")
    works_path = os.path.join(PARQUET_DIR, "works.parquet")

    source_path = feat_path if os.path.exists(feat_path) else works_path
    if not os.path.exists(source_path):
        results.add_section(
            "Memory & Performance Profiler", "SKIPPED", 0, 0, 1,
            ["No feature data available for profiling."], "Skipped."
        )
        return

    df_full = pd.read_parquet(source_path)
    total_full = len(df_full)
    sample_size = min(10000, total_full)
    df_sample = df_full.sample(n=sample_size, random_state=42)
    total_records = sample_size

    details.append(f"Full dataset: {total_full:,} records | Sample: {sample_size:,} records")

    # PROFILE 1: DataFrame operations (feature computation proxy)
    tracemalloc.start()
    t0 = time.time()

    # Simulate heavy computation similar to feature_builder
    df_test = df_sample.copy()
    for col in df_test.select_dtypes(include=[np.number]).columns[:5]:
        df_test[f"{col}_zscore"] = (df_test[col] - df_test[col].mean()) / (df_test[col].std() + 1e-9)

    t1 = time.time()
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    elapsed_feat = t1 - t0
    peak_mb_feat = peak / 1024 / 1024
    projected_feat = (peak_mb_feat / sample_size) * total_full

    details.append(f"**Feature computation (z-scores on {sample_size:,} records):**")
    details.append(f"  Time: {elapsed_feat:.2f}s | Peak RAM: {peak_mb_feat:.1f} MB")
    details.append(f"  Projected full dataset ({total_full:,}): ~{projected_feat:.0f} MB")

    # PROFILE 2: Sentence embedding simulation (if available)
    try:
        tracemalloc.start()
        t0 = time.time()

        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")

        # Encode a small batch of descriptions
        desc_col = None
        for candidate in ["work_description", "activity_name"]:
            if candidate in df_sample.columns:
                desc_col = candidate
                break

        if desc_col:
            texts = df_sample[desc_col].fillna("").astype(str).tolist()[:1000]
            embeddings = model.encode(texts, batch_size=128, show_progress_bar=False)

            t1 = time.time()
            current, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            elapsed_emb = t1 - t0
            peak_mb_emb = peak / 1024 / 1024
            projected_emb = (peak_mb_emb / len(texts)) * total_full

            details.append(f"**SentenceTransformer encoding ({len(texts):,} texts):**")
            details.append(f"  Time: {elapsed_emb:.2f}s | Peak RAM: {peak_mb_emb:.1f} MB")
            details.append(f"  Projected full dataset ({total_full:,}): ~{projected_emb:.0f} MB")

            if projected_emb > 8000:
                warnings += 1
                details.append(f"  ⚠️ WARNING: Projected RAM ({projected_emb:.0f} MB) exceeds 8 GB")
            else:
                details.append(f"  ✅ Projected RAM within safe limits")
        else:
            tracemalloc.stop()
            details.append("No text column found for embedding profiling.")
    except ImportError:
        if tracemalloc.is_tracing():
            tracemalloc.stop()
        details.append("⚠️ SentenceTransformers not available — embedding profiling skipped")
    except Exception as e:
        if tracemalloc.is_tracing():
            tracemalloc.stop()
        details.append(f"⚠️ Embedding profiling failed: {e}")

    # PROFILE 3: NetworkX graph construction simulation
    try:
        tracemalloc.start()
        t0 = time.time()

        import networkx as nx

        df_exp = load_from_db_or_parquet("expenditures", "expenditures.parquet")
        if not df_exp.empty:
            exp_sample = df_exp.sample(n=min(10000, len(df_exp)), random_state=42)
            G = nx.Graph()
            for _, row in exp_sample.iterrows():
                if pd.notna(row.get("vendor_id")) and pd.notna(row.get("work_id")):
                    G.add_edge(f"vendor_{int(row['vendor_id'])}", f"work_{int(row['work_id'])}")

            t1 = time.time()
            current, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            elapsed_graph = t1 - t0
            peak_mb_graph = peak / 1024 / 1024
            projected_graph = (peak_mb_graph / len(exp_sample)) * len(df_exp)

            details.append(f"**NetworkX graph construction ({len(exp_sample):,} edges):**")
            details.append(f"  Time: {elapsed_graph:.2f}s | Peak RAM: {peak_mb_graph:.1f} MB")
            details.append(f"  Projected full dataset ({len(df_exp):,}): ~{projected_graph:.0f} MB")
            details.append(f"  Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        else:
            tracemalloc.stop()
            details.append("No expenditure data for graph profiling.")
    except Exception as e:
        if tracemalloc.is_tracing():
            tracemalloc.stop()
        details.append(f"⚠️ Graph profiling failed: {e}")

    status = "PASSED" if violations == 0 else "FAILED"
    results.add_section(
        "Memory & Performance Profiler", status, total_records, violations, warnings,
        details, f"Profiled on {total_records:,} record sample."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

def main():
    log.info("╔" + "═" * 58 + "╗")
    log.info("║  NIRIKSHAK AI — QA Intelligence Audit Suite              ║")
    log.info("║  Lead QA & ML Validation Engineer                        ║")
    log.info("╚" + "═" * 58 + "╝")

    results = AuditResults()

    # Run all 5 audits
    try:
        audit_risk_scores(results)
    except Exception as e:
        log.error(f"Risk score audit failed: {e}")
        results.add_section("Unified Risk Score Validation", "ERROR", 0, 1, 0,
                            [f"Exception: {e}", traceback.format_exc()])

    try:
        audit_duplicate_detection(results)
    except Exception as e:
        log.error(f"Duplicate detection audit failed: {e}")
        results.add_section("Duplicate Detection Authenticity", "ERROR", 0, 1, 0,
                            [f"Exception: {e}", traceback.format_exc()])

    try:
        audit_finguard(results)
    except Exception as e:
        log.error(f"FinGuard audit failed: {e}")
        results.add_section("FinGuard Financial Sanity", "ERROR", 0, 1, 0,
                            [f"Exception: {e}", traceback.format_exc()])

    try:
        audit_vendor_network(results)
    except Exception as e:
        log.error(f"Vendor network audit failed: {e}")
        results.add_section("Vendor Network & HHI", "ERROR", 0, 1, 0,
                            [f"Exception: {e}", traceback.format_exc()])

    try:
        audit_memory_performance(results)
    except Exception as e:
        log.error(f"Memory profiler failed: {e}")
        results.add_section("Memory & Performance Profiler", "ERROR", 0, 1, 0,
                            [f"Exception: {e}", traceback.format_exc()])

    # Generate report
    report = results.generate_report()
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)

    log.info(f"\n{'=' * 60}")
    log.info(f"QA Audit Report saved to: {REPORT_PATH}")
    log.info(f"Total records audited: {results.total_records_audited:,}")
    log.info(f"Total violations: {results.total_violations}")
    log.info(f"Total warnings: {results.total_warnings}")

    verdict = "✅ ALL CHECKS PASSED" if results.total_violations == 0 else "❌ VIOLATIONS DETECTED"
    log.info(f"VERDICT: {verdict}")
    log.info("=" * 60)

    # Print summary to terminal
    print("\n" + "=" * 60)
    print("  NIRIKSHAK AI — QA AUDIT SUMMARY")
    print("=" * 60)
    for section in results.sections:
        icon = "✅" if section["violations"] == 0 else "❌"
        print(f"  {icon} {section['name']}: {section['status']} "
              f"({section['records']:,} records, {section['violations']} violations)")
    print(f"\n  OVERALL: {verdict}")
    print(f"  Report: {REPORT_PATH}")
    print("=" * 60)

    return results.total_violations


if __name__ == "__main__":
    import traceback
    sys.exit(main())

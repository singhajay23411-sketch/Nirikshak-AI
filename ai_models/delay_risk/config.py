"""config.py

Configuration constants, feature definitions, validation schemas, and operational risk tier boundaries
for the Nirikshak-AI Delay Risk Detection module.
"""

from typing import List, Dict, Tuple

# Module Metadata
MODULE_NAME = "delay_risk"
MODULE_VERSION = "1.0.0"
UNIFIED_RISK_WEIGHT = 0.15  # Contributes exactly 15% to Nirikshak-AI Unified Risk Score

# Statutory MoSPI Benchmarks
STATUTORY_SANCTION_LIMIT_DAYS = 45  # Administrative sanction turnaround guideline
BENCHMARK_EXECUTION_DAYS = 365       # Standard execution window (1 calendar year / 365 days)

# Valid Observation Modes
VALID_MODES = ["initiation", "early_progress"]

# Canonical 17 ML-Safe Feature Names in Exact Model Matrix Order
FEATURE_NAMES: List[str] = [
    "recom_to_sanc_days",
    "sanction_year",
    "sanction_month",
    "sanction_quarter",
    "sanction_dayofweek",
    "log_sanction_amount",
    "log_recommended_amount",
    "recom_sanc_amount_diff",
    "recom_sanc_amount_ratio",
    "category_code",
    "house_type_code",
    "tenure_code",
    "state_id_code",
    "constituency_id_code",
    "exp_count_90d",
    "disbursed_amount_90d",
    "disbursed_ratio_90d",
]

# Strict Leakage Quarantine List (MUST NEVER BE USED AS MODEL PREDICTORS)
FORBIDDEN_LEAKAGE_COLUMNS: List[str] = [
    "is_delayed",
    "completion_duration_days",
    "actual_end_date",
    "actual_amount",
    "work_status",
    "work_stage",
    "record_hash",
    "updated_at",
]

# Operational Risk Tier Thresholds
# Tiers: LOW: 0–29.99, MODERATE: 30–49.99, HIGH: 50–69.99, CRITICAL: 70–100
RISK_TIERS: Dict[str, Tuple[float, float]] = {
    "LOW": (0.0, 29.99),
    "MODERATE": (30.0, 49.99),
    "HIGH": (50.0, 69.99),
    "CRITICAL": (70.0, 100.0),
}

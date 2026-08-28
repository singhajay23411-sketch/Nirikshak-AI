"""config.py

Configuration constants, feature definitions, statistical priors, and operational risk tier boundaries
for the Nirikshak-AI Agency Intelligence & Agency Risk Scoring module (Phase 6 Revised Architecture).
"""

from typing import List, Dict, Tuple

# Module Metadata
MODULE_NAME = "agency_intelligence"
MODULE_VERSION = "2.0.0"
UNIFIED_RISK_WEIGHT = 0.05  # Contributes exactly 5% to Nirikshak-AI Unified Risk Score (Max 5.0 points)

# Statutory Benchmarks & Mature Baseline References (17th Lok Sabha Baseline)
STATUTORY_DELAY_THRESHOLD_DAYS = 365  # Execution window threshold (1 calendar year)
MATURE_BASELINE_DELAY_RATE = 0.364805  # 17th Lok Sabha historical project delay rate (36.48%)
MATURE_BASELINE_MEDIAN_DAYS = 252.0    # 17th Lok Sabha median completion duration (252.0 days)
MATURE_BASELINE_MEAN_DAYS = 302.56     # 17th Lok Sabha mean completion duration (302.56 days)

# Re-Calibrated Empirical Bayes Beta-Binomial Prior Parameters
# Anchored to true mature project baseline (36.48%) with robust sample prior strength M = 5.0
EB_PRIOR_MEAN = 0.364805
EB_PRIOR_WEIGHT = 5.0000   # Equivalent sample strength (M = alpha + beta)
EB_PRIOR_ALPHA = 1.824025  # alpha = mu * M
EB_PRIOR_BETA = 3.175975   # beta = (1 - mu) * M

# Neutral Baseline Agency Score
# Calibrated score corresponding to an entity executing exactly at national mature baseline (36.48%)
NEUTRAL_BASELINE_SCORE = 45.00

# Adaptive Confidence Hierarchy Architecture Parameters (IDA Anchor + IA Credibility Modifier)
IDA_BASE_WEIGHT_MIN = 0.70          # District Nodal Authority base anchor is always at least 70%
IA_MAX_CREDIBILITY_WEIGHT = 0.30     # Specific Implementing Agency contributes at most 30%
IA_CREDIBILITY_HALF_LIFE_N = 20.0   # Sample size where IA achieves half of maximum credibility weight

# Data Confidence Tiers & Reliability Modulation Weights
# Modulates low-sample agency scores toward neutral baseline to prevent false alarms
DATA_CONFIDENCE_THRESHOLDS: Dict[str, Tuple[int, float]] = {
    "Strong": (100, 1.00),     # N >= 100: Pure empirical score (100% data weight)
    "Moderate": (20, 0.85),    # 20 <= N < 100: 85% data weight, 15% neutral baseline
    "Low": (5, 0.60),          # 5 <= N < 20: 60% data weight, 40% neutral baseline
    "Very Low": (0, 0.30),     # N < 5: 30% data weight, 70% neutral baseline
}

# Operational Agency Risk Tier Thresholds (0 to 100 scale)
# Calibrated for government infrastructure monitoring
RISK_TIERS: Dict[str, Tuple[float, float]] = {
    "LOW": (0.0, 29.99),
    "MODERATE": (30.0, 49.99),
    "HIGH": (50.0, 69.99),
    "CRITICAL": (70.0, 100.0),
}

# Strict Leakage Quarantine List (MUST NEVER BE USED IN LIVE AGENCY INFERENCE)
FORBIDDEN_LEAKAGE_COLUMNS: List[str] = [
    "actual_end_date",
    "actual_end_dt",
    "actual_amount",
    "is_delayed",
    "completion_duration_days",
    "record_hash",
    "updated_at",
]

# Canonical Agency Types
VALID_AGENCY_TYPES: List[str] = [
    "Corporation/PSU",
    "Panchayat",
    "Cooperative",
    "PWD",
    "Engineering Department",
    "Municipal body",
    "Line Department/Officer",
    "Other",
]

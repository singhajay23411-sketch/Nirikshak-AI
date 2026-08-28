"""Agency Intelligence & Agency Risk Scoring Module for Nirikshak-AI.

Provides canonical entity resolution, empirical Bayes historical performance profiling,
point-in-time workload concurrency tracking, and transparent 0-100 Agency Risk scoring.
"""

from .config import (
    MODULE_NAME,
    MODULE_VERSION,
    UNIFIED_RISK_WEIGHT,
    RISK_TIERS,
    STATUTORY_DELAY_THRESHOLD_DAYS,
    MATURE_BASELINE_DELAY_RATE,
    MATURE_BASELINE_MEDIAN_DAYS,
)
from .canonicalization import (
    canonicalize_ia,
    canonicalize_ida,
    clean_branch,
)
from .profiling import (
    build_agency_profiles,
)
from .scoring import (
    AgencyRiskScorer,
    AgencyRiskResult,
)
from .explainability import (
    generate_agency_risk_factors,
)

__all__ = [
    "MODULE_NAME",
    "MODULE_VERSION",
    "UNIFIED_RISK_WEIGHT",
    "RISK_TIERS",
    "STATUTORY_DELAY_THRESHOLD_DAYS",
    "MATURE_BASELINE_DELAY_RATE",
    "MATURE_BASELINE_MEDIAN_DAYS",
    "canonicalize_ia",
    "canonicalize_ida",
    "clean_branch",
    "build_agency_profiles",
    "AgencyRiskScorer",
    "AgencyRiskResult",
    "generate_agency_risk_factors",
]

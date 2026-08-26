"""FinGuard Analytics Engine Package.

Provides clean activity and tenure normalisation, expenditure aggregation,
hierarchical cost benchmarking, and explainable modular risk scoring.
"""

from .cleaner import clean_activity_name, normalize_tenure
from .rules import (
    compute_expenditure_metrics,
    compute_vendor_concentration,
    compute_disbursement_rules,
    compute_cost_overrun
)
from .benchmarkers import benchmark_costs
from .scoring import (
    FinGuardScoringEngine,
    RiskSignal,
    ComponentScorer,
    DisbursementScorer,
    CostBenchmarkScorer,
    DuplicateExpenditureScorer,
    VendorConcentrationScorer
)
from .models import (
    ProjectContext,
    Evidence,
    Signal,
    VerificationResult,
    Assessment,
    FinGuardResult,
    CATEGORY_FINANCIAL,
    CATEGORY_DATA_INTEGRITY,
    CATEGORY_EXPENDITURE,
    CATEGORY_VENDOR,
    CATEGORY_BENCHMARK,
    CATEGORY_VERIFICATION,
    STATUS_UNVERIFIED,
    STATUS_VERIFIED,
    STATUS_DISPROVED,
    STATUS_MATCHED,
    STATUS_CONTRADICTED,
    STATUS_CHANGED,
    STATUS_UNABLE_TO_VERIFY,
    STATUS_NOT_REQUIRED,
    STATUS_NOT_YET_VERIFIED,
    SEVERITY_LOW,
    SEVERITY_MEDIUM,
    SEVERITY_HIGH,
    SEVERITY_CRITICAL,
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    PRIORITY_HIGH,
    PRIORITY_CRITICAL
)


"""explainability.py

Predictive signal explanation engine for the Delay Risk Detection module.
Translates project feature vectors and ML predictions into actionable, non-causal risk indicators.
All explanations use observational wording (e.g. 'predictive signal', 'associated with higher predicted delay risk').
"""

from typing import Dict, Any, List
from .config import STATUTORY_SANCTION_LIMIT_DAYS


def generate_predictive_risk_factors(
    feature_dict: Dict[str, Any],
    mode: str = "early_progress"
) -> List[str]:
    """Generate human-readable predictive risk factors based on feature values.

    Args:
        feature_dict: Dictionary of project feature values.
        mode: Observation mode ('initiation' or 'early_progress').

    Returns:
        List of explanatory risk indicator strings phrased as predictive signals.
    """
    signals: List[str] = []

    # 1. Pre-sanction administrative lag
    recom_to_sanc = feature_dict.get("recom_to_sanc_days", 0)
    if recom_to_sanc > STATUTORY_SANCTION_LIMIT_DAYS * 2:  # > 90 days
        signals.append(
            f"Elevated pre-sanction administrative lag ({int(recom_to_sanc)} days vs {STATUTORY_SANCTION_LIMIT_DAYS}-day statutory guideline) is a predictive signal of execution friction"
        )
    elif recom_to_sanc > STATUTORY_SANCTION_LIMIT_DAYS:
        signals.append(
            f"Pre-sanction administrative turnaround exceeded statutory {STATUTORY_SANCTION_LIMIT_DAYS}-day limit"
        )

    # 2. Early disbursement velocity (evaluated in early_progress mode)
    if mode == "early_progress":
        disbursed_ratio = feature_dict.get("disbursed_ratio_90d", 0.0)
        exp_count_90d = feature_dict.get("exp_count_90d", 0)
        if disbursed_ratio < 0.05 and exp_count_90d == 0:
            signals.append(
                "Zero contractor fund disbursement within 90 days of administrative sanction is associated with elevated delay risk"
            )
        elif disbursed_ratio < 0.10:
            signals.append(
                "Low early disbursement velocity (<10% of sanctioned budget at 90 days) indicates slow initial contractor mobilization"
            )

    # 3. Budget scale & complexity
    log_sanc_amt = feature_dict.get("log_sanction_amount", 0.0)
    if log_sanc_amt > 13.5:  # > ~₹7.5 Lakhs
        signals.append(
            "High capital expenditure scale requiring multi-stage engineering execution is associated with higher baseline completion risk"
        )

    # 4. Budget revision variance
    recom_sanc_ratio = feature_dict.get("recom_sanc_amount_ratio", 1.0)
    if recom_sanc_ratio > 1.25:
        signals.append(
            "Significant upward budget revision (>25% increase over recommended amount) indicates scope re-estimation during approval"
        )
    elif recom_sanc_ratio < 0.75:
        signals.append(
            "Substantial budget truncation (>25% reduction below requested amount) may constrain execution scope"
        )

    # 5. Seasonality / monsoon timing
    month = feature_dict.get("sanction_month", 1)
    if month in [6, 7, 8]:
        signals.append(
            "Sanction approved during monsoon quarter with historical outdoor civil construction constraints"
        )

    # Default fallback
    if not signals:
        signals.append(
            "Project parameters align with standard historical execution baselines"
        )

    return signals

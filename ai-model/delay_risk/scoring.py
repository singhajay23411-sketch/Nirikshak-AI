"""scoring.py

Production Delay Risk Scorer for Nirikshak-AI.
Transforms machine learning delay probabilities into continuous 0-100 Delay Risk Scores,
maps them to operational risk tiers, and computes the 15% contribution interface for the Unified Risk Engine.
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime, date
import numpy as np
import pandas as pd

from shared.types import RiskLevel
from .config import (
    UNIFIED_RISK_WEIGHT,
    RISK_TIERS,
    FEATURE_NAMES,
    FORBIDDEN_LEAKAGE_COLUMNS,
    VALID_MODES,
)
from .model import DelayRiskMLModel
from .explainability import generate_predictive_risk_factors

# Critical target outcome and audit leakage fields that must trigger immediate rejection
CRITICAL_TARGET_LEAKAGE = [
    "is_delayed",
    "actual_end_date",
    "actual_amount",
    "completion_duration_days",
    "record_hash",
    "updated_at",
]


def parse_date(val: Any) -> Optional[pd.Timestamp]:
    """Safely parse date values into pandas Timestamp."""
    if val is None or pd.isna(val) or val == "":
        return None
    if isinstance(val, (datetime, date, pd.Timestamp)):
        return pd.to_datetime(val)
    try:
        return pd.to_datetime(val, errors="raise")
    except Exception:
        raise ValueError(f"Invalid date format: '{val}'. Expected ISO format (YYYY-MM-DD) or standard date string.")


def validate_input_payload(project_data: Dict[str, Any]) -> None:
    """Strictly validate the input project data for forbidden leakage and missing essentials.

    Raises:
        ValueError: If forbidden leakage attributes or invalid configurations are present.
    """
    # 1. Check for critical target outcome and audit leakage
    detected_leakage = [k for k in CRITICAL_TARGET_LEAKAGE if k in project_data and project_data[k] is not None]
    if detected_leakage:
        raise ValueError(
            f"LEAKAGE VIOLATION: Forbidden target outcome attributes detected in scoring input: {detected_leakage}. "
            "These fields must NEVER enter the prediction pipeline."
        )

    # 2. Validate observation mode
    mode = project_data.get("mode", "early_progress")
    if mode not in VALID_MODES:
        raise ValueError(
            f"Invalid observation mode: '{mode}'. Supported modes are: {VALID_MODES}"
        )

    # 3. Validate financial amounts if provided
    for amt_field in ["sanction_amount", "recommended_amount"]:
        if amt_field in project_data and project_data[amt_field] is not None:
            try:
                amt = float(project_data[amt_field])
            except (TypeError, ValueError) as e:
                raise ValueError(f"Invalid numerical value for '{amt_field}': {project_data[amt_field]}") from e
            if amt < 0:
                raise ValueError(f"Invalid negative amount for '{amt_field}': {amt}")


def extract_features_from_dict(
    project_data: Dict[str, Any],
    mode: str = "early_progress",
    as_of_date: Optional[Any] = None
) -> Dict[str, Any]:
    """Transform raw project payload into the canonical 17 ML-safe features.

    Adheres strictly to the observation time boundary:
    - Mode 'initiation': t_obs = sanction_date. No post-sanction expenditures used.
    - Mode 'early_progress': t_obs = sanction_date + 90 days. Only expenditures <= t_obs used.
    - Any auxiliary database attributes (e.g. work_status, work_stage) are explicitly quarantined and excluded.
    """
    validate_input_payload(project_data)

    sanc_dt = parse_date(project_data.get("sanction_date"))
    recom_dt = parse_date(project_data.get("recommendation_date"))

    effective_sanc_dt = sanc_dt or recom_dt or pd.Timestamp("2024-01-01")

    # 1. Pre-sanction administrative lag
    if sanc_dt is not None and recom_dt is not None:
        recom_to_sanc_days = float(max(0, (sanc_dt - recom_dt).days))
    else:
        recom_to_sanc_days = 90.0

    # 2-5. Calendar temporal indicators
    sanction_year = int(effective_sanc_dt.year)
    sanction_month = int(effective_sanc_dt.month)
    sanction_quarter = int(effective_sanc_dt.quarter)
    sanction_dayofweek = int(effective_sanc_dt.dayofweek)

    # 6-9. Financial scale and cost revisions
    sanc_amt = float(project_data.get("sanction_amount") or 350000.0)
    sanc_amt = max(0.0, sanc_amt)
    recom_amt = float(project_data.get("recommended_amount") or sanc_amt)
    recom_amt = max(0.0, recom_amt)

    log_sanction_amount = float(np.log1p(sanc_amt))
    log_recommended_amount = float(np.log1p(recom_amt))
    recom_sanc_amount_diff = float(sanc_amt - recom_amt)
    recom_sanc_amount_ratio = float(np.clip(sanc_amt / recom_amt if recom_amt > 0 else 1.0, 0.1, 10.0))

    # 10-14. Categorical and jurisdictional codes
    cat_val = str(project_data.get("work_category", "Normal")).lower()
    if "repair" in cat_val:
        category_code = 1
    elif "trust" in cat_val:
        category_code = 2
    else:
        category_code = 0

    house_type_code = int(project_data.get("house_type", 2))
    tenure_val = str(project_data.get("tenure", "18th LS"))
    tenure_code = 1 if "18th" in tenure_val else (0 if "17th" in tenure_val else 2)
    state_id_code = int(project_data.get("state_id", 0))
    constituency_id_code = int(project_data.get("constituency_id", 0))

    # 15-17. Bounded 90-day expenditure features
    if mode == "initiation" or sanc_dt is None:
        exp_count_90d = 0
        disbursed_amount_90d = 0.0
        disbursed_ratio_90d = 0.0
    else:
        cutoff_date = sanc_dt + pd.Timedelta(days=90)
        raw_expenditures = project_data.get("expenditures", [])
        
        # Support total_disbursed shorthand if raw expenditures list not passed
        if not raw_expenditures and "total_disbursed" in project_data:
            total_d = float(project_data.get("total_disbursed", 0.0))
            if total_d > 0:
                raw_expenditures = [{"expenditure_date": sanc_dt + pd.Timedelta(days=30), "fund_disbursed_amount": total_d}]

        valid_disbursements = []
        for exp in raw_expenditures:
            exp_date = parse_date(exp.get("expenditure_date"))
            amt = float(exp.get("fund_disbursed_amount", 0.0))
            if exp_date is not None and exp_date <= cutoff_date and amt > 0:
                valid_disbursements.append(amt)
            elif exp_date is None and amt > 0:
                valid_disbursements.append(amt)

        exp_count_90d = len(valid_disbursements)
        disbursed_amount_90d = float(sum(valid_disbursements))
        sanc_denom = max(1.0, sanc_amt)
        disbursed_ratio_90d = float(np.clip(disbursed_amount_90d / sanc_denom, 0.0, 2.0))

    return {
        "recom_to_sanc_days": recom_to_sanc_days,
        "sanction_year": sanction_year,
        "sanction_month": sanction_month,
        "sanction_quarter": sanction_quarter,
        "sanction_dayofweek": sanction_dayofweek,
        "log_sanction_amount": log_sanction_amount,
        "log_recommended_amount": log_recommended_amount,
        "recom_sanc_amount_diff": recom_sanc_amount_diff,
        "recom_sanc_amount_ratio": recom_sanc_amount_ratio,
        "category_code": category_code,
        "house_type_code": house_type_code,
        "tenure_code": tenure_code,
        "state_id_code": state_id_code,
        "constituency_id_code": constituency_id_code,
        "exp_count_90d": exp_count_90d,
        "disbursed_amount_90d": disbursed_amount_90d,
        "disbursed_ratio_90d": disbursed_ratio_90d,
    }


class DelayRiskResultPayload(dict):
    """Dictionary-subclass payload providing both dictionary key access and attribute access."""

    def __init__(self, data: Dict[str, Any]):
        super().__init__(data)
        self.__dict__.update(data)
        self.delay_risk = int(round(data.get("delay_risk_score", 0.0)))
        tier_val = data.get("delay_risk_tier", "LOW")
        self.risk_level = RiskLevel(tier_val) if hasattr(RiskLevel, tier_val) else RiskLevel.LOW
        self.reasons = data.get("top_risk_factors", [])
        self.status = (
            "CRITICALLY_DELAYED" if tier_val == "CRITICAL"
            else "LIKELY_DELAYED" if tier_val == "HIGH"
            else "APPROACHING_DEADLINE" if tier_val == "MODERATE"
            else "ON_TRACK"
        )
        self.metrics = {
            "delay_probability": data.get("delay_probability"),
            "delay_risk_score": data.get("delay_risk_score"),
            "unified_risk_contribution": data.get("unified_risk_contribution"),
            "mode": data.get("mode"),
        }

    def to_dict(self) -> Dict[str, Any]:
        return dict(self)


class DelayRiskScorer:
    """Production Delay Risk Scorer for Nirikshak-AI backend services."""

    def __init__(self, model: Optional[DelayRiskMLModel] = None):
        self.model = model or DelayRiskMLModel()

    def map_score_to_tier(self, score: float) -> str:
        """Map a continuous 0-100 Delay Risk Score to its operational risk tier.

        Tiers:
          - LOW:      0.00 – 29.99
          - MODERATE: 30.00 – 49.99
          - HIGH:     50.00 – 69.99
          - CRITICAL: 70.00 – 100.00
        """
        if score < 30.0:
            return "LOW"
        elif score < 50.0:
            return "MODERATE"
        elif score < 70.0:
            return "HIGH"
        else:
            return "CRITICAL"

    def assess_project(
        self,
        project_data: Dict[str, Any],
        as_of_date: Optional[Any] = None
    ) -> DelayRiskResultPayload:
        """Score a single project payload and return standardized risk payload.

        Args:
            project_data: Dictionary containing work attributes and optional expenditures.
            as_of_date: Optional reference evaluation date.

        Returns:
            DelayRiskResultPayload conforming to the Delay Risk API contract.
        """
        mode = project_data.get("mode", "early_progress")
        work_id = project_data.get("work_id", 0)

        # 1. Extract 17 canonical features respecting observation mode
        features = extract_features_from_dict(project_data, mode=mode, as_of_date=as_of_date)

        # 2. Predict probability from validated ML model
        prob = self.model.predict_delay_probability(features)

        # 3. Calculate continuous 0-100 Delay Risk Score
        score = float(np.clip(prob * 100.0, 0.0, 100.0))

        # 4. Determine operational tier
        tier = self.map_score_to_tier(score)

        # 5. Compute future 15% contribution to Unified Risk Score
        unified_contrib = float(round(score * UNIFIED_RISK_WEIGHT, 2))

        # 6. Generate non-causal predictive signals
        top_signals = generate_predictive_risk_factors(features, mode=mode)

        payload_dict = {
            "work_id": work_id,
            "mode": mode,
            "delay_probability": round(prob, 4),
            "delay_risk_score": round(score, 2),
            "delay_risk_tier": tier,
            "risk_weight": UNIFIED_RISK_WEIGHT,
            "unified_risk_contribution": unified_contrib,
            "top_risk_factors": top_signals,
        }

        return DelayRiskResultPayload(payload_dict)

    def assess_batch(
        self,
        projects: List[Dict[str, Any]],
        mode: str = "early_progress"
    ) -> List[DelayRiskResultPayload]:
        """Score a batch of project payloads."""
        results = []
        for p in projects:
            p_copy = dict(p)
            if "mode" not in p_copy:
                p_copy["mode"] = mode
            results.append(self.assess_project(p_copy))
        return results

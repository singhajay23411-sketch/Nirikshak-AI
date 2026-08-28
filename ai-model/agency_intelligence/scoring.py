"""scoring.py

Production Agency Risk Scoring Engine for Nirikshak-AI (Phase 6 Revised Architecture).
Transforms validated agency signals into deterministic 0-100 Agency Risk Scores,
operational risk tiers, explainable audit factors, and 5% Unified Risk contributions.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import numpy as np
import pandas as pd

from .config import (
    MODULE_NAME,
    MODULE_VERSION,
    UNIFIED_RISK_WEIGHT,
    NEUTRAL_BASELINE_SCORE,
    RISK_TIERS,
    EB_PRIOR_ALPHA,
    EB_PRIOR_BETA,
    MATURE_BASELINE_DELAY_RATE,
    MATURE_BASELINE_MEDIAN_DAYS,
    IDA_BASE_WEIGHT_MIN,
    IA_MAX_CREDIBILITY_WEIGHT,
    IA_CREDIBILITY_HALF_LIFE_N,
)
from .signals import (
    calibrate_agency_risk_score,
    normalize_performance_component,
    normalize_speed_component,
    normalize_workload_component,
    compute_baseline_delay_gap,
    compute_speed_gap_days,
    get_confidence_weight,
    compute_adaptive_ia_weight,
)
from .explainability import generate_agency_risk_factors


@dataclass
class AgencyRiskResult:
    """Standardized output result returned by Agency Intelligence Scoring Engine."""
    agency_id: str
    agency_name: str
    agency_level: str  # "IA" or "IDA"
    agency_type: str
    agency_branch: str
    completed_project_count: int
    data_confidence: str  # "Strong", "Moderate", "Low", "Very Low"
    shrunken_delay_rate: float
    baseline_delay_gap: float
    speed_gap_days: Optional[float]
    workload_pressure: float
    agency_risk_score: float  # 0.0 to 100.0
    agency_risk_tier: str     # "LOW", "MODERATE", "HIGH", "CRITICAL"
    risk_weight: float = UNIFIED_RISK_WEIGHT  # 0.05
    unified_risk_contribution: float = 0.0     # 0.0 to 5.0
    risk_factors: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agency_id": self.agency_id,
            "agency_name": self.agency_name,
            "agency_level": self.agency_level,
            "agency_type": self.agency_type,
            "agency_branch": self.agency_branch,
            "completed_project_count": self.completed_project_count,
            "data_confidence": self.data_confidence,
            "shrunken_delay_rate": round(self.shrunken_delay_rate, 4),
            "baseline_delay_gap": round(self.baseline_delay_gap, 4),
            "speed_gap_days": round(self.speed_gap_days, 1) if self.speed_gap_days is not None else None,
            "workload_pressure": round(self.workload_pressure, 2),
            "agency_risk_score": round(self.agency_risk_score, 2),
            "agency_risk_tier": self.agency_risk_tier,
            "risk_weight": self.risk_weight,
            "unified_risk_contribution": round(self.unified_risk_contribution, 3),
            "risk_factors": self.risk_factors,
            "metrics": self.metrics,
        }


class AgencyRiskScorer:
    """Production scoring engine for Agency Intelligence (Phase 6 Architecture)."""

    def __init__(self):
        self.module_name = MODULE_NAME
        self.version = MODULE_VERSION

    @staticmethod
    def map_score_to_tier(score: float) -> str:
        """Map continuous 0-100 Agency Risk Score to operational risk tier."""
        for tier, (low, high) in RISK_TIERS.items():
            if low <= score <= high:
                return tier
        return "CRITICAL" if score >= 100.0 else "LOW"

    def score_agency(
        self,
        agency_name: Optional[str],
        agency_level: str = "IA",
        agency_type: str = "Other",
        agency_branch: str = "General",
        completed_projects: int = 0,
        delay_count: int = 0,
        median_duration_days: Optional[float] = None,
        workload_pressure: float = 1.0,
        distinct_vendors: int = 0,
        top_vendor_share: Optional[float] = None,
        data_confidence: Optional[str] = None
    ) -> AgencyRiskResult:
        """
        Compute deterministic Agency Risk Score for a single entity (IA or IDA).
        """
        # Handle missing or invalid entity identity
        if not agency_name or agency_name == "UNKNOWN_AGENCY" or agency_name == "UNKNOWN_IDA":
            fallback_score = NEUTRAL_BASELINE_SCORE
            tier = self.map_score_to_tier(fallback_score)
            return AgencyRiskResult(
                agency_id="UNRESOLVED",
                agency_name=agency_name or "Unknown Agency",
                agency_level=agency_level,
                agency_type="Other",
                agency_branch="General",
                completed_project_count=0,
                data_confidence="Very Low",
                shrunken_delay_rate=MATURE_BASELINE_DELAY_RATE,
                baseline_delay_gap=0.0,
                speed_gap_days=None,
                workload_pressure=1.0,
                agency_risk_score=fallback_score,
                agency_risk_tier=tier,
                unified_risk_contribution=round(fallback_score * UNIFIED_RISK_WEIGHT, 3),
                risk_factors=["Agency identity is unlinked or unresolved; defaulted to neutral baseline."],
                metrics={"unresolved": True, "fallback": True}
            )

        # 1. Determine Confidence Tier if not passed
        if data_confidence is None:
            if completed_projects >= 100:
                data_confidence = "Strong"
            elif completed_projects >= 20:
                data_confidence = "Moderate"
            elif completed_projects >= 5:
                data_confidence = "Low"
            else:
                data_confidence = "Very Low"

        # 2. Compute Re-Calibrated Empirical Bayes Shrunken Delay Rate
        # Prior is anchored to true mature project baseline (36.48%) with sample strength M = 5.0
        shrunken_delay_rate = (delay_count + EB_PRIOR_ALPHA) / (completed_projects + EB_PRIOR_ALPHA + EB_PRIOR_BETA)

        # 3. Compute Calibrated Continuous Agency Risk Score [0.0, 100.0]
        calibrated_score = calibrate_agency_risk_score(shrunken_delay_rate)

        # 4. Data Confidence Modulation Guardrail
        # Smoothly pulls low-sample estimates toward Neutral Baseline Score (45.0)
        conf_weight = get_confidence_weight(data_confidence)
        final_score = (conf_weight * calibrated_score) + ((1.0 - conf_weight) * NEUTRAL_BASELINE_SCORE)
        final_score = float(np.clip(round(final_score, 2), 0.0, 100.0))

        # 5. Operational Tier and Unified Contribution
        tier = self.map_score_to_tier(final_score)
        unified_contribution = float(np.clip(round(final_score * UNIFIED_RISK_WEIGHT, 3), 0.0, 5.0))

        # 6. Comparative Gaps and Explainability Signals
        base_gap = compute_baseline_delay_gap(shrunken_delay_rate)
        speed_gap = compute_speed_gap_days(median_duration_days) if completed_projects > 0 else None
        speed_comp = normalize_speed_component(median_duration_days) if completed_projects > 0 else NEUTRAL_BASELINE_SCORE
        workload_comp = normalize_workload_component(workload_pressure)

        # 7. Explainability Risk Factors
        factors = generate_agency_risk_factors(
            shrunken_delay_rate=shrunken_delay_rate,
            baseline_delay_gap=base_gap,
            speed_gap_days=speed_gap,
            workload_pressure=workload_pressure,
            data_confidence=data_confidence,
            completed_projects=completed_projects,
            agency_type=agency_type,
            top_vendor_share=top_vendor_share
        )

        metrics = {
            "calibrated_performance_score": round(calibrated_score, 2),
            "speed_severity_score": round(speed_comp, 2),
            "workload_component": round(workload_comp, 2),
            "confidence_modulation_weight": conf_weight,
            "neutral_baseline_anchor": NEUTRAL_BASELINE_SCORE,
            "distinct_vendors": distinct_vendors,
            "top_vendor_share": round(top_vendor_share, 4) if top_vendor_share is not None else None,
        }

        return AgencyRiskResult(
            agency_id=f"{agency_level}_{agency_name.replace(' ', '_')[:32]}",
            agency_name=agency_name,
            agency_level=agency_level,
            agency_type=agency_type,
            agency_branch=agency_branch,
            completed_project_count=completed_projects,
            data_confidence=data_confidence,
            shrunken_delay_rate=shrunken_delay_rate,
            baseline_delay_gap=base_gap,
            speed_gap_days=speed_gap,
            workload_pressure=workload_pressure,
            agency_risk_score=final_score,
            agency_risk_tier=tier,
            unified_risk_contribution=unified_contribution,
            risk_factors=factors,
            metrics=metrics
        )

    def score_project(
        self,
        work_row: Dict[str, Any],
        ia_profile_lookup: Optional[Dict[str, Dict[str, Any]]] = None,
        ida_profile_lookup: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate Agency Risk for a project assignment using the Confidence-Adaptive Hierarchy.

        Architecture:
          - District Nodal Authority (IDA) acts as the Primary Governance Anchor (70% - 100% weight).
          - Executing Agency (IA) provides a specific execution modifier (0% - 30% weight),
            scaled smoothly by IA sample size credibility.
          - If IA is missing or unobserved, score defaults seamlessly to 100% IDA with no penalty.
        """
        raw_ia = work_row.get("ia_name")
        raw_ida = work_row.get("ida_name")

        ia_res = None
        has_valid_ia = False
        ia_completed_n = 0

        if raw_ia and ia_profile_lookup and raw_ia in ia_profile_lookup:
            p_data = ia_profile_lookup[raw_ia]
            ia_completed_n = p_data.get("completed_projects", 0)
            has_valid_ia = (p_data.get("canonical_agency_name") != "UNKNOWN_AGENCY")
            ia_res = self.score_agency(
                agency_name=p_data.get("canonical_agency_name", raw_ia),
                agency_level="IA",
                agency_type=p_data.get("agency_type", "Other"),
                agency_branch=p_data.get("ia_branch", "General"),
                completed_projects=ia_completed_n,
                delay_count=p_data.get("delay_count", 0),
                median_duration_days=p_data.get("median_duration_days"),
                workload_pressure=p_data.get("workload_pressure", 1.0),
                data_confidence=p_data.get("data_confidence"),
                top_vendor_share=p_data.get("top_vendor_share")
            )
        elif raw_ia:
            ia_res = self.score_agency(agency_name=raw_ia, agency_level="IA")
            has_valid_ia = (raw_ia not in ["UNKNOWN_AGENCY", "UNRESOLVED"])

        ida_res = None
        if raw_ida and ida_profile_lookup and raw_ida in ida_profile_lookup:
            p_data = ida_profile_lookup[raw_ida]
            ida_res = self.score_agency(
                agency_name=p_data.get("canonical_ida_name", raw_ida),
                agency_level="IDA",
                agency_type="District Authority",
                agency_branch=p_data.get("district", "General"),
                completed_projects=p_data.get("completed_projects", 0),
                delay_count=p_data.get("delay_count", 0),
                median_duration_days=p_data.get("median_duration_days"),
                workload_pressure=p_data.get("workload_pressure", 1.0),
                data_confidence=p_data.get("data_confidence")
            )
        elif raw_ida:
            ida_res = self.score_agency(agency_name=raw_ida, agency_level="IDA")

        # Confidence-Adaptive Blending Logic
        if ida_res and ia_res and has_valid_ia:
            ia_weight = compute_adaptive_ia_weight(ia_completed_n, has_valid_ia=True)
            ida_weight = 1.0 - ia_weight
            blended_score = round((ida_weight * ida_res.agency_risk_score) + (ia_weight * ia_res.agency_risk_score), 2)
            tier = self.map_score_to_tier(blended_score)
            contribution = round(blended_score * UNIFIED_RISK_WEIGHT, 3)

            primary_factors = [f"District Governance Anchor ({int(ida_weight*100)}% weight): {f}" for f in ida_res.risk_factors[:2]]
            if ia_weight > 0.05:
                primary_factors += [f"Executing IA Track Record ({int(ia_weight*100)}% weight): {f}" for f in ia_res.risk_factors[:2]]

            return {
                "work_id": work_row.get("work_id"),
                "agency_risk_score": blended_score,
                "agency_risk_tier": tier,
                "risk_weight": UNIFIED_RISK_WEIGHT,
                "unified_risk_contribution": contribution,
                "blending_weights": {
                    "ida_weight": round(ida_weight, 3),
                    "ia_weight": round(ia_weight, 3)
                },
                "ia_evaluation": ia_res.to_dict(),
                "ida_evaluation": ida_res.to_dict(),
                "primary_risk_factors": primary_factors
            }
        elif ida_res:
            return {
                "work_id": work_row.get("work_id"),
                "agency_risk_score": ida_res.agency_risk_score,
                "agency_risk_tier": ida_res.agency_risk_tier,
                "risk_weight": UNIFIED_RISK_WEIGHT,
                "unified_risk_contribution": ida_res.unified_risk_contribution,
                "blending_weights": {
                    "ida_weight": 1.0,
                    "ia_weight": 0.0
                },
                "ia_evaluation": ia_res.to_dict() if ia_res else None,
                "ida_evaluation": ida_res.to_dict(),
                "primary_risk_factors": [f"District Governance Anchor (100% weight): {f}" for f in ida_res.risk_factors]
            }
        elif ia_res:
            return {
                "work_id": work_row.get("work_id"),
                "agency_risk_score": ia_res.agency_risk_score,
                "agency_risk_tier": ia_res.agency_risk_tier,
                "risk_weight": UNIFIED_RISK_WEIGHT,
                "unified_risk_contribution": ia_res.unified_risk_contribution,
                "blending_weights": {
                    "ida_weight": 0.0,
                    "ia_weight": 1.0
                },
                "ia_evaluation": ia_res.to_dict(),
                "ida_evaluation": None,
                "primary_risk_factors": ia_res.risk_factors
            }
        else:
            fallback = NEUTRAL_BASELINE_SCORE
            return {
                "work_id": work_row.get("work_id"),
                "agency_risk_score": fallback,
                "agency_risk_tier": self.map_score_to_tier(fallback),
                "risk_weight": UNIFIED_RISK_WEIGHT,
                "unified_risk_contribution": round(fallback * UNIFIED_RISK_WEIGHT, 3),
                "blending_weights": {
                    "ida_weight": 0.5,
                    "ia_weight": 0.5
                },
                "ia_evaluation": None,
                "ida_evaluation": None,
                "primary_risk_factors": ["No agency data available; defaulted to neutral baseline."]
            }

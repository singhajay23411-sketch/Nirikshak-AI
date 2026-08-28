"""signals.py

Signal engineering and component transformation module for Agency Intelligence (Phase 6 Revised Architecture).
Computes mathematically bounded, standardized risk components and calibrated operational scores
from historical performance.
"""

from typing import Dict, Any, Optional, Union
import numpy as np
import pandas as pd
from .config import (
    MATURE_BASELINE_DELAY_RATE,
    MATURE_BASELINE_MEDIAN_DAYS,
    NEUTRAL_BASELINE_SCORE,
    DATA_CONFIDENCE_THRESHOLDS,
    IA_MAX_CREDIBILITY_WEIGHT,
    IA_CREDIBILITY_HALF_LIFE_N,
)


def calibrate_agency_risk_score(shrunken_delay_rate: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray]:
    """
    Transform empirical Bayes shrunken delay rate [0.0, 1.0] to calibrated continuous [0.0, 100.0] score.
    Supports both scalar float and numpy array / pandas Series.

    Calibration Anchors:
      0.00% delay rate          ->  0.00  (Minimum Risk)
      20.00% delay rate         -> 30.00  (Boundary of LOW tier)
      36.48% (Mature Baseline)  -> 45.00  (Neutral Baseline in MODERATE tier)
      55.00% delay rate         -> 65.00  (HIGH tier)
      70.00% delay rate         -> 80.00  (CRITICAL tier)
      100.00% delay rate        -> 100.00 (Maximum Risk)
    """
    is_scalar = np.isscalar(shrunken_delay_rate)
    r = np.asarray(shrunken_delay_rate, dtype=float)
    r = np.clip(np.nan_to_num(r, nan=MATURE_BASELINE_DELAY_RATE), 0.0, 1.0)

    condlist = [
        r <= 0.20,
        (r > 0.20) & (r <= MATURE_BASELINE_DELAY_RATE),
        (r > MATURE_BASELINE_DELAY_RATE) & (r <= 0.55),
        (r > 0.55) & (r <= 0.70),
    ]
    choicelist = [
        (r / 0.20) * 30.0,
        30.0 + ((r - 0.20) / (MATURE_BASELINE_DELAY_RATE - 0.20)) * 15.0,
        45.0 + ((r - MATURE_BASELINE_DELAY_RATE) / (0.55 - MATURE_BASELINE_DELAY_RATE)) * 20.0,
        65.0 + ((r - 0.55) / 0.15) * 15.0,
    ]
    default = np.clip(80.0 + ((r - 0.70) / 0.30) * 20.0, 80.0, 100.0)

    out = np.select(condlist, choicelist, default=default)
    return float(out) if is_scalar else out


def normalize_performance_component(shrunken_delay_rate: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray]:
    """
    Normalized performance component alias, returning calibrated 0-100 score.
    """
    return calibrate_agency_risk_score(shrunken_delay_rate)


def compute_adaptive_ia_weight(completed_projects: Union[int, np.ndarray, pd.Series], has_valid_ia: bool = True) -> Union[float, np.ndarray]:
    """
    Compute dynamic, confidence-adaptive weight for Implementing Agency (IA) modifier.

    Formula:
      w_IA = min(IA_MAX_CREDIBILITY_WEIGHT, (N / (N + IA_CREDIBILITY_HALF_LIFE_N)) * IA_MAX_CREDIBILITY_WEIGHT)
    """
    is_scalar = np.isscalar(completed_projects)
    n = np.asarray(completed_projects, dtype=float)
    if not has_valid_ia:
        return 0.0 if is_scalar else np.zeros_like(n)

    credibility = np.where(n > 0, n / (n + IA_CREDIBILITY_HALF_LIFE_N), 0.0)
    w = np.clip(credibility * IA_MAX_CREDIBILITY_WEIGHT, 0.0, IA_MAX_CREDIBILITY_WEIGHT)
    return float(w) if is_scalar else w


def normalize_speed_component(median_duration_days: Optional[float]) -> float:
    """
    Transform median completion duration (days) into speed severity score [0.0, 100.0].
    Used as an operational intelligence signal / explainability metric.
    """
    if median_duration_days is None or pd.isnull(median_duration_days) or median_duration_days <= 0:
        return NEUTRAL_BASELINE_SCORE
    if median_duration_days <= MATURE_BASELINE_MEDIAN_DAYS:
        return float((median_duration_days / MATURE_BASELINE_MEDIAN_DAYS) * 45.0)
    else:
        excess = median_duration_days - MATURE_BASELINE_MEDIAN_DAYS
        excess_score = np.clip((excess / 478.0) * 55.0, 0.0, 55.0)
        return float(45.0 + excess_score)


def normalize_workload_component(workload_pressure: Optional[float]) -> float:
    """
    Transform point-in-time workload pressure ratio (current / historical_median) to [20.0, 100.0].
    Used as an operational intelligence flag / explainability metric.
    """
    if workload_pressure is None or pd.isnull(workload_pressure) or workload_pressure <= 1.0:
        return 20.0
    scaled = 20.0 + (workload_pressure - 1.0) * 40.0
    return float(np.clip(scaled, 20.0, 100.0))


def compute_baseline_delay_gap(shrunken_delay_rate: float) -> float:
    """Calculate absolute difference between agency shrunken rate and mature 17th LS baseline."""
    if pd.isnull(shrunken_delay_rate):
        return 0.0
    return float(shrunken_delay_rate - MATURE_BASELINE_DELAY_RATE)


def compute_speed_gap_days(median_duration_days: Optional[float]) -> Optional[float]:
    """Calculate days difference between agency median duration and mature 17th LS baseline."""
    if median_duration_days is None or pd.isnull(median_duration_days):
        return None
    return float(median_duration_days - MATURE_BASELINE_MEDIAN_DAYS)


def get_confidence_weight(confidence_tier: str) -> float:
    """Return data reliability weight for confidence-aware score modulation."""
    return DATA_CONFIDENCE_THRESHOLDS.get(confidence_tier, (0, 0.30))[1]

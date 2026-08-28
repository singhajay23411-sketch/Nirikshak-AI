"""explainability.py

Explainability and audit factor generation engine for Agency Intelligence.
Generates concise, non-causal predictive intelligence statements for auditability.
"""

from typing import List, Optional
from .config import (
    MATURE_BASELINE_DELAY_RATE,
    MATURE_BASELINE_MEDIAN_DAYS,
)


def generate_agency_risk_factors(
    shrunken_delay_rate: float,
    baseline_delay_gap: float,
    speed_gap_days: Optional[float],
    workload_pressure: float,
    data_confidence: str,
    completed_projects: int,
    agency_type: str = "Other",
    top_vendor_share: Optional[float] = None
) -> List[str]:
    """
    Generate non-causal, objective audit factors explaining the Agency Risk Score.
    """
    factors: List[str] = []

    # 1. Historical Delay Performance Factors
    if data_confidence in ["Strong", "Moderate", "Low"]:
        if baseline_delay_gap > 0.15:
            factors.append(
                f"Historical delay performance is substantially elevated above mature baseline "
                f"(shrunken delay rate: {shrunken_delay_rate*100:.1f}%, baseline gap: +{baseline_delay_gap*100:.1f}%)."
            )
        elif baseline_delay_gap > 0.05:
            factors.append(
                f"Historical delay performance is moderately above mature baseline "
                f"(shrunken delay rate: {shrunken_delay_rate*100:.1f}%, baseline: {MATURE_BASELINE_DELAY_RATE*100:.1f}%)."
            )
        elif baseline_delay_gap < -0.15:
            factors.append(
                f"Historical execution demonstrates strong on-time reliability "
                f"(shrunken delay rate: {shrunken_delay_rate*100:.1f}%, well below {MATURE_BASELINE_DELAY_RATE*100:.1f}% baseline)."
            )
        elif baseline_delay_gap < -0.05:
            factors.append(
                f"Historical delay performance is below mature baseline "
                f"(shrunken delay rate: {shrunken_delay_rate*100:.1f}%)."
            )
        else:
            factors.append(
                f"Historical execution performance is in line with mature baseline "
                f"(shrunken delay rate: {shrunken_delay_rate*100:.1f}%)."
            )

    # 2. Execution Speed Severity Factors
    if speed_gap_days is not None and data_confidence in ["Strong", "Moderate", "Low"]:
        if speed_gap_days > 150.0:
            factors.append(
                f"Historical completion turnaround indicates chronic duration overruns "
                f"(median duration: {speed_gap_days + MATURE_BASELINE_MEDIAN_DAYS:.0f} days, +{speed_gap_days:.0f} days vs 252-day baseline)."
            )
        elif speed_gap_days < -60.0:
            factors.append(
                f"Demonstrated fast project turnaround "
                f"(median duration: {speed_gap_days + MATURE_BASELINE_MEDIAN_DAYS:.0f} days vs 252-day baseline)."
            )

    # 3. Workload Concurrency Pressure Factors
    if workload_pressure >= 2.0:
        factors.append(
            f"Active project workload is significantly elevated at {workload_pressure:.1f}x historical typical capacity, "
            f"indicating potential operational bottleneck risk."
        )
    elif workload_pressure >= 1.4:
        factors.append(
            f"Active project workload is moderately above historical typical capacity ({workload_pressure:.1f}x)."
        )

    # 4. Data Confidence & Sample Guardrail Factors
    if data_confidence == "Very Low":
        factors.append(
            f"Limited historical observations (N={completed_projects} completed projects); "
            f"score is safeguarded and stabilized toward neutral baseline via empirical Bayes shrinkage."
        )
    elif data_confidence == "Low":
        factors.append(
            f"Modest historical sample (N={completed_projects} completed projects); confidence weighting applied."
        )
    elif data_confidence == "Strong":
        factors.append(
            f"High statistical confidence supported by robust track record of {completed_projects:,} completed works."
        )

    # 5. Vendor Concentration Intelligence (Contextual)
    if top_vendor_share is not None and top_vendor_share >= 0.80 and completed_projects >= 10:
        factors.append(
            f"Expenditure records indicate high vendor concentration ({top_vendor_share*100:.1f}% disbursed to single primary contractor)."
        )

    return factors

"""
Nirikshak AI — Analytics Routes
=================================
Lightweight aggregation endpoints for dashboard and map visualisation.
All queries are pure SQL COUNT / SUM / GROUP BY — no ML inference.

Endpoints:
    GET /api/analytics/summary          — National KPI summary
    GET /api/analytics/states           — Per-state project & budget data (India Map)
    GET /api/analytics/risk-distribution — Project counts by risk tier
"""

import logging
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import psycopg2.extras

from backend.auth.routes import get_current_user
from backend.database import get_connection

# ─── Logging ───────────────────────────────────────────────────────────────────

log = logging.getLogger("nirikshak.analytics.routes")

# ─── Pydantic Response Models ──────────────────────────────────────────────────

class NationalSummaryResponse(BaseModel):
    total_projects: int
    total_sanctioned_cr: float          # in Crores (÷1e7)
    total_completed: int
    total_pending: int
    total_high_risk: int                # financial_risk_score ≥ 50
    total_moderate_risk: int            # 25 ≤ score < 50
    total_low_risk: int                 # score < 25
    utilization_rate_pct: float         # (total_disbursed / total_sanctioned) × 100


class StateAnalyticsItem(BaseModel):
    state_id: int
    state_name: str
    project_count: int
    total_allocated: float              # in Crores
    total_completed: int
    avg_risk_score: Optional[float] = None  # avg financial_risk_score


class RiskDistributionResponse(BaseModel):
    high_risk_count: int                # financial_risk_score ≥ 50
    moderate_risk_count: int            # 25 ≤ score < 50
    low_risk_count: int                 # score < 25
    total_scored: int
    high_risk_pct: float
    moderate_risk_pct: float
    low_risk_pct: float
    # Agency tier breakdown (from works_analytical_features)
    agency_high: int
    agency_moderate: int
    agency_low: int


# ─── Router ───────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ─── Helper ───────────────────────────────────────────────────────────────────

def _f(d) -> float:
    """Safely convert Decimal / None to float."""
    if d is None:
        return 0.0
    return float(d)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=NationalSummaryResponse)
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    """
    Return national KPI totals for the main dashboard.
    Sources: works table (status / amounts) + finguard_financial_anomalies (risk dist).
    """
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Works aggregate
        cur.execute("""
            SELECT
                COUNT(work_id)                                          AS total_projects,
                COALESCE(SUM(sanction_amount), 0)                      AS total_sanctioned,
                COALESCE(SUM(actual_amount), 0)                        AS total_disbursed,
                SUM(CASE WHEN work_status = 'Completed' THEN 1 ELSE 0 END) AS total_completed,
                SUM(CASE WHEN work_status != 'Completed' THEN 1 ELSE 0 END) AS total_pending
            FROM works;
        """)
        works_row = cur.fetchone()

        # Financial risk distribution from FinGuard table
        cur.execute("""
            SELECT
                SUM(CASE WHEN financial_risk_score >= 50 THEN 1 ELSE 0 END) AS high_risk,
                SUM(CASE WHEN financial_risk_score >= 25
                          AND financial_risk_score < 50 THEN 1 ELSE 0 END) AS moderate_risk,
                SUM(CASE WHEN financial_risk_score < 25 THEN 1 ELSE 0 END) AS low_risk
            FROM finguard_financial_anomalies;
        """)
        risk_row = cur.fetchone()

        total_sanctioned = _f(works_row["total_sanctioned"])
        total_disbursed  = _f(works_row["total_disbursed"])
        util_rate = (total_disbursed / total_sanctioned * 100) if total_sanctioned > 0 else 0.0

        cur.close()
        conn.close()

    except Exception as e:
        log.error(f"analytics/summary DB error: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    return NationalSummaryResponse(
        total_projects=int(works_row["total_projects"]),
        total_sanctioned_cr=round(total_sanctioned / 1e7, 2),
        total_completed=int(works_row["total_completed"]),
        total_pending=int(works_row["total_pending"]),
        total_high_risk=int(risk_row["high_risk"] or 0),
        total_moderate_risk=int(risk_row["moderate_risk"] or 0),
        total_low_risk=int(risk_row["low_risk"] or 0),
        utilization_rate_pct=round(util_rate, 2),
    )


@router.get("/states", response_model=List[StateAnalyticsItem])
async def get_state_analytics(current_user: dict = Depends(get_current_user)):
    """
    Return per-state aggregates for the India Map tooltip data.
    Joins works → states → works_analytical_features for avg risk score.
    """
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("""
            SELECT
                s.state_id,
                s.state_name,
                COUNT(w.work_id)                                            AS project_count,
                COALESCE(SUM(w.sanction_amount), 0) / 1e7                  AS total_allocated,
                SUM(CASE WHEN w.work_status = 'Completed' THEN 1 ELSE 0 END) AS total_completed,
                AVG(f.financial_risk_score)                                 AS avg_risk_score
            FROM works w
            JOIN states s ON w.state_id = s.state_id
            LEFT JOIN finguard_financial_anomalies f ON w.work_id = f.work_id
            GROUP BY s.state_id, s.state_name
            ORDER BY project_count DESC;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

    except Exception as e:
        log.error(f"analytics/states DB error: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    return [
        StateAnalyticsItem(
            state_id=int(r["state_id"]),
            state_name=r["state_name"],
            project_count=int(r["project_count"]),
            total_allocated=round(_f(r["total_allocated"]), 2),
            total_completed=int(r["total_completed"]),
            avg_risk_score=round(_f(r["avg_risk_score"]), 2) if r["avg_risk_score"] is not None else None,
        )
        for r in rows
    ]


@router.get("/risk-distribution", response_model=RiskDistributionResponse)
async def get_risk_distribution(current_user: dict = Depends(get_current_user)):
    """
    Return project counts by financial risk tier and agency risk tier.
    Financial tier: from finguard_financial_anomalies.financial_risk_score.
    Agency tier: from works_analytical_features.agency_risk_tier.
    """
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Financial risk distribution
        cur.execute("""
            SELECT
                SUM(CASE WHEN financial_risk_score >= 50 THEN 1 ELSE 0 END) AS high_risk,
                SUM(CASE WHEN financial_risk_score >= 25
                          AND financial_risk_score < 50 THEN 1 ELSE 0 END) AS moderate_risk,
                SUM(CASE WHEN financial_risk_score < 25 THEN 1 ELSE 0 END) AS low_risk,
                COUNT(*) AS total_scored
            FROM finguard_financial_anomalies;
        """)
        fin_row = cur.fetchone()

        # Agency risk tier distribution
        cur.execute("""
            SELECT
                SUM(CASE WHEN agency_risk_tier = 'HIGH'     THEN 1 ELSE 0 END) AS agency_high,
                SUM(CASE WHEN agency_risk_tier = 'MODERATE' THEN 1 ELSE 0 END) AS agency_moderate,
                SUM(CASE WHEN agency_risk_tier = 'LOW'      THEN 1 ELSE 0 END) AS agency_low
            FROM works_analytical_features;
        """)
        agency_row = cur.fetchone()

        cur.close()
        conn.close()

    except Exception as e:
        log.error(f"analytics/risk-distribution DB error: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    high = int(fin_row["high_risk"] or 0)
    moderate = int(fin_row["moderate_risk"] or 0)
    low = int(fin_row["low_risk"] or 0)
    total = int(fin_row["total_scored"] or 0)

    return RiskDistributionResponse(
        high_risk_count=high,
        moderate_risk_count=moderate,
        low_risk_count=low,
        total_scored=total,
        high_risk_pct=round(high / total * 100, 2) if total > 0 else 0.0,
        moderate_risk_pct=round(moderate / total * 100, 2) if total > 0 else 0.0,
        low_risk_pct=round(low / total * 100, 2) if total > 0 else 0.0,
        agency_high=int(agency_row["agency_high"] or 0),
        agency_moderate=int(agency_row["agency_moderate"] or 0),
        agency_low=int(agency_row["agency_low"] or 0),
    )

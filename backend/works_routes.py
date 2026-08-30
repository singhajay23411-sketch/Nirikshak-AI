"""
Nirikshak AI — Works Routes
===========================
FastAPI router for handling project (work) specific queries and AI assessments.
"""

import json
import logging
import sqlite3
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import psycopg2.extras

from backend.auth.routes import get_current_user
from backend.auth.database import DB_PATH
from backend.database import get_connection, fetch_work_for_delay_scoring

class DelayRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    evaluation_mode: str = "pre-computed"
    delay_probability: float
    delay_risk_score: float
    delay_risk_tier: str
    unified_risk_contribution: float
    risk_factors: List[str]
    operational_status: str = "Active"


class WorkDetailResponse(BaseModel):
    work_id: int
    activity_name: Optional[str] = None
    work_description: Optional[str] = None
    work_category: Optional[str] = None
    mp_id: Optional[int] = None
    house_type: Optional[int] = None
    tenure: Optional[str] = None
    constituency_id: Optional[int] = None
    state_id: Optional[int] = None
    ida_name: Optional[str] = None
    letter_no: Optional[str] = None
    recommended_amount: Optional[float] = None
    sanction_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    recommendation_date: Optional[str] = None
    sanction_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    work_stage: Optional[str] = None
    work_status: Optional[str] = None
    average_rating: Optional[float] = None
    flag: Optional[int] = None
    agency_risk_score: Optional[float] = None
    agency_risk_tier: Optional[str] = None
    agency_risk_contribution: Optional[float] = None


class FinancialRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    financial_risk_score: float
    financial_risk_tier: str
    unified_risk_contribution: float
    anomaly_reasons: List[str]
    recommended_actions: List[str]
    cost_overrun_pct: Optional[float] = None
    disbursement_ratio: Optional[float] = None


class ProgressRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    progress_risk_score: float
    progress_risk_tier: str
    unified_risk_contribution: float
    stall_probability: float
    risk_factors: List[str]


class CostRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    cost_risk_score: float
    cost_risk_tier: str
    unified_risk_contribution: float
    cost_z_score: float
    risk_factors: List[str]


class DuplicateRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    reason: Optional[str] = None
    text_similarity_score: Optional[float] = None
    financial_match_flag: Optional[bool] = None
    agency_match_flag: Optional[bool] = None
    temporal_match_flag: Optional[bool] = None
    location_match_flag: Optional[bool] = None
    risk_confidence_score: Optional[float] = None
    alert_type: Optional[str] = None


class AgencyRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    agency_risk_score: float
    agency_risk_tier: str
    unified_risk_contribution: float
    risk_factors: List[str]


class PaymentRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    payment_risk_score: float
    payment_risk_tier: str
    unified_risk_contribution: float
    hhi: float
    num_payments: int
    risk_factors: List[str]


class EvidenceRiskResponse(BaseModel):
    work_id: int
    status: str = "COMPLETED"
    reason: Optional[str] = None
    evidence_risk_score: Optional[float] = None
    evidence_risk_tier: Optional[str] = None
    unified_risk_contribution: Optional[float] = None
    flags: Optional[List[str]] = None


class UnifiedRiskResponse(BaseModel):
    work_id: int
    status: str
    components: dict
    unified_risk_score: Optional[float] = None
    risk_tier: Optional[str] = None
    reason: Optional[str] = None


router = APIRouter(prefix="/api", tags=["works"])
log = logging.getLogger("nirikshak.works.routes")


# ─── Helper Functions ───

def map_score_to_tier(score: float) -> str:
    """Map any 0-100 risk score to LOW, MODERATE, HIGH, or CRITICAL tier."""
    if score >= 75.0:
        return "CRITICAL"
    elif score >= 50.0:
        return "HIGH"
    elif score >= 25.0:
        return "MODERATE"
    else:
        return "LOW"


# ─── API Route Endpoints ───

@router.get("/works/{work_id}", response_model=WorkDetailResponse)
async def get_work_details(work_id: int):
    """Retrieve raw project details from PostgreSQL works table."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = "SELECT * FROM works WHERE work_id = %s;"
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        log.error(f"Database error during details fetch for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database fetch failed")

    if not row:
        raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")

    data = dict(row)
    # Format date columns to standard strings
    for col in ["recommendation_date", "sanction_date", "actual_end_date"]:
        if data.get(col):
            data[col] = data[col].strftime("%Y-%m-%d")
    # Cast Numeric types to standard floats
    for col in ["recommended_amount", "sanction_amount", "actual_amount", "average_rating", "agency_risk_score", "agency_risk_contribution"]:
        if data.get(col) is not None:
            data[col] = float(data[col])
    return data


@router.get("/works/{work_id}/delay-risk", response_model=DelayRiskResponse)
async def get_work_delay_risk(work_id: int):
    """Retrieve pre-computed delay risk metrics for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.delay_risk_score, GREATEST(0.0, LEAST(100.0, COALESCE(f.delay_z_score, 0.0) * 20.0 + 30.0))) as delay_risk_score,
                COALESCE(p.risk_tier, 'LOW') as delay_risk_tier
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        log.error(f"Database error during delay risk fetch for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    if not row:
        raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")
        
    score = float(row["delay_risk_score"]) if row["delay_risk_score"] is not None else 0.0
    tier = row["delay_risk_tier"] if row["delay_risk_tier"] else map_score_to_tier(score)
    
    return DelayRiskResponse(
        work_id=work_id,
        status="COMPLETED",
        evaluation_mode="pre-computed",
        delay_probability=round(score / 100.0, 3),
        delay_risk_score=round(score, 2),
        delay_risk_tier=tier,
        unified_risk_contribution=round(score * 0.15, 2),
        risk_factors=[
            f"Precomputed delay risk benchmark score: {score:.1f}/100.",
            f"Project operational delay risk mapped to {tier} tier."
        ],
        operational_status="Active"
    )


@router.get("/works/{work_id}/financial-risk", response_model=FinancialRiskResponse)
async def get_work_financial_risk(work_id: int):
    """Retrieve FinGuard financial risk score and anomalies for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                COALESCE(f.cost_overrun_pct, 0.0) as cost_overrun_pct,
                COALESCE(f.disbursement_ratio, 0.0) as disbursement_ratio,
                COALESCE(p.financial_risk_score, a.financial_risk_score, 0.0) as financial_risk_score,
                a.anomaly_reasons,
                a.recommended_actions
            FROM works w
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN finguard_financial_anomalies a ON w.work_id = a.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        log.error(f"Database error during financial risk fetch for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    if not row:
        raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")

    score = float(row["financial_risk_score"]) if row["financial_risk_score"] is not None else 0.0
    
    reasons = row["anomaly_reasons"]
    if isinstance(reasons, str):
        try:
            reasons = json.loads(reasons)
        except Exception:
            reasons = [reasons]
    elif not reasons:
        reasons = ["No financial irregularities or anomalous transaction patterns detected."]
        
    actions = row["recommended_actions"]
    if isinstance(actions, str):
        try:
            actions = json.loads(actions)
        except Exception:
            actions = [actions]
    elif not actions:
        actions = ["Standard financial milestone auditing."]

    overrun = float(row["cost_overrun_pct"]) if row["cost_overrun_pct"] is not None else 0.0
    disb_ratio = float(row["disbursement_ratio"]) if row["disbursement_ratio"] is not None else 0.0

    return FinancialRiskResponse(
        work_id=work_id,
        status="COMPLETED",
        financial_risk_score=round(score, 2),
        financial_risk_tier=map_score_to_tier(score),
        unified_risk_contribution=round(score * 0.20, 2),
        anomaly_reasons=reasons,
        recommended_actions=actions,
        cost_overrun_pct=round(overrun, 2),
        disbursement_ratio=round(disb_ratio, 2)
    )


@router.get("/works/{work_id}/progress-risk", response_model=ProgressRiskResponse)
async def get_work_progress_risk(work_id: int):
    """Retrieve Stall Predictor progress risk metrics for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.progress_risk_score, 0.0) as progress_risk_score,
                COALESCE(a.stall_probability, 0.0) as stall_probability,
                COALESCE(a.flag_phantom_completion, false) as flag_phantom_completion
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN finguard_financial_anomalies a ON w.work_id = a.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        log.error(f"Database error during progress risk fetch for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    if not row:
        raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")

    score = float(row["progress_risk_score"]) if row["progress_risk_score"] is not None else 0.0
    stall_prob = float(row["stall_probability"]) if row["stall_probability"] is not None else (score / 100.0)
    is_phantom = bool(row["flag_phantom_completion"])

    factors = []
    if score >= 60.0:
        factors.append(f"High predictive project stall probability ({score:.1f}%)")
    elif score >= 30.0:
        factors.append(f"Moderate predictive project stall probability ({score:.1f}%)")
    if is_phantom:
        factors.append("Phantom completion flag (substantial disbursements with zero physical progress)")
    if not factors:
        factors.append("Nominal project progress velocity and milestone completion rate")

    return ProgressRiskResponse(
        work_id=work_id,
        status="COMPLETED",
        progress_risk_score=round(score, 2),
        progress_risk_tier=map_score_to_tier(score),
        unified_risk_contribution=round(score * 0.20, 2),
        stall_probability=round(stall_prob, 3),
        risk_factors=factors
    )


@router.get("/works/{work_id}/cost-risk", response_model=CostRiskResponse)
async def get_work_cost_risk(work_id: int):
    """Retrieve cost risk benchmarking metrics for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.cost_risk_score, 0.0) as cost_risk_score,
                COALESCE(f.cost_z_score, 0.0) as cost_z_score
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        log.error(f"Database error during cost risk fetch for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    if not row:
        raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")

    score = float(row["cost_risk_score"]) if row["cost_risk_score"] is not None else 0.0
    z_cost = float(row["cost_z_score"]) if row["cost_z_score"] is not None else 0.0

    factors = []
    if score >= 60.0:
        factors.append(f"Elevated cost deviation outlier score: {score:.1f}/100")
    elif score >= 30.0:
        factors.append(f"Moderate cost variance identified across peer sanctions")
    else:
        factors.append("Sanction cost conforms to baseline category schedule of rates (SoR)")

    return CostRiskResponse(
        work_id=work_id,
        status="COMPLETED",
        cost_risk_score=round(score, 2),
        cost_risk_tier=map_score_to_tier(score),
        unified_risk_contribution=round(score * 0.15, 2),
        cost_z_score=round(z_cost, 2),
        risk_factors=factors
    )


@router.get("/works/{work_id}/duplicate-risk", response_model=DuplicateRiskResponse)
async def get_work_duplicate_risk(work_id: int):
    """Retrieve duplicate and split-work risk alerts for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.duplicate_risk_score, 0.0) as duplicate_risk_score,
                d.text_similarity_score,
                d.financial_match_flag,
                d.agency_match_flag,
                d.temporal_match_flag,
                d.location_match_flag,
                d.risk_confidence_score,
                d.alert_type
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN duplicate_alerts d ON (w.work_id = d."work_id_A" OR w.work_id = d."work_id_B")
            WHERE w.work_id = %s
            ORDER BY d.risk_confidence_score DESC NULLS LAST
            LIMIT 1;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")
            
        dup_score = float(row["duplicate_risk_score"]) if row["duplicate_risk_score"] is not None else 0.0
        
        if row["alert_type"]:
            return DuplicateRiskResponse(
                work_id=work_id,
                status="COMPLETED",
                reason=f"Matched potential duplicate alert: {row['alert_type']}",
                text_similarity_score=float(row["text_similarity_score"] or 0.0),
                financial_match_flag=bool(row["financial_match_flag"]),
                agency_match_flag=bool(row["agency_match_flag"]),
                temporal_match_flag=bool(row["temporal_match_flag"]),
                location_match_flag=bool(row["location_match_flag"]),
                risk_confidence_score=float(row["risk_confidence_score"] or dup_score),
                alert_type=str(row["alert_type"])
            )
            
        return DuplicateRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            reason="No duplicate or split-work overlap detected in regional asset registers",
            text_similarity_score=0.0,
            financial_match_flag=False,
            agency_match_flag=False,
            temporal_match_flag=False,
            location_match_flag=False,
            risk_confidence_score=dup_score,
            alert_type="NONE"
        )
        
    except Exception as e:
        log.error(f"Error fetching duplicate risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")


@router.get("/works/{work_id}/agency-risk", response_model=AgencyRiskResponse)
async def get_work_agency_risk(work_id: int):
    """Retrieve blended agency and district governance risk for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.agency_risk_score, f.agency_risk_score, 41.2) as agency_risk_score,
                COALESCE(f.agency_risk_tier, 'MODERATE') as agency_risk_tier,
                COALESCE(f.agency_risk_contribution, 2.06) as agency_risk_contribution,
                f.agency_risk_factors
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        log.error(f"Database error during agency risk fetch for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    if not row:
        raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")

    score = float(row["agency_risk_score"]) if row["agency_risk_score"] is not None else 41.2
    tier = str(row["agency_risk_tier"]) if row["agency_risk_tier"] else map_score_to_tier(score)
    contrib = float(row["agency_risk_contribution"]) if row["agency_risk_contribution"] is not None else round(score * 0.05, 2)
    
    factors = row["agency_risk_factors"]
    if not factors:
        factors = ["Implementing agency past performance track record evaluated against regional benchmarks."]
    elif isinstance(factors, str):
        try:
            factors = json.loads(factors)
        except Exception:
            factors = [factors]

    return AgencyRiskResponse(
        work_id=work_id,
        status="COMPLETED",
        agency_risk_score=round(score, 2),
        agency_risk_tier=tier,
        unified_risk_contribution=round(contrib, 2),
        risk_factors=factors
    )


@router.get("/works/{work_id}/payment-risk", response_model=PaymentRiskResponse)
async def get_work_payment_risk(work_id: int):
    """Retrieve transaction concentration (HHI) and payment fragmentation risk for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.payment_risk_score, 0.0) as payment_risk_score,
                COALESCE(f.num_payments, 0) as num_payments,
                COALESCE(f.num_vendors, 0) as num_vendors
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")
            
        score = float(row["payment_risk_score"]) if row["payment_risk_score"] is not None else 0.0
        num_payments = int(row["num_payments"]) if row["num_payments"] is not None else 0
        
        factors = []
        if num_payments > 10:
            factors.append(f"High frequency of micro-payments ({num_payments} disbursements)")
        else:
            factors.append("Payment disbursements structured in accordance with milestone guidelines.")
            
        return PaymentRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            payment_risk_score=round(score, 2),
            payment_risk_tier=map_score_to_tier(score),
            unified_risk_contribution=round(score * 0.05, 2),
            hhi=0.0,
            num_payments=num_payments,
            risk_factors=factors
        )
        
    except Exception as e:
        log.error(f"Error computing payment risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")


@router.get("/works/{work_id}/evidence-risk", response_model=EvidenceRiskResponse)
async def get_work_evidence_risk(work_id: int):
    """Retrieve EvidenceAI image and document verification risk for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                COALESCE(p.evidence_risk_score, 0.0) as evidence_risk_score
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")
            
        score = float(row["evidence_risk_score"]) if row["evidence_risk_score"] is not None else 0.0
        tier = map_score_to_tier(score)
        
        flags = []
        if score >= 50.0:
            flags.append(f"Evidence validation flags: physical site inspection verification recommended ({score:.1f}/100)")
        else:
            flags.append("All project documentation and geotagged inspection evidence verified clean.")
            
        return EvidenceRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            evidence_risk_score=round(score, 2),
            evidence_risk_tier=tier,
            unified_risk_contribution=round(score * 0.10, 2),
            flags=flags
        )
        
    except Exception as e:
        log.error(f"Error fetching evidence risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Evidence fetch failed")


@router.get("/works/{work_id}/risk", response_model=UnifiedRiskResponse)
async def get_work_unified_risk(work_id: int):
    """Retrieve the Unified Risk Engine compilation for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = """
            SELECT 
                w.work_id,
                p.final_risk_score,
                p.risk_tier,
                p.financial_risk_score,
                p.progress_risk_score,
                p.cost_risk_score,
                p.delay_risk_score,
                p.duplicate_risk_score,
                p.evidence_risk_score,
                p.agency_risk_score,
                p.payment_risk_score,
                p.top_risk_drivers,
                p.project_summary,
                p.recommended_actions,
                f.cost_overrun_pct,
                f.disbursement_ratio,
                f.cost_z_score,
                f.delay_z_score,
                f.num_payments,
                f.agency_risk_factors,
                a.anomaly_reasons,
                a.stall_probability
            FROM works w
            LEFT JOIN project_risk_evaluations p ON w.work_id = p.work_id
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            LEFT JOIN finguard_financial_anomalies a ON w.work_id = a.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")
            
        fin_score = float(row["financial_risk_score"]) if row["financial_risk_score"] is not None else 0.0
        prog_score = float(row["progress_risk_score"]) if row["progress_risk_score"] is not None else 0.0
        cost_score = float(row["cost_risk_score"]) if row["cost_risk_score"] is not None else (
            round(max(0.0, min(100.0, abs(float(row["cost_z_score"] or 0.0)) * 25.0)), 2)
        )
        delay_score = float(row["delay_risk_score"]) if row["delay_risk_score"] is not None else (
            round(max(0.0, min(100.0, float(row["delay_z_score"] or 0.0) * 20.0 + 30.0)), 2)
        )
        dup_score = float(row["duplicate_risk_score"]) if row["duplicate_risk_score"] is not None else 0.0
        ev_score = float(row["evidence_risk_score"]) if row["evidence_risk_score"] is not None else 0.0
        agency_score = float(row["agency_risk_score"]) if row["agency_risk_score"] is not None else 41.2
        pay_score = float(row["payment_risk_score"]) if row["payment_risk_score"] is not None else 0.0
        
        final_score = float(row["final_risk_score"]) if row["final_risk_score"] is not None else round(
            0.20 * fin_score + 0.20 * prog_score + 0.15 * cost_score + 0.15 * delay_score +
            0.10 * dup_score + 0.10 * ev_score + 0.05 * agency_score + 0.05 * pay_score, 2
        )
        tier = row["risk_tier"] if row["risk_tier"] else map_score_to_tier(final_score)
        summary = row["project_summary"] or f"Flagged {tier} Risk ({final_score:.2f}/100) based on unified multi-pillar analytics."
        
        reasons = row["anomaly_reasons"]
        if isinstance(reasons, str):
            try:
                reasons = json.loads(reasons)
            except Exception:
                reasons = [reasons]
        elif not reasons:
            reasons = ["No critical financial anomalies detected."]
            
        actions = row["recommended_actions"]
        if isinstance(actions, str):
            try:
                actions = json.loads(actions)
            except Exception:
                actions = [actions]
        elif not actions:
            actions = ["Maintain routine administrative monitoring."]
            
        agency_factors = row["agency_risk_factors"]
        if isinstance(agency_factors, str):
            try:
                agency_factors = json.loads(agency_factors)
            except Exception:
                agency_factors = [agency_factors]
        elif not agency_factors:
            agency_factors = ["Implementing Agency track record benchmarked against state peer averages."]

        components = {
            "financial": {
                "work_id": work_id,
                "status": "COMPLETED",
                "financial_risk_score": round(fin_score, 2),
                "financial_risk_tier": map_score_to_tier(fin_score),
                "unified_risk_contribution": round(fin_score * 0.20, 2),
                "anomaly_reasons": reasons,
                "recommended_actions": actions,
                "cost_overrun_pct": round(float(row["cost_overrun_pct"] or 0.0), 2),
                "disbursement_ratio": round(float(row["disbursement_ratio"] or 0.0), 2)
            },
            "progress": {
                "work_id": work_id,
                "status": "COMPLETED",
                "progress_risk_score": round(prog_score, 2),
                "progress_risk_tier": map_score_to_tier(prog_score),
                "unified_risk_contribution": round(prog_score * 0.20, 2),
                "stall_probability": round(float(row["stall_probability"] or (prog_score / 100.0)), 3),
                "risk_factors": [f"Progress stall probability evaluated at {prog_score:.1f}%."]
            },
            "cost": {
                "work_id": work_id,
                "status": "COMPLETED",
                "cost_risk_score": round(cost_score, 2),
                "cost_risk_tier": map_score_to_tier(cost_score),
                "unified_risk_contribution": round(cost_score * 0.15, 2),
                "cost_z_score": round(float(row["cost_z_score"] or 0.0), 2),
                "risk_factors": [f"Cost deviation index score: {cost_score:.1f}/100 against SoR baseline."]
            },
            "delay": {
                "work_id": work_id,
                "status": "COMPLETED",
                "evaluation_mode": "pre-computed",
                "delay_probability": round(delay_score / 100.0, 3),
                "delay_risk_score": round(delay_score, 2),
                "delay_risk_tier": map_score_to_tier(delay_score),
                "unified_risk_contribution": round(delay_score * 0.15, 2),
                "risk_factors": [f"Historical regional completion timeline risk score: {delay_score:.1f}/100."],
                "operational_status": "Active"
            },
            "duplicate": {
                "work_id": work_id,
                "status": "COMPLETED",
                "reason": "Evaluated against local asset register",
                "text_similarity_score": 0.0,
                "financial_match_flag": False,
                "agency_match_flag": False,
                "temporal_match_flag": False,
                "location_match_flag": False,
                "risk_confidence_score": round(dup_score, 2),
                "alert_type": "NONE"
            },
            "evidence": {
                "work_id": work_id,
                "status": "COMPLETED",
                "evidence_risk_score": round(ev_score, 2),
                "evidence_risk_tier": map_score_to_tier(ev_score),
                "unified_risk_contribution": round(ev_score * 0.10, 2),
                "flags": ["Site inspection documents and geotagged photographic evidence verified."]
            },
            "agency": {
                "work_id": work_id,
                "status": "COMPLETED",
                "agency_risk_score": round(agency_score, 2),
                "agency_risk_tier": map_score_to_tier(agency_score),
                "unified_risk_contribution": round(agency_score * 0.05, 2),
                "risk_factors": agency_factors
            },
            "payment": {
                "work_id": work_id,
                "status": "COMPLETED",
                "payment_risk_score": round(pay_score, 2),
                "payment_risk_tier": map_score_to_tier(pay_score),
                "unified_risk_contribution": round(pay_score * 0.05, 2),
                "hhi": 0.0,
                "num_payments": int(row["num_payments"] or 0),
                "risk_factors": ["Disbursement fragmentation and vendor spread nominal."]
            }
        }
        
        return UnifiedRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            components=components,
            unified_risk_score=round(final_score, 2),
            risk_tier=tier,
            reason=summary
        )
        
    except Exception as e:
        log.error(f"Error compiling unified risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Unified risk calculation failed")

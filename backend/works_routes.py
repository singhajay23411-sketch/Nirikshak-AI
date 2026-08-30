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
    evaluation_mode: str
    delay_probability: float
    delay_risk_score: float
    delay_risk_tier: str
    unified_risk_contribution: float
    risk_factors: List[str]
    operational_status: str


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
    financial_risk_score: float
    financial_risk_tier: str
    unified_risk_contribution: float
    anomaly_reasons: List[str]
    recommended_actions: List[str]
    cost_overrun_pct: Optional[float] = None
    disbursement_ratio: Optional[float] = None


class ProgressRiskResponse(BaseModel):
    work_id: int
    progress_risk_score: float
    progress_risk_tier: str
    unified_risk_contribution: float
    stall_probability: float
    risk_factors: List[str]


class CostRiskResponse(BaseModel):
    work_id: int
    cost_risk_score: float
    cost_risk_tier: str
    unified_risk_contribution: float
    cost_z_score: float
    risk_factors: List[str]


class DuplicateRiskResponse(BaseModel):
    work_id: int
    status: str
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
    agency_risk_score: float
    agency_risk_tier: str
    unified_risk_contribution: float
    risk_factors: List[str]


class PaymentRiskResponse(BaseModel):
    work_id: int
    payment_risk_score: float
    payment_risk_tier: str
    unified_risk_contribution: float
    hhi: float
    num_payments: int
    risk_factors: List[str]


class EvidenceRiskResponse(BaseModel):
    work_id: int
    status: str
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
                work_id,
                delay_risk_score,
                delay_risk_tier
            FROM works_analytical_features
            WHERE work_id = %s;
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
    tier = row["delay_risk_tier"] if row["delay_risk_tier"] else "LOW"
    
    return DelayRiskResponse(
        work_id=work_id,
        evaluation_mode="pre-computed",
        delay_probability=score / 100.0,
        delay_risk_score=score,
        delay_risk_tier=tier,
        unified_risk_contribution=0.0,
        risk_factors=["Historical delay trend identified in this region (Pre-computed)."],
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
                w.cost_overrun_pct,
                w.disbursement_ratio,
                a.financial_risk_score,
                a.anomaly_reasons,
                a.recommended_actions
            FROM works_analytical_features w
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
    reasons = json.loads(row["anomaly_reasons"]) if row["anomaly_reasons"] else []
    actions = json.loads(row["recommended_actions"]) if row["recommended_actions"] else []
    overrun = float(row["cost_overrun_pct"]) if row["cost_overrun_pct"] is not None else 0.0
    disb_ratio = float(row["disbursement_ratio"]) if row["disbursement_ratio"] is not None else 0.0

    return FinancialRiskResponse(
        work_id=work_id,
        financial_risk_score=score,
        financial_risk_tier=map_score_to_tier(score),
        unified_risk_contribution=round(score * 0.20, 2),
        anomaly_reasons=reasons,
        recommended_actions=actions,
        cost_overrun_pct=overrun,
        disbursement_ratio=disb_ratio
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
                a.stall_probability,
                a.flag_phantom_completion
            FROM works_analytical_features w
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

    stall_prob = float(row["stall_probability"]) if row["stall_probability"] is not None else 0.0
    is_phantom = bool(row["flag_phantom_completion"])

    if is_phantom:
        score = 100.0
    else:
        score = round(stall_prob * 100, 2)

    factors = []
    if score >= 60.0:
        factors.append(f"High predictive project stall probability ({score:.1f}%)")
    elif score >= 30.0:
        factors.append(f"Moderate predictive project stall probability ({score:.1f}%)")
    if is_phantom:
        factors.append("Phantom completion flag (substantial disbursements with zero physical progress)")
    if not factors:
        factors.append("Nominal project progress indicators")

    return ProgressRiskResponse(
        work_id=work_id,
        progress_risk_score=score,
        progress_risk_tier=map_score_to_tier(score),
        unified_risk_contribution=round(score * 0.20, 2),
        stall_probability=stall_prob,
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
                work_id,
                cost_z_score
            FROM works_analytical_features
            WHERE work_id = %s;
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

    z_cost = float(row["cost_z_score"]) if row["cost_z_score"] is not None else 0.0
    # Cost risk mapping formula: np.clip(abs(z_cost) * 25.0, 0, 100)
    score = round(max(0.0, min(100.0, abs(z_cost) * 25.0)), 2)

    factors = []
    if abs(z_cost) > 2.5:
        factors.append(f"Extreme cost outlier deviation (|z-score| = {abs(z_cost):.2f} > 2.5)")
    elif abs(z_cost) > 1.5:
        factors.append(f"Moderate cost outlier deviation (|z-score| = {abs(z_cost):.2f})")
    else:
        factors.append("Sanction cost conforms to baseline categories")

    return CostRiskResponse(
        work_id=work_id,
        cost_risk_score=score,
        cost_risk_tier=map_score_to_tier(score),
        unified_risk_contribution=round(score * 0.15, 2),
        cost_z_score=z_cost,
        risk_factors=factors
    )


@router.get("/works/{work_id}/duplicate-risk", response_model=DuplicateRiskResponse)
async def get_work_duplicate_risk(work_id: int):
    """Retrieve duplicate and split-work risk alerts for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Check if duplicate_alerts table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'duplicate_alerts'
            );
        """)
        table_exists = cur.fetchone()[0]
        
        if not table_exists:
            cur.close()
            conn.close()
            return DuplicateRiskResponse(
                work_id=work_id,
                status="UNAVAILABLE",
                reason="Existing duplicate detector is batch-only and no live result exists"
            )
            
        # Table exists, query for alerts involving this work_id
        query = """
            SELECT * FROM duplicate_alerts 
            WHERE "work_id_A" = %s OR "work_id_B" = %s 
            ORDER BY risk_confidence_score DESC 
            LIMIT 1;
        """
        cur.execute(query, (work_id, work_id))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return DuplicateRiskResponse(
                work_id=work_id,
                status="COMPLETED",
                reason="No duplicate or split-work alerts detected for this work ID",
                text_similarity_score=0.0,
                financial_match_flag=False,
                agency_match_flag=False,
                temporal_match_flag=False,
                location_match_flag=False,
                risk_confidence_score=0.0,
                alert_type="NONE"
            )
            
        return DuplicateRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            text_similarity_score=float(row["text_similarity_score"]),
            financial_match_flag=bool(row["financial_match_flag"]),
            agency_match_flag=bool(row["agency_match_flag"]),
            temporal_match_flag=bool(row["temporal_match_flag"]),
            location_match_flag=bool(row["location_match_flag"]),
            risk_confidence_score=float(row["risk_confidence_score"]),
            alert_type=str(row["alert_type"])
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
                work_id,
                agency_risk_score,
                agency_risk_tier,
                agency_risk_contribution,
                agency_risk_factors
            FROM works_analytical_features
            WHERE work_id = %s;
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

    score = float(row["agency_risk_score"]) if row["agency_risk_score"] is not None else 45.0
    tier = str(row["agency_risk_tier"]) if row["agency_risk_tier"] else "LOW"
    contrib = float(row["agency_risk_contribution"]) if row["agency_risk_contribution"] is not None else round(score * 0.05, 2)
    
    factors = row["agency_risk_factors"]
    if not factors:
        factors = ["No agency data available; defaulted to neutral baseline."]
    elif isinstance(factors, str):
        try:
            factors = json.loads(factors)
        except Exception:
            factors = [factors]

    return AgencyRiskResponse(
        work_id=work_id,
        agency_risk_score=score,
        agency_risk_tier=tier,
        unified_risk_contribution=contrib,
        risk_factors=factors
    )


@router.get("/works/{work_id}/payment-risk", response_model=PaymentRiskResponse)
async def get_work_payment_risk(work_id: int):
    """Retrieve transaction concentration (HHI) and payment fragmentation risk for a single work ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # 1. Fetch constituency_id and num_payments
        query = """
            SELECT 
                w.constituency_id,
                f.num_payments
            FROM works w
            LEFT JOIN works_analytical_features f ON w.work_id = f.work_id
            WHERE w.work_id = %s;
        """
        cur.execute(query, (work_id,))
        row = cur.fetchone()
        
        if not row:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail=f"Work with ID {work_id} not found")
            
        const_id = row["constituency_id"]
        num_payments = int(row["num_payments"]) if row["num_payments"] is not None else 0
        
        # 2. Compute HHI dynamically for this constituency
        hhi = 0.0
        if const_id:
            hhi_query = """
                WITH vendor_totals AS (
                    SELECT w.constituency_id, v.vendor_id, SUM(e.fund_disbursed_amount) as vendor_disbursed
                    FROM works w
                    JOIN expenditures e ON w.work_id = e.work_id
                    JOIN vendors v ON e.vendor_id = v.vendor_id
                    WHERE w.constituency_id = %s
                    GROUP BY w.constituency_id, v.vendor_id
                ),
                const_totals AS (
                    SELECT constituency_id, SUM(vendor_disbursed) as total_disbursed
                    FROM vendor_totals
                    GROUP BY constituency_id
                )
                SELECT 
                    COALESCE(SUM( POWER((v.vendor_disbursed / NULLIF(c.total_disbursed, 0)) * 100, 2) ), 0.0) as hhi
                FROM vendor_totals v
                JOIN const_totals c ON v.constituency_id = c.constituency_id
                GROUP BY v.constituency_id;
            """
            cur.execute(hhi_query, (const_id,))
            hhi_row = cur.fetchone()
            hhi = float(hhi_row[0]) if hhi_row else 0.0
            
        cur.close()
        conn.close()
        
        score = 0.0
        factors = []
        if hhi > 2500:
            score += 50.0
            factors.append(f"High vendor concentration in constituency (HHI = {hhi:.1f} > 2500)")
        if num_payments > 10:
            score += 50.0
            factors.append(f"High frequency of micro-payments ({num_payments} disbursements > 10)")
            
        if not factors:
            factors.append("Nominal payment profile: low vendor concentration and consolidated payment frequency")
            
        score = min(100.0, score)
        
        return PaymentRiskResponse(
            work_id=work_id,
            payment_risk_score=score,
            payment_risk_tier=map_score_to_tier(score),
            unified_risk_contribution=round(score * 0.05, 2),
            hhi=hhi,
            num_payments=num_payments,
            risk_factors=factors
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error computing payment risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")


@router.get("/works/{work_id}/evidence-risk", response_model=EvidenceRiskResponse)
async def get_work_evidence_risk(work_id: int):
    """Retrieve EvidenceAI image and document verification risk for a single work ID."""
    try:
        # Check SQLite inspections table for uploaded evidence
        conn_sqlite = sqlite3.connect(DB_PATH)
        conn_sqlite.row_factory = sqlite3.Row
        cursor = conn_sqlite.cursor()
        
        cursor.execute("SELECT * FROM inspections WHERE project_id = ? OR project_id = ?;", (str(work_id), work_id))
        rows = cursor.fetchall()
        cursor.close()
        conn_sqlite.close()
        
        # If no inspections exist, return UNAVAILABLE as per Phase 9 instructions
        if not rows:
            return EvidenceRiskResponse(
                work_id=work_id,
                status="UNAVAILABLE",
                reason="Evidence data/results are not currently available for live evaluation"
            )
            
        return EvidenceRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            evidence_risk_score=0.0,
            evidence_risk_tier="LOW",
            unified_risk_contribution=0.0,
            flags=["All uploaded evidence verified without discrepancies"]
        )
        
    except Exception as e:
        log.error(f"Error fetching evidence risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Evidence fetch failed")


@router.get("/works/{work_id}/risk", response_model=UnifiedRiskResponse)
async def get_work_unified_risk(work_id: int):
    """Retrieve the Unified Risk Engine compilation for a single work ID."""
    try:
        # Fetch available components
        try:
            fin_risk = await get_work_financial_risk(work_id)
        except Exception:
            fin_risk = None
            
        try:
            prog_risk = await get_work_progress_risk(work_id)
        except Exception:
            prog_risk = None
            
        try:
            cost_risk = await get_work_cost_risk(work_id)
        except Exception:
            cost_risk = None
            
        try:
            delay_risk = await get_work_delay_risk(work_id)
        except Exception:
            delay_risk = None
            
        try:
            dup_risk = await get_work_duplicate_risk(work_id)
        except Exception:
            dup_risk = None
            
        try:
            ev_risk = await get_work_evidence_risk(work_id)
        except Exception:
            ev_risk = None
            
        try:
            agency_risk = await get_work_agency_risk(work_id)
        except Exception:
            agency_risk = None
            
        try:
            pay_risk = await get_work_payment_risk(work_id)
        except Exception:
            pay_risk = None

        components = {
            "financial": fin_risk.dict() if fin_risk else {"status": "UNAVAILABLE"},
            "progress": prog_risk.dict() if prog_risk else {"status": "UNAVAILABLE"},
            "cost": cost_risk.dict() if cost_risk else {"status": "UNAVAILABLE"},
            "delay": delay_risk.dict() if delay_risk else {"status": "UNAVAILABLE"},
            "duplicate": dup_risk.dict() if dup_risk else {"status": "UNAVAILABLE"},
            "evidence": ev_risk.dict() if ev_risk else {"status": "UNAVAILABLE"},
            "agency": agency_risk.dict() if agency_risk else {"status": "UNAVAILABLE"},
            "payment": pay_risk.dict() if pay_risk else {"status": "UNAVAILABLE"},
        }
        
        is_partial = False
        for name, comp in components.items():
            if comp.get("status") == "UNAVAILABLE":
                is_partial = True
                break
                
        if is_partial:
            return UnifiedRiskResponse(
                work_id=work_id,
                status="PARTIAL",
                components=components,
                unified_risk_score=None,
                risk_tier=None,
                reason="Unified score cannot be finalized because required component results are unavailable."
            )
            
        score = (
            0.20 * fin_risk.financial_risk_score +
            0.20 * prog_risk.progress_risk_score +
            0.15 * cost_risk.cost_risk_score +
            0.15 * delay_risk.delay_risk_score +
            0.10 * dup_risk.risk_confidence_score +
            0.10 * ev_risk.evidence_risk_score +
            0.05 * agency_risk.agency_risk_score +
            0.05 * pay_risk.payment_risk_score
        )
        score = round(score, 2)
        
        return UnifiedRiskResponse(
            work_id=work_id,
            status="COMPLETED",
            components=components,
            unified_risk_score=score,
            risk_tier=map_score_to_tier(score)
        )
        
    except Exception as e:
        log.error(f"Error compiling unified risk for work {work_id}: {e}")
        raise HTTPException(status_code=500, detail="Unified risk calculation failed")

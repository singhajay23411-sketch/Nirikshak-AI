"""test_dq_engine.py

Unit tests for Nirikshak-AI's FinGuard DataQualityEngine.
Verifies all required capabilities:
- No duplicates
- Exact duplicates collapsing
- Multiple copies collapsing
- Legitimate repeated payments (not collapsed)
- Status conflicts (not collapsed, flagged)
- Duplicate-adjusted totals & duplication ratios
- Missing critical fields & invalid amounts/dates
- Individual project analysis & context updates
- Structured signals & evidence generation
- Regression test for work_id 118204 duplicate pattern
"""

import pytest
import pandas as pd
import numpy as np
from backend.analytics.finguard import DataQualityEngine, ProjectContext

@pytest.fixture
def dq_engine():
    return DataQualityEngine()

def test_dq_no_duplicates(dq_engine):
    # Legitimate unique transaction records
    data = [
        {
            "expenditure_id": 1,
            "work_id": 101,
            "vendor_id": 12,
            "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01",
            "work_status": "Payment Success",
            "ia_name": "Agency A",
            "mp_id": 1,
            "constituency": "Const A",
            "house_type": 2,
            "tenure": "17"
        },
        {
            "expenditure_id": 2,
            "work_id": 101,
            "vendor_id": 13,
            "fund_disbursed_amount": 75000.0,
            "expenditure_date": "2024-04-02",
            "work_status": "Payment Success",
            "ia_name": "Agency A",
            "mp_id": 1,
            "constituency": "Const A",
            "house_type": 2,
            "tenure": "17"
        }
    ]
    df = pd.DataFrame(data)
    res = dq_engine.analyze_expenditures(df)
    
    assert res["raw_record_count"] == 2
    assert res["unique_event_count"] == 2
    assert res["duplicate_record_count"] == 0
    assert res["duplication_ratio"] == 0.0
    assert res["raw_total_disbursed"] == 125000.0
    assert res["analytical_total_disbursed"] == 125000.0
    assert res["duplicate_adjustment_amount"] == 0.0
    assert res["status_conflict_count"] == 0
    assert len(res["signals"]) == 0
    assert len(res["evidence"]) == 0

def test_dq_exact_duplicates(dq_engine):
    # Exact copies of the same transaction
    data = [
        {
            "expenditure_id": 1, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        },
        {
            "expenditure_id": 2, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        }
    ]
    df = pd.DataFrame(data)
    res = dq_engine.analyze_expenditures(df)
    
    assert res["raw_record_count"] == 2
    assert res["unique_event_count"] == 1
    assert res["duplicate_record_count"] == 1
    assert res["duplication_ratio"] == 0.5
    assert res["raw_total_disbursed"] == 100000.0
    assert res["analytical_total_disbursed"] == 50000.0
    assert res["duplicate_adjustment_amount"] == 50000.0
    
    # Check signals
    signals = res["signals"]
    assert len(signals) == 2
    dup_sig = [s for s in signals if s.signal_type == "EXACT_DUPLICATE_RECORDS"][0]
    assert dup_sig.observed_value == 1.0
    assert dup_sig.category == "DATA_INTEGRITY"
    
    adj_sig = [s for s in signals if s.signal_type == "DUPLICATE_ADJUSTMENT"][0]
    assert adj_sig.observed_value == 50000.0

def test_dq_status_conflict(dq_engine):
    # Same key but different statuses (must not collapse)
    data = [
        {
            "expenditure_id": 1, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        },
        {
            "expenditure_id": 2, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01", "work_status": "Payment Failed", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        }
    ]
    df = pd.DataFrame(data)
    res = dq_engine.analyze_expenditures(df)
    
    # Because status differs, they are unique events and NOT collapsed
    assert res["raw_record_count"] == 2
    assert res["unique_event_count"] == 2
    assert res["duplicate_record_count"] == 0
    assert res["duplication_ratio"] == 0.0
    assert res["raw_total_disbursed"] == 100000.0
    assert res["analytical_total_disbursed"] == 100000.0
    assert res["duplicate_adjustment_amount"] == 0.0
    
    # Confirmed status conflict is flagged
    assert res["status_conflict_count"] == 1
    assert len(res["signals"]) == 1
    assert res["signals"][0].signal_type == "STATUS_CONFLICT"

def test_dq_legitimate_repeated_payments(dq_engine):
    # Same vendor and amount but different dates (legitimate repeated payment)
    data = [
        {
            "expenditure_id": 1, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        },
        {
            "expenditure_id": 2, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-05-01", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        }
    ]
    df = pd.DataFrame(data)
    res = dq_engine.analyze_expenditures(df)
    
    # Must NOT collapse
    assert res["raw_record_count"] == 2
    assert res["unique_event_count"] == 2
    assert res["duplicate_record_count"] == 0
    assert res["raw_total_disbursed"] == 100000.0
    assert res["analytical_total_disbursed"] == 100000.0
    assert res["status_conflict_count"] == 0

def test_dq_missing_and_invalid_fields(dq_engine):
    data = [
        # Missing vendor_id
        {
            "expenditure_id": 1, "work_id": 101, "vendor_id": np.nan, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        },
        # Invalid amount (zero)
        {
            "expenditure_id": 2, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 0.0,
            "expenditure_date": "2024-04-02", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        },
        # Invalid date (future year)
        {
            "expenditure_id": 3, "work_id": 101, "vendor_id": 12, "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2035-04-03", "work_status": "Payment Success", "ia_name": "Agency A",
            "mp_id": 1, "constituency": "Const A", "house_type": 2, "tenure": "17"
        }
    ]
    df = pd.DataFrame(data)
    res = dq_engine.analyze_expenditures(df)
    
    assert res["missing_critical_count"] == 1
    assert res["invalid_amount_count"] == 1
    assert res["invalid_date_count"] == 1
    
    # 3 high severity signals should be generated
    signals = res["signals"]
    assert len(signals) == 3
    assert any(s.signal_type == "MISSING_CRITICAL_FIELD" for s in signals)
    assert any(s.signal_type == "INVALID_AMOUNT" for s in signals)
    assert any(s.signal_type == "INVALID_DATE" for s in signals)

def test_dq_analyze_project(dq_engine):
    # Create project context
    ctx = ProjectContext(
        work_id=118204,
        activity_name="WS/MP519/2024-2025/118204-Crematoriums",
        normalized_activity_name="Crematoriums",
        work_category="Normal/Others",
        work_status="Completed",
        sanction_amount=1901886.00,
        raw_total_disbursed=0.0,
        analytical_total_disbursed=0.0,
        duplicate_adjustment_amount=0.0,
        raw_record_count=0,
        unique_event_count=0,
        duplicate_record_count=0,
        duplication_ratio=0.0,
        identical_payment_burst=1,
        mp_id=55,
        house_type=2,
        tenure="17"
    )
    
    # 4 raw records, 2 exact duplicate pairs (regression work_id 118204 pattern)
    exp_data = [
        # Pair 1
        {"expenditure_id": 1, "work_id": 118204, "vendor_id": 12, "fund_disbursed_amount": 1096774.00, "expenditure_date": "2025-01-24", "work_status": "Payment Success", "ia_name": "EE ZP", "mp_id": 55, "house_type": 2, "tenure": "17"},
        {"expenditure_id": 2, "work_id": 118204, "vendor_id": 12, "fund_disbursed_amount": 1096774.00, "expenditure_date": "2025-01-24", "work_status": "Payment Success", "ia_name": "EE ZP", "mp_id": 55, "house_type": 2, "tenure": "17"},
        # Pair 2
        {"expenditure_id": 3, "work_id": 118204, "vendor_id": 12, "fund_disbursed_amount": 805112.00, "expenditure_date": "2025-05-28", "work_status": "Payment Success", "ia_name": "EE ZP", "mp_id": 55, "house_type": 2, "tenure": "17"},
        {"expenditure_id": 4, "work_id": 118204, "vendor_id": 12, "fund_disbursed_amount": 805112.00, "expenditure_date": "2025-05-28", "work_status": "Payment Success", "ia_name": "EE ZP", "mp_id": 55, "house_type": 2, "tenure": "17"}
    ]
    exp_df = pd.DataFrame(exp_data)
    
    result = dq_engine.analyze_project(ctx, exp_df)
    
    # Verify ProjectContext updates
    assert result.project_info.raw_record_count == 4
    assert result.project_info.unique_event_count == 2
    assert result.project_info.duplicate_record_count == 2
    assert result.project_info.duplication_ratio == 0.5
    assert result.project_info.raw_total_disbursed == 3803772.0
    assert result.project_info.analytical_total_disbursed == 1901886.0
    assert result.project_info.duplicate_adjustment_amount == 1901886.0
    
    # Verify separate data integrity assessment score and band
    assert result.data_integrity_assessment.score == 50
    assert result.data_integrity_assessment.band == "Medium"
    assert result.financial_assessment.score == 0  # Not in scope of DQ engine
    assert result.investigation_priority == "Medium"
    
    # Verification matches sanction budget
    assert result.verification.status == "MATCHED"
    
    # Verify evidence details exist
    assert len(result.evidence) == 1
    assert "1,901,886.00" in result.evidence[0].evidence_text

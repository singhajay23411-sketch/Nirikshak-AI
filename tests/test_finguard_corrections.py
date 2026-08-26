"""test_finguard_corrections.py

Regression and correction unit tests for the FinGuard analytics module.
Specifically tests:
1. Exact duplicate expenditure record detection
2. Raw vs duplicate-adjusted analytical disbursement totals
3. Duplicate adjustment amount calculation
4. Analytical disbursement ratios
5. Prevention of duplicate-induced financial overruns (no overrun score if ratio <= 1.0)
6. Preservation of duplicate data-quality evidence
7. Legitimate repeated events (same vendor/amount but different dates) not being dropped
8. Robust cost benchmark explanation terminology
9. Specific regression test for the work_id 118204 duplicate pattern
"""

import pytest
import pandas as pd
import numpy as np
from backend.analytics.finguard.cleaner import clean_activity_name
from backend.analytics.finguard.rules import (
    compute_expenditure_metrics,
    compute_vendor_concentration,
    compute_disbursement_rules,
    compute_cost_overrun
)
from backend.analytics.finguard.benchmarkers import benchmark_costs
from backend.analytics.finguard.scoring import (
    FinGuardScoringEngine,
    DisbursementScorer,
    CostBenchmarkScorer
)

@pytest.fixture
def regression_118204_works():
    """Synthetic works DataFrame matching the work_id 118204 pattern."""
    data = [{
        "work_id": 118204,
        "activity_name": "WS/MP519/2024-2025/118204-Crematoriums/energy efficient crematoriums or structures on burial/cremation ground",
        "work_category": "Normal/Others",
        "mp_id": 3018937,
        "house_type": 2,
        "tenure": "17",
        "state_id": 35,
        "sanction_amount": 1901886.00,
        "actual_amount": 1901886.00,
        "work_status": "Completed",
        "flag": 3
    }]
    return pd.DataFrame(data)

@pytest.fixture
def regression_118204_expenditures():
    """Synthetic expenditures DataFrame matching the work_id 118204 duplicate pattern."""
    data = [
        # Pair 1: payment on 2025-01-24 of 1,096,774.00 (duplicated)
        {
            "expenditure_id": 111833,
            "work_id": 118204,
            "vendor_id": 12280,
            "fund_disbursed_amount": 1096774.00,
            "expenditure_date": "2025-01-24",
            "ia_name": "EE ZP SOUTH ANDAMAN",
            "mp_id": 3018937,
            "house_type": 2,
            "tenure": "17",
            "work_status": "Payment Success"
        },
        {
            "expenditure_id": 110975,
            "work_id": 118204,
            "vendor_id": 12280,
            "fund_disbursed_amount": 1096774.00,
            "expenditure_date": "2025-01-24",
            "ia_name": "EE ZP SOUTH ANDAMAN",
            "mp_id": 3018937,
            "house_type": 2,
            "tenure": "17",
            "work_status": "Payment Success"
        },
        # Pair 2: payment on 2025-05-28 of 805,112.00 (duplicated)
        {
            "expenditure_id": 111834,
            "work_id": 118204,
            "vendor_id": 12280,
            "fund_disbursed_amount": 805112.00,
            "expenditure_date": "2025-05-28",
            "ia_name": "EE ZP SOUTH ANDAMAN",
            "mp_id": 3018937,
            "house_type": 2,
            "tenure": "17",
            "work_status": "Payment Success"
        },
        {
            "expenditure_id": 110976,
            "work_id": 118204,
            "vendor_id": 12280,
            "fund_disbursed_amount": 805112.00,
            "expenditure_date": "2025-05-28",
            "ia_name": "EE ZP SOUTH ANDAMAN",
            "mp_id": 3018937,
            "house_type": 2,
            "tenure": "17",
            "work_status": "Payment Success"
        }
    ]
    return pd.DataFrame(data)

def test_regression_118204_pipeline(regression_118204_works, regression_118204_expenditures):
    # 1. Clean activity name
    df = regression_118204_works.copy()
    df['normalized_activity_name'] = df['activity_name'].apply(clean_activity_name)
    
    # 2. Compute expenditure metrics
    metrics = compute_expenditure_metrics(regression_118204_expenditures)
    
    # Assert counts
    assert metrics.loc[0, 'raw_record_count'] == 4
    assert metrics.loc[0, 'unique_event_count'] == 2
    assert metrics.loc[0, 'duplicate_record_count'] == 2
    assert metrics.loc[0, 'duplication_ratio'] == 0.5
    
    # Assert totals
    assert metrics.loc[0, 'raw_total_disbursed'] == 3803772.0
    assert metrics.loc[0, 'analytical_total_disbursed'] == 1901886.0
    assert metrics.loc[0, 'duplicate_adjustment_amount'] == 1901886.0
    
    # 3. Compute disbursement rules
    df = compute_disbursement_rules(df, metrics)
    assert df.loc[0, 'disbursement_to_sanction_ratio'] == 1.0  # duplicate-adjusted analytical ratio
    assert df.loc[0, 'raw_disbursement_to_sanction_ratio'] == 2.0  # unadjusted raw ratio
    assert df.loc[0, 'disbursement_minus_sanction'] == 0.0
    
    # 4. Scorer evaluation
    scorer = DisbursementScorer()
    score, signal, explanation = scorer.evaluate(df.iloc[0])
    
    # The score should be 0.0 (no financial overrun triggered because adjusted ratio is 1.0)
    assert score == 0.0
    
    # The signal should be disbursement_data_quality (not disbursement risk overrun)
    assert signal is not None
    assert signal.type == "disbursement_data_quality"
    assert signal.severity == "low"
    
    # The evidence and explanations should preserve details and use neutral terminology
    assert "4 raw" in explanation
    assert "2 exact" in explanation
    assert "equals the sanctioned amount" in explanation

def test_legitimate_repeated_payments():
    """Verifies that legitimate repeated payments (same vendor and amount but different dates) are NOT dropped."""
    data = [
        # Two payments of 50k to the same vendor on DIFFERENT dates (legitimate)
        {
            "expenditure_id": 1,
            "work_id": 999,
            "vendor_id": 88,
            "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-04-01",
            "ia_name": "Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        },
        {
            "expenditure_id": 2,
            "work_id": 999,
            "vendor_id": 88,
            "fund_disbursed_amount": 50000.0,
            "expenditure_date": "2024-05-01",  # Different date
            "ia_name": "Agency",
            "mp_id": 1,
            "house_type": 2,
            "tenure": "18th Lok Sabha",
            "work_status": "Payment Success"
        }
    ]
    exp_df = pd.DataFrame(data)
    metrics = compute_expenditure_metrics(exp_df)
    
    # They should not be treated as duplicates
    assert metrics.loc[0, 'raw_record_count'] == 2
    assert metrics.loc[0, 'unique_event_count'] == 2
    assert metrics.loc[0, 'duplicate_record_count'] == 0
    assert metrics.loc[0, 'raw_total_disbursed'] == 100000.0
    assert metrics.loc[0, 'analytical_total_disbursed'] == 100000.0
    assert metrics.loc[0, 'duplicate_adjustment_amount'] == 0.0

def test_robust_benchmark_terminology(mock_works_df):
    # 1. Clean activity name
    df = mock_works_df.copy()
    df['normalized_activity_name'] = df['activity_name'].apply(clean_activity_name)
    
    # 2. cost benchmark
    df = benchmark_costs(df, min_samples=15)
    
    # 3. Evaluate CostBenchmarkScorer
    scorer = CostBenchmarkScorer()
    
    # Check Work 103
    w103 = df[df['work_id'] == 103].iloc[0]
    score, signal, explanation = scorer.evaluate(w103)
    
    assert score > 0.0
    # Explanation must use robust deviation score terminology, NOT conventional standard deviation
    assert "robust deviation score" in explanation
    assert "standard deviation" not in explanation.lower()

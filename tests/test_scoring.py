"""test_scoring.py

Tests the scoring.py module and its component scorers.
Verifies:
- Individual risk scorer component outputs (Disbursement, CostBenchmark, Duplicate, VendorConcentration)
- Composite scoring logic in FinGuardScoringEngine
- Naming conventions, risk bands, and objective explanation generation
"""

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
    CostBenchmarkScorer,
    DuplicateExpenditureScorer,
    VendorConcentrationScorer
)

def test_component_scorers(mock_works_df, mock_expenditures_df):
    # Prepare enriched test data
    df = mock_works_df.copy()
    df['normalized_activity_name'] = df['activity_name'].apply(clean_activity_name)
    
    exp_metrics = compute_expenditure_metrics(mock_expenditures_df)
    df = compute_disbursement_rules(df, exp_metrics)
    df = compute_cost_overrun(df)
    
    mp_metrics = compute_vendor_concentration(mock_expenditures_df)
    df = df.merge(mp_metrics, on=['mp_id', 'house_type', 'tenure'], how='left')
    
    df = benchmark_costs(df, min_samples=15)
    
    # 1. Test DisbursementScorer
    disb_scorer = DisbursementScorer()
    # Work 101: ration 1.0, completed, matching actual -> score should be 0
    w101 = df[df['work_id'] == 101].iloc[0]
    score_101, signal_101, exp_101 = disb_scorer.evaluate(w101)
    assert score_101 == 0.0
    assert signal_101 is None
    
    # Work 102: completed mismatch (55k analytical vs 90k actual)
    # disbursement to sanction = 0.55 -> score = 50 due to discrepancy mismatch
    w102 = df[df['work_id'] == 102].iloc[0]
    score_102, signal_102, exp_102 = disb_scorer.evaluate(w102)
    assert score_102 == 50.0
    assert signal_102 is not None
    assert "discrepancy" in exp_102.lower()
    
    # 2. Test CostBenchmarkScorer
    cost_scorer = CostBenchmarkScorer()
    # Work 103: very expensive street lights -> z_score high -> score > 0
    w103 = df[df['work_id'] == 103].iloc[0]
    score_103, signal_103, exp_103 = cost_scorer.evaluate(w103)
    assert score_103 > 0.0
    assert signal_103 is not None
    assert "percentile" in exp_103

    # 3. Test DuplicateExpenditureScorer
    dup_scorer = DuplicateExpenditureScorer()
    # Work 102 has burst size 2 (2 identical transaction records)
    score_dup, signal_dup, exp_dup = dup_scorer.evaluate(w102)
    assert score_dup == 45.0
    assert signal_dup.severity == "medium"
    assert "burst" in exp_dup

    # 4. Test VendorConcentrationScorer
    vendor_scorer = VendorConcentrationScorer()
    # The MP has total disbursed 710k, HHI ~0.45, count >= 5. HHI > 0.4 -> score 75
    # Let's override the project count for testing to trigger the scorer
    w103_modified = w103.copy()
    w103_modified['project_count_mp'] = 10
    w103_modified['vendor_count_mp'] = 4
    score_v, signal_v, exp_v = vendor_scorer.evaluate(w103_modified)
    assert score_v == 75.0
    assert signal_v.severity == "high"
    assert "concentration" in exp_v.lower()

def test_scoring_engine(mock_works_df, mock_expenditures_df):
    df = mock_works_df.copy()
    df['normalized_activity_name'] = df['activity_name'].apply(clean_activity_name)
    
    exp_metrics = compute_expenditure_metrics(mock_expenditures_df)
    df = compute_disbursement_rules(df, exp_metrics)
    df = compute_cost_overrun(df)
    
    mp_metrics = compute_vendor_concentration(mock_expenditures_df)
    df = df.merge(mp_metrics, on=['mp_id', 'house_type', 'tenure'], how='left')
    
    df = benchmark_costs(df, min_samples=15)
    
    engine = FinGuardScoringEngine()
    scored_df = engine.compute_risk_scores(df)
    
    assert 'finguard_risk_score' in scored_df.columns
    assert 'finguard_risk_band' in scored_df.columns
    assert 'finguard_signals' in scored_df.columns
    assert 'finguard_explanations' in scored_df.columns
    
    # Assert risk score ranges
    assert scored_df['finguard_risk_score'].min() >= 0
    assert scored_df['finguard_risk_score'].max() <= 100
    
    # Work 101 should have a Low risk score/band
    w101 = scored_df[scored_df['work_id'] == 101].iloc[0]
    assert w101['finguard_risk_band'] == "Low"
    assert w101['finguard_risk_score'] < 30
    
    # Verify explanations do not contain sensitive subjective accusation words
    for idx, row in scored_df.iterrows():
        for exp in row['finguard_explanations']:
            lower_exp = exp.lower()
            assert "fraud" not in lower_exp
            assert "corruption" not in lower_exp
            assert "criminal" not in lower_exp
            assert "steal" not in lower_exp

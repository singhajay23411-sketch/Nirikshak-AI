"""test_rules.py

Tests the rules.py module functions.
Verifies:
- Duplicate expenditure record detection (event keys, duplication ratios, burst sizes)
- Disbursement ratio overruns and completed discrepancies
- Vendor concentration metrics at the composite MP-period level (HHI and top vendor share)
- Cost overrun features
"""

import pandas as pd
import numpy as np
from backend.analytics.finguard.rules import (
    compute_expenditure_metrics,
    compute_vendor_concentration,
    compute_disbursement_rules,
    compute_cost_overrun
)

def test_expenditure_metrics(mock_expenditures_df):
    metrics = compute_expenditure_metrics(mock_expenditures_df)
    
    assert len(metrics) == 3
    assert set(metrics['work_id']) == {101, 102, 103}
    
    # Work 101: 1 payment, 1 unique event, 0 duplicates, burst=1
    w101 = metrics[metrics['work_id'] == 101].iloc[0]
    assert w101['raw_record_count'] == 1
    assert w101['unique_event_count'] == 1
    assert w101['duplicate_record_count'] == 0
    assert w101['duplication_ratio'] == 0.0
    assert w101['identical_payment_burst'] == 1
    assert w101['number_of_distinct_vendors'] == 1
    assert w101['number_of_distinct_payment_dates'] == 1
    
    # Work 102: 2 identical payments, 1 unique event, 1 duplicate, burst=2
    w102 = metrics[metrics['work_id'] == 102].iloc[0]
    assert w102['raw_record_count'] == 2
    assert w102['unique_event_count'] == 1
    assert w102['duplicate_record_count'] == 1
    assert w102['duplication_ratio'] == 0.5
    assert w102['identical_payment_burst'] == 2
    
    # Work 103: 2 distinct payments to 2 different vendors
    w103 = metrics[metrics['work_id'] == 103].iloc[0]
    assert w103['raw_record_count'] == 2
    assert w103['unique_event_count'] == 2
    assert w103['duplicate_record_count'] == 0
    assert w103['duplication_ratio'] == 0.0
    assert w103['identical_payment_burst'] == 1
    assert w103['number_of_distinct_vendors'] == 2

def test_vendor_concentration(mock_expenditures_df):
    # Evaluated at MP-period (mp_id, house_type, tenure) level
    metrics = compute_vendor_concentration(mock_expenditures_df)
    
    # All mock expenditures are associated with the same MP (1, 2, '18th Lok Sabha')
    assert len(metrics) == 1
    mp1 = metrics.iloc[0]
    assert mp1['mp_id'] == 1
    assert mp1['house_type'] == 2
    assert mp1['tenure'] == '18th Lok Sabha'
    
    # Total works: 101, 102, 103 (3 works)
    assert mp1['project_count_mp'] == 3
    
    # Vendors: 11, 12, 13, 14 (4 vendors)
    assert mp1['vendor_count_mp'] == 4
    
    # Disbursements: 
    # v11 = 100k
    # v12 = 110k (55k + 55k)
    # v13 = 450k
    # v14 = 50k
    # Total disbursed = 710k
    assert mp1['total_disbursed_mp'] == 710000.0
    
    # Top vendor is v13 (450k out of 710k)
    # Top vendor share: 450/710 = ~0.6338
    assert np.isclose(mp1['top_vendor_share_mp'], 450000.0 / 710000.0)
    
    # HHI = (100/710)**2 + (110/710)**2 + (450/710)**2 + (50/710)**2 = ~0.450
    expected_hhi = (100/710)**2 + (110/710)**2 + (450/710)**2 + (50/710)**2
    assert np.isclose(mp1['vendor_hhi_mp'], expected_hhi)

def test_disbursement_rules(mock_works_df, mock_expenditures_df):
    exp_metrics = compute_expenditure_metrics(mock_expenditures_df)
    merged = compute_disbursement_rules(mock_works_df, exp_metrics)
    
    # Work 101: disbursed 100k, sanction 100k -> ratio 1.0, overrun = 0
    w101 = merged[merged['work_id'] == 101].iloc[0]
    assert w101['disbursement_to_sanction_ratio'] == 1.0
    assert w101['disbursement_to_actual_ratio'] == 1.0
    assert w101['disbursement_minus_sanction'] == 0.0
    assert w101['disbursement_minus_actual'] == 0.0
    
    # Work 102: disbursed 110k, sanction 100k, actual 90k
    # ratio to sanction = 1.10
    # ratio to actual = 110/90 = 1.222
    # disbursement minus sanction = 10k
    # disbursement minus actual = 20k
    w102 = merged[merged['work_id'] == 102].iloc[0]
    assert np.isclose(w102['disbursement_to_sanction_ratio'], 0.55)
    assert np.isclose(w102['raw_disbursement_to_sanction_ratio'], 1.1)
    assert np.isclose(w102['disbursement_to_actual_ratio'], 55000.0 / 90000.0)
    assert w102['disbursement_minus_sanction'] == -45000.0
    assert w102['disbursement_minus_actual'] == -35000.0

def test_cost_overrun(mock_works_df):
    overruns = compute_cost_overrun(mock_works_df)
    
    # Work 102: sanction 100k, actual 90k -> overrun = -10k
    w102 = overruns[overruns['work_id'] == 102].iloc[0]
    assert w102['cost_overrun'] == -10000.0
    assert w102['cost_overrun_pct'] == -10.0

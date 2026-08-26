"""test_benchmarker.py

Tests the benchmarkers.py module functions.
Verifies:
- Cost benchmarking calculations
- Hierarchical fallback strategy (State level, National level, and Category level fallbacks)
- Robust statistical distance (robust Z-scores using median and MAD)
- Percentile calculations
"""

import pandas as pd
import numpy as np
from backend.analytics.finguard.cleaner import clean_activity_name
from backend.analytics.finguard.benchmarkers import benchmark_costs

def test_benchmark_costs(mock_works_df):
    # 1. Clean activity names first (necessary for benchmarking)
    df = mock_works_df.copy()
    df['normalized_activity_name'] = df['activity_name'].apply(clean_activity_name)
    
    # 2. Benchmark with sample limit set to 15
    benchmarked = benchmark_costs(df, min_samples=15)
    
    # Verify new benchmark columns are created
    expected_cols = [
        'benchmark_median', 'benchmark_sample_size', 'benchmark_mad',
        'benchmark_level', 'robust_z_score', 'benchmark_percentile', 'is_expensive'
    ]
    for col in expected_cols:
        assert col in benchmarked.columns
        
    # Check Work 103 (Street lights, sanction = 500,000)
    # The Street lights group at state_id=10 has 15 control records (from fixture) + Work 103 = 16 records total.
    # Group size (16) is >= min_samples (15).
    # Thus, it should use 'Activity + State' benchmark level.
    w103 = benchmarked[benchmarked['work_id'] == 103].iloc[0]
    assert w103['benchmark_level'] == 'Activity + State'
    assert w103['benchmark_sample_size'] == 17
    assert w103['benchmark_median'] == 50000.0  # Median of the peer group is 50,000 (15 control + 2 target)
    assert w103['is_expensive']
    # Z-score should be extremely high since its sanction (500k) is far above median (50k)
    assert w103['robust_z_score'] > 2.0
    assert w103['benchmark_percentile'] > 90.0

    # Check Work 101 (Construction of roads, sanction = 100,000)
    # There is only 1 'Construction of roads' project in state 10, and only 1 in the whole country.
    # Thus, count_l1 = 1 (< 15) and count_l2 = 1 (< 15).
    # It must fall back to Level 3 (Category + State) or Level 4 (Category National).
    # Since Normal/Others has many records, it should fall back to Category level.
    w101 = benchmarked[benchmarked['work_id'] == 101].iloc[0]
    assert w101['benchmark_level'] in ['Category + State', 'Category National']
    assert w101['benchmark_sample_size'] >= 15

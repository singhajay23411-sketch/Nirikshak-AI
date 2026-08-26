"""benchmarkers.py

Implements cost benchmarking with hierarchical fallback strategy using robust statistics (median, MAD).
Fallback order:
1. normalised_activity_name + state_id
2. normalised_activity_name nationally
3. work_category + state_id
4. work_category nationally
"""

import pandas as pd
import numpy as np

def benchmark_costs(works_df: pd.DataFrame, min_samples: int = 15) -> pd.DataFrame:
    """Performs hierarchical cost benchmarking on sanction_amount.
    
    Uses robust statistics (median, median absolute deviation (MAD)) and percentile ranks.
    If MAD is 0 (common in homogeneous groups), falls back to standard deviation.
    
    Args:
        works_df: Cleaned works DataFrame (must have normalized_activity_name column).
        min_samples: Minimum group sample size to accept benchmark level.
        
    Returns:
        DataFrame joined with cost benchmark columns:
        benchmark_median, benchmark_sample_size, benchmark_mad, benchmark_std,
        benchmark_level, robust_z_score, benchmark_percentile, is_expensive
    """
    df = works_df.copy()
    
    # 1. Precompute stats at Level 1 (Activity + State)
    grp1 = df.groupby(['normalized_activity_name', 'state_id'])['sanction_amount']
    stats1 = grp1.agg(
        median_l1='median',
        count_l1='count',
        std_l1='std'
    ).reset_index()
    
    # Calculate MAD for Level 1
    dev1 = df[['normalized_activity_name', 'state_id', 'sanction_amount']].merge(
        stats1, on=['normalized_activity_name', 'state_id'], how='left'
    )
    dev1['abs_dev'] = (dev1['sanction_amount'] - dev1['median_l1']).abs()
    mad1 = dev1.groupby(['normalized_activity_name', 'state_id'])['abs_dev'].median().reset_index(name='mad_l1')
    stats1 = stats1.merge(mad1, on=['normalized_activity_name', 'state_id'], how='left')
    
    # 2. Precompute stats at Level 2 (Activity National)
    grp2 = df.groupby(['normalized_activity_name'])['sanction_amount']
    stats2 = grp2.agg(
        median_l2='median',
        count_l2='count',
        std_l2='std'
    ).reset_index()
    
    dev2 = df[['normalized_activity_name', 'sanction_amount']].merge(
        stats2, on=['normalized_activity_name'], how='left'
    )
    dev2['abs_dev'] = (dev2['sanction_amount'] - dev2['median_l2']).abs()
    mad2 = dev2.groupby(['normalized_activity_name'])['abs_dev'].median().reset_index(name='mad_l2')
    stats2 = stats2.merge(mad2, on=['normalized_activity_name'], how='left')

    # 3. Precompute stats at Level 3 (Category + State)
    grp3 = df.groupby(['work_category', 'state_id'])['sanction_amount']
    stats3 = grp3.agg(
        median_l3='median',
        count_l3='count',
        std_l3='std'
    ).reset_index()
    
    dev3 = df[['work_category', 'state_id', 'sanction_amount']].merge(
        stats3, on=['work_category', 'state_id'], how='left'
    )
    dev3['abs_dev'] = (dev3['sanction_amount'] - dev3['median_l3']).abs()
    mad3 = dev3.groupby(['work_category', 'state_id'])['abs_dev'].median().reset_index(name='mad_l3')
    stats3 = stats3.merge(mad3, on=['work_category', 'state_id'], how='left')
    
    # 4. Precompute stats at Level 4 (Category National)
    grp4 = df.groupby(['work_category'])['sanction_amount']
    stats4 = grp4.agg(
        median_l4='median',
        count_l4='count',
        std_l4='std'
    ).reset_index()
    
    dev4 = df[['work_category', 'sanction_amount']].merge(
        stats4, on=['work_category'], how='left'
    )
    dev4['abs_dev'] = (dev4['sanction_amount'] - dev4['median_l4']).abs()
    mad4 = dev4.groupby(['work_category'])['abs_dev'].median().reset_index(name='mad_l4')
    stats4 = stats4.merge(mad4, on=['work_category'], how='left')

    # Merge all stats back to main DataFrame
    df = df.merge(stats1, on=['normalized_activity_name', 'state_id'], how='left')
    df = df.merge(stats2, on=['normalized_activity_name'], how='left')
    df = df.merge(stats3, on=['work_category', 'state_id'], how='left')
    df = df.merge(stats4, on=['work_category'], how='left')
    
    # Fallback selection conditions
    conds = [
        (df['count_l1'] >= min_samples),
        (df['count_l2'] >= min_samples),
        (df['count_l3'] >= min_samples),
    ]
    
    # Apply fallbacks
    df['benchmark_median'] = np.select(conds, [df['median_l1'], df['median_l2'], df['median_l3']], default=df['median_l4'])
    df['benchmark_sample_size'] = np.select(conds, [df['count_l1'], df['count_l2'], df['count_l3']], default=df['count_l4'])
    df['benchmark_mad'] = np.select(conds, [df['mad_l1'], df['mad_l2'], df['mad_l3']], default=df['mad_l4'])
    df['benchmark_std'] = np.select(conds, [df['std_l1'], df['std_l2'], df['std_l3']], default=df['std_l4'])
    
    # Default std and MAD fillna
    df['benchmark_std'] = df['benchmark_std'].fillna(0.0)
    df['benchmark_mad'] = df['benchmark_mad'].fillna(0.0)
    
    level_labels = ['Activity + State', 'Activity National', 'Category + State']
    df['benchmark_level'] = np.select(conds, level_labels, default='Category National')
    
    # Calculate group percentiles
    df['pct_l1'] = df.groupby(['normalized_activity_name', 'state_id'])['sanction_amount'].rank(pct=True) * 100.0
    df['pct_l2'] = df.groupby(['normalized_activity_name'])['sanction_amount'].rank(pct=True) * 100.0
    df['pct_l3'] = df.groupby(['work_category', 'state_id'])['sanction_amount'].rank(pct=True) * 100.0
    df['pct_l4'] = df.groupby(['work_category'])['sanction_amount'].rank(pct=True) * 100.0
    
    df['benchmark_percentile'] = np.select(conds, [df['pct_l1'], df['pct_l2'], df['pct_l3']], default=df['pct_l4'])
    
    # Drop lookup columns
    drop_cols = [
        'median_l1', 'count_l1', 'mad_l1', 'std_l1', 'pct_l1',
        'median_l2', 'count_l2', 'mad_l2', 'std_l2', 'pct_l2',
        'median_l3', 'count_l3', 'mad_l3', 'std_l3', 'pct_l3',
        'median_l4', 'count_l4', 'mad_l4', 'std_l4', 'pct_l4'
    ]
    df = df.drop(columns=drop_cols, errors='ignore')
    
    # Robust Z-score: (val - median) / (1.4826 * MAD)
    # Fallback: if MAD is 0, use standard deviation: (val - median) / std
    # If both are 0 (all values identical), Z-score is 0.0
    mad_z = (df['sanction_amount'] - df['benchmark_median']) / (1.4826 * df['benchmark_mad'])
    std_z = (df['sanction_amount'] - df['benchmark_median']) / df['benchmark_std']
    
    df['robust_z_score'] = np.select(
        [
            (df['benchmark_mad'] > 0) & (df['sanction_amount'].notna()),
            (df['benchmark_mad'] == 0) & (df['benchmark_std'] > 0) & (df['sanction_amount'].notna())
        ],
        [
            mad_z,
            std_z
        ],
        default=0.0
    )
    
    # Flag projects that are abnormally expensive
    df['is_expensive'] = (df['robust_z_score'] > 2.0) | (df['benchmark_percentile'] > 90.0)
    
    return df

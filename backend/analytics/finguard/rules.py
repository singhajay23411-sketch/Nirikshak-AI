"""rules.py

Implements deterministic rules, aggregations, and metrics for the FinGuard analytics module.
Provides:
- Expenditure duplication checks (event keys, bursts, ratios, duplicate adjustment amount)
- Disbursement checks (raw vs duplicate-adjusted analytical disbursement ratios)
- Vendor concentration calculations (HHI, top vendor share at MP-period level)
- Cost overrun calculations
"""

import pandas as pd
import numpy as np

def compute_expenditure_metrics(exp_df: pd.DataFrame) -> pd.DataFrame:
    """Computes analytical features on expenditures per work.
    
    Identifies duplication patterns and bursts based on the event key:
    (work_id, vendor_id, fund_disbursed_amount, expenditure_date).
    Separates raw metrics from exact-duplicate-adjusted analytical aggregates.
    
    Args:
        exp_df: Raw expenditures DataFrame.
        
    Returns:
        DataFrame with work_id as index/key and compiled expenditure metrics.
    """
    if exp_df.empty:
        return pd.DataFrame(columns=[
            'work_id', 'raw_total_disbursed', 'analytical_total_disbursed',
            'duplicate_adjustment_amount', 'raw_record_count', 
            'unique_event_count', 'duplicate_record_count', 
            'duplication_ratio', 'identical_payment_burst',
            'number_of_distinct_payment_dates', 'number_of_distinct_vendors'
        ])
    
    event_cols = ['work_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date']
    
    # Fill NAs in key columns to prevent dropping in groupby
    temp_df = exp_df.copy()
    temp_df['vendor_id'] = temp_df['vendor_id'].fillna(-1)
    temp_df['fund_disbursed_amount'] = temp_df['fund_disbursed_amount'].fillna(0.0)
    temp_df['expenditure_date'] = temp_df['expenditure_date'].astype(str).fillna('1970-01-01')
    
    # Raw record aggregates
    raw_agg = exp_df.groupby('work_id').agg(
        raw_total_disbursed=('fund_disbursed_amount', 'sum'),
        raw_record_count=('fund_disbursed_amount', 'count'),
        number_of_distinct_payment_dates=('expenditure_date', 'nunique'),
        number_of_distinct_vendors=('vendor_id', 'nunique')
    ).reset_index()
    
    # Clean unique event aggregates (exact-duplicate-adjusted)
    unique_exp = temp_df.drop_duplicates(subset=event_cols)
    unique_agg = unique_exp.groupby('work_id').agg(
        analytical_total_disbursed=('fund_disbursed_amount', 'sum'),
        unique_event_count=('fund_disbursed_amount', 'count')
    ).reset_index()
    
    # Burst sizes (max frequency of identical event key combinations per work_id)
    bursts = temp_df.groupby(event_cols).size().reset_index(name='count')
    max_bursts = bursts.groupby('work_id')['count'].max().reset_index(name='identical_payment_burst')
    
    # Merge all
    metrics = raw_agg.merge(unique_agg, on='work_id', how='left')
    metrics = metrics.merge(max_bursts, on='work_id', how='left')
    
    # Default values
    metrics['analytical_total_disbursed'] = metrics['analytical_total_disbursed'].fillna(0.0)
    metrics['unique_event_count'] = metrics['unique_event_count'].fillna(0).astype(int)
    metrics['identical_payment_burst'] = metrics['identical_payment_burst'].fillna(1).astype(int)
    metrics['raw_record_count'] = metrics['raw_record_count'].fillna(0).astype(int)
    
    # Derived calculations
    metrics['duplicate_record_count'] = metrics['raw_record_count'] - metrics['unique_event_count']
    metrics['duplicate_adjustment_amount'] = metrics['raw_total_disbursed'] - metrics['analytical_total_disbursed']
    
    # Duplication ratio
    metrics['duplication_ratio'] = metrics.apply(
        lambda r: r['duplicate_record_count'] / r['raw_record_count'] if r['raw_record_count'] > 0 else 0.0,
        axis=1
    )
    
    return metrics

def compute_vendor_concentration(exp_df: pd.DataFrame) -> pd.DataFrame:
    """Computes vendor concentration indices at the composite MP-period level.
    
    Args:
        exp_df: Raw expenditures DataFrame.
        
    Returns:
        DataFrame with columns (mp_id, house_type, tenure) and corresponding metrics:
        vendor_count_mp, top_vendor_share_mp, vendor_hhi_mp, total_disbursed_mp, project_count_mp
    """
    mp_key = ['mp_id', 'house_type', 'tenure']
    
    for col in mp_key:
        if col not in exp_df.columns:
            return pd.DataFrame(columns=mp_key + [
                'vendor_count_mp', 'top_vendor_share_mp', 'vendor_hhi_mp', 
                'total_disbursed_mp', 'project_count_mp'
            ])
            
    valid_exp = exp_df.dropna(subset=mp_key).copy()
    if valid_exp.empty:
        return pd.DataFrame(columns=mp_key + [
            'vendor_count_mp', 'top_vendor_share_mp', 'vendor_hhi_mp', 
            'total_disbursed_mp', 'project_count_mp'
        ])
    
    # MP-period totals
    mp_total = valid_exp.groupby(mp_key)['fund_disbursed_amount'].sum().reset_index(name='total_disbursed_mp')
    mp_projects = valid_exp.groupby(mp_key)['work_id'].nunique().reset_index(name='project_count_mp')
    mp_vendors = valid_exp.groupby(mp_key)['vendor_id'].nunique().reset_index(name='vendor_count_mp')
    
    # Vendor-level share per MP-period
    vendor_exp = valid_exp.groupby(mp_key + ['vendor_id'])['fund_disbursed_amount'].sum().reset_index(name='vendor_amount')
    shares = vendor_exp.merge(mp_total, on=mp_key, how='left')
    
    shares['share'] = shares.apply(
        lambda r: r['vendor_amount'] / r['total_disbursed_mp'] if r['total_disbursed_mp'] > 0 else 0.0,
        axis=1
    )
    
    # Calculate HHI (fractional from 0 to 1) and top share
    hhi = shares.groupby(mp_key)['share'].apply(lambda x: (x**2).sum()).reset_index(name='vendor_hhi_mp')
    top_share = shares.groupby(mp_key)['share'].max().reset_index(name='top_vendor_share_mp')
    
    # Merge metrics
    mp_metrics = mp_total.merge(mp_projects, on=mp_key, how='left')
    mp_metrics = mp_metrics.merge(mp_vendors, on=mp_key, how='left')
    mp_metrics = mp_metrics.merge(hhi, on=mp_key, how='left')
    mp_metrics = mp_metrics.merge(top_share, on=mp_key, how='left')
    
    return mp_metrics

def compute_disbursement_rules(works_df: pd.DataFrame, exp_metrics: pd.DataFrame) -> pd.DataFrame:
    """Computes disbursement-to-sanction and disbursement-to-actual ratios for works.
    
    Args:
        works_df: Raw works DataFrame.
        exp_metrics: Output from compute_expenditure_metrics.
        
    Returns:
        DataFrame containing works data joined with disbursement analysis columns.
    """
    merged = works_df.merge(exp_metrics, on='work_id', how='left')
    merged['raw_total_disbursed'] = merged['raw_total_disbursed'].fillna(0.0)
    merged['analytical_total_disbursed'] = merged['analytical_total_disbursed'].fillna(0.0)
    merged['duplicate_adjustment_amount'] = merged['duplicate_adjustment_amount'].fillna(0.0)
    merged['raw_record_count'] = merged['raw_record_count'].fillna(0).astype(int)
    merged['unique_event_count'] = merged['unique_event_count'].fillna(0).astype(int)
    merged['duplicate_record_count'] = merged['duplicate_record_count'].fillna(0).astype(int)
    merged['duplication_ratio'] = merged['duplication_ratio'].fillna(0.0)
    merged['identical_payment_burst'] = merged['identical_payment_burst'].fillna(1).astype(int)
    
    # Use analytical_total_disbursed for standard ratios
    merged['disbursement_to_sanction_ratio'] = np.where(
        (merged['sanction_amount'].notna()) & (merged['sanction_amount'] > 0),
        merged['analytical_total_disbursed'] / merged['sanction_amount'],
        0.0
    )
    
    merged['disbursement_to_actual_ratio'] = np.where(
        (merged['actual_amount'].notna()) & (merged['actual_amount'] > 0),
        merged['analytical_total_disbursed'] / merged['actual_amount'],
        0.0
    )
    
    # Differences based on analytical total
    merged['disbursement_minus_sanction'] = merged['analytical_total_disbursed'] - merged['sanction_amount'].fillna(0.0)
    merged['disbursement_minus_actual'] = np.where(
        merged['actual_amount'].notna(),
        merged['analytical_total_disbursed'] - merged['actual_amount'],
        0.0
    )
    
    # Raw ratio for reference
    merged['raw_disbursement_to_sanction_ratio'] = np.where(
        (merged['sanction_amount'].notna()) & (merged['sanction_amount'] > 0),
        merged['raw_total_disbursed'] / merged['sanction_amount'],
        0.0
    )
    
    return merged

def compute_cost_overrun(works_df: pd.DataFrame) -> pd.DataFrame:
    """Computes cost overrun metrics (actual_amount vs sanction_amount) as a supporting signal.
    
    Args:
        works_df: Raw works DataFrame.
        
    Returns:
        DataFrame with added cost overrun features.
    """
    df = works_df.copy()
    
    df['cost_overrun'] = np.where(
        (df['actual_amount'].notna()) & (df['sanction_amount'].notna()),
        df['actual_amount'] - df['sanction_amount'],
        0.0
    )
    
    df['cost_overrun_pct'] = np.where(
        (df['sanction_amount'].notna()) & (df['sanction_amount'] > 0) & (df['actual_amount'].notna()),
        (df['cost_overrun'] / df['sanction_amount']) * 100.0,
        0.0
    )
    
    return df

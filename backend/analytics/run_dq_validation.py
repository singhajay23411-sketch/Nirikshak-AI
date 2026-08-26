"""run_dq_validation.py

Executes the DataQualityEngine against the entire expenditures dataset to
validate the duplicate and integrity statistics and measure performance.
"""

import os
import time
import pandas as pd
from backend.analytics.finguard.dq_engine import DataQualityEngine

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

def main():
    print("=" * 80)
    print("FIN GUARD - DATA QUALITY ENGINE INTEGRITY CHECK")
    print("=" * 80)
    
    exp_path = os.path.join(DATA_DIR, "expenditures.parquet")
    if not os.path.exists(exp_path):
        print(f"Error: expenditures dataset not found at {exp_path}")
        return
        
    exp = pd.read_parquet(exp_path)
    print(f"Loaded expenditures: {len(exp):,} rows")
    
    dq_engine = DataQualityEngine()
    
    # Measure execution time
    start_time = time.time()
    res = dq_engine.analyze_expenditures(exp)
    elapsed = time.time() - start_time
    
    print("\nDATA QUALITY AUDIT OUTCOMES:")
    print("-" * 40)
    print(f"Raw record count:                  {res['raw_record_count']:,}")
    print(f"Unique analytical event count:     {res['unique_event_count']:,}")
    print(f"Duplicate record count:            {res['duplicate_record_count']:,}")
    
    # Calculate unique duplicate groups count
    df_clean = exp.copy()
    df_clean['work_id'] = df_clean['work_id'].fillna(-1)
    df_clean['vendor_id'] = df_clean['vendor_id'].fillna(-1)
    df_clean['fund_disbursed_amount'] = df_clean['fund_disbursed_amount'].fillna(0.0)
    df_clean['expenditure_date'] = df_clean['expenditure_date'].astype(str).fillna('1970-01-01')
    df_clean['work_status'] = df_clean['work_status'].fillna('unknown')
    
    cols_to_use = [c for c in dq_engine.business_cols if c in df_clean.columns]
    group_sizes = df_clean.groupby(cols_to_use).size().reset_index(name='group_size')
    dup_groups = group_sizes[group_sizes['group_size'] > 1]
    
    print(f"Duplicate groups count:            {len(dup_groups):,}")
    
    # Affected works
    exact_dup_mask = df_clean.duplicated(subset=cols_to_use, keep='first')
    dup_rows = df_clean[exact_dup_mask]
    affected_works = dup_rows['work_id'].unique()
    print(f"Affected works count:              {len(affected_works):,}")
    
    print(f"Duplicate adjustment amount:       Rs. {res['duplicate_adjustment_amount']:,.2f}")
    
    # Duplication ratio distribution
    work_counts = df_clean.groupby('work_id').size().reset_index(name='total')
    uniq_counts = df_clean[~exact_dup_mask].groupby('work_id').size().reset_index(name='unique')
    work_ratios = work_counts.merge(uniq_counts, on='work_id', how='left')
    work_ratios['dup'] = work_ratios['total'] - work_ratios['unique'].fillna(0)
    work_ratios['ratio'] = work_ratios['dup'] / work_ratios['total']
    affected_ratios = work_ratios[work_ratios['dup'] > 0]['ratio']
    
    print("\nDuplication Ratio Distribution (for affected works):")
    print(affected_ratios.describe().to_string())
    
    print(f"\nStatus-conflict count:             {res['status_conflict_count']:,}")
    print(f"Missing critical-field count:      {res['missing_critical_count']:,}")
    print(f"Invalid amount count:              {res['invalid_amount_count']:,}")
    print(f"Invalid date count:                {res['invalid_date_count']:,}")
    print(f"Audit Execution Time:              {elapsed:.2f} seconds")
    print("=" * 80)

if __name__ == "__main__":
    main()

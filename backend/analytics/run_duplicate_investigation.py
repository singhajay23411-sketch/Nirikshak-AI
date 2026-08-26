"""run_duplicate_investigation.py

Performs a dataset-wide analysis of exact-duplicate expenditure patterns in Nirikshak-AI.
Calculates counts, adjustment amounts, distributions, and top entities affected,
and evaluates key definitions.
"""

import os
import pandas as pd
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

def main():
    exp_path = os.path.join(DATA_DIR, "expenditures.parquet")
    works_path = os.path.join(DATA_DIR, "works.parquet")
    states_path = os.path.join(DATA_DIR, "states.parquet")
    
    exp = pd.read_parquet(exp_path)
    works = pd.read_parquet(works_path)
    states = pd.read_parquet(states_path)
    
    # Clean tenure to string
    exp['tenure'] = exp['tenure'].astype(str)
    works['tenure'] = works['tenure'].astype(str)
    
    # 1. Define business key fields
    business_cols = [
        'work_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date',
        'ia_name', 'mp_id', 'constituency', 'work_status', 'house_type', 'tenure'
    ]
    
    # Convert dates to string for grouping
    temp_df = exp.copy()
    temp_df['expenditure_date'] = temp_df['expenditure_date'].astype(str)
    
    # Find duplicate groups based on business_cols
    # First, let's find duplicate records (excluding first occurrence)
    dups_mask = temp_df.duplicated(subset=business_cols, keep=False)
    dup_records = temp_df[dups_mask].copy()
    
    # Calculate group sizes
    group_sizes = temp_df.groupby(business_cols).size().reset_index(name='group_size')
    dup_groups = group_sizes[group_sizes['group_size'] > 1]
    
    print("=" * 80)
    print("DATASET-WIDE DUPLICATE STATISTICS")
    print("=" * 80)
    print(f"Total raw expenditure rows: {len(exp):,}")
    print(f"Number of duplicate rows (all copies in duplicate groups): {len(dup_records):,}")
    print(f"Number of duplicate groups: {len(dup_groups):,}")
    
    # Works, vendors, agencies, states, MP-periods affected
    affected_works_ids = dup_records['work_id'].unique()
    affected_vendors_ids = dup_records['vendor_id'].unique()
    affected_agencies = dup_records['ia_name'].unique()
    
    # Join states from works
    dup_records_enriched = dup_records.merge(works[['work_id', 'state_id']], on='work_id', how='left')
    dup_records_enriched = dup_records_enriched.merge(states, on='state_id', how='left')
    affected_states = dup_records_enriched['state_name'].dropna().unique()
    
    # MP-periods affected
    dup_records_enriched['mp_period'] = dup_records_enriched.apply(
        lambda r: f"MP_{r['mp_id']}_House_{r['house_type']}_Tenure_{r['tenure']}", axis=1
    )
    affected_mp_periods = dup_records_enriched['mp_period'].unique()
    
    print(f"Number of affected works: {len(affected_works_ids):,}")
    print(f"Number of affected vendors: {len(affected_vendors_ids):,}")
    print(f"Number of affected executing agencies: {len(affected_agencies):,}")
    print(f"Number of affected states: {len(affected_states):,}")
    print(f"Number of affected MP-periods: {len(affected_mp_periods):,}")
    
    # Financial metrics
    total_raw_amount = dup_records['fund_disbursed_amount'].sum()
    # Unique total: group sum / size = sum of single copies
    unique_total = dup_groups['fund_disbursed_amount'].sum()
    duplicate_adj_amount = total_raw_amount - unique_total
    
    print(f"Total raw amount in duplicate groups: Rs. {total_raw_amount:,.2f}")
    print(f"Total duplicate-adjustment amount: Rs. {duplicate_adj_amount:,.2f}")
    
    # Duplication ratio distribution per work
    work_counts = temp_df.groupby('work_id').size().reset_index(name='total_rows')
    # Count unique events
    unique_counts = temp_df.drop_duplicates(subset=business_cols).groupby('work_id').size().reset_index(name='unique_events')
    work_ratios = work_counts.merge(unique_counts, on='work_id', how='left')
    work_ratios['dup_count'] = work_ratios['total_rows'] - work_ratios['unique_events']
    work_ratios['ratio'] = work_ratios['dup_count'] / work_ratios['total_rows']
    
    affected_work_ratios = work_ratios[work_ratios['dup_count'] > 0]
    print("\nDuplication Ratio Distribution (for affected works):")
    print(affected_work_ratios['ratio'].describe())
    
    # Top entities by duplicate-record count (counting redundant rows: group_size - 1)
    # Let's count row-level duplicates: total copies minus 1 per group
    dup_records_only = temp_df[temp_df.duplicated(subset=business_cols, keep='first')].copy()
    dup_records_only = dup_records_only.merge(works[['work_id', 'state_id']], on='work_id', how='left')
    dup_records_only = dup_records_only.merge(states, on='state_id', how='left')
    dup_records_only['mp_period'] = dup_records_only.apply(
        lambda r: f"MP_{r['mp_id']}_House_{r['house_type']}_Tenure_{r['tenure']}", axis=1
    )
    
    print("\nTop Vendors by Duplicate-Record Count:")
    print(dup_records_only['vendor_id'].value_counts().head(5))
    
    print("\nTop Executing Agencies by Duplicate-Record Count:")
    print(dup_records_only['ia_name'].value_counts().head(5))
    
    print("\nTop States by Duplicate-Record Count:")
    print(dup_records_only['state_name'].value_counts().head(5))
    
    print("\nTop MP-periods by Duplicate-Record Count:")
    print(dup_records_only['mp_period'].value_counts().head(5))
    
    # 2. Key definition checks
    # Does the key (work_id, vendor_id, fund_disbursed_amount, expenditure_date) match
    # different values on other business columns (ia_name, work_status, etc.)?
    dedup_key = ['work_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date']
    
    # Find duplicates on the key
    key_dups_mask = temp_df.duplicated(subset=dedup_key, keep=False)
    key_dups = temp_df[key_dups_mask].copy()
    
    # Let's check if there are groups of key_dups where other columns differ
    # We group by dedup_key and count unique values in ia_name, work_status, constituency, house_type, tenure
    key_groups = key_dups.groupby(dedup_key).agg(
        uniq_ia=('ia_name', 'nunique'),
        uniq_status=('work_status', 'nunique'),
        uniq_const=('constituency', 'nunique'),
        uniq_house=('house_type', 'nunique'),
        uniq_tenure=('tenure', 'nunique')
    ).reset_index()
    
    differing_ia = key_groups[key_groups['uniq_ia'] > 1]
    differing_status = key_groups[key_groups['uniq_status'] > 1]
    differing_const = key_groups[key_groups['uniq_const'] > 1]
    
    print("\n" + "=" * 80)
    print("DEDUPLICATION KEY SUITABILITY INVESTIGATION")
    print("=" * 80)
    print(f"Groups where ia_name differs on identical key: {len(differing_ia)}")
    print(f"Groups where work_status differs on identical key: {len(differing_status)}")
    print(f"Groups where constituency differs on identical key: {len(differing_const)}")
    
    if len(differing_ia) > 0:
        print("\nExample of groups where ia_name differs:")
        example_keys = differing_ia.head(2)
        for _, r in example_keys.iterrows():
            matching = temp_df[
                (temp_df['work_id'] == r['work_id']) &
                (temp_df['vendor_id'] == r['vendor_id']) &
                (temp_df['fund_disbursed_amount'] == r['fund_disbursed_amount']) &
                (temp_df['expenditure_date'] == r['expenditure_date'])
            ]
            print(matching[['expenditure_id', 'ia_name', 'work_status', 'constituency']])
            
    # Do identical records (same vendor_id, amount, date) appear across different work_ids?
    cross_work_key = ['vendor_id', 'fund_disbursed_amount', 'expenditure_date']
    cross_work_groups = temp_df.groupby(cross_work_key)['work_id'].nunique().reset_index(name='uniq_works')
    cross_works = cross_work_groups[cross_work_groups['uniq_works'] > 1]
    print(f"\nGroups where same vendor/date/amount appear across different works: {len(cross_works)}")
    if len(cross_works) > 0:
        print("Example of cross-work payments:")
        ex = cross_works.head(2)
        for _, r in ex.iterrows():
            matching = temp_df[
                (temp_df['vendor_id'] == r['vendor_id']) &
                (temp_df['fund_disbursed_amount'] == r['fund_disbursed_amount']) &
                (temp_df['expenditure_date'] == r['expenditure_date'])
            ]
            print(matching[['expenditure_id', 'work_id', 'ia_name', 'work_status']])

if __name__ == "__main__":
    main()

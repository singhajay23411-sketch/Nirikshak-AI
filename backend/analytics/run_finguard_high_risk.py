"""run_finguard_high_risk.py

Extracts detailed metrics, component scores, and raw expenditure records
for the remaining High-risk projects in the Nirikshak-AI dataset.
"""

import os
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

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

def main():
    works_path = os.path.join(DATA_DIR, "works.parquet")
    exp_path = os.path.join(DATA_DIR, "expenditures.parquet")
    states_path = os.path.join(DATA_DIR, "states.parquet")
    consts_path = os.path.join(DATA_DIR, "constituencies.parquet")
    
    works = pd.read_parquet(works_path)
    exp = pd.read_parquet(exp_path)
    states = pd.read_parquet(states_path)
    consts = pd.read_parquet(consts_path)
    
    works['normalized_activity_name'] = works['activity_name'].apply(clean_activity_name)
    works['tenure'] = works['tenure'].astype(str)
    exp['tenure'] = exp['tenure'].astype(str)
    
    exp_metrics = compute_expenditure_metrics(exp)
    df = compute_disbursement_rules(works, exp_metrics)
    df = compute_cost_overrun(df)
    mp_metrics = compute_vendor_concentration(exp)
    df = df.merge(mp_metrics, on=['mp_id', 'house_type', 'tenure'], how='left')
    df = benchmark_costs(df, min_samples=15)
    
    engine = FinGuardScoringEngine()
    scored = engine.compute_risk_scores(df)
    
    high_risk = scored[scored['finguard_risk_score'] >= 70].copy()
    high_risk = high_risk.merge(states, on='state_id', how='left')
    high_risk = high_risk.merge(consts, on='constituency_id', how='left')
    
    print(f"Total High-risk projects found: {len(high_risk)}\n")
    
    disb_scorer = DisbursementScorer()
    cost_scorer = CostBenchmarkScorer()
    dup_scorer = DuplicateExpenditureScorer()
    vendor_scorer = VendorConcentrationScorer()
    
    for idx, row in high_risk.iterrows():
        print("=" * 80)
        print(f"Work ID: {row['work_id']} | Score: {row['finguard_risk_score']}/100 | Band: {row['finguard_risk_band']}")
        print("=" * 80)
        print(f"MP identity: mp_id={row['mp_id']}, house_type={row['house_type']}, tenure={row['tenure']}")
        print(f"State: {row['state_name']} | Constituency: {row['constituency_name']}")
        print(f"Activity name: {row['activity_name']}")
        print(f"Normalized activity: {row['normalized_activity_name']}")
        print(f"Work Status: {row['work_status']}")
        print(f"Sanction amount: Rs. {row['sanction_amount']:,.2f} | Actual: Rs. {row['actual_amount']}")
        print(f"Raw disbursed: Rs. {row['raw_total_disbursed']:,.2f} | Analytical: Rs. {row['analytical_total_disbursed']:,.2f}")
        print(f"Duplicate adjustment: Rs. {row['duplicate_adjustment_amount']:,.2f}")
        print(f"Vendor count: {row['number_of_distinct_vendors']} | Top vendor share: {row['top_vendor_share_mp']} | HHI: {row['vendor_hhi_mp']}")
        print(f"Project count for MP-period: {row['project_count_mp']}")
        
        # Benchmarking parameters
        print(f"\nCost Benchmarking details:")
        print(f"  - Level: {row['benchmark_level']}")
        print(f"  - Peer sample size: {row['benchmark_sample_size']}")
        print(f"  - Peer median: Rs. {row['benchmark_median']:,.2f}")
        print(f"  - Percentile: {row['benchmark_percentile']:.1f}%")
        print(f"  - Robust deviation score: {row['robust_z_score']:.2f}")
        print(f"  - Minimum sample threshold used: 15")
        
        # Scorer trace
        sc_disb, _, _ = disb_scorer.evaluate(row)
        sc_cost, _, _ = cost_scorer.evaluate(row)
        sc_dup, _, _ = dup_scorer.evaluate(row)
        sc_vendor, _, _ = vendor_scorer.evaluate(row)
        
        print("\nComponent Scores & Contributions:")
        print(f"  - Disbursement score: {sc_disb:.1f} (Contribution: {sc_disb * 0.35:.1f})")
        print(f"  - Cost Benchmark score: {sc_cost:.1f} (Contribution: {sc_cost * 0.30:.1f})")
        print(f"  - Duplicate score: {sc_dup:.1f} (Contribution: {sc_dup * 0.20:.1f})")
        print(f"  - Vendor Concentration score: {sc_vendor:.1f} (Contribution: {sc_vendor * 0.15:.1f})")
        
        # Expenditure details
        proj_exp = exp[exp['work_id'] == row['work_id']].copy()
        print(f"\nExpenditure Details (Count: {len(proj_exp)}):")
        print(f"  - Unique events count: {row['unique_event_count']}")
        print(f"  - Duplicate records count: {row['duplicate_record_count']}")
        print(f"  - Duplication ratio: {row['duplication_ratio']:.2f}")
        print(f"  - Payment dates: {list(pd.to_datetime(proj_exp['expenditure_date']).dt.strftime('%Y-%m-%d').unique())}")
        
        # Check for exact duplicate records
        dup_cols = ['work_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date', 'ia_name', 'mp_id', 'constituency', 'work_status', 'house_type', 'tenure']
        any_exact_dup = proj_exp.duplicated(subset=[c for c in dup_cols if c in proj_exp.columns]).any()
        print(f"  - Exact duplicates exist on available business fields: {any_exact_dup}")
        print(proj_exp[['expenditure_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date', 'ia_name', 'work_status']].to_string(index=False))
        
        print("\nSignals:")
        for sig in row['finguard_signals']:
            print(f"  - [{sig['type'].upper()} | Severity: {sig['severity'].upper()}] {sig['evidence']}")
            
        print("\nExplanations:")
        for exp_text in row['finguard_explanations']:
            print(f"  * {exp_text}")
        print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()

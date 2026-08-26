"""run_finguard_demo.py

Demonstration runner for FinGuard Analytics Engine.
Loads real Parquet datasets from data/, executes the normalized pipeline,
calculates risk scores for all projects, and outputs statistics and examples.
"""

import os
import time
import pandas as pd
from backend.analytics.finguard.cleaner import clean_activity_name
from backend.analytics.finguard.rules import (
    compute_expenditure_metrics,
    compute_vendor_concentration,
    compute_disbursement_rules,
    compute_cost_overrun
)
from backend.analytics.finguard.benchmarkers import benchmark_costs
from backend.analytics.finguard.scoring import FinGuardScoringEngine

# Path configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

def run_finguard():
    print("=" * 70)
    print("FIN GUARD - PIPELINE DEMO & ANALYSIS RUN")
    print("=" * 70)
    start_time = time.time()
    
    # 1. Load Parquet Data
    print("Loading Parquet datasets...")
    works_path = os.path.join(DATA_DIR, "works.parquet")
    exp_path = os.path.join(DATA_DIR, "expenditures.parquet")
    
    if not os.path.exists(works_path) or not os.path.exists(exp_path):
        print(f"Error: Parquet files not found in {DATA_DIR}!")
        return
        
    works_df = pd.read_parquet(works_path)
    exp_df = pd.read_parquet(exp_path)
    print(f"  -> Works loaded: {len(works_df):,} rows")
    print(f"  -> Expenditures loaded: {len(exp_df):,} rows")
    
    # 2. Normalise and Clean Columns (cleaner.py)
    print("\n[Cleaner] Normalising activity names and tenure strings...")
    works_df['normalized_activity_name'] = works_df['activity_name'].apply(clean_activity_name)
    works_df['tenure'] = works_df['tenure'].astype(str)
    exp_df['tenure'] = exp_df['tenure'].astype(str)
    # Note: Tenure normalization can be done dynamically if needed but we keep values consistent here
    
    # 3. Rules Engine and Aggregations (rules.py)
    print("\n[Rules] Aggregating expenditure records and duplicate event patterns...")
    exp_metrics = compute_expenditure_metrics(exp_df)
    
    print("[Rules] Calculating disbursement ratios and actual completion discrepancies...")
    df = compute_disbursement_rules(works_df, exp_metrics)
    df = compute_cost_overrun(df)
    
    print("[Rules] Evaluating vendor concentration at MP-period composite levels...")
    mp_metrics = compute_vendor_concentration(exp_df)
    df = df.merge(mp_metrics, on=['mp_id', 'house_type', 'tenure'], how='left')
    
    # 4. Statistical Benchmarking (benchmarkers.py)
    print("\n[Benchmarker] Performing hierarchical cost benchmarking (min_samples=15)...")
    df = benchmark_costs(df, min_samples=15)
    
    # 5. Risk Scoring Engine (scoring.py)
    print("\n[Scoring] Running explainable scoring engine and generating signals...")
    engine = FinGuardScoringEngine()
    scored_df = engine.compute_risk_scores(df)
    
    elapsed = time.time() - start_time
    print(f"Pipeline execution finished in {elapsed:.2f} seconds.")
    
    # 6. Distribution Analysis
    print("\n" + "=" * 70)
    print("FIN GUARD RISK DISTRIBUTION")
    print("=" * 70)
    counts = scored_df['finguard_risk_band'].value_counts()
    print(counts)
    
    # 7. Print Sample Alerts (Critical and High Risk Works)
    print("\n" + "=" * 70)
    print("SAMPLE FIN GUARD ALERTS (CRITICAL & HIGH RISK)")
    print("=" * 70)
    
    # Select critical anomalies
    anomalous = scored_df[scored_df['finguard_risk_score'] >= 70]
    
    # Sample different categories of alerts
    samples = anomalous.head(4)
    
    for idx, row in samples.iterrows():
        print(f"\nWork ID: {row['work_id']} | Score: {row['finguard_risk_score']}/100 | Band: {row['finguard_risk_band']}")
        print(f"Original Activity Name: {row['activity_name']}")
        print(f"Cleaned Activity:       {row['normalized_activity_name']}")
        print(f"Sanctioned Amount: Rs. {row['sanction_amount']:,.2f} | Raw Disbursed: Rs. {row['raw_total_disbursed']:,.2f} | Analytical Disbursed: Rs. {row['analytical_total_disbursed']:,.2f}")
        
        print("Signals Block:")
        for sig in row['finguard_signals']:
            print(f"  - [{sig['type'].upper()} | Severity: {sig['severity'].upper()}] {sig['evidence']}")
            
        print("Explanations Block:")
        for exp in row['finguard_explanations']:
            print(f"  * {exp}")
            
    print("\n" + "=" * 70)
    print("End of Analysis")
    print("=" * 70)

if __name__ == "__main__":
    run_finguard()

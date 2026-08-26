"""dq_engine.py

Implements the reusable Data Quality Engine for Nirikshak-AI.
Processes expenditure records to calculate:
- Raw record counts and totals
- Exact-duplicate-adjusted analytical totals
- Status conflict groups (different status on identical transaction key)
- Missing/invalid critical fields
- Structured evidence and category-level signals
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Any, Tuple
from .models import (
    ProjectContext,
    Evidence,
    Signal,
    VerificationResult,
    Assessment,
    FinGuardResult,
    CATEGORY_DATA_INTEGRITY,
    STATUS_UNVERIFIED,
    STATUS_MATCHED,
    SEVERITY_LOW,
    SEVERITY_MEDIUM,
    SEVERITY_HIGH,
    SEVERITY_CRITICAL
)

class DataQualityEngine:
    """Evaluates the integrity and analytical usability of project and expenditure records."""

    def __init__(self):
        # Business columns defining a full identical record
        self.business_cols = [
            'work_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date',
            'work_status', 'ia_name', 'mp_id', 'constituency', 'house_type', 'tenure'
        ]

    def analyze_expenditures(self, exp_df: pd.DataFrame) -> Dict[str, Any]:
        """Performs data quality audit across a set of expenditure rows.
        
        Args:
            exp_df: expenditures DataFrame containing transaction records.
            
        Returns:
            Dict containing raw counts, analytical totals, list of Signals, and Evidence.
        """
        if exp_df.empty:
            return {
                "raw_record_count": 0,
                "unique_event_count": 0,
                "duplicate_record_count": 0,
                "duplication_ratio": 0.0,
                "raw_total_disbursed": 0.0,
                "analytical_total_disbursed": 0.0,
                "duplicate_adjustment_amount": 0.0,
                "status_conflict_count": 0,
                "missing_critical_count": 0,
                "invalid_amount_count": 0,
                "invalid_date_count": 0,
                "signals": [],
                "evidence": []
            }

        # 1. Null and missing critical fields check
        missing_mask = (
            exp_df['work_id'].isna() | 
            exp_df['vendor_id'].isna() | 
            exp_df['fund_disbursed_amount'].isna() | 
            exp_df['expenditure_date'].isna()
        )
        missing_count = int(missing_mask.sum())

        # 2. Invalid amounts check
        invalid_amount_mask = (exp_df['fund_disbursed_amount'] <= 0) | exp_df['fund_disbursed_amount'].isna()
        invalid_amount_count = int(invalid_amount_mask.sum())

        # 3. Invalid dates check (e.g. unparseable or out of bounds)
        parsed_dates = pd.to_datetime(exp_df['expenditure_date'], errors='coerce')
        invalid_date_mask = parsed_dates.isna() | (parsed_dates.dt.year < 2000) | (parsed_dates.dt.year > 2030)
        invalid_date_count = int(invalid_date_mask.sum())

        # Create clean copy for business key groupings
        df_clean = exp_df.copy()
        df_clean['work_id'] = df_clean['work_id'].fillna(-1)
        df_clean['vendor_id'] = df_clean['vendor_id'].fillna(-1)
        df_clean['fund_disbursed_amount'] = df_clean['fund_disbursed_amount'].fillna(0.0)
        df_clean['expenditure_date'] = df_clean['expenditure_date'].astype(str).fillna('1970-01-01')
        df_clean['work_status'] = df_clean['work_status'].fillna('unknown')

        # 4. Raw totals
        raw_record_count = len(exp_df)
        raw_total_disbursed = float(exp_df['fund_disbursed_amount'].sum())

        # 5. Deduplication (Exact duplicates merge on all business columns that exist in the inputs)
        cols_to_use = [c for c in self.business_cols if c in df_clean.columns]
        exact_dup_mask = df_clean.duplicated(subset=cols_to_use, keep='first')
        duplicate_record_count = int(exact_dup_mask.sum())
        
        # The analytical set retains unique events + status conflicts (not merged)
        df_analytical = df_clean[~exact_dup_mask]
        unique_event_count = len(df_analytical)
        
        analytical_total_disbursed = float(df_analytical['fund_disbursed_amount'].sum())
        duplicate_adjustment_amount = raw_total_disbursed - analytical_total_disbursed
        duplication_ratio = (duplicate_record_count / raw_record_count) if raw_record_count > 0 else 0.0

        # 6. Status Conflict detection
        # Transaction key defines uniqueness before status/ia details
        key_cols = ['work_id', 'vendor_id', 'fund_disbursed_amount', 'expenditure_date']
        status_counts = df_analytical.groupby(key_cols).size().reset_index(name='status_count')
        conflicts = status_counts[status_counts['status_count'] > 1]
        status_conflict_count = len(conflicts)

        # 7. Generate Signals & Evidence
        signals = []
        evidence_list = []

        if duplicate_record_count > 0:
            ev_dup = Evidence(
                evidence_text=(
                    f"{raw_record_count} raw expenditure records were observed representing {unique_event_count} exact analytical events. "
                    f"Exact duplicate records account for Rs. {duplicate_adjustment_amount:,.2f} of the raw recorded total."
                ),
                source="expenditures.parquet",
                value={
                    "raw_record_count": raw_record_count,
                    "unique_event_count": unique_event_count,
                    "duplicate_record_count": duplicate_record_count,
                    "duplicate_adjustment_amount": duplicate_adjustment_amount
                }
            )
            evidence_list.append(ev_dup)

            sig_dup = Signal(
                signal_type="EXACT_DUPLICATE_RECORDS",
                category=CATEGORY_DATA_INTEGRITY,
                severity=SEVERITY_MEDIUM if duplication_ratio < 0.2 else (SEVERITY_HIGH if duplication_ratio < 0.5 else SEVERITY_CRITICAL),
                observed_value=float(duplicate_record_count),
                threshold_benchmark=0.0,
                score_contribution=0.0,
                evidence=[ev_dup],
                source="DataQualityEngine",
                confidence=1.0,
                verification_status=STATUS_UNVERIFIED
            )
            signals.append(sig_dup)

            sig_adj = Signal(
                signal_type="DUPLICATE_ADJUSTMENT",
                category=CATEGORY_DATA_INTEGRITY,
                severity=SEVERITY_LOW if duplicate_adjustment_amount < 50000.0 else SEVERITY_MEDIUM,
                observed_value=duplicate_adjustment_amount,
                threshold_benchmark=0.0,
                score_contribution=0.0,
                evidence=[ev_dup],
                source="DataQualityEngine",
                confidence=1.0,
                verification_status=STATUS_UNVERIFIED
            )
            signals.append(sig_adj)

        if status_conflict_count > 0:
            ev_conf = Evidence(
                evidence_text=f"Detected {status_conflict_count} groups with identical transaction keys but conflicting payment statuses.",
                source="expenditures.parquet",
                value=status_conflict_count
            )
            evidence_list.append(ev_conf)

            sig_conf = Signal(
                signal_type="STATUS_CONFLICT",
                category=CATEGORY_DATA_INTEGRITY,
                severity=SEVERITY_MEDIUM,
                observed_value=float(status_conflict_count),
                threshold_benchmark=0.0,
                score_contribution=0.0,
                evidence=[ev_conf],
                source="DataQualityEngine",
                confidence=1.0,
                verification_status=STATUS_UNVERIFIED
            )
            signals.append(sig_conf)

        if missing_count > 0:
            ev_miss = Evidence(
                evidence_text=f"Detected {missing_count} rows with missing critical business columns.",
                source="expenditures.parquet",
                value=missing_count
            )
            evidence_list.append(ev_miss)

            sig_miss = Signal(
                signal_type="MISSING_CRITICAL_FIELD",
                category=CATEGORY_DATA_INTEGRITY,
                severity=SEVERITY_HIGH,
                observed_value=float(missing_count),
                threshold_benchmark=0.0,
                score_contribution=0.0,
                evidence=[ev_miss],
                source="DataQualityEngine",
                confidence=1.0,
                verification_status=STATUS_UNVERIFIED
            )
            signals.append(sig_miss)

        if invalid_amount_count > 0:
            ev_inv_amt = Evidence(
                evidence_text=f"Detected {invalid_amount_count} rows with zero or negative disbursement amounts.",
                source="expenditures.parquet",
                value=invalid_amount_count
            )
            evidence_list.append(ev_inv_amt)

            sig_inv_amt = Signal(
                signal_type="INVALID_AMOUNT",
                category=CATEGORY_DATA_INTEGRITY,
                severity=SEVERITY_HIGH,
                observed_value=float(invalid_amount_count),
                threshold_benchmark=0.0,
                score_contribution=0.0,
                evidence=[ev_inv_amt],
                source="DataQualityEngine",
                confidence=1.0,
                verification_status=STATUS_UNVERIFIED
            )
            signals.append(sig_inv_amt)

        if invalid_date_count > 0:
            ev_inv_date = Evidence(
                evidence_text=f"Detected {invalid_date_count} rows with missing, unparseable, or out-of-bounds payment dates.",
                source="expenditures.parquet",
                value=invalid_date_count
            )
            evidence_list.append(ev_inv_date)

            sig_inv_date = Signal(
                signal_type="INVALID_DATE",
                category=CATEGORY_DATA_INTEGRITY,
                severity=SEVERITY_HIGH,
                observed_value=float(invalid_date_count),
                threshold_benchmark=0.0,
                score_contribution=0.0,
                evidence=[ev_inv_date],
                source="DataQualityEngine",
                confidence=1.0,
                verification_status=STATUS_UNVERIFIED
            )
            signals.append(sig_inv_date)

        return {
            "raw_record_count": raw_record_count,
            "unique_event_count": unique_event_count,
            "duplicate_record_count": duplicate_record_count,
            "duplication_ratio": duplication_ratio,
            "raw_total_disbursed": raw_total_disbursed,
            "analytical_total_disbursed": analytical_total_disbursed,
            "duplicate_adjustment_amount": duplicate_adjustment_amount,
            "status_conflict_count": status_conflict_count,
            "missing_critical_count": missing_count,
            "invalid_amount_count": invalid_amount_count,
            "invalid_date_count": invalid_date_count,
            "signals": signals,
            "evidence": evidence_list
        }

    def analyze_project(self, project_info: ProjectContext, project_exp_df: pd.DataFrame) -> FinGuardResult:
        """Performs data quality analysis on a single project context.
        
        Args:
            project_info: ProjectContext details.
            project_exp_df: DataFrame of expenditures for this project.
            
        Returns:
            FinGuardResult wrapping derived project context, data integrity assessment, and evidence.
        """
        res = self.analyze_expenditures(project_exp_df)
        
        # Update project context with DQ findings
        project_info.raw_record_count = res["raw_record_count"]
        project_info.unique_event_count = res["unique_event_count"]
        project_info.duplicate_record_count = res["duplicate_record_count"]
        project_info.duplication_ratio = res["duplication_ratio"]
        project_info.raw_total_disbursed = res["raw_total_disbursed"]
        project_info.analytical_total_disbursed = res["analytical_total_disbursed"]
        project_info.duplicate_adjustment_amount = res["duplicate_adjustment_amount"]
        
        # Calculate separate Data Integrity Assessment score (weighted duplication ratio)
        score = int(round(res["duplication_ratio"] * 100.0))
        if score >= 90:
            band = "Critical"
        elif score >= 70:
            band = "High"
        elif score >= 40:
            band = "Medium"
        else:
            band = "Low"
            
        data_integrity_assess = Assessment(
            score=score,
            band=band,
            signals=res["signals"],
            summary=f"Data integrity score of {score}% based on {res['duplicate_record_count']} duplicates out of {res['raw_record_count']} raw records."
        )
        
        # Financial Assessment placeholder (empty in DQ scope)
        financial_assess = Assessment(score=0, band="Low", signals=[])
        
        # Verification status check
        match_status = STATUS_MATCHED if np.isclose(res["analytical_total_disbursed"], project_info.sanction_amount) else STATUS_UNVERIFIED
        vr = VerificationResult(status=match_status)
        
        priority = "Critical" if band == "Critical" else ("High" if band == "High" else ("Medium" if band == "Medium" else "Low"))
        
        return FinGuardResult(
            project_info=project_info,
            financial_assessment=financial_assess,
            data_integrity_assessment=data_integrity_assess,
            verification=vr,
            investigation_priority=priority,
            confidence=1.0,
            evidence=res["evidence"],
            module_id="finguard"
        )

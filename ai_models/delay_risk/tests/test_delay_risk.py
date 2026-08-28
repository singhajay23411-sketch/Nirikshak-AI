"""test_delay_risk.py

Comprehensive Test Suite for the Delay Risk Detection module.
Validates all 17 backend integration and safety requirements.
"""

import os
import sys
import hashlib
import json
import pytest
from datetime import datetime, timedelta

# Ensure ai-model is on sys.path
MODULE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if MODULE_ROOT not in sys.path:
    sys.path.insert(0, MODULE_ROOT)

from delay_risk.config import (
    FEATURE_NAMES,
    FORBIDDEN_LEAKAGE_COLUMNS,
    UNIFIED_RISK_WEIGHT,
    RISK_TIERS,
    VALID_MODES,
)
from delay_risk.model import DelayRiskMLModel
from delay_risk.scoring import (
    DelayRiskScorer,
    extract_features_from_dict,
    validate_input_payload,
    CRITICAL_TARGET_LEAKAGE,
)
from delay_risk.explainability import generate_predictive_risk_factors

DATA_DIR = os.path.abspath(os.path.join(MODULE_ROOT, "..", "data", "parquet"))
MODEL_PATH = os.path.abspath(os.path.join(MODULE_ROOT, "delay_risk", "delay_risk_model.joblib"))


# 1. Test Model Loading & Features
def test_01_model_loading():
    """Verify that the production Random Forest model artifact loads correctly."""
    assert os.path.exists(MODEL_PATH), f"Model artifact not found at {MODEL_PATH}"
    model = DelayRiskMLModel(MODEL_PATH)
    assert model.is_loaded is True
    assert model.model is not None


def test_02_feature_count_and_order():
    """Verify that exactly 17 canonical features are defined in exact order."""
    model = DelayRiskMLModel(MODEL_PATH)
    assert len(FEATURE_NAMES) == 17
    assert model.feature_names == FEATURE_NAMES
    expected_order = [
        "recom_to_sanc_days",
        "sanction_year",
        "sanction_month",
        "sanction_quarter",
        "sanction_dayofweek",
        "log_sanction_amount",
        "log_recommended_amount",
        "recom_sanc_amount_diff",
        "recom_sanc_amount_ratio",
        "category_code",
        "house_type_code",
        "tenure_code",
        "state_id_code",
        "constituency_id_code",
        "exp_count_90d",
        "disbursed_amount_90d",
        "disbursed_ratio_90d",
    ]
    assert FEATURE_NAMES == expected_order


def test_03_04_probability_and_score_bounds():
    """Verify that probability is in [0, 1] and risk score is in [0, 100]."""
    scorer = DelayRiskScorer()
    sample_payload = {
        "work_id": 60423,
        "mode": "early_progress",
        "recommendation_date": "2024-01-10",
        "sanction_date": "2024-02-15",
        "sanction_amount": 500000.0,
        "recommended_amount": 550000.0,
        "work_category": "Normal",
        "house_type": 2,
        "tenure": "18th LS",
        "state_id": 1,
        "constituency_id": 123,
        "expenditures": [
            {"expenditure_date": "2024-03-01", "fund_disbursed_amount": 50000.0}
        ]
    }
    result = scorer.assess_project(sample_payload)
    assert 0.0 <= result["delay_probability"] <= 1.0
    assert 0.0 <= result["delay_risk_score"] <= 100.0
    assert result["delay_risk_score"] == round(result["delay_probability"] * 100.0, 2)


def test_05_06_exact_tier_mapping_and_contribution():
    """Verify that every valid score maps to exactly one tier and contribution is 15%."""
    scorer = DelayRiskScorer()
    
    test_cases = [
        (15.0, "LOW", 2.25),
        (29.99, "LOW", 4.50),
        (30.0, "MODERATE", 4.50),
        (45.0, "MODERATE", 6.75),
        (50.0, "HIGH", 7.50),
        (69.99, "HIGH", 10.50),
        (70.0, "CRITICAL", 10.50),
        (85.0, "CRITICAL", 12.75),
        (100.0, "CRITICAL", 15.00),
    ]
    
    for score, expected_tier, expected_contrib in test_cases:
        tier = scorer.map_score_to_tier(score)
        assert tier == expected_tier
        contrib = round(score * UNIFIED_RISK_WEIGHT, 2)
        assert contrib == expected_contrib


def test_07_leakage_rejection():
    """Verify that any payload with forbidden future outcome fields is strictly rejected."""
    scorer = DelayRiskScorer()
    
    for forbidden_col in CRITICAL_TARGET_LEAKAGE:
        bad_payload = {
            "work_id": 999,
            "mode": "early_progress",
            "sanction_date": "2024-01-01",
            "sanction_amount": 500000.0,
            forbidden_col: "LEAKAGE_VALUE"
        }
        with pytest.raises(ValueError, match="LEAKAGE VIOLATION"):
            scorer.assess_project(bad_payload)


def test_08_09_observation_modes_and_expenditure_filtering():
    """Verify that initiation mode ignores expenditures and early_progress filters >90d."""
    sanc_date = "2024-01-01"
    
    payload = {
        "work_id": 1001,
        "recommendation_date": "2023-11-01",
        "sanction_date": sanc_date,
        "sanction_amount": 1000000.0,
        "recommended_amount": 1000000.0,
        "work_category": "Normal",
        "house_type": 2,
        "tenure": "18th LS",
        "state_id": 10,
        "constituency_id": 50,
        "expenditures": [
            {"expenditure_date": "2024-02-01", "fund_disbursed_amount": 200000.0},  # Day 31: valid for 90d
            {"expenditure_date": "2024-06-01", "fund_disbursed_amount": 500000.0},  # Day 152: FUTURE >90d (must be excluded)
        ]
    }
    
    # Mode A: Initiation (t_obs = sanction_date)
    feat_init = extract_features_from_dict(payload, mode="initiation")
    assert feat_init["exp_count_90d"] == 0
    assert feat_init["disbursed_amount_90d"] == 0.0
    assert feat_init["disbursed_ratio_90d"] == 0.0

    # Mode B: Early Progress (t_obs = sanction_date + 90 days)
    feat_early = extract_features_from_dict(payload, mode="early_progress")
    assert feat_early["exp_count_90d"] == 1  # Only the 2024-02-01 disbursement
    assert feat_early["disbursed_amount_90d"] == 200000.0
    assert feat_early["disbursed_ratio_90d"] == 0.20  # 200k / 1000k


def test_10_invalid_mode_error():
    """Verify that an invalid mode raises a clear ValueError."""
    scorer = DelayRiskScorer()
    bad_mode_payload = {
        "work_id": 555,
        "mode": "post_completion",  # Invalid mode
        "sanction_date": "2024-01-01",
        "sanction_amount": 500000.0
    }
    with pytest.raises(ValueError, match="Invalid observation mode"):
        scorer.assess_project(bad_mode_payload)


def test_11_invalid_amount_error():
    """Verify that negative amounts raise a clear ValueError."""
    scorer = DelayRiskScorer()
    bad_amt_payload = {
        "work_id": 555,
        "mode": "initiation",
        "sanction_date": "2024-01-01",
        "sanction_amount": -50000.0  # Invalid negative
    }
    with pytest.raises(ValueError, match="Invalid negative amount"):
        scorer.assess_project(bad_amt_payload)


def test_12_non_causal_explainability():
    """Verify that generated explanations use observational / predictive phrasing without causal claims."""
    features = {
        "recom_to_sanc_days": 150.0,
        "log_sanction_amount": 14.0,
        "disbursed_ratio_90d": 0.0,
        "exp_count_90d": 0,
        "recom_sanc_amount_ratio": 1.5,
        "sanction_month": 7
    }
    signals = generate_predictive_risk_factors(features, mode="early_progress")
    assert len(signals) >= 3
    valid_terms = ["predictive signal", "associated with", "indicates", "indicated", "guideline", "constraints", "baseline"]
    for s in signals:
        assert "caused" not in s.lower()
        assert any(term in s.lower() for term in valid_terms)


def test_13_raw_parquet_immutability():
    """Verify that all raw Parquet files in data/parquet remain byte-for-byte unmodified."""
    expected_hashes = {
        "works.parquet": "57513bcf18f5311b",
        "expenditures.parquet": "4025aa1f0a988b8f",
        "vendors.parquet": "a28918b42c6e4b69",
        "constituencies.parquet": "e2435f8bfd6a0472",
        "states.parquet": "776605881e811c6e",
        "mp_allocations.parquet": "fae21b4e1f00b7f5",
        "mps.parquet": "5ee7ce345296e579"
    }
    for fname, exp_prefix in expected_hashes.items():
        fpath = os.path.join(DATA_DIR, fname)
        assert os.path.exists(fpath), f"Parquet file {fname} missing!"
        with open(fpath, "rb") as f:
            h = hashlib.sha256(f.read()).hexdigest()
        assert h.startswith(exp_prefix), f"Parquet file {fname} modified! Hash: {h[:16]}"


if __name__ == "__main__":
    pytest.main(["-v", __file__])

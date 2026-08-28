"""test_e2e.py

Phase 9: Automated End-to-End (E2E) Integration and Serialization Test Suite
Verifies the complete pipeline flow from database parquet loading to final scoring and API serialization.
"""

import os
import sys
import json
import unittest
import numpy as np
import pandas as pd

# Add workspace root and module root to path
MODULE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORKSPACE_ROOT = os.path.abspath(os.path.join(MODULE_ROOT, ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)
if MODULE_ROOT not in sys.path:
    sys.path.insert(0, MODULE_ROOT)

from shared.types import AgencyRiskResult, ProjectAgencyRiskResult
from agency_intelligence.scoring import AgencyRiskScorer
from agency_intelligence.config import NEUTRAL_BASELINE_SCORE, UNIFIED_RISK_WEIGHT, RISK_TIERS
from agency_intelligence.signals import compute_adaptive_ia_weight
from ai_models.feature_builder import load_datasets, compute_agency_risk_features


class TestAgencyIntelligenceE2E(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Load real datasets in a read-only manner
        cls.dfs = load_datasets()
        cls.works_full = cls.dfs['works']
        cls.exp_full = cls.dfs['expenditures']
        cls.scorer = AgencyRiskScorer()

    def test_a_successful_real_data_pipeline(self):
        """Test A: Verifies the E2E feature extraction pipeline executes successfully on real data slice."""
        works_slice = self.works_full.head(100).copy()
        exp_slice = self.exp_full[self.exp_full['work_id'].isin(works_slice['work_id'])].copy()

        # Compute features
        enriched = compute_agency_risk_features(works_slice, exp_slice)

        # Verify columns exist and are fully populated
        for col in ["agency_risk_score", "agency_risk_tier", "agency_risk_contribution", "agency_risk_factors"]:
            self.assertIn(col, enriched.columns)
            self.assertEqual(enriched[col].isnull().sum(), 0)

    def test_b_risk_score_validity(self):
        """Test B: Verify continuous score boundaries (0-100) and configured risk tiers."""
        works_slice = self.works_full.head(100).copy()
        exp_slice = self.exp_full[self.exp_full['work_id'].isin(works_slice['work_id'])].copy()

        enriched = compute_agency_risk_features(works_slice, exp_slice)

        valid_tiers = set(RISK_TIERS.keys())
        for score in enriched["agency_risk_score"]:
            self.assertTrue(0.0 <= score <= 100.0)

        for tier in enriched["agency_risk_tier"]:
            self.assertIn(tier, valid_tiers)

    def test_c_unified_5_percent_contribution(self):
        """Test C: Verify the contribution follows the exact score * 0.05 contribution formula."""
        works_slice = self.works_full.head(100).copy()
        exp_slice = self.exp_full[self.exp_full['work_id'].isin(works_slice['work_id'])].copy()

        enriched = compute_agency_risk_features(works_slice, exp_slice)

        for idx, row in enriched.iterrows():
            score = row["agency_risk_score"]
            contribution = row["agency_risk_contribution"]
            # Use NumPy round to match the feature builder rounding logic
            expected = np.round(score * UNIFIED_RISK_WEIGHT, 3)
            self.assertAlmostEqual(contribution, expected, places=3)

    def test_d_risk_factors_and_confidence_preservation(self):
        """Test D: Verify that confidence and risk factor structures are preserved correctly."""
        res = self.scorer.score_agency(
            agency_name="Block Development Office / Panchayat Samiti",
            agency_level="IA",
            completed_projects=1000,
            delay_count=300,
            median_duration_days=200.0,
            data_confidence="Strong"
        )

        self.assertEqual(res.agency_name, "Block Development Office / Panchayat Samiti")
        self.assertEqual(res.data_confidence, "Strong")
        self.assertTrue(any("Block Development Office" in f or "delay" in f.lower() or "confidence" in f.lower() for f in res.risk_factors))

    def test_e_missing_and_weak_data_safety(self):
        """Test E: Verify that incomplete, empty, or unresolved records do not crash the system."""
        # 1. Missing IA name (should default/blend safely using default neutral IA)
        works_missing_ia = pd.DataFrame([{
            'work_id': 99999,
            'ida_name': 'JAUNPUR(DISTRICT MAGISTRATE JAUNPUR_IDA)',
            'sanction_date': '2024-01-01',
            'actual_end_date': '2024-08-01',
            'work_status': 'Completed'
        }])
        exp_empty = pd.DataFrame(columns=['expenditure_id', 'work_id', 'ia_name', 'fund_disbursed_amount', 'vendor_id'])

        res = compute_agency_risk_features(works_missing_ia, exp_empty)
        self.assertEqual(len(res), 1)
        self.assertIsNotNone(res.loc[0, "agency_risk_score"])

        # 2. Unresolved / Unknown identity (None/NaN)
        works_unresolved = pd.DataFrame([{
            'work_id': 88888,
            'ida_name': None,
            'sanction_date': '2024-01-01',
            'actual_end_date': '2024-08-01',
            'work_status': 'Completed'
        }])

        res_unresolved = compute_agency_risk_features(works_unresolved, exp_empty)
        self.assertEqual(res_unresolved.loc[0, "agency_risk_score"], NEUTRAL_BASELINE_SCORE)

    def test_f_ida_ia_hierarchy_weights(self):
        """Test F: Verify Phase 6 scoring hierarchy weights (IDA Anchor 70%-100%, IA Modifier 0%-30%)."""
        # N=0 IA completed projects -> 0% IA weight, 100% IDA weight
        w_ia_0 = compute_adaptive_ia_weight(0, has_valid_ia=True)
        self.assertEqual(w_ia_0, 0.0)

        # High sample IA completed projects -> maxes out asymptotically near 30% IA weight
        w_ia_max = compute_adaptive_ia_weight(1000, has_valid_ia=True)
        self.assertLessEqual(w_ia_max, 0.30)
        self.assertGreater(w_ia_max, 0.29)

        ida_weight = 1.0 - w_ia_max
        self.assertGreaterEqual(ida_weight, 0.70)
        self.assertLessEqual(ida_weight, 1.0)

    def test_g_api_serialization(self):
        """Test G: Verify that computed results serialize cleanly to JSON/dict for backend API responses."""
        res_ia = self.scorer.score_agency(
            agency_name="Test IA",
            agency_level="IA",
            completed_projects=50,
            delay_count=10
        )

        # Dict serialization
        res_dict = res_ia.to_dict()
        self.assertIsInstance(res_dict, dict)
        self.assertEqual(res_dict["agency_name"], "Test IA")
        self.assertEqual(res_dict["agency_risk_score"], round(res_ia.agency_risk_score, 2))

        # JSON serialization compatibility
        res_json = json.dumps(res_dict)
        self.assertIsInstance(res_json, str)
        deserialized = json.loads(res_json)
        self.assertEqual(deserialized["agency_risk_score"], round(res_ia.agency_risk_score, 2))

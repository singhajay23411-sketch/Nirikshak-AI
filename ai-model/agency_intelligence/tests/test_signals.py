"""test_signals.py

Unit tests for signal engineering transformations, empirical Bayes shrinkage math,
and calibrated piecewise score mappings.
"""

import os
import sys
import unittest
import numpy as np

MODULE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if MODULE_ROOT not in sys.path:
    sys.path.insert(0, MODULE_ROOT)

from agency_intelligence.config import (
    MATURE_BASELINE_DELAY_RATE,
    MATURE_BASELINE_MEDIAN_DAYS,
    EB_PRIOR_ALPHA,
    EB_PRIOR_BETA,
    EB_PRIOR_MEAN,
    NEUTRAL_BASELINE_SCORE,
)
from agency_intelligence.signals import (
    calibrate_agency_risk_score,
    normalize_performance_component,
    normalize_speed_component,
    normalize_workload_component,
    compute_baseline_delay_gap,
    compute_speed_gap_days,
    get_confidence_weight,
    compute_adaptive_ia_weight,
)


class TestAgencySignals(unittest.TestCase):

    def test_empirical_bayes_shrinkage_math(self):
        # Prior Mean check: alpha / (alpha + beta) == 0.364805
        prior_mean = EB_PRIOR_ALPHA / (EB_PRIOR_ALPHA + EB_PRIOR_BETA)
        self.assertAlmostEqual(prior_mean, MATURE_BASELINE_DELAY_RATE, places=4)

        # N=0: exact prior mean
        shrunk_n0 = (0 + EB_PRIOR_ALPHA) / (0 + EB_PRIOR_ALPHA + EB_PRIOR_BETA)
        self.assertAlmostEqual(shrunk_n0, MATURE_BASELINE_DELAY_RATE, places=4)

        # N=1, k=1
        shrunk_n1_k1 = (1 + EB_PRIOR_ALPHA) / (1 + EB_PRIOR_ALPHA + EB_PRIOR_BETA)
        self.assertAlmostEqual(shrunk_n1_k1, (1 + 1.824025) / 6.0, places=4)

        # N=1, k=0
        shrunk_n1_k0 = (0 + EB_PRIOR_ALPHA) / (1 + EB_PRIOR_ALPHA + EB_PRIOR_BETA)
        self.assertAlmostEqual(shrunk_n1_k0, 1.824025 / 6.0, places=4)

        # N=100, k=50
        shrunk_n100_k50 = (50 + EB_PRIOR_ALPHA) / (100 + EB_PRIOR_ALPHA + EB_PRIOR_BETA)
        self.assertAlmostEqual(shrunk_n100_k50, 51.824025 / 105.0, places=4)

    def test_calibrated_piecewise_mapping(self):
        # 0% delay -> 0.0
        self.assertAlmostEqual(calibrate_agency_risk_score(0.0), 0.0, places=2)
        # 20% delay -> 30.0 (LOW boundary)
        self.assertAlmostEqual(calibrate_agency_risk_score(0.20), 30.0, places=2)
        # Mature Baseline (36.48%) -> 45.0 (MODERATE neutral baseline)
        self.assertAlmostEqual(calibrate_agency_risk_score(MATURE_BASELINE_DELAY_RATE), 45.0, places=2)
        # 55% delay -> 65.0 (HIGH tier)
        self.assertAlmostEqual(calibrate_agency_risk_score(0.55), 65.0, places=2)
        # 70% delay -> 80.0 (CRITICAL tier)
        self.assertAlmostEqual(calibrate_agency_risk_score(0.70), 80.0, places=2)
        # 100% delay -> 100.0
        self.assertAlmostEqual(calibrate_agency_risk_score(1.00), 100.0, places=2)

    def test_adaptive_ia_weights(self):
        # Missing or N=0 IA
        self.assertEqual(compute_adaptive_ia_weight(0, has_valid_ia=False), 0.0)
        self.assertEqual(compute_adaptive_ia_weight(0, has_valid_ia=True), 0.0)

        # N=20 (half-life N): credibility = 20/40 = 0.50 -> weight = 0.50 * 0.30 = 0.15
        self.assertAlmostEqual(compute_adaptive_ia_weight(20, has_valid_ia=True), 0.15, places=3)

        # N=100: credibility = 100/120 = 0.833 -> weight = 0.833 * 0.30 = 0.25
        self.assertAlmostEqual(compute_adaptive_ia_weight(100, has_valid_ia=True), 0.25, places=3)

        # Capped at 0.30 maximum
        self.assertLessEqual(compute_adaptive_ia_weight(10000, has_valid_ia=True), 0.30)

    def test_confidence_weights(self):
        self.assertEqual(get_confidence_weight("Strong"), 1.00)
        self.assertEqual(get_confidence_weight("Moderate"), 0.85)
        self.assertEqual(get_confidence_weight("Low"), 0.60)
        self.assertEqual(get_confidence_weight("Very Low"), 0.30)


if __name__ == "__main__":
    unittest.main()

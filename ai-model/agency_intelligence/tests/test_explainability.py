"""test_explainability.py

Unit tests for explainability factor generation and non-causal language adherence.
"""

import os
import sys
import unittest

MODULE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if MODULE_ROOT not in sys.path:
    sys.path.insert(0, MODULE_ROOT)

from agency_intelligence.explainability import generate_agency_risk_factors


class TestAgencyExplainability(unittest.TestCase):

    def test_high_delay_factors(self):
        factors = generate_agency_risk_factors(
            shrunken_delay_rate=0.75,
            baseline_delay_gap=0.385,
            speed_gap_days=200.0,
            workload_pressure=2.2,
            data_confidence="Strong",
            completed_projects=150
        )
        self.assertTrue(any("elevated above mature baseline" in f for f in factors))
        self.assertTrue(any("chronic duration overruns" in f for f in factors))
        self.assertTrue(any("workload is significantly elevated" in f for f in factors))
        self.assertTrue(any("robust track record" in f for f in factors))

    def test_low_sample_safeguard_factors(self):
        factors = generate_agency_risk_factors(
            shrunken_delay_rate=0.64,
            baseline_delay_gap=0.275,
            speed_gap_days=100.0,
            workload_pressure=1.0,
            data_confidence="Very Low",
            completed_projects=1
        )
        self.assertTrue(any("Limited historical observations" in f for f in factors))
        self.assertTrue(any("empirical Bayes shrinkage" in f for f in factors))


if __name__ == "__main__":
    unittest.main()

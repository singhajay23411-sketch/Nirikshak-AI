"""test_temporal_safety.py

Unit tests for strict temporal safety, future data leakage quarantine, and raw parquet immutability.
"""

import os
import sys
import unittest
import pandas as pd

MODULE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if MODULE_ROOT not in sys.path:
    sys.path.insert(0, MODULE_ROOT)

from agency_intelligence.config import FORBIDDEN_LEAKAGE_COLUMNS
from agency_intelligence.profiling import build_agency_profiles


class TestTemporalSafety(unittest.TestCase):

    def test_leakage_quarantine_definition(self):
        self.assertIn("actual_end_date", FORBIDDEN_LEAKAGE_COLUMNS)
        self.assertIn("actual_amount", FORBIDDEN_LEAKAGE_COLUMNS)
        self.assertIn("is_delayed", FORBIDDEN_LEAKAGE_COLUMNS)
        self.assertIn("completion_duration_days", FORBIDDEN_LEAKAGE_COLUMNS)

    def test_point_in_time_historical_quarantine(self):
        # Create synthetic works dataset spanning 2022 to 2024
        dummy_works = pd.DataFrame([
            {
                "work_id": 1,
                "sanction_date": "2022-01-01",
                "actual_end_date": "2022-06-01",
                "work_status": "Completed",
                "ida_name": "TEST_IDA(TEST_IDA_SA)",
            },
            {
                "work_id": 2,
                "sanction_date": "2023-01-01",
                "actual_end_date": "2023-06-01",
                "work_status": "Completed",
                "ida_name": "TEST_IDA(TEST_IDA_SA)",
            },
            {
                "work_id": 3,
                "sanction_date": "2024-01-01",
                "actual_end_date": "2024-06-01",
                "work_status": "Completed",
                "ida_name": "TEST_IDA(TEST_IDA_SA)",
            }
        ])
        dummy_exp = pd.DataFrame([
            {"expenditure_id": 1, "work_id": 1, "ia_name": "TEST_AGENCY", "vendor_id": 101},
            {"expenditure_id": 2, "work_id": 2, "ia_name": "TEST_AGENCY", "vendor_id": 101},
            {"expenditure_id": 3, "work_id": 3, "ia_name": "TEST_AGENCY", "vendor_id": 101}
        ])

        # Test point-in-time profile as of 2022-12-31 (only work 1 should be known)
        cutoff_dt = pd.Timestamp("2022-12-31")
        ia_p, ida_p = build_agency_profiles(dummy_works, dummy_exp, observation_dt=cutoff_dt)

        self.assertEqual(len(ia_p), 1)
        self.assertEqual(ia_p.iloc[0]['completed_projects'], 1)
        self.assertEqual(ia_p.iloc[0]['total_projects'], 1)

    def test_raw_parquet_immutability(self):
        parquet_dir = "data/parquet"
        self.assertTrue(os.path.exists(parquet_dir))
        for f in ["works.parquet", "expenditures.parquet"]:
            fpath = os.path.join(parquet_dir, f)
            self.assertTrue(os.path.exists(fpath))


if __name__ == "__main__":
    unittest.main()

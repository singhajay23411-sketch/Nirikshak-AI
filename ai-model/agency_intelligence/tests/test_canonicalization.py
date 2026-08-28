"""test_canonicalization.py

Unit tests for deterministic entity canonicalization and branch extraction.
"""

import os
import sys
import unittest

MODULE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if MODULE_ROOT not in sys.path:
    sys.path.insert(0, MODULE_ROOT)

from agency_intelligence.canonicalization import canonicalize_ia, canonicalize_ida, clean_branch


class TestAgencyCanonicalization(unittest.TestCase):

    def test_upsic_variations(self):
        samples = [
            "Area Manager U P Small Industries Corporation Ltd Prayagraj",
            "UPSIC Lucknow",
            "UP SMALL INDUSTRIES CORPORATION LTD.AO.LKO",
            "UPSIC-2",
            "Excutive Engineer UP Small Industries Corporation Ltd Kanpur Construction Division 6",
            "KSHETRIYA PRABANDHAK U P LAGHU UDHYOG NIGA LTD"
        ]
        for s in samples:
            parent, branch, atype, method, conf, evid = canonicalize_ia(s)
            self.assertEqual(parent, "Uttar Pradesh Small Industries Corporation Ltd (UPSIC)")
            self.assertEqual(atype, "Corporation/PSU")
            self.assertEqual(conf, "HIGH")

    def test_pccd_variations(self):
        samples = [
            "PCCD SHAHJAHANPUR",
            "PROVINCIAL CO OPERATIVE CONSTRUTION AND DEVELOPMENT LIMITED",
            "Provincial Co-operative construction and Development Ltd_5",
            "PROVINCIAL CO-OPERRATIVE CONSTRUCTION AND DEVELOPMENT LTD BULANDSHAHR"
        ]
        for s in samples:
            parent, branch, atype, method, conf, evid = canonicalize_ia(s)
            self.assertEqual(parent, "Provincial Co-operative Construction & Development Ltd (PCCD)")
            self.assertEqual(atype, "Cooperative")
            self.assertEqual(conf, "HIGH")

    def test_local_bodies(self):
        p, b, t, m, c, e = canonicalize_ia("Gram Panchayat Chandpur")
        self.assertEqual(p, "Gram Panchayat (GP)")
        self.assertEqual(b, "Chandpur")
        self.assertEqual(t, "Panchayat")

        p, b, t, m, c, e = canonicalize_ia("Block Development Officer, Hawalbag")
        self.assertEqual(p, "Block Development Office / Panchayat Samiti")
        self.assertEqual(b, "Hawalbag")
        self.assertEqual(t, "Panchayat")

        p, b, t, m, c, e = canonicalize_ia("Zila Parishad, Ranchi")
        self.assertEqual(p, "Zila Parishad / District Panchayat")
        self.assertEqual(b, "Ranchi")
        self.assertEqual(t, "Panchayat")

    def test_ida_canonicalization(self):
        ida_samples = [
            ("JAUNPUR(DISTRICT MAGISTRATE JAUNPUR_IDA)", "District Authority - Jaunpur (DISTRICT MAGISTRATE JAUNPUR)", "Jaunpur"),
            ("PRAYAGRAJ(DISTRICT MAGISTRAE ALLAHABAD_IDA)", "District Authority - Prayagraj (DISTRICT MAGISTRATE ALLAHABAD)", "Prayagraj"),
            ("PATNA(DISTRICT PLANNING OFFICER PATNA_IDA)", "District Authority - Patna (DISTRICT PLANNING OFFICER PATNA)", "Patna"),
            ("SOLAPUR(DISTRICT COLLECTOR SOLAPUR_IDA)", "District Authority - Solapur (DISTRICT COLLECTOR SOLAPUR)", "Solapur")
        ]
        for raw, expected_canon, expected_dist in ida_samples:
            canon, dist = canonicalize_ida(raw)
            self.assertEqual(canon, expected_canon)
            self.assertEqual(dist, expected_dist)

    def test_empty_and_null(self):
        p, b, t, m, c, e = canonicalize_ia(None)
        self.assertEqual(p, "UNKNOWN_AGENCY")
        self.assertEqual(c, "LOW")

        p, b, t, m, c, e = canonicalize_ia("   ")
        self.assertEqual(p, "UNKNOWN_AGENCY")
        self.assertEqual(c, "LOW")

        ida_canon, ida_dist = canonicalize_ida(None)
        self.assertEqual(ida_canon, "UNKNOWN_IDA")


if __name__ == "__main__":
    unittest.main()

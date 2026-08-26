"""test_cleaner.py

Tests the cleaner.py module functions.
Verifies activity name prefix stripping and tenure standardisation.
"""

from backend.analytics.finguard.cleaner import clean_activity_name, normalize_tenure

def test_clean_activity_name():
    # Test Lok Sabha standard pattern prefix removal
    raw_ls = "WS/MP519/2023-2024/60423-Construction of community centers and community halls"
    assert clean_activity_name(raw_ls) == "Construction of community centers and community halls"

    # Test Rajya Sabha standard pattern prefix removal
    raw_rs = "WS/RS1234/2025-2026/98765-Street lights"
    assert clean_activity_name(raw_rs) == "Street lights"

    # Test NA- prefix removal
    raw_na = "NA-Construction of roads"
    assert clean_activity_name(raw_na) == "Construction of roads"

    # Test names without prefix
    normal = "Construction of pathways"
    assert clean_activity_name(normal) == "Construction of pathways"

    # Test whitespace handling
    raw_whitespace = "  WS/MP519/2023-2024/60423-Construction of public library   "
    assert clean_activity_name(raw_whitespace) == "Construction of public library"

    # Test invalid and edge cases
    assert clean_activity_name("") == ""
    assert clean_activity_name(None) == ""

def test_normalize_tenure():
    # Test numeric string conversion
    assert normalize_tenure("17") == "17th Lok Sabha"
    assert normalize_tenure("18") == "18th Lok Sabha"

    # Test valid formats stay as-is
    assert normalize_tenure("18th Lok Sabha") == "18th Lok Sabha"
    assert normalize_tenure("Rajya Sabha") == "Rajya Sabha"

    # Test whitespace cleaning
    assert normalize_tenure("  17   ") == "17th Lok Sabha"

    # Test invalid inputs
    assert normalize_tenure(None) == ""
    assert normalize_tenure(123) == ""

"""Unit tests for EvidenceAI – Image & Document Verification module.
All test image fixtures are programmatically generated and strictly marked as TEST DATA.
"""

import pytest
import os
import sys
from PIL import Image, ImageDraw
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from shared.types import EvidenceAnalysisResult
from evidence_ai import EvidenceAIAnalyzer, PhotoVerifier, DocumentVerifier


@pytest.fixture
def temp_test_images():
    """Generate temporary synthetic images for duplicate testing (TEST DATA)."""
    with tempfile.TemporaryDirectory() as tmpdir:
        img1_path = os.path.join(tmpdir, "site_photo_road_1.jpg")
        img2_path = os.path.join(tmpdir, "site_photo_road_copy.jpg")
        img3_path = os.path.join(tmpdir, "site_photo_unique.jpg")

        # Create base image 1
        im1 = Image.new("RGB", (200, 200), color=(100, 150, 200))
        d1 = ImageDraw.Draw(im1)
        d1.rectangle([50, 50, 150, 150], fill=(250, 200, 50))
        im1.save(img1_path)

        # Create identical copy (simulating duplicate upload on different project)
        im1.save(img2_path)

        # Create distinct unique image
        im3 = Image.new("RGB", (200, 200), color=(20, 20, 20))
        d3 = ImageDraw.Draw(im3)
        d3.ellipse([30, 30, 170, 170], fill=(200, 50, 50))
        im3.save(img3_path)

        yield {
            "img1": img1_path,
            "img2_duplicate": img2_path,
            "img3_unique": img3_path,
        }


def test_empty_evidence_defaults_to_none():
    analyzer = EvidenceAIAnalyzer()
    res = analyzer.analyze_evidence(project_id="PROJ_999", is_test_data=True)

    assert isinstance(res, EvidenceAnalysisResult)
    assert res.evidence_risk is None
    assert res.is_test_data is True
    assert "No physical site media" in res.flags[0]
    assert res.metadata_status == "UNAVAILABLE"


def test_duplicate_photo_detection(temp_test_images):
    analyzer = EvidenceAIAnalyzer()

    # Project A uploads Photo 1
    res_a = analyzer.analyze_evidence(
        project_id="PROJ_A",
        image_path=temp_test_images["img1"],
        is_test_data=True
    )
    assert res_a.evidence_risk is not None
    assert res_a.image_similarity is None  # First time seeing this image

    # Project B uploads duplicate Photo 2
    res_b = analyzer.analyze_evidence(
        project_id="PROJ_B",
        image_path=temp_test_images["img2_duplicate"],
        is_test_data=True
    )
    assert res_b.evidence_risk is not None
    assert res_b.evidence_risk >= 60
    assert res_b.image_similarity == 1.0
    assert any("Duplicate image detected" in f for f in res_b.flags)
    assert any("PROJ_A" in f for f in res_b.flags)


def test_document_text_consistency():
    verifier = DocumentVerifier()

    valid_doc = """
    OFFICE OF THE DISTRICT MAGISTRATE, JAUNPUR
    SANCTION ORDER NO. MPLADS/2025/8842
    Regarding: Work ID 8842 - Construction of CC Road in Jaunpur Constituency.
    Sanction Amount: Rs. 500000/- (Five Lakhs).
    """

    res_valid = verifier.verify_document_text(
        document_text=valid_doc,
        expected_metadata={
            "work_id": 8842,
            "sanction_amount": 500000.0,
            "constituency": "Jaunpur",
        }
    )
    assert res_valid["is_consistent"] is True
    assert res_valid["risk_penalty"] == 0

    mismatched_doc = """
    COMPLETION CERTIFICATE FOR ROAD IN VARANASI
    Amount: Rs. 200000
    """

    res_mismatched = verifier.verify_document_text(
        document_text=mismatched_doc,
        expected_metadata={
            "work_id": 8842,
            "sanction_amount": 500000.0,
            "constituency": "Jaunpur",
        }
    )
    assert res_mismatched["is_consistent"] is False
    assert res_mismatched["risk_penalty"] > 0
    assert len(res_mismatched["discrepancies"]) >= 2

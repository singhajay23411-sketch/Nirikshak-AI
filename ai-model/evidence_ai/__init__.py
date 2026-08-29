"""EvidenceAI – Image & Document Verification module for Nirikshak AI (10% platform risk weight)."""

from typing import Dict, Any, List, Optional
from datetime import datetime

from shared.types import EvidenceAnalysisResult
from .interface import BaseEvidenceAnalyzer
from .photo_verifier import PhotoVerifier, compute_dhash, extract_exif_metadata
from .doc_verifier import DocumentVerifier


class EvidenceAIAnalyzer(BaseEvidenceAnalyzer):
    """Main production class for EvidenceAI multimodal verification."""

    def __init__(self):
        self.photo_verifier = PhotoVerifier()
        self.doc_verifier = DocumentVerifier()

    def analyze_evidence(
        self,
        project_id: str,
        image_path: Optional[str] = None,
        document_path: Optional[str] = None,
        document_text: Optional[str] = None,
        project_metadata: Optional[Dict[str, Any]] = None,
        is_test_data: bool = False
    ) -> EvidenceAnalysisResult:
        """Analyze project image and/or document evidence.

        If no media is provided, returns evidence_risk = None (explicit unanalyzed state).
        """
        metadata = project_metadata or {}
        flags = []
        penalties = []
        image_sim = None
        relevance = None
        metadata_status = None
        doc_result = None

        has_media = bool(image_path or document_path or document_text)
        if not has_media:
            return EvidenceAnalysisResult(
                project_id=project_id,
                evidence_risk=None,
                flags=["No physical site media or completion certificates uploaded yet"],
                image_similarity=None,
                relevance_score=None,
                metadata_status="UNAVAILABLE",
                document_consistency=None,
                is_test_data=is_test_data
            )

        # 1. Process Photo Evidence
        if image_path:
            p_res = self.photo_verifier.register_and_verify(
                project_id=project_id,
                image_path=image_path,
                project_start_date=metadata.get("sanction_date")
            )
            flags.extend(p_res.get("flags", []))
            penalties.append(p_res.get("risk_penalty", 0))
            if p_res.get("duplicate_matches"):
                image_sim = 1.0
            metadata_status = p_res.get("exif_metadata", {}).get("status", "VALID")

        # 2. Process Document Evidence
        if document_text:
            d_res = self.doc_verifier.verify_document_text(
                document_text=document_text,
                expected_metadata=metadata
            )
            flags.extend(d_res.get("discrepancies", []))
            penalties.append(d_res.get("risk_penalty", 0))
            doc_result = d_res

        # Calculate calibrated evidence risk (0 to 100)
        overall_penalty = max(penalties) if penalties else 0
        evidence_risk = min(100, overall_penalty)

        return EvidenceAnalysisResult(
            project_id=project_id,
            evidence_risk=evidence_risk,
            flags=flags if flags else ["All uploaded evidence verified without discrepancies"],
            image_similarity=image_sim,
            relevance_score=0.90 if evidence_risk < 30 else 0.40,
            metadata_status=metadata_status or "VERIFIED",
            document_consistency=doc_result,
            is_test_data=is_test_data
        )


__all__ = [
    "BaseEvidenceAnalyzer",
    "EvidenceAIAnalyzer",
    "PhotoVerifier",
    "DocumentVerifier",
    "compute_dhash",
    "extract_exif_metadata",
]

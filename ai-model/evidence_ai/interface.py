"""interface.py

Standardized, modular interface for EvidenceAI Image & Document Verification module.
Represents 10% of Nirikshak AI's unified platform risk.
Designed to return explicit null/unverified defaults when raw media is unavailable.
"""

from typing import Dict, Any, List, Optional
from shared.types import EvidenceAnalysisResult


class BaseEvidenceAnalyzer:
    """Base interface for EvidenceAI multimodal verification engines."""

    def analyze_evidence(
        self,
        project_id: str,
        image_path: Optional[str] = None,
        document_path: Optional[str] = None,
        project_metadata: Optional[Dict[str, Any]] = None,
        is_test_data: bool = False
    ) -> EvidenceAnalysisResult:
        """Analyze project image/document evidence.

        Args:
            project_id: Unique project identifier.
            image_path: Optional path to uploaded site photo.
            document_path: Optional path to completion certificate / sanction letter.
            project_metadata: Associated project facts (sanction amount, constituency, dates).
            is_test_data: Flag indicating whether input is synthetic fixture / test data.

        Returns:
            EvidenceAnalysisResult with risk score (or None), flags, and verification metrics.
        """
        raise NotImplementedError("Subclasses must implement analyze_evidence")

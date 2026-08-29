"""doc_verifier.py

Structural and textual consistency validation for uploaded project documents
(e.g., Sanction Orders, Completion Certificates, Measurement Books).
"""

import os
from typing import Dict, Any, List, Optional


class DocumentVerifier:
    """Validates metadata consistency between project records and uploaded document text."""

    def verify_document_text(
        self,
        document_text: str,
        expected_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Cross-checks text from an uploaded document against project parameters.

        Args:
            document_text: Extracted text from PDF / OCR scan.
            expected_metadata: Dictionary with expected work_id, amount, constituency, etc.

        Returns:
            Dict with discrepancy flags, matched entities, and consistency risk score.
        """
        flags = []
        risk_penalty = 0
        doc_lower = document_text.lower()

        work_id = str(expected_metadata.get("work_id", ""))
        amount = expected_metadata.get("sanction_amount")
        constituency = str(expected_metadata.get("constituency", "")).lower()

        # Check work id mention
        if work_id and work_id not in document_text:
            flags.append(f"Document text does not reference expected Work ID ({work_id})")
            risk_penalty += 20

        # Check constituency mention
        if constituency and constituency not in doc_lower:
            flags.append(f"Document text does not mention expected Constituency ({constituency})")
            risk_penalty += 15

        # Check amount mention
        if amount and amount > 0:
            # Check if amount is roughly mentioned (as integer or lakhs)
            int_amt = str(int(amount))
            lakh_amt = f"{amount / 100000:.1f}"
            if int_amt not in document_text and lakh_amt not in document_text:
                flags.append(f"Sanction amount (Rs. {amount:,.0f}) not explicitly verified in document text")
                risk_penalty += 15

        return {
            "verified": True,
            "discrepancies": flags,
            "risk_penalty": min(100, risk_penalty),
            "is_consistent": len(flags) == 0,
        }

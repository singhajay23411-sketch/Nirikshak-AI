"""models.py

Domain models and contracts for the FinGuard analytics module.
Implements:
- ProjectContext: representation of project features and variables
- Evidence: first-class traceable evidence structures
- Signal: structured detector outcomes (financial, data integrity, benchmark, etc.)
- VerificationResult: verifier status, sources, and findings
- Assessment: risk-specific component outcomes (financial risk or data integrity risk)
- FinGuardResult: unified outcome payload containing assessments, confidence, and priority
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any

# Signal Category Constants
CATEGORY_FINANCIAL = "FINANCIAL"
CATEGORY_DATA_INTEGRITY = "DATA_INTEGRITY"
CATEGORY_EXPENDITURE = "EXPENDITURE"
CATEGORY_VENDOR = "VENDOR"
CATEGORY_BENCHMARK = "BENCHMARK"
CATEGORY_VERIFICATION = "VERIFICATION"

# Verification Status Constants
STATUS_UNVERIFIED = "unverified"
STATUS_VERIFIED = "verified"
STATUS_DISPROVED = "disproved"
STATUS_MATCHED = "MATCHED"
STATUS_CONTRADICTED = "CONTRADICTED"
STATUS_CHANGED = "CHANGED"
STATUS_UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
STATUS_NOT_REQUIRED = "NOT_REQUIRED"
STATUS_NOT_YET_VERIFIED = "NOT_YET_VERIFIED"

# Severity Constants
SEVERITY_LOW = "low"
SEVERITY_MEDIUM = "medium"
SEVERITY_HIGH = "high"
SEVERITY_CRITICAL = "critical"

# Investigation Priority Constants
PRIORITY_LOW = "Low"
PRIORITY_MEDIUM = "Medium"
PRIORITY_HIGH = "High"
PRIORITY_CRITICAL = "Critical"

@dataclass
class ProjectContext:
    """Consolidated project context containing metadata and derived features."""
    work_id: int
    activity_name: str
    normalized_activity_name: str
    work_category: str
    work_status: str
    sanction_amount: float
    raw_total_disbursed: float
    analytical_total_disbursed: float
    duplicate_adjustment_amount: float
    raw_record_count: int
    unique_event_count: int
    duplicate_record_count: int
    duplication_ratio: float
    identical_payment_burst: int
    mp_id: int
    house_type: int
    tenure: str
    actual_amount: Optional[float] = None
    state_id: Optional[int] = None
    constituency_id: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "work_id": self.work_id,
            "activity_name": self.activity_name,
            "normalized_activity_name": self.normalized_activity_name,
            "work_category": self.work_category,
            "work_status": self.work_status,
            "sanction_amount": self.sanction_amount,
            "raw_total_disbursed": self.raw_total_disbursed,
            "analytical_total_disbursed": self.analytical_total_disbursed,
            "duplicate_adjustment_amount": self.duplicate_adjustment_amount,
            "raw_record_count": self.raw_record_count,
            "unique_event_count": self.unique_event_count,
            "duplicate_record_count": self.duplicate_record_count,
            "duplication_ratio": self.duplication_ratio,
            "identical_payment_burst": self.identical_payment_burst,
            "mp_id": self.mp_id,
            "house_type": self.house_type,
            "tenure": self.tenure,
            "actual_amount": self.actual_amount,
            "state_id": self.state_id,
            "constituency_id": self.constituency_id
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ProjectContext":
        return cls(
            work_id=d["work_id"],
            activity_name=d["activity_name"],
            normalized_activity_name=d["normalized_activity_name"],
            work_category=d["work_category"],
            work_status=d["work_status"],
            sanction_amount=d["sanction_amount"],
            raw_total_disbursed=d["raw_total_disbursed"],
            analytical_total_disbursed=d["analytical_total_disbursed"],
            duplicate_adjustment_amount=d["duplicate_adjustment_amount"],
            raw_record_count=d["raw_record_count"],
            unique_event_count=d["unique_event_count"],
            duplicate_record_count=d["duplicate_record_count"],
            duplication_ratio=d["duplication_ratio"],
            identical_payment_burst=d["identical_payment_burst"],
            mp_id=d["mp_id"],
            house_type=d["house_type"],
            tenure=d["tenure"],
            actual_amount=d.get("actual_amount"),
            state_id=d.get("state_id"),
            constituency_id=d.get("constituency_id")
        )


@dataclass
class Evidence:
    """Traceable evidence mapping analytical observations back to the database sources."""
    evidence_text: str
    source: str
    value: Any
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evidence_text": self.evidence_text,
            "source": self.source,
            "value": self.value,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Evidence":
        return cls(
            evidence_text=d["evidence_text"],
            source=d["source"],
            value=d["value"],
            metadata=d.get("metadata")
        )


@dataclass
class Signal:
    """Structured signal generated by risk and pattern detection components."""
    signal_type: str
    category: str  # e.g., FINANCIAL, DATA_INTEGRITY, EXPENDITURE, VENDOR, BENCHMARK, VERIFICATION
    severity: str  # low, medium, high, critical
    observed_value: float
    threshold_benchmark: Optional[float]
    score_contribution: float
    evidence: List[Evidence]
    source: str
    confidence: float  # 0.0 to 1.0
    verification_status: str  # unverified, verified, disproved

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signal_type": self.signal_type,
            "category": self.category,
            "severity": self.severity,
            "observed_value": self.observed_value,
            "threshold_benchmark": self.threshold_benchmark,
            "score_contribution": self.score_contribution,
            "evidence": [e.to_dict() for e in self.evidence],
            "source": self.source,
            "confidence": self.confidence,
            "verification_status": self.verification_status
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Signal":
        return cls(
            signal_type=d["signal_type"],
            category=d["category"],
            severity=d["severity"],
            observed_value=d["observed_value"],
            threshold_benchmark=d.get("threshold_benchmark"),
            score_contribution=d["score_contribution"],
            evidence=[Evidence.from_dict(e) for e in d.get("evidence", [])],
            source=d["source"],
            confidence=d["confidence"],
            verification_status=d["verification_status"]
        )


@dataclass
class VerificationResult:
    """Verification metadata compiled from external third-party or manually verified files."""
    status: str  # unverified, verified, disproved
    findings: List[str] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)
    verified_at: Optional[str] = None
    verifier: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "findings": self.findings,
            "sources": self.sources,
            "verified_at": self.verified_at,
            "verifier": self.verifier
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "VerificationResult":
        return cls(
            status=d["status"],
            findings=d.get("findings", []),
            sources=d.get("sources", []),
            verified_at=d.get("verified_at"),
            verifier=d.get("verifier")
        )


@dataclass
class Assessment:
    """Summary assessment containing risk scores, risk bands, and corresponding signals."""
    score: int
    band: str  # Low, Medium, High, Critical
    signals: List[Signal] = field(default_factory=list)
    summary: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "band": self.band,
            "signals": [s.to_dict() for s in self.signals],
            "summary": self.summary
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Assessment":
        return cls(
            score=d["score"],
            band=d["band"],
            signals=[Signal.from_dict(s) for s in d.get("signals", [])],
            summary=d.get("summary")
        )


@dataclass
class FinGuardResult:
    """The unified outcomes payload from the FinGuard analysis engine."""
    project_info: ProjectContext
    financial_assessment: Assessment
    data_integrity_assessment: Assessment
    verification: VerificationResult
    investigation_priority: str  # Low, Medium, High, Critical
    confidence: float  # 0.0 to 1.0
    evidence: List[Evidence] = field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None
    module_id: str = "finguard"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "module_id": self.module_id,
            "project_info": self.project_info.to_dict(),
            "financial_assessment": self.financial_assessment.to_dict(),
            "data_integrity_assessment": self.data_integrity_assessment.to_dict(),
            "verification": self.verification.to_dict(),
            "investigation_priority": self.investigation_priority,
            "confidence": self.confidence,
            "evidence": [e.to_dict() for e in self.evidence],
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "FinGuardResult":
        res = cls(
            project_info=ProjectContext.from_dict(d["project_info"]),
            financial_assessment=Assessment.from_dict(d["financial_assessment"]),
            data_integrity_assessment=Assessment.from_dict(d["data_integrity_assessment"]),
            verification=VerificationResult.from_dict(d["verification"]),
            investigation_priority=d["investigation_priority"],
            confidence=d["confidence"],
            evidence=[Evidence.from_dict(e) for e in d.get("evidence", [])],
            metadata=d.get("metadata")
        )
        if "module_id" in d:
            res.module_id = d["module_id"]
        return res

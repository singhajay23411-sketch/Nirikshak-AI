"""Shared type definitions and enums for Nirikshak AI modules."""

from enum import Enum
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class WorkStage(str, Enum):
    RECOMMENDED = "RECOMMENDED"
    PENDING_SANCTION = "PENDING_SANCTION"
    VENDOR_IDENTIFICATION = "VENDOR_IDENTIFICATION"
    TIME_ESTIMATION = "TIME_ESTIMATION"
    IN_PROGRESS = "IN_PROGRESS"
    PHYSICAL_INSPECTION = "PHYSICAL_INSPECTION"
    COMPLETED = "COMPLETED"
    UNKNOWN = "UNKNOWN"


class CaseStatus(str, Enum):
    UNDER_REVIEW = "UNDER_REVIEW"
    INVESTIGATION_OPENED = "INVESTIGATION_OPENED"
    FIELD_VERIFICATION = "FIELD_VERIFICATION"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED_NORMAL = "VERIFIED_NORMAL"
    VERIFIED_DELAYED = "VERIFIED_DELAYED"
    DISCREPANCY_DETECTED = "DISCREPANCY_DETECTED"
    INCONCLUSIVE = "INCONCLUSIVE"


@dataclass
class DelayRiskResult:
    """Standardized result returned by Delay Risk Detection module."""
    work_id: int
    delay_risk: int  # 0 to 100
    risk_level: RiskLevel
    status: str  # e.g., ON_TRACK, AT_RISK, LIKELY_DELAYED, CRITICALLY_DELAYED, COMPLETED_LATE
    reasons: List[str] = field(default_factory=list)
    confidence: float = 1.0  # 0.0 to 1.0
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "work_id": self.work_id,
            "delay_risk": self.delay_risk,
            "risk_level": self.risk_level.value if isinstance(self.risk_level, RiskLevel) else self.risk_level,
            "status": self.status,
            "reasons": self.reasons,
            "confidence": round(self.confidence, 2),
            "metrics": self.metrics,
        }


@dataclass
class EvidenceAnalysisResult:
    """Standardized result returned by EvidenceAI module."""
    project_id: str
    evidence_risk: Optional[int] = None  # 0 to 100 or None if unanalyzed
    flags: List[str] = field(default_factory=list)
    image_similarity: Optional[float] = None
    relevance_score: Optional[float] = None
    metadata_status: Optional[str] = None
    document_consistency: Optional[Dict[str, Any]] = None
    is_test_data: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_id": self.project_id,
            "evidence_risk": self.evidence_risk,
            "flags": self.flags,
            "image_similarity": self.image_similarity,
            "relevance_score": self.relevance_score,
            "metadata_status": self.metadata_status,
            "document_consistency": self.document_consistency,
            "is_test_data": self.is_test_data,
        }


@dataclass
class AgencyRiskResult:
    """Standardized result returned for an individual agency or district authority entity."""
    agency_id: str
    agency_name: str
    agency_level: str  # "IA" or "IDA"
    agency_type: str
    agency_branch: str
    completed_project_count: int
    data_confidence: str  # "Strong", "Moderate", "Low", "Very Low"
    shrunken_delay_rate: float
    baseline_delay_gap: float
    speed_gap_days: Optional[float]
    workload_pressure: float
    agency_risk_score: float  # 0.0 to 100.0
    agency_risk_tier: str     # "LOW", "MODERATE", "HIGH", "CRITICAL"
    risk_weight: float = 0.05
    unified_risk_contribution: float = 0.0     # 0.0 to 5.0
    risk_factors: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agency_id": self.agency_id,
            "agency_name": self.agency_name,
            "agency_level": self.agency_level,
            "agency_type": self.agency_type,
            "agency_branch": self.agency_branch,
            "completed_project_count": self.completed_project_count,
            "data_confidence": self.data_confidence,
            "shrunken_delay_rate": round(self.shrunken_delay_rate, 4),
            "baseline_delay_gap": round(self.baseline_delay_gap, 4),
            "speed_gap_days": round(self.speed_gap_days, 1) if self.speed_gap_days is not None else None,
            "workload_pressure": round(self.workload_pressure, 2),
            "agency_risk_score": round(self.agency_risk_score, 2),
            "agency_risk_tier": self.agency_risk_tier,
            "risk_weight": self.risk_weight,
            "unified_risk_contribution": round(self.unified_risk_contribution, 3),
            "risk_factors": self.risk_factors,
            "metrics": self.metrics,
        }


@dataclass
class ProjectAgencyRiskResult:
    """Standardized result returned for a work-level IA/IDA assignment."""
    work_id: int
    agency_risk_score: float  # 0.0 to 100.0
    agency_risk_tier: str     # "LOW", "MODERATE", "HIGH", "CRITICAL"
    risk_weight: float = 0.05
    unified_risk_contribution: float = 0.0     # 0.0 to 5.0
    blending_weights: Dict[str, float] = field(default_factory=dict)
    ia_evaluation: Optional[Dict[str, Any]] = None
    ida_evaluation: Optional[Dict[str, Any]] = None
    primary_risk_factors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "work_id": self.work_id,
            "agency_risk_score": round(self.agency_risk_score, 2),
            "agency_risk_tier": self.agency_risk_tier,
            "risk_weight": self.risk_weight,
            "unified_risk_contribution": round(self.unified_risk_contribution, 3),
            "blending_weights": self.blending_weights,
            "ia_evaluation": self.ia_evaluation,
            "ida_evaluation": self.ida_evaluation,
            "primary_risk_factors": self.primary_risk_factors,
        }

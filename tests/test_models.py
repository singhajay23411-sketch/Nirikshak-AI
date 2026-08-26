"""test_models.py

Unit tests for the new FinGuard domain models and contracts.
Verifies:
- Valid construction of all models
- Serialization (to_dict) and deserialization (from_dict) correctness
- Required and optional fields handling
- Constant categories and verification statuses
- Deeply nested structures inside FinGuardResult
"""

import pytest
from backend.analytics.finguard.models import (
    ProjectContext,
    Evidence,
    Signal,
    VerificationResult,
    Assessment,
    FinGuardResult,
    CATEGORY_FINANCIAL,
    CATEGORY_DATA_INTEGRITY,
    STATUS_UNVERIFIED,
    STATUS_VERIFIED,
    SEVERITY_LOW,
    SEVERITY_HIGH,
    PRIORITY_MEDIUM
)

def test_evidence_model():
    # Valid construction
    ev = Evidence(
        evidence_text="Disbursement exceeds actual by Rs. 5,000",
        source="expenditures.parquet",
        value=5000.0,
        metadata={"index": 12}
    )
    assert ev.evidence_text == "Disbursement exceeds actual by Rs. 5,000"
    assert ev.source == "expenditures.parquet"
    assert ev.value == 5000.0
    assert ev.metadata == {"index": 12}

    # Serialization
    d = ev.to_dict()
    assert d["evidence_text"] == ev.evidence_text
    assert d["source"] == ev.source
    assert d["value"] == ev.value
    assert d["metadata"] == ev.metadata

    # Deserialization
    ev2 = Evidence.from_dict(d)
    assert ev2.evidence_text == ev.evidence_text
    assert ev2.source == ev.source
    assert ev2.value == ev.value
    assert ev2.metadata == ev.metadata

def test_signal_model():
    ev = Evidence(evidence_text="test text", source="src", value=1.0)
    
    # Valid construction
    sig = Signal(
        signal_type="cost_outlier",
        category=CATEGORY_FINANCIAL,
        severity=SEVERITY_HIGH,
        observed_value=4.5,
        threshold_benchmark=2.0,
        score_contribution=30.0,
        evidence=[ev],
        source="benchmarkers.py",
        confidence=0.9,
        verification_status=STATUS_UNVERIFIED
    )
    
    assert sig.signal_type == "cost_outlier"
    assert sig.category == CATEGORY_FINANCIAL
    assert sig.severity == SEVERITY_HIGH
    assert sig.observed_value == 4.5
    assert sig.threshold_benchmark == 2.0
    assert sig.score_contribution == 30.0
    assert len(sig.evidence) == 1
    assert sig.evidence[0].evidence_text == "test text"
    assert sig.source == "benchmarkers.py"
    assert sig.confidence == 0.9
    assert sig.verification_status == STATUS_UNVERIFIED

    # Serialization
    d = sig.to_dict()
    assert d["signal_type"] == "cost_outlier"
    assert d["category"] == CATEGORY_FINANCIAL
    assert len(d["evidence"]) == 1
    assert d["evidence"][0]["evidence_text"] == "test text"

    # Deserialization
    sig2 = Signal.from_dict(d)
    assert sig2.signal_type == sig.signal_type
    assert sig2.category == sig.category
    assert sig2.observed_value == sig.observed_value
    assert len(sig2.evidence) == 1
    assert sig2.evidence[0].evidence_text == "test text"

def test_verification_result_model():
    # Construction with default empty list arguments
    vr = VerificationResult(status=STATUS_UNVERIFIED)
    assert vr.status == STATUS_UNVERIFIED
    assert vr.findings == []
    assert vr.sources == []
    assert vr.verified_at is None
    assert vr.verifier is None

    # Full construction
    vr_full = VerificationResult(
        status=STATUS_VERIFIED,
        findings=["Physical inspection matches record"],
        sources=["inspection_report_2026.pdf"],
        verified_at="2026-08-27",
        verifier="Audit Officer"
    )
    assert vr_full.status == STATUS_VERIFIED
    assert len(vr_full.findings) == 1
    assert vr_full.verified_at == "2026-08-27"
    
    # Serialization/Deserialization
    d = vr_full.to_dict()
    vr_deser = VerificationResult.from_dict(d)
    assert vr_deser.status == vr_full.status
    assert vr_deser.findings == vr_full.findings
    assert vr_deser.verifier == vr_full.verifier

def test_assessment_model():
    ev = Evidence(evidence_text="test text", source="src", value=1.0)
    sig = Signal(
        signal_type="cost_outlier", category=CATEGORY_FINANCIAL, severity=SEVERITY_HIGH,
        observed_value=4.5, threshold_benchmark=2.0, score_contribution=30.0,
        evidence=[ev], source="benchmarkers.py", confidence=0.9, verification_status=STATUS_UNVERIFIED
    )
    
    # Default lists
    assess = Assessment(score=40, band="Medium")
    assert assess.score == 40
    assert assess.band == "Medium"
    assert assess.signals == []
    assert assess.summary is None

    # Full construction
    assess_full = Assessment(
        score=75,
        band="High",
        signals=[sig],
        summary="High financial risk due to benchmark costs"
    )
    
    # Serialization/Deserialization
    d = assess_full.to_dict()
    assess_deser = Assessment.from_dict(d)
    assert assess_deser.score == 75
    assert assess_deser.band == "High"
    assert len(assess_deser.signals) == 1
    assert assess_deser.signals[0].signal_type == "cost_outlier"
    assert assess_deser.summary == "High financial risk due to benchmark costs"

def test_project_context_model():
    ctx = ProjectContext(
        work_id=123,
        activity_name="Construction of road",
        normalized_activity_name="Construction of road",
        work_category="Infrastructure",
        work_status="Sanctioned",
        sanction_amount=100000.0,
        raw_total_disbursed=120000.0,
        analytical_total_disbursed=100000.0,
        duplicate_adjustment_amount=20000.0,
        raw_record_count=4,
        unique_event_count=2,
        duplicate_record_count=2,
        duplication_ratio=0.5,
        identical_payment_burst=2,
        mp_id=55,
        house_type=2,
        tenure="17",
        actual_amount=100000.0,
        state_id=10,
        constituency_id=2
    )
    
    assert ctx.work_id == 123
    assert ctx.actual_amount == 100000.0
    assert ctx.state_id == 10
    
    # Serialization/Deserialization
    d = ctx.to_dict()
    ctx_deser = ProjectContext.from_dict(d)
    assert ctx_deser.work_id == ctx.work_id
    assert ctx_deser.sanction_amount == ctx.sanction_amount
    assert ctx_deser.duplication_ratio == ctx.duplication_ratio
    assert ctx_deser.actual_amount == ctx.actual_amount
    assert ctx_deser.state_id == ctx.state_id

def test_finguard_result_model():
    ctx = ProjectContext(
        work_id=123, activity_name="road", normalized_activity_name="road",
        work_category="Infra", work_status="Sanctioned", sanction_amount=100000.0,
        raw_total_disbursed=100000.0, analytical_total_disbursed=100000.0,
        duplicate_adjustment_amount=0.0, raw_record_count=1, unique_event_count=1,
        duplicate_record_count=0, duplication_ratio=0.0, identical_payment_burst=1,
        mp_id=55, house_type=2, tenure="17"
    )
    
    ev = Evidence(evidence_text="test text", source="src", value=1.0)
    sig = Signal(
        signal_type="cost_outlier", category=CATEGORY_FINANCIAL, severity=SEVERITY_HIGH,
        observed_value=4.5, threshold_benchmark=2.0, score_contribution=30.0,
        evidence=[ev], source="benchmarkers.py", confidence=0.9, verification_status=STATUS_UNVERIFIED
    )
    
    assess_fin = Assessment(score=30, band="Low", signals=[sig])
    assess_integ = Assessment(score=0, band="Low", signals=[])
    
    # Test new verification statuses
    from backend.analytics.finguard.models import (
        STATUS_MATCHED,
        STATUS_CONTRADICTED,
        STATUS_CHANGED,
        STATUS_UNABLE_TO_VERIFY,
        STATUS_NOT_REQUIRED,
        STATUS_NOT_YET_VERIFIED
    )
    
    for status in [STATUS_MATCHED, STATUS_CONTRADICTED, STATUS_CHANGED, STATUS_UNABLE_TO_VERIFY, STATUS_NOT_REQUIRED, STATUS_NOT_YET_VERIFIED]:
        vr = VerificationResult(status=status)
        assert vr.status == status
    
    vr = VerificationResult(status=STATUS_MATCHED)
    
    # Construction
    fgr = FinGuardResult(
        project_info=ctx,
        financial_assessment=assess_fin,
        data_integrity_assessment=assess_integ,
        verification=vr,
        investigation_priority=PRIORITY_MEDIUM,
        confidence=0.95,
        evidence=[ev],
        metadata={"run_id": "test-run"}
    )
    
    # Assert module boundary constraints
    assert fgr.module_id == "finguard"
    assert fgr.project_info.work_id == 123
    assert fgr.financial_assessment.score == 30
    assert len(fgr.financial_assessment.signals) == 1
    assert fgr.investigation_priority == PRIORITY_MEDIUM
    assert fgr.confidence == 0.95
    assert len(fgr.evidence) == 1
    assert fgr.metadata == {"run_id": "test-run"}
    
    # Serialization/Deserialization
    d = fgr.to_dict()
    assert d["module_id"] == "finguard"
    fgr_deser = FinGuardResult.from_dict(d)
    
    assert fgr_deser.module_id == "finguard"
    assert fgr_deser.project_info.work_id == ctx.work_id
    assert fgr_deser.financial_assessment.score == 30
    assert len(fgr_deser.financial_assessment.signals) == 1
    assert fgr_deser.financial_assessment.signals[0].signal_type == "cost_outlier"
    assert fgr_deser.investigation_priority == PRIORITY_MEDIUM
    assert fgr_deser.confidence == 0.95
    assert len(fgr_deser.evidence) == 1
    assert fgr_deser.metadata == {"run_id": "test-run"}

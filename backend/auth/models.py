"""
Nirikshak AI — Authentication & RBAC Pydantic Models
=====================================================
Data models for login, tokens, user profiles, roles, permissions and scoping.

Canonical role names standardised for SIH 2026 — Problem Statement SIH26-26102.
"""

from typing import Optional, List


# ─── Canonical Role Codes ───

class RoleCode:
    """Supported canonical role codes."""
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    MOSPI_NATIONAL_OFFICER = "MOSPI_NATIONAL_OFFICER"
    STATE_NODAL_OFFICER = "STATE_NODAL_OFFICER"
    DISTRICT_AUTHORITY = "DISTRICT_AUTHORITY"
    MEMBER_OF_PARLIAMENT = "MEMBER_OF_PARLIAMENT"
    FIELD_INSPECTOR = "FIELD_INSPECTOR"
    AI_RISK_ANALYST = "AI_RISK_ANALYST"
    PUBLIC_VIEWER = "PUBLIC_VIEWER"

    ALL = [
        SYSTEM_ADMIN,
        MOSPI_NATIONAL_OFFICER,
        STATE_NODAL_OFFICER,
        DISTRICT_AUTHORITY,
        MEMBER_OF_PARLIAMENT,
        FIELD_INSPECTOR,
        AI_RISK_ANALYST,
        PUBLIC_VIEWER,
    ]


# ─── Legacy → Canonical Role Mapping ───

ROLE_LEGACY_MAP = {
    "ADMIN": RoleCode.SYSTEM_ADMIN,
    "MOSPI_OFFICER": RoleCode.MOSPI_NATIONAL_OFFICER,
    "STATE_OFFICER": RoleCode.STATE_NODAL_OFFICER,
    "DISTRICT_OFFICER": RoleCode.DISTRICT_AUTHORITY,
    "MP": RoleCode.MEMBER_OF_PARLIAMENT,
    "FIELD_INSPECTOR": RoleCode.FIELD_INSPECTOR,
    "ANALYST": RoleCode.AI_RISK_ANALYST,
    "VIEWER": RoleCode.PUBLIC_VIEWER,
}


def resolve_role(role_str: str) -> str:
    """Resolve a legacy or canonical role string to its canonical form."""
    if role_str in RoleCode.ALL:
        return role_str
    return ROLE_LEGACY_MAP.get(role_str, role_str)


# ─── Role Labels (English & Hindi) ───

ROLE_LABELS = {
    RoleCode.SYSTEM_ADMIN:           {"en": "System Administrator",          "hi": "प्रणाली प्रशासक"},
    RoleCode.MOSPI_NATIONAL_OFFICER: {"en": "MoSPI National Officer",        "hi": "MoSPI राष्ट्रीय अधिकारी"},
    RoleCode.STATE_NODAL_OFFICER:    {"en": "State Nodal Officer",           "hi": "राज्य नोडल अधिकारी"},
    RoleCode.DISTRICT_AUTHORITY:     {"en": "District Authority",            "hi": "जिला प्राधिकरण"},
    RoleCode.MEMBER_OF_PARLIAMENT:   {"en": "Hon'ble Member of Parliament",  "hi": "माननीय सांसद"},
    RoleCode.FIELD_INSPECTOR:        {"en": "Field Inspector",               "hi": "क्षेत्र निरीक्षक"},
    RoleCode.AI_RISK_ANALYST:        {"en": "AI Risk Analyst",               "hi": "AI जोखिम विश्लेषक"},
    RoleCode.PUBLIC_VIEWER:          {"en": "Public Transparency Viewer",    "hi": "सार्वजनिक पारदर्शिता दर्शक"},
}


# ─── Granular Permissions per Role ───

ROLE_PERMISSIONS = {
    RoleCode.SYSTEM_ADMIN: [
        "projects.view", "projects.edit",
        "risk.view", "risk.analyze",
        "evidence.view", "evidence.upload", "evidence.verify",
        "investigation.view", "investigation.create", "investigation.assign",
        "reports.view", "reports.generate",
        "users.manage", "roles.manage",
        "audit.view", "system.manage",
        "assistant.query",
    ],
    RoleCode.MOSPI_NATIONAL_OFFICER: [
        "projects.view",
        "risk.view", "risk.analyze",
        "evidence.view",
        "investigation.view", "investigation.create", "investigation.assign",
        "investigation.resolve", "investigation.escalate",
        "reports.view", "reports.generate",
        "assistant.query",
    ],
    RoleCode.STATE_NODAL_OFFICER: [
        "projects.view",
        "risk.view",
        "evidence.view", "evidence.verify",
        "investigation.view", "investigation.create", "investigation.assign",
        "investigation.resolve", "investigation.escalate",
        "reports.view", "reports.generate",
        "assistant.query",
    ],
    RoleCode.DISTRICT_AUTHORITY: [
        "projects.view",
        "risk.view",
        "evidence.view", "evidence.verify",
        "investigation.view", "investigation.create", "investigation.assign",
        "investigation.resolve",
        "reports.view", "reports.generate",
        "assistant.query",
    ],
    RoleCode.MEMBER_OF_PARLIAMENT: [
        "projects.view",
        "risk.view",
        "evidence.view",
        "reports.view",
        "map.view",
        "assistant.query",
    ],
    RoleCode.FIELD_INSPECTOR: [
        "projects.view",
        "evidence.view", "evidence.upload",
        "investigation.view",
        "verification.submit",
        "reports.view",
        "assistant.query",
    ],
    RoleCode.AI_RISK_ANALYST: [
        "projects.view",
        "risk.view", "risk.analyze",
        "anomalies.view", "benchmarks.view",
        "model.view", "model.diagnose",
        "reports.view", "reports.generate",
        "assistant.query",
    ],
    RoleCode.PUBLIC_VIEWER: [
        "projects.view",
        "risk.view",
        "map.view",
        "reports.view",
    ],
}


# ─── Geographic Scope per Role ───

class ScopeType:
    NATIONAL = "NATIONAL"
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    CONSTITUENCY = "CONSTITUENCY"
    PROJECT = "PROJECT"


ROLE_SCOPE = {
    RoleCode.SYSTEM_ADMIN:           ScopeType.NATIONAL,
    RoleCode.MOSPI_NATIONAL_OFFICER: ScopeType.NATIONAL,
    RoleCode.STATE_NODAL_OFFICER:    ScopeType.STATE,
    RoleCode.DISTRICT_AUTHORITY:     ScopeType.DISTRICT,
    RoleCode.MEMBER_OF_PARLIAMENT:   ScopeType.CONSTITUENCY,
    RoleCode.FIELD_INSPECTOR:        ScopeType.PROJECT,
    RoleCode.AI_RISK_ANALYST:        ScopeType.NATIONAL,
    RoleCode.PUBLIC_VIEWER:          ScopeType.NATIONAL,
}


# ─── Investigation Status Values ───

class InvestigationStatus:
    NEW = "NEW"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    FIELD_VISIT_SCHEDULED = "FIELD_VISIT_SCHEDULED"
    EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    REQUIRES_CLARIFICATION = "REQUIRES_CLARIFICATION"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

    ALL = [
        NEW, TRIAGED, ASSIGNED, FIELD_VISIT_SCHEDULED,
        EVIDENCE_SUBMITTED, UNDER_REVIEW, REQUIRES_CLARIFICATION,
        RESOLVED, ESCALATED, FALSE_POSITIVE,
    ]


# Valid status transitions
VALID_STATUS_TRANSITIONS = {
    InvestigationStatus.NEW: [
        InvestigationStatus.TRIAGED,
        InvestigationStatus.ASSIGNED,
        InvestigationStatus.FALSE_POSITIVE,
    ],
    InvestigationStatus.TRIAGED: [
        InvestigationStatus.ASSIGNED,
        InvestigationStatus.ESCALATED,
        InvestigationStatus.FALSE_POSITIVE,
    ],
    InvestigationStatus.ASSIGNED: [
        InvestigationStatus.FIELD_VISIT_SCHEDULED,
        InvestigationStatus.UNDER_REVIEW,
        InvestigationStatus.ESCALATED,
    ],
    InvestigationStatus.FIELD_VISIT_SCHEDULED: [
        InvestigationStatus.EVIDENCE_SUBMITTED,
        InvestigationStatus.REQUIRES_CLARIFICATION,
    ],
    InvestigationStatus.EVIDENCE_SUBMITTED: [
        InvestigationStatus.UNDER_REVIEW,
        InvestigationStatus.REQUIRES_CLARIFICATION,
    ],
    InvestigationStatus.UNDER_REVIEW: [
        InvestigationStatus.RESOLVED,
        InvestigationStatus.REQUIRES_CLARIFICATION,
        InvestigationStatus.ESCALATED,
        InvestigationStatus.FALSE_POSITIVE,
    ],
    InvestigationStatus.REQUIRES_CLARIFICATION: [
        InvestigationStatus.ASSIGNED,
        InvestigationStatus.UNDER_REVIEW,
        InvestigationStatus.ESCALATED,
    ],
    InvestigationStatus.RESOLVED: [],       # Terminal state
    InvestigationStatus.ESCALATED: [
        InvestigationStatus.ASSIGNED,
        InvestigationStatus.UNDER_REVIEW,
    ],
    InvestigationStatus.FALSE_POSITIVE: [],  # Terminal state
}


# Roles that can resolve investigations (requires officer note)
RESOLUTION_ROLES = [
    RoleCode.MOSPI_NATIONAL_OFFICER,
    RoleCode.STATE_NODAL_OFFICER,
    RoleCode.DISTRICT_AUTHORITY,
]


# ─── Demo Users for SIH 2026 Presentation ───
# Standard password: nirikshak@2026

DEMO_PASSWORD = "nirikshak@2026"

DEMO_USERS = [
    {
        "email": "admin@nirikshak.gov.in",
        "username": "admin",
        "full_name": "System Administrator (NIC MoSPI)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.SYSTEM_ADMIN,
        "state": None,
        "district": None,
        "constituency": None,
        "house_type": "BOTH",
        "tenure": "ALL",
        "project_ids": None,
    },
    {
        "email": "mospi.officer@nirikshak.gov.in",
        "username": "mospi.officer",
        "full_name": "Dr. Ramesh Sharma, DDG (MPLADS Division, MoSPI)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.MOSPI_NATIONAL_OFFICER,
        "state": None,
        "district": None,
        "constituency": None,
        "house_type": "BOTH",
        "tenure": "ALL",
        "project_ids": None,
    },
    {
        "email": "state.up@nirikshak.gov.in",
        "username": "state.officer.up",
        "full_name": "Shri Anand Verma, IAS (State Nodal Officer, Uttar Pradesh)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.STATE_NODAL_OFFICER,
        "state": "Uttar Pradesh",
        "district": None,
        "constituency": None,
        "house_type": "BOTH",
        "tenure": "ALL",
        "project_ids": None,
    },
    {
        "email": "district.jabalpur@nirikshak.gov.in",
        "username": "district.officer.jabalpur",
        "full_name": "Smt. G. Srijana, IAS (Collector & DM, Jabalpur)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.DISTRICT_AUTHORITY,
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "constituency": "Jabalpur",
        "house_type": "BOTH",
        "tenure": "ALL",
        "project_ids": None,
    },
    {
        "email": "mp.loksabha@nirikshak.gov.in",
        "username": "mp.varanasi",
        "full_name": "Shri Narendra Modi (Hon'ble MP, Varanasi)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.MEMBER_OF_PARLIAMENT,
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "constituency": "Varanasi",
        "house_type": "LOK_SABHA",
        "tenure": "2019-2024",
        "project_ids": None,
    },
    {
        "email": "inspector@nirikshak.gov.in",
        "username": "field.inspector",
        "full_name": "Er. Rajesh Kumar (Quality & Field Inspector, Jabalpur)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.FIELD_INSPECTOR,
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "constituency": "Jabalpur",
        "house_type": None,
        "tenure": None,
        "project_ids": "MPLADS-MA-M02260,MPLADS-MA-M02264,MPLADS-MA-M02265",
    },
    {
        "email": "analyst@nirikshak.gov.in",
        "username": "analyst",
        "full_name": "Priya Sundaram (Lead AI Risk & Forensic Analyst)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.AI_RISK_ANALYST,
        "state": None,
        "district": None,
        "constituency": None,
        "house_type": "BOTH",
        "tenure": "ALL",
        "project_ids": None,
    },
    {
        "email": "viewer@nirikshak.gov.in",
        "username": "viewer",
        "full_name": "Citizen Transparency Portal (Public Access)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.PUBLIC_VIEWER,
        "state": None,
        "district": None,
        "constituency": None,
        "house_type": None,
        "tenure": None,
        "project_ids": None,
    },
]

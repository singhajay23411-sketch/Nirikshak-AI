"""
Nirikshak AI — Authentication & RBAC Pydantic Models
=====================================================
Data models for login, tokens, user profiles, roles, permissions and scoping.
"""

from enum import Enum
from typing import Optional, List
from datetime import datetime

# ─── Since Pydantic may not be available, use lightweight dataclasses ───

class RoleCode:
    """Supported role codes."""
    ADMIN = "ADMIN"
    MOSPI_OFFICER = "MOSPI_OFFICER"
    STATE_OFFICER = "STATE_OFFICER"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    MP = "MP"
    FIELD_INSPECTOR = "FIELD_INSPECTOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

    ALL = [ADMIN, MOSPI_OFFICER, STATE_OFFICER, DISTRICT_OFFICER,
           MP, FIELD_INSPECTOR, ANALYST, VIEWER]


# ─── Role Labels (English & Hindi) ───

ROLE_LABELS = {
    RoleCode.ADMIN:            {"en": "Administrator",      "hi": "प्रशासक"},
    RoleCode.MOSPI_OFFICER:    {"en": "MoSPI Officer",      "hi": "MoSPI अधिकारी"},
    RoleCode.STATE_OFFICER:    {"en": "State Officer",       "hi": "राज्य अधिकारी"},
    RoleCode.DISTRICT_OFFICER: {"en": "District Officer",    "hi": "जिला अधिकारी"},
    RoleCode.MP:               {"en": "Hon'ble MP",          "hi": "माननीय सांसद"},
    RoleCode.FIELD_INSPECTOR:  {"en": "Field Inspector",     "hi": "क्षेत्र निरीक्षक"},
    RoleCode.ANALYST:          {"en": "Analyst",             "hi": "विश्लेषक"},
    RoleCode.VIEWER:           {"en": "Viewer",              "hi": "दर्शक"},
}


# ─── Granular Permissions per Role ───

ROLE_PERMISSIONS = {
    RoleCode.ADMIN: [
        "projects.view", "projects.edit",
        "risk.view", "risk.analyze",
        "evidence.view", "evidence.upload", "evidence.verify",
        "investigation.view", "investigation.create", "investigation.resolve",
        "reports.view", "reports.generate",
        "users.manage", "roles.manage",
        "audit.view", "system.manage",
    ],
    RoleCode.MOSPI_OFFICER: [
        "projects.view",
        "risk.view", "risk.analyze",
        "evidence.view",
        "investigation.view", "investigation.create",
        "reports.view", "reports.generate",
    ],
    RoleCode.STATE_OFFICER: [
        "projects.view",
        "risk.view",
        "evidence.view", "evidence.verify",
        "investigation.view", "investigation.create",
        "reports.view",
    ],
    RoleCode.DISTRICT_OFFICER: [
        "projects.view",
        "risk.view",
        "evidence.view", "evidence.verify",
        "investigation.view", "investigation.create",
        "reports.view",
    ],
    RoleCode.MP: [
        "projects.view",
        "risk.view",
        "evidence.view",
        "reports.view",
        "map.view",
    ],
    RoleCode.FIELD_INSPECTOR: [
        "projects.view",
        "evidence.view", "evidence.upload",
        "verification.submit",
        "reports.view",
    ],
    RoleCode.ANALYST: [
        "projects.view",
        "risk.view", "risk.analyze",
        "anomalies.view", "benchmarks.view",
        "reports.view", "reports.generate",
    ],
    RoleCode.VIEWER: [
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
    PROJECT = "PROJECT"
    CONSTITUENCY = "CONSTITUENCY"


ROLE_SCOPE = {
    RoleCode.ADMIN:            ScopeType.NATIONAL,
    RoleCode.MOSPI_OFFICER:    ScopeType.NATIONAL,
    RoleCode.STATE_OFFICER:    ScopeType.STATE,
    RoleCode.DISTRICT_OFFICER: ScopeType.DISTRICT,
    RoleCode.MP:               ScopeType.CONSTITUENCY,
    RoleCode.FIELD_INSPECTOR:  ScopeType.PROJECT,
    RoleCode.ANALYST:          ScopeType.NATIONAL,
    RoleCode.VIEWER:           ScopeType.NATIONAL,
}


# ─── Demo Users for SIH 2026 Presentation ───
# Standard password: nirikshak@2026

DEMO_PASSWORD = "nirikshak@2026"

DEMO_USERS = [
    {
        "email": "admin@nirikshak.gov.in",
        "username": "admin",
        "full_name": "System Administrator",
        "password": DEMO_PASSWORD,
        "role": RoleCode.ADMIN,
        "state": None,
        "district": None,
        "project_ids": None,
    },
    {
        "email": "mospi.officer@nirikshak.gov.in",
        "username": "mospi.officer",
        "full_name": "MoSPI Joint Secretary",
        "password": DEMO_PASSWORD,
        "role": RoleCode.MOSPI_OFFICER,
        "state": None,
        "district": None,
        "project_ids": None,
    },
    {
        "email": "state.up@nirikshak.gov.in",
        "username": "state.officer.up",
        "full_name": "State Nodal Officer (UP)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.STATE_OFFICER,
        "state": "Uttar Pradesh",
        "district": None,
        "project_ids": None,
    },
    {
        "email": "district.jabalpur@nirikshak.gov.in",
        "username": "district.officer.jabalpur",
        "full_name": "District Magistrate (Jabalpur)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.DISTRICT_OFFICER,
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "project_ids": None,
    },
    {
        "email": "mp.loksabha@nirikshak.gov.in",
        "username": "mp.varanasi",
        "full_name": "Hon'ble MP (Varanasi)",
        "password": DEMO_PASSWORD,
        "role": RoleCode.MP,
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "project_ids": None,
    },
    {
        "email": "inspector@nirikshak.gov.in",
        "username": "field.inspector",
        "full_name": "Field Quality Inspector",
        "password": DEMO_PASSWORD,
        "role": RoleCode.FIELD_INSPECTOR,
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "project_ids": "MPLADS-2026-8871,MPLADS-2026-4420,MPLADS-2025-1122",
    },
    {
        "email": "analyst@nirikshak.gov.in",
        "username": "analyst",
        "full_name": "MoSPI Policy Analyst",
        "password": DEMO_PASSWORD,
        "role": RoleCode.ANALYST,
        "state": None,
        "district": None,
        "project_ids": None,
    },
    {
        "email": "viewer@nirikshak.gov.in",
        "username": "viewer",
        "full_name": "Public Citizen / Guest Auditor",
        "password": DEMO_PASSWORD,
        "role": RoleCode.VIEWER,
        "state": None,
        "district": None,
        "project_ids": None,
    },
]

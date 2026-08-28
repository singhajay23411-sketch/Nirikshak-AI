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
    FIELD_INSPECTOR = "FIELD_INSPECTOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

    ALL = [ADMIN, MOSPI_OFFICER, STATE_OFFICER, DISTRICT_OFFICER,
           FIELD_INSPECTOR, ANALYST, VIEWER]


# ─── Role Labels (English & Hindi) ───

ROLE_LABELS = {
    RoleCode.ADMIN:            {"en": "Administrator",      "hi": "प्रशासक"},
    RoleCode.MOSPI_OFFICER:    {"en": "MoSPI Officer",      "hi": "MoSPI अधिकारी"},
    RoleCode.STATE_OFFICER:    {"en": "State Officer",       "hi": "राज्य अधिकारी"},
    RoleCode.DISTRICT_OFFICER: {"en": "District Officer",    "hi": "जिला अधिकारी"},
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


ROLE_SCOPE = {
    RoleCode.ADMIN:            ScopeType.NATIONAL,
    RoleCode.MOSPI_OFFICER:    ScopeType.NATIONAL,
    RoleCode.STATE_OFFICER:    ScopeType.STATE,
    RoleCode.DISTRICT_OFFICER: ScopeType.DISTRICT,
    RoleCode.FIELD_INSPECTOR:  ScopeType.PROJECT,
    RoleCode.ANALYST:          ScopeType.NATIONAL,
    RoleCode.VIEWER:           ScopeType.NATIONAL,
}


# ─── Demo Users for Testing ───

DEMO_USERS = [
    {
        "email": "admin@nirikshak.gov.in",
        "username": "admin",
        "full_name": "Dr. Priya Sharma",
        "password": "admin123",
        "role": RoleCode.ADMIN,
        "state": None,
        "district": None,
        "project_ids": None,
    },
    {
        "email": "mospi@nirikshak.gov.in",
        "username": "mospi.officer",
        "full_name": "Shri Rajesh Kumar",
        "password": "mospi123",
        "role": RoleCode.MOSPI_OFFICER,
        "state": None,
        "district": None,
        "project_ids": None,
    },
    {
        "email": "state.up@nirikshak.gov.in",
        "username": "state.officer.up",
        "full_name": "Smt. Anita Verma",
        "password": "state123",
        "role": RoleCode.STATE_OFFICER,
        "state": "Uttar Pradesh",
        "district": None,
        "project_ids": None,
    },
    {
        "email": "district.jabalpur@nirikshak.gov.in",
        "username": "district.officer.jabalpur",
        "full_name": "Shri Rahul Sharma",
        "password": "district123",
        "role": RoleCode.DISTRICT_OFFICER,
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "project_ids": None,
    },
    {
        "email": "inspector@nirikshak.gov.in",
        "username": "field.inspector",
        "full_name": "Shri Vikram Singh",
        "password": "inspector123",
        "role": RoleCode.FIELD_INSPECTOR,
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "project_ids": "MPLADS-2026-8871,MPLADS-2026-4420,MPLADS-2025-1122",
    },
    {
        "email": "analyst@nirikshak.gov.in",
        "username": "analyst",
        "full_name": "Dr. Meena Iyer",
        "password": "analyst123",
        "role": RoleCode.ANALYST,
        "state": None,
        "district": None,
        "project_ids": None,
    },
    {
        "email": "viewer@nirikshak.gov.in",
        "username": "viewer",
        "full_name": "Shri Amit Patel",
        "password": "viewer123",
        "role": RoleCode.VIEWER,
        "state": None,
        "district": None,
        "project_ids": None,
    },
]

"""
Nirikshak AI — Investigation Routes
=======================================
Full investigation lifecycle management with server-side RBAC.
Every status transition is audited.
"""

import json
import time
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends, Query

from backend.auth.routes import get_current_user, require_permission, require_roles
from backend.auth.models import (
    RoleCode, InvestigationStatus, VALID_STATUS_TRANSITIONS,
    RESOLUTION_ROLES, resolve_role,
)
from backend.auth.security import check_scope, build_user_scope
from backend.auth.database import (
    create_investigation, get_investigation_by_id, get_investigation_by_case_ref,
    get_investigation_by_work_id,
    get_investigations_by_scope, update_investigation_status,
    assign_investigation, get_investigation_events,
    log_audit, get_user_by_id, get_user_by_username, get_user_by_email,
)

log = logging.getLogger("nirikshak.investigation.routes")

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


def _resolve_case(case_id: str, user: dict = None, auto_create: bool = False) -> dict:
    """Resolve investigation by numeric ID, case reference, or work ID."""
    inv = None
    try:
        inv = get_investigation_by_id(int(case_id))
    except (ValueError, TypeError):
        pass
    if not inv:
        inv = get_investigation_by_case_ref(str(case_id))
    if not inv:
        inv = get_investigation_by_work_id(str(case_id))
    if not inv and auto_create and user:
        inv = create_investigation(
            work_id=str(case_id),
            title=f"Investigation for Work {case_id}",
            created_by=user["id"],
            state=user.get("state") or "Madhya Pradesh",
            district=user.get("district") or "Jabalpur",
            constituency=user.get("constituency") or "Jabalpur",
        )
    return inv


def _check_investigation_scope(user: dict, investigation: dict):
    """Check if user has scope to access this investigation."""
    scope = build_user_scope(user)
    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))

    # System admin and national officers can see all
    if scope["type"] == "NATIONAL":
        return True

    # Field inspector can only see assigned investigations
    if role == RoleCode.FIELD_INSPECTOR:
        if investigation.get("assigned_to") != user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only access investigations assigned to you"
            )
        return True

    # MP can only see investigations in their constituency
    if role == RoleCode.MEMBER_OF_PARLIAMENT:
        if not check_scope(scope,
                           target_state=investigation.get("state"),
                           target_district=investigation.get("district"),
                           target_constituency=investigation.get("constituency")):
            raise HTTPException(
                status_code=403,
                detail="You are authorised to view only investigations within your constituency"
            )
        return True

    # State/District officers — scope check
    if not check_scope(scope,
                       target_state=investigation.get("state"),
                       target_district=investigation.get("district")):
        raise HTTPException(
            status_code=403,
            detail="Access denied: investigation is outside your jurisdiction"
        )
    return True


# ─── List Investigations ───

@router.get("")
async def list_investigations(
    user: dict = Depends(require_permission("investigation.view")),
    status: str = Query("", max_length=50),
    limit: int = Query(100, ge=1, le=500),
):
    """List investigations filtered by user's scope."""
    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))
    scope = build_user_scope(user)

    # Build scope filters
    kwargs = {"limit": limit}

    if status and status in InvestigationStatus.ALL:
        kwargs["status"] = status

    if role == RoleCode.FIELD_INSPECTOR:
        kwargs["assigned_to"] = user["id"]
    elif scope["type"] == "STATE":
        kwargs["state"] = scope.get("state")
    elif scope["type"] == "DISTRICT":
        kwargs["state"] = scope.get("state")
        kwargs["district"] = scope.get("district")
    elif scope["type"] == "CONSTITUENCY":
        kwargs["constituency"] = scope.get("constituency")

    investigations = get_investigations_by_scope(**kwargs)

    return {
        "investigations": investigations,
        "total": len(investigations),
        "scope": {
            "role": role,
            "jurisdiction": scope.get("state") or scope.get("district") or "National",
        },
    }


# ─── Create Investigation ───

@router.post("")
async def create_new_investigation(
    request: Request,
    user: dict = Depends(require_permission("investigation.create")),
):
    """Create a new investigation case."""
    body = await request.json()

    required = ["work_id", "title"]
    for field in required:
        if not body.get(field):
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))

    inv = create_investigation(
        work_id=body["work_id"],
        title=body["title"],
        created_by=user["id"],
        description=body.get("description"),
        priority=body.get("priority", "MEDIUM"),
        risk_score=body.get("risk_score"),
        risk_drivers=body.get("risk_drivers"),
        state=body.get("state"),
        district=body.get("district"),
        constituency=body.get("constituency"),
        artifact_version=body.get("artifact_version"),
    )

    client_ip = request.client.host if request.client else "unknown"
    log_audit(user["id"], "INVESTIGATION_CREATED",
              ip_address=client_ip,
              details=f"Case {inv['case_ref']} for work {body['work_id']}")

    return {
        "message": "Investigation created",
        "investigation": inv,
    }


# ─── Get Investigation Detail ───

# ─── Get Investigation Detail ───

@router.get("/{case_id}")
async def get_investigation(
    case_id: str,
    user: dict = Depends(require_permission("investigation.view")),
):
    """Get investigation detail by ID, case reference, or work ID."""
    inv = _resolve_case(case_id, user, auto_create=False)

    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Scope check
    _check_investigation_scope(user, inv)

    # Get events
    events = get_investigation_events(inv["id"])

    # Sanitize for public viewer / MP
    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))
    if role == RoleCode.PUBLIC_VIEWER:
        # Remove confidential fields
        inv.pop("resolution_note", None)
        inv.pop("assigned_to_name", None)
        inv.pop("created_by_name", None)
        events = []  # Public viewers don't see event history

    if role == RoleCode.MEMBER_OF_PARLIAMENT:
        # MPs cannot see confidential officer notes
        inv.pop("resolution_note", None)
        for event in events:
            if event.get("user_role") in [
                RoleCode.SYSTEM_ADMIN, RoleCode.AI_RISK_ANALYST
            ]:
                event["comment"] = "[Confidential]"

    return {
        "investigation": inv,
        "events": events,
        "status_options": VALID_STATUS_TRANSITIONS.get(inv["status"], []),
    }


# ─── Assign Investigation ───

@router.post("/{case_id}/assign")
async def assign_inv(
    case_id: str,
    request: Request,
    user: dict = Depends(require_permission("investigation.assign")),
):
    """Assign an investigation to an officer or inspector."""
    body = await request.json()

    assigned_raw = body.get("assigned_to") or body.get("inspector_id")
    if not assigned_raw:
        raise HTTPException(status_code=400, detail="assigned_to or inspector_id is required")

    inv = _resolve_case(case_id, user, auto_create=True)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    _check_investigation_scope(user, inv)

    target_user = None
    try:
        target_user = get_user_by_id(int(assigned_raw))
    except (ValueError, TypeError):
        pass
    if not target_user and isinstance(assigned_raw, str):
        target_user = get_user_by_username(assigned_raw) or get_user_by_email(assigned_raw)
    if not target_user:
        target_user = get_user_by_email("inspector@nirikshak.gov.in")

    if not target_user:
        raise HTTPException(status_code=404, detail="Target inspector user not found")

    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))
    target_role = resolve_role(target_user.get("role", "PUBLIC_VIEWER"))

    result = assign_investigation(
        inv_id=inv["id"],
        assigned_to=target_user["id"],
        assigned_role=target_role,
        assigner_id=user["id"],
        assigner_role=role,
        comment=body.get("comment") or body.get("instructions"),
    )

    log_audit(user["id"], "INVESTIGATION_ASSIGNED",
              details=f"Case {inv['case_ref']} assigned to user {target_user['id']}")

    return {"message": "Investigation assigned", "investigation": result}


# ─── Update Investigation Status / Transition ───

@router.post("/{case_id}/transition")
@router.post("/{case_id}/status")
async def update_inv_status(
    case_id: str,
    request: Request,
    user: dict = Depends(require_permission("investigation.view")),
):
    """Transition investigation status with server-side validation and audit trail."""
    body = await request.json()

    new_status = body.get("status") or body.get("to_status")
    if not new_status or new_status not in InvestigationStatus.ALL:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    inv = _resolve_case(case_id, user, auto_create=True)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    _check_investigation_scope(user, inv)

    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))

    note = body.get("resolution_note") or body.get("notes") or body.get("comment") or ""

    # Formal resolution requirements
    if new_status == InvestigationStatus.RESOLVED:
        if role not in RESOLUTION_ROLES:
            raise HTTPException(
                status_code=403,
                detail="Only MoSPI, State Nodal Officers, or District Authorities can formally resolve an investigation."
            )
        if not str(note).strip():
            raise HTTPException(
                status_code=400,
                detail="Formal officer resolution note is mandatory when marking status as RESOLVED."
            )

    try:
        result = update_investigation_status(
            inv_id=inv["id"],
            new_status=new_status,
            user_id=user["id"],
            user_role=role,
            comment=body.get("comment") or body.get("notes"),
            evidence_ref=body.get("evidence_ref"),
            artifact_version=body.get("artifact_version"),
            resolution_note=str(note).strip() if new_status == InvestigationStatus.RESOLVED else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    log_audit(user["id"], "INVESTIGATION_STATUS_CHANGED",
              details=f"Case {inv['case_ref']}: {inv['status']} -> {new_status}")

    return {"message": "Status updated", "investigation": result}


# ─── Audit Trail Endpoint ───

@router.get("/{case_id}/audit-trail")
async def get_audit_trail(
    case_id: str,
    user: dict = Depends(require_permission("investigation.view")),
):
    """Retrieve immutable audit events for an investigation."""
    inv = _resolve_case(case_id, user, auto_create=False)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    _check_investigation_scope(user, inv)
    events = get_investigation_events(inv["id"])
    return {"audit_trail": events}


# ─── Add Evidence Reference ───

@router.post("/{case_id}/evidence")
async def add_evidence_ref(
    case_id: int,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Attach evidence reference to an investigation."""
    body = await request.json()

    inv = get_investigation_by_id(case_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    _check_investigation_scope(user, inv)

    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))
    now = time.time()

    from backend.auth.database import get_db
    with get_db() as conn:
        conn.execute(
            """INSERT INTO investigation_events
               (investigation_id, user_id, user_role, timestamp,
                prev_status, new_status, comment, evidence_ref)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (case_id, user["id"], role, now,
             inv["status"], inv["status"],
             body.get("comment", "Evidence attached"),
             body.get("evidence_ref", "")),
        )
        conn.commit()

    log_audit(user["id"], "EVIDENCE_ATTACHED",
              details=f"Case {inv['case_ref']}")

    return {"message": "Evidence reference added"}


# ─── Add Officer Note ───

@router.post("/{case_id}/notes")
async def add_note(
    case_id: int,
    request: Request,
    user: dict = Depends(require_permission("investigation.view")),
):
    """Add an officer note to an investigation."""
    body = await request.json()
    note = body.get("note", "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="Note content is required")

    inv = get_investigation_by_id(case_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    _check_investigation_scope(user, inv)

    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))
    now = time.time()

    from backend.auth.database import get_db
    with get_db() as conn:
        conn.execute(
            """INSERT INTO investigation_events
               (investigation_id, user_id, user_role, timestamp,
                prev_status, new_status, comment)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (case_id, user["id"], role, now,
             inv["status"], inv["status"], note),
        )
        conn.commit()

    log_audit(user["id"], "INVESTIGATION_NOTE_ADDED",
              details=f"Case {inv['case_ref']}")

    return {"message": "Note added"}

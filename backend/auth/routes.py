"""
Nirikshak AI — Auth API Routes
================================
FastAPI router for authentication, session management, and admin user operations.
All authorization is enforced server-side.
"""

import json
import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse

from .models import RoleCode, ROLE_PERMISSIONS, ROLE_SCOPE, ROLE_LABELS
from .security import verify_password, create_jwt, verify_jwt, check_permission, needs_rehash, hash_password
from .database import (
    get_user_by_email, get_user_by_username, get_user_by_id,
    get_all_users, create_user, update_user, delete_user,
    reset_user_password, update_last_login, log_audit, get_audit_logs,
)

log = logging.getLogger("nirikshak.auth.routes")

router = APIRouter(prefix="/api", tags=["auth"])


# ─── Auth Dependency: Extract & Verify Current User ───

async def get_current_user(request: Request) -> dict:
    """Extract and verify the JWT token from the Authorization header.
    Returns the full user record or raises 401."""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header[7:]

    try:
        payload = verify_jwt(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Account is disabled")

    return user


def require_permission(permission: str):
    """Dependency factory: enforce a specific permission on the current user."""
    async def _check(user: dict = Depends(get_current_user)):
        user_perms = ROLE_PERMISSIONS.get(user["role"], [])
        if not check_permission(user_perms, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {permission}"
            )
        return user
    return _check


def require_admin():
    """Dependency: require ADMIN role."""
    async def _check(user: dict = Depends(get_current_user)):
        if user["role"] != RoleCode.ADMIN:
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    return _check


# ─── Public: Login ───

@router.post("/auth/login")
async def login(request: Request):
    """Authenticate user with email/username + password. Returns JWT + profile."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")

    identifier = body.get("email", "").strip()
    password = body.get("password", "")

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Email/username and password are required")

    # Find user by email or username
    user = get_user_by_email(identifier)
    if not user:
        user = get_user_by_username(identifier)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Verify password
    if not verify_password(password, user["password_hash"]):
        log_audit(user["id"], "LOGIN_FAILED", details="Invalid password attempt")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Rehash if needed (cost parameter upgrade)
    if needs_rehash(user["password_hash"]):
        from .database import get_db
        new_hash = hash_password(password)
        with get_db() as conn:
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                         (new_hash, user["id"]))
            conn.commit()

    # Update last login
    update_last_login(user["id"])

    # Build permissions and scope
    role = user["role"]
    permissions = ROLE_PERMISSIONS.get(role, [])
    scope_type = ROLE_SCOPE.get(role, "NATIONAL")
    role_label = ROLE_LABELS.get(role, {"en": role, "hi": role})

    scope = {
        "type": scope_type,
        "state": user.get("state"),
        "district": user.get("district"),
        "project_ids": user.get("project_ids", "").split(",") if user.get("project_ids") else [],
    }

    # Create JWT
    token = create_jwt({
        "user_id": user["id"],
        "role": role,
        "scope_type": scope_type,
    })

    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    log_audit(user["id"], "LOGIN_SUCCESS", ip_address=client_ip)

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "fullName": user["full_name"],
            "role": role,
            "roleLabel": role_label,
            "permissions": permissions,
            "scope": scope,
            "state": user.get("state"),
            "district": user.get("district"),
            "lastLogin": user.get("last_login"),
        },
    }


# ─── Protected: Current Session ───

@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Return the current authenticated user's profile and permissions."""
    role = user["role"]
    permissions = ROLE_PERMISSIONS.get(role, [])
    scope_type = ROLE_SCOPE.get(role, "NATIONAL")
    role_label = ROLE_LABELS.get(role, {"en": role, "hi": role})

    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "fullName": user["full_name"],
            "role": role,
            "roleLabel": role_label,
            "permissions": permissions,
            "scope": {
                "type": scope_type,
                "state": user.get("state"),
                "district": user.get("district"),
                "project_ids": user.get("project_ids", "").split(",") if user.get("project_ids") else [],
            },
            "state": user.get("state"),
            "district": user.get("district"),
            "isActive": bool(user.get("is_active")),
            "lastLogin": user.get("last_login"),
        },
    }


@router.post("/auth/logout")
async def logout(request: Request, user: dict = Depends(get_current_user)):
    """Log out the current user (server-side audit only; client clears token)."""
    client_ip = request.client.host if request.client else "unknown"
    log_audit(user["id"], "LOGOUT", ip_address=client_ip)
    return {"message": "Logged out successfully"}


# ─── Admin: User Management ───

@router.get("/admin/users")
async def list_users(admin: dict = Depends(require_admin())):
    """List all users (Admin only)."""
    users = get_all_users()
    result = []
    for u in users:
        role = u["role"]
        result.append({
            "id": u["id"],
            "email": u["email"],
            "username": u["username"],
            "fullName": u["full_name"],
            "role": role,
            "roleLabel": ROLE_LABELS.get(role, {"en": role, "hi": role}),
            "state": u.get("state"),
            "district": u.get("district"),
            "projectIds": u.get("project_ids"),
            "isActive": bool(u.get("is_active")),
            "createdAt": u.get("created_at"),
            "lastLogin": u.get("last_login"),
        })
    return {"users": result}


@router.post("/admin/users")
async def create_new_user(request: Request, admin: dict = Depends(require_admin())):
    """Create a new user (Admin only)."""
    body = await request.json()

    required = ["email", "username", "fullName", "password", "role"]
    for field in required:
        if not body.get(field):
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    role = body["role"]
    if role not in RoleCode.ALL:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    try:
        user = create_user(
            email=body["email"],
            username=body["username"],
            full_name=body["fullName"],
            password=body["password"],
            role=role,
            state=body.get("state"),
            district=body.get("district"),
            project_ids=body.get("projectIds"),
        )
    except Exception as e:
        if "UNIQUE" in str(e):
            raise HTTPException(status_code=409, detail="Email or username already exists")
        raise HTTPException(status_code=500, detail=str(e))

    log_audit(admin["id"], "USER_CREATED", details=f"Created user: {body['email']}")
    return {"message": "User created", "userId": user["id"]}


@router.put("/admin/users/{user_id}")
async def update_existing_user(user_id: int, request: Request,
                                admin: dict = Depends(require_admin())):
    """Update a user's profile (Admin only)."""
    body = await request.json()

    allowed_updates = {}
    if "fullName" in body:
        allowed_updates["full_name"] = body["fullName"]
    if "role" in body:
        if body["role"] not in RoleCode.ALL:
            raise HTTPException(status_code=400, detail=f"Invalid role: {body['role']}")
        allowed_updates["role"] = body["role"]
    if "state" in body:
        allowed_updates["state"] = body["state"]
    if "district" in body:
        allowed_updates["district"] = body["district"]
    if "projectIds" in body:
        allowed_updates["project_ids"] = body["projectIds"]
    if "isActive" in body:
        allowed_updates["is_active"] = 1 if body["isActive"] else 0

    if not allowed_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    updated = update_user(user_id, **allowed_updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")

    log_audit(admin["id"], "USER_UPDATED", details=f"Updated user ID {user_id}")
    return {"message": "User updated"}


@router.delete("/admin/users/{user_id}")
async def remove_user(user_id: int, admin: dict = Depends(require_admin())):
    """Soft-delete a user (Admin only)."""
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target["id"] == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    delete_user(user_id)
    log_audit(admin["id"], "USER_DELETED", details=f"Deactivated user ID {user_id}")
    return {"message": "User deactivated"}


@router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: int, request: Request,
                                admin: dict = Depends(require_admin())):
    """Reset a user's password (Admin only)."""
    body = await request.json()
    new_password = body.get("password", "")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    reset_user_password(user_id, new_password)
    log_audit(admin["id"], "PASSWORD_RESET", details=f"Reset password for user ID {user_id}")
    return {"message": "Password reset successfully"}


# ─── Admin: Audit Logs ───

@router.get("/admin/audit-logs")
async def list_audit_logs(admin: dict = Depends(require_admin())):
    """Fetch recent audit logs (Admin only)."""
    logs = get_audit_logs(limit=200)
    return {"logs": logs}


# ─── Inspections ───

@router.get("/inspections")
async def list_inspections(user: dict = Depends(get_current_user)):
    """
    Return inspection records visible to the current user.
    - FIELD_INSPECTOR: only their own records.
    - All other roles: all records (national scope).
    """
    from .database import get_db
    with get_db() as conn:
        if user["role"] == "FIELD_INSPECTOR":
            rows = conn.execute(
                """SELECT i.*, u.full_name AS inspector_name
                   FROM inspections i
                   LEFT JOIN users u ON i.inspector_id = u.id
                   WHERE i.inspector_id = ?
                   ORDER BY i.created_at DESC""",
                (user["id"],),
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT i.*, u.full_name AS inspector_name
                   FROM inspections i
                   LEFT JOIN users u ON i.inspector_id = u.id
                   ORDER BY i.created_at DESC""",
            ).fetchall()

    result = []
    for r in rows:
        d = dict(r)
        # Safely parse JSON blobs
        for field in ("checklist_data", "photos"):
            if d.get(field):
                try:
                    d[field] = json.loads(d[field])
                except (json.JSONDecodeError, TypeError):
                    pass
        result.append(d)

    return {"inspections": result, "total": len(result)}


@router.post("/inspections")
async def create_inspection(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Create a new inspection record.
    Body: { project_id, status?, checklist_data?, photos?, notes? }
    """
    import time as _time
    body = await request.json()
    project_id = body.get("project_id", "").strip()
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    status        = body.get("status", "pending")
    checklist     = body.get("checklist_data")
    photos        = body.get("photos")
    notes         = body.get("notes", "")

    from .database import get_db
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO inspections
               (project_id, inspector_id, status, checklist_data, photos, notes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                project_id,
                user["id"],
                status,
                json.dumps(checklist) if checklist is not None else None,
                json.dumps(photos)    if photos    is not None else None,
                notes,
                _time.time(),
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid

    log_audit(user["id"], "INSPECTION_CREATED", details=f"Project: {project_id}")
    return {"message": "Inspection created", "id": new_id, "project_id": project_id}


@router.patch("/inspections/{inspection_id}")
async def update_inspection(
    inspection_id: int,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Update an existing inspection record.
    Field inspectors can only update their own records.
    Body: { status?, checklist_data?, photos?, notes? }
    """
    import time as _time
    body = await request.json()

    from .database import get_db
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM inspections WHERE id = ?", (inspection_id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Inspection not found")

        row = dict(row)
        if user["role"] == "FIELD_INSPECTOR" and row["inspector_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not authorised to update this inspection")

        updates = {}
        if "status" in body:
            updates["status"] = body["status"]
        if "checklist_data" in body:
            updates["checklist_data"] = json.dumps(body["checklist_data"])
        if "photos" in body:
            updates["photos"] = json.dumps(body["photos"])
        if "notes" in body:
            updates["notes"] = body["notes"]

        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        if body.get("status") in ("completed", "verified"):
            updates["verified_at"] = _time.time()

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [inspection_id]
        conn.execute(f"UPDATE inspections SET {set_clause} WHERE id = ?", values)
        conn.commit()

    log_audit(user["id"], "INSPECTION_UPDATED", details=f"Inspection ID: {inspection_id}")
    return {"message": "Inspection updated", "id": inspection_id}

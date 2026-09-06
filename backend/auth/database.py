"""
Nirikshak AI — Auth Database Layer
====================================
SQLite database for user authentication, audit logs, inspection records,
and investigation lifecycle management.
Auto-seeds official demo accounts on first run.
"""

import sqlite3
import os
import time
import json
import logging
from contextlib import contextmanager

from .models import (
    DEMO_USERS, ROLE_PERMISSIONS, ROLE_SCOPE, RoleCode,
    InvestigationStatus, VALID_STATUS_TRANSITIONS, RESOLUTION_ROLES,
)
from .security import hash_password

log = logging.getLogger("nirikshak.auth.database")

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "nirikshak_users.db")


# ─── Schema ───

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT UNIQUE NOT NULL,
    username        TEXT UNIQUE NOT NULL,
    full_name       TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'PUBLIC_VIEWER',
    state           TEXT,
    district        TEXT,
    constituency    TEXT,
    house_type      TEXT,
    tenure          TEXT,
    project_ids     TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      REAL NOT NULL,
    last_login      REAL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER,
    action          TEXT NOT NULL,
    timestamp       REAL NOT NULL,
    ip_address      TEXT,
    details         TEXT
);

CREATE TABLE IF NOT EXISTS inspections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL,
    inspector_id    INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    checklist_data  TEXT,
    photos          TEXT,
    notes           TEXT,
    created_at      REAL NOT NULL,
    verified_at     REAL,
    FOREIGN KEY (inspector_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS investigations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    case_ref        TEXT UNIQUE NOT NULL,
    work_id         TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'NEW',
    priority        TEXT DEFAULT 'MEDIUM',
    risk_score      REAL,
    risk_drivers    TEXT,
    state           TEXT,
    district        TEXT,
    constituency    TEXT,
    assigned_to     INTEGER,
    assigned_role   TEXT,
    created_by      INTEGER NOT NULL,
    created_at      REAL NOT NULL,
    updated_at      REAL NOT NULL,
    resolved_at     REAL,
    resolution_note TEXT,
    artifact_version TEXT,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS investigation_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    investigation_id INTEGER NOT NULL,
    user_id         INTEGER NOT NULL,
    user_role       TEXT NOT NULL,
    timestamp       REAL NOT NULL,
    prev_status     TEXT,
    new_status      TEXT NOT NULL,
    comment         TEXT,
    evidence_ref    TEXT,
    artifact_version TEXT,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evidence_files (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    investigation_id INTEGER,
    inspection_id   INTEGER,
    project_id      TEXT,
    uploaded_by     INTEGER NOT NULL,
    filename        TEXT NOT NULL,
    original_name   TEXT NOT NULL,
    file_type       TEXT,
    file_size       INTEGER,
    geo_lat         REAL,
    geo_lng         REAL,
    timestamp_taken TEXT,
    notes           TEXT,
    created_at      REAL NOT NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_state ON investigations(state);
CREATE INDEX IF NOT EXISTS idx_investigations_assigned ON investigations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_investigation_events_case ON investigation_events(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence_files(project_id);
"""


@contextmanager
def get_db():
    """Context manager for SQLite connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
    finally:
        conn.close()


def init_database():
    """Initialize database schema and seed demo users."""
    log.info("Initializing auth database at: %s", DB_PATH)

    # Check if we need to recreate the schema (detect missing columns)
    needs_recreate = False
    if os.path.exists(DB_PATH):
        try:
            with get_db() as conn:
                cursor = conn.execute("PRAGMA table_info(users)")
                columns = {row[1] for row in cursor.fetchall()}
                if "constituency" not in columns or "house_type" not in columns:
                    needs_recreate = True
                    log.info("Schema update needed — adding new columns")
        except Exception:
            needs_recreate = True

    if needs_recreate:
        log.info("Recreating database with updated schema...")
        try:
            os.remove(DB_PATH)
        except OSError:
            pass

    with get_db() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.commit()

        # Check if demo users already exist
        cursor = conn.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]

        if count == 0:
            log.info("Seeding %d demo users...", len(DEMO_USERS))
            now = time.time()

            for user in DEMO_USERS:
                pw_hash = hash_password(user["password"])
                conn.execute(
                    """INSERT INTO users
                       (email, username, full_name, password_hash, role,
                        state, district, constituency, house_type, tenure,
                        project_ids, is_active, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
                    (
                        user["email"],
                        user["username"],
                        user["full_name"],
                        pw_hash,
                        user["role"],
                        user.get("state"),
                        user.get("district"),
                        user.get("constituency"),
                        user.get("house_type"),
                        user.get("tenure"),
                        user.get("project_ids"),
                        now,
                    ),
                )

            conn.commit()
            log.info("Demo users seeded successfully.")
        else:
            log.info("Database already contains %d users, skipping seed.", count)


# ─── User CRUD ───

def get_user_by_email(email: str) -> dict:
    """Fetch a user by email address."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ? AND is_active = 1",
            (email,),
        ).fetchone()
        return dict(row) if row else None


def get_user_by_username(username: str) -> dict:
    """Fetch a user by username."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1",
            (username,),
        ).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict:
    """Fetch a user by ID."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


def get_all_users() -> list:
    """Fetch all users (for admin management)."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, email, username, full_name, role, state, district, "
            "constituency, house_type, tenure, project_ids, is_active, "
            "created_at, last_login FROM users "
            "ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def create_user(email: str, username: str, full_name: str, password: str,
                role: str, state: str = None, district: str = None,
                constituency: str = None, house_type: str = None,
                tenure: str = None, project_ids: str = None) -> dict:
    """Create a new user. Returns the created user dict."""
    pw_hash = hash_password(password)
    now = time.time()

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO users
               (email, username, full_name, password_hash, role,
                state, district, constituency, house_type, tenure,
                project_ids, is_active, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            (email, username, full_name, pw_hash, role,
             state, district, constituency, house_type, tenure,
             project_ids, now),
        )
        conn.commit()
        return get_user_by_id(cursor.lastrowid)


def update_user(user_id: int, **kwargs) -> dict:
    """Update user fields. Supports: full_name, role, state, district,
    constituency, house_type, tenure, project_ids, is_active."""
    allowed = {
        "full_name", "role", "state", "district", "constituency",
        "house_type", "tenure", "project_ids", "is_active",
    }
    updates = {k: v for k, v in kwargs.items() if k in allowed}

    if not updates:
        return get_user_by_id(user_id)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [user_id]

    with get_db() as conn:
        conn.execute(
            f"UPDATE users SET {set_clause} WHERE id = ?",
            values,
        )
        conn.commit()

    return get_user_by_id(user_id)


def reset_user_password(user_id: int, new_password: str):
    """Reset a user's password (admin action)."""
    pw_hash = hash_password(new_password)
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (pw_hash, user_id),
        )
        conn.commit()


def update_last_login(user_id: int):
    """Update the last_login timestamp."""
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (time.time(), user_id),
        )
        conn.commit()


def delete_user(user_id: int):
    """Soft-delete a user by deactivating."""
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET is_active = 0 WHERE id = ?",
            (user_id,),
        )
        conn.commit()


# ─── Audit Logging ───

def log_audit(user_id: int, action: str, ip_address: str = None, details: str = None):
    """Record an audit log entry."""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO audit_logs (user_id, action, timestamp, ip_address, details) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, action, time.time(), ip_address, details),
        )
        conn.commit()


def get_audit_logs(limit: int = 100, user_id: int = None, action: str = None) -> list:
    """Fetch recent audit logs with optional filters."""
    query = (
        "SELECT a.*, u.full_name, u.email, u.role FROM audit_logs a "
        "LEFT JOIN users u ON a.user_id = u.id "
    )
    conditions = []
    params = []

    if user_id:
        conditions.append("a.user_id = ?")
        params.append(user_id)
    if action:
        conditions.append("a.action = ?")
        params.append(action)

    if conditions:
        query += "WHERE " + " AND ".join(conditions) + " "

    query += "ORDER BY a.timestamp DESC LIMIT ?"
    params.append(limit)

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


# ─── Investigation CRUD ───

def _generate_case_ref() -> str:
    """Generate a unique case reference like NIR-2026-XXXX."""
    import random
    year = time.strftime("%Y")
    num = random.randint(1000, 9999)
    return f"NIR-{year}-{num}"


def create_investigation(
    work_id: str,
    title: str,
    created_by: int,
    description: str = None,
    priority: str = "MEDIUM",
    risk_score: float = None,
    risk_drivers: str = None,
    state: str = None,
    district: str = None,
    constituency: str = None,
    artifact_version: str = None,
) -> dict:
    """Create a new investigation case."""
    now = time.time()
    case_ref = _generate_case_ref()

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO investigations
               (case_ref, work_id, title, description, status, priority,
                risk_score, risk_drivers, state, district, constituency,
                created_by, created_at, updated_at, artifact_version)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                case_ref, work_id, title, description,
                InvestigationStatus.NEW, priority,
                risk_score, risk_drivers,
                state, district, constituency,
                created_by, now, now, artifact_version,
            ),
        )
        conn.commit()
        inv_id = cursor.lastrowid

        # Log initial event
        conn.execute(
            """INSERT INTO investigation_events
               (investigation_id, user_id, user_role, timestamp,
                prev_status, new_status, comment, artifact_version)
               VALUES (?, ?, ?, ?, NULL, ?, ?, ?)""",
            (inv_id, created_by, "", now,
             InvestigationStatus.NEW, "Investigation created", artifact_version),
        )
        conn.commit()

    return get_investigation_by_id(inv_id)


def get_investigation_by_id(inv_id: int) -> dict:
    """Fetch an investigation by ID."""
    with get_db() as conn:
        row = conn.execute(
            """SELECT i.*, u1.full_name AS created_by_name, u2.full_name AS assigned_to_name
               FROM investigations i
               LEFT JOIN users u1 ON i.created_by = u1.id
               LEFT JOIN users u2 ON i.assigned_to = u2.id
               WHERE i.id = ?""",
            (inv_id,),
        ).fetchone()
        return dict(row) if row else None


def get_investigation_by_case_ref(case_ref: str) -> dict:
    """Fetch an investigation by case reference."""
    with get_db() as conn:
        row = conn.execute(
            """SELECT i.*, u1.full_name AS created_by_name, u2.full_name AS assigned_to_name
               FROM investigations i
               LEFT JOIN users u1 ON i.created_by = u1.id
               LEFT JOIN users u2 ON i.assigned_to = u2.id
               WHERE i.case_ref = ?""",
            (case_ref,),
        ).fetchone()
        return dict(row) if row else None


def get_investigation_by_work_id(work_id: str) -> dict:
    """Fetch an investigation by work ID."""
    with get_db() as conn:
        row = conn.execute(
            """SELECT i.*, u1.full_name AS created_by_name, u2.full_name AS assigned_to_name
               FROM investigations i
               LEFT JOIN users u1 ON i.created_by = u1.id
               LEFT JOIN users u2 ON i.assigned_to = u2.id
               WHERE i.work_id = ?
               ORDER BY i.id DESC LIMIT 1""",
            (work_id,),
        ).fetchone()
        return dict(row) if row else None


def get_investigations_by_scope(
    state: str = None,
    district: str = None,
    constituency: str = None,
    status: str = None,
    assigned_to: int = None,
    limit: int = 100,
) -> list:
    """Fetch investigations filtered by scope."""
    query = (
        "SELECT i.*, u1.full_name AS created_by_name, u2.full_name AS assigned_to_name "
        "FROM investigations i "
        "LEFT JOIN users u1 ON i.created_by = u1.id "
        "LEFT JOIN users u2 ON i.assigned_to = u2.id "
    )
    conditions = []
    params = []

    if state:
        conditions.append("LOWER(i.state) = LOWER(?)")
        params.append(state)
    if district:
        conditions.append("LOWER(i.district) = LOWER(?)")
        params.append(district)
    if constituency:
        conditions.append("LOWER(i.constituency) = LOWER(?)")
        params.append(constituency)
    if status:
        conditions.append("i.status = ?")
        params.append(status)
    if assigned_to:
        conditions.append("i.assigned_to = ?")
        params.append(assigned_to)

    if conditions:
        query += "WHERE " + " AND ".join(conditions) + " "

    query += "ORDER BY i.updated_at DESC LIMIT ?"
    params.append(limit)

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


def update_investigation_status(
    inv_id: int,
    new_status: str,
    user_id: int,
    user_role: str,
    comment: str = None,
    evidence_ref: str = None,
    artifact_version: str = None,
    resolution_note: str = None,
) -> dict:
    """Update an investigation's status with full audit trail.
    Enforces: RESOLVED requires officer note from authorised role."""
    inv = get_investigation_by_id(inv_id)
    if not inv:
        return None

    prev_status = inv["status"]

    # Validate transition
    valid_next = VALID_STATUS_TRANSITIONS.get(prev_status, [])
    if new_status not in valid_next:
        raise ValueError(
            f"Invalid status transition: {prev_status} → {new_status}. "
            f"Valid: {valid_next}"
        )

    # RESOLVED requires officer note from authorised role
    if new_status == InvestigationStatus.RESOLVED:
        if user_role not in RESOLUTION_ROLES:
            raise PermissionError(
                "Only authorised officers can resolve investigations"
            )
        if not resolution_note and not comment:
            raise ValueError(
                "Resolution requires an authorised officer note"
            )

    now = time.time()

    with get_db() as conn:
        updates = {"status": new_status, "updated_at": now}

        if new_status == InvestigationStatus.RESOLVED:
            updates["resolved_at"] = now
            updates["resolution_note"] = resolution_note or comment

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [inv_id]
        conn.execute(f"UPDATE investigations SET {set_clause} WHERE id = ?", values)

        # Log event
        conn.execute(
            """INSERT INTO investigation_events
               (investigation_id, user_id, user_role, timestamp,
                prev_status, new_status, comment, evidence_ref, artifact_version)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (inv_id, user_id, user_role, now,
             prev_status, new_status,
             comment or resolution_note,
             evidence_ref, artifact_version),
        )
        conn.commit()

    return get_investigation_by_id(inv_id)


def assign_investigation(inv_id: int, assigned_to: int, assigned_role: str,
                          assigner_id: int, assigner_role: str,
                          comment: str = None) -> dict:
    """Assign an investigation to a user."""
    now = time.time()

    with get_db() as conn:
        conn.execute(
            """UPDATE investigations
               SET assigned_to = ?, assigned_role = ?,
                   status = ?, updated_at = ?
               WHERE id = ?""",
            (assigned_to, assigned_role,
             InvestigationStatus.ASSIGNED, now, inv_id),
        )

        conn.execute(
            """INSERT INTO investigation_events
               (investigation_id, user_id, user_role, timestamp,
                prev_status, new_status, comment)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (inv_id, assigner_id, assigner_role, now,
             None, InvestigationStatus.ASSIGNED,
             comment or f"Assigned to user {assigned_to}"),
        )
        conn.commit()

    return get_investigation_by_id(inv_id)


def get_investigation_events(inv_id: int) -> list:
    """Fetch all events for an investigation."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT e.*, u.full_name, u.email
               FROM investigation_events e
               LEFT JOIN users u ON e.user_id = u.id
               WHERE e.investigation_id = ?
               ORDER BY e.timestamp ASC""",
            (inv_id,),
        ).fetchall()
        return [dict(r) for r in rows]


# ─── Evidence Files ───

def save_evidence_metadata(
    project_id: str,
    uploaded_by: int,
    filename: str,
    original_name: str,
    file_type: str = None,
    file_size: int = None,
    geo_lat: float = None,
    geo_lng: float = None,
    timestamp_taken: str = None,
    notes: str = None,
    investigation_id: int = None,
    inspection_id: int = None,
) -> dict:
    """Save evidence file metadata."""
    now = time.time()

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO evidence_files
               (investigation_id, inspection_id, project_id, uploaded_by,
                filename, original_name, file_type, file_size,
                geo_lat, geo_lng, timestamp_taken, notes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (investigation_id, inspection_id, project_id, uploaded_by,
             filename, original_name, file_type, file_size,
             geo_lat, geo_lng, timestamp_taken, notes, now),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "filename": filename}


def get_evidence_by_project(project_id: str) -> list:
    """Fetch evidence files for a project."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT e.*, u.full_name AS uploader_name
               FROM evidence_files e
               LEFT JOIN users u ON e.uploaded_by = u.id
               WHERE e.project_id = ?
               ORDER BY e.created_at DESC""",
            (project_id,),
        ).fetchall()
        return [dict(r) for r in rows]

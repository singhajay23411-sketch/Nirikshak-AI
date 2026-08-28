"""
Nirikshak AI — Auth Database Layer
====================================
SQLite database for user authentication, audit logs, and inspection records.
Auto-seeds official demo accounts on first run.
"""

import sqlite3
import os
import time
import logging
from contextlib import contextmanager

from .models import DEMO_USERS, ROLE_PERMISSIONS, ROLE_SCOPE, RoleCode
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
    role            TEXT NOT NULL DEFAULT 'VIEWER',
    state           TEXT,
    district        TEXT,
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
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
                        state, district, project_ids, is_active, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
                    (
                        user["email"],
                        user["username"],
                        user["full_name"],
                        pw_hash,
                        user["role"],
                        user.get("state"),
                        user.get("district"),
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
            "project_ids, is_active, created_at, last_login FROM users "
            "ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def create_user(email: str, username: str, full_name: str, password: str,
                role: str, state: str = None, district: str = None,
                project_ids: str = None) -> dict:
    """Create a new user. Returns the created user dict."""
    pw_hash = hash_password(password)
    now = time.time()

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO users
               (email, username, full_name, password_hash, role,
                state, district, project_ids, is_active, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            (email, username, full_name, pw_hash, role,
             state, district, project_ids, now),
        )
        conn.commit()
        return get_user_by_id(cursor.lastrowid)


def update_user(user_id: int, **kwargs) -> dict:
    """Update user fields. Supports: full_name, role, state, district,
    project_ids, is_active."""
    allowed = {"full_name", "role", "state", "district", "project_ids", "is_active"}
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


def get_audit_logs(limit: int = 100) -> list:
    """Fetch recent audit logs."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT a.*, u.full_name, u.email FROM audit_logs a "
            "LEFT JOIN users u ON a.user_id = u.id "
            "ORDER BY a.timestamp DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]

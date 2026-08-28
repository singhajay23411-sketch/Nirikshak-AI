"""
Nirikshak AI — Security Module
================================
Password hashing (Argon2id primary, bcrypt fallback), JWT token management,
and permission verification utilities.

SECURITY POLICY:
- Argon2id is the PRIMARY password hashing algorithm.
- bcrypt is the FALLBACK if argon2-cffi is unavailable.
- Plaintext passwords are NEVER stored or logged.
- All auth/authorization is enforced server-side.
"""

import hashlib
import hmac
import base64
import json
import time
import secrets
import os
import logging

log = logging.getLogger("nirikshak.auth.security")

# ─── JWT Configuration ───

JWT_SECRET = os.environ.get("NIRIKSHAK_JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_SECONDS = int(os.environ.get("NIRIKSHAK_JWT_EXPIRY", 86400))  # 24 hours


# ─── Password Hashing — Argon2id (primary), bcrypt (fallback) ───

_hasher = None
_hash_scheme = None

def _init_hasher():
    """Initialize the password hasher. Prefer Argon2id, fall back to bcrypt."""
    global _hasher, _hash_scheme

    if _hasher is not None:
        return

    # Try Argon2id first
    try:
        from argon2 import PasswordHasher, Type as Argon2Type
        from argon2.exceptions import VerifyMismatchError
        _hasher = PasswordHasher(
            time_cost=3,
            memory_cost=65536,
            parallelism=4,
            hash_len=32,
            salt_len=16,
            type=Argon2Type.ID,
        )
        _hash_scheme = "argon2id"
        log.info("Password hashing: Argon2id initialized (primary)")
        return
    except ImportError:
        log.warning("argon2-cffi not available, trying bcrypt fallback...")

    # Fallback to bcrypt
    try:
        import bcrypt as _bcrypt_mod
        _hasher = _bcrypt_mod
        _hash_scheme = "bcrypt"
        log.info("Password hashing: bcrypt initialized (fallback)")
        return
    except ImportError:
        log.error("Neither argon2-cffi nor bcrypt is available!")
        raise RuntimeError(
            "No secure password hashing library available. "
            "Install argon2-cffi (recommended) or bcrypt: "
            "pip install argon2-cffi bcrypt"
        )


def hash_password(plaintext: str) -> str:
    """Hash a plaintext password using Argon2id (preferred) or bcrypt (fallback).
    Never stores or logs plaintext passwords."""
    _init_hasher()

    if _hash_scheme == "argon2id":
        return _hasher.hash(plaintext)
    elif _hash_scheme == "bcrypt":
        salt = _hasher.gensalt(rounds=12)
        return _hasher.hashpw(plaintext.encode("utf-8"), salt).decode("utf-8")
    else:
        raise RuntimeError("No password hasher configured")


def verify_password(plaintext: str, hashed: str) -> bool:
    """Verify a plaintext password against a stored hash.
    Supports both Argon2id and bcrypt hashes for migration compatibility."""
    _init_hasher()

    try:
        if _hash_scheme == "argon2id":
            return _hasher.verify(hashed, plaintext)
        elif _hash_scheme == "bcrypt":
            return _hasher.checkpw(
                plaintext.encode("utf-8"),
                hashed.encode("utf-8")
            )
    except Exception:
        return False

    return False


def needs_rehash(hashed: str) -> bool:
    """Check if a hash should be rehashed (e.g. cost parameters changed)."""
    _init_hasher()
    if _hash_scheme == "argon2id":
        try:
            return _hasher.check_needs_rehash(hashed)
        except Exception:
            return False
    return False


# ─── JWT Token Management ───

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_jwt(payload: dict, expiry_seconds: int = None) -> str:
    """Create a signed JWT token with HMAC-SHA256."""
    if expiry_seconds is None:
        expiry_seconds = JWT_EXPIRY_SECONDS

    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    now = int(time.time())
    payload = {
        **payload,
        "iat": now,
        "exp": now + expiry_seconds,
        "jti": secrets.token_hex(16),
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256
    ).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_jwt(token: str) -> dict:
    """Verify a JWT token signature and expiry. Returns payload dict or raises ValueError."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    header_b64, payload_b64, signature_b64 = parts

    # Verify signature
    signing_input = f"{header_b64}.{payload_b64}"
    expected_sig = hmac.new(
        JWT_SECRET.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256
    ).digest()
    actual_sig = _b64url_decode(signature_b64)

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise ValueError("Invalid token signature")

    # Decode payload
    payload = json.loads(_b64url_decode(payload_b64))

    # Check expiry
    exp = payload.get("exp", 0)
    if time.time() > exp:
        raise ValueError("Token has expired")

    return payload


# ─── Permission Checking ───

def check_permission(user_permissions: list, required: str) -> bool:
    """Check if a user has a specific permission."""
    if not required:
        return True
    # Wildcard check (e.g. "projects.*" covers "projects.view")
    for perm in user_permissions:
        if perm == required:
            return True
        if perm.endswith(".*"):
            prefix = perm[:-2]
            if required.startswith(prefix + "."):
                return True
    return False


def check_scope(user_scope: dict, target_state: str = None, target_district: str = None) -> bool:
    """Check if a user's geographic scope allows access to a target location."""
    scope_type = user_scope.get("type", "NATIONAL")

    if scope_type == "NATIONAL":
        return True
    elif scope_type == "STATE":
        if target_state and user_scope.get("state"):
            return target_state.lower() == user_scope["state"].lower()
        return True  # If no target specified, allow
    elif scope_type == "DISTRICT":
        state_match = True
        district_match = True
        if target_state and user_scope.get("state"):
            state_match = target_state.lower() == user_scope["state"].lower()
        if target_district and user_scope.get("district"):
            district_match = target_district.lower() == user_scope["district"].lower()
        return state_match and district_match
    elif scope_type == "PROJECT":
        return True  # Project-level scoping is handled at query level

    return False

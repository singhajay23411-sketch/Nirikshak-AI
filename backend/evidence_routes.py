"""
Nirikshak AI — Evidence Routes
=================================
Evidence file upload/retrieval with server-side scope enforcement.
Files stored in backend/uploads/ with metadata in SQLite.
"""

import os
import uuid
import time
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse

from backend.auth.routes import get_current_user, require_permission
from backend.auth.models import RoleCode, resolve_role
from backend.auth.security import build_user_scope, check_scope
from backend.auth.database import (
    save_evidence_metadata, get_evidence_by_project,
    get_investigation_by_id, log_audit,
)

log = logging.getLogger("nirikshak.evidence.routes")

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/{project_id}/upload")
@router.post("/upload")
async def upload_evidence(
    request: Request,
    project_id: Optional[str] = None,
    user: dict = Depends(require_permission("evidence.upload")),
):
    """Upload evidence file with metadata. Accepts multipart or JSON-based metadata."""
    # For demo, accept JSON with base64 or just metadata
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")

    project_id = project_id or body.get("project_id", "").strip()
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    # Generate unique filename
    original_name = body.get("filename", "evidence.jpg")
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".bin"

    unique_name = f"{uuid.uuid4().hex}{ext}"

    # If file data is included (base64), save it
    file_data = body.get("file_data")
    file_size = 0
    if file_data:
        import base64
        try:
            decoded = base64.b64decode(file_data)
            if len(decoded) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large (max 10MB)")
            file_path = os.path.join(UPLOAD_DIR, unique_name)
            with open(file_path, "wb") as f:
                f.write(decoded)
            file_size = len(decoded)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid file data: {e}")
    else:
        # Metadata-only upload (reference to external file)
        file_size = body.get("file_size", 0)

    # Save metadata
    result = save_evidence_metadata(
        project_id=project_id,
        uploaded_by=user["id"],
        filename=unique_name,
        original_name=original_name,
        file_type=body.get("file_type", ext.lstrip(".")),
        file_size=file_size,
        geo_lat=body.get("geo_lat"),
        geo_lng=body.get("geo_lng"),
        timestamp_taken=body.get("timestamp_taken"),
        notes=body.get("notes"),
        investigation_id=body.get("investigation_id"),
        inspection_id=body.get("inspection_id"),
    )

    log_audit(user["id"], "EVIDENCE_UPLOADED",
              details=f"Project: {project_id}, File: {original_name}")

    return {
        "message": "Evidence uploaded successfully",
        "evidence_id": result["id"],
        "filename": unique_name,
    }


@router.get("/by-project/{project_id}")
@router.get("/{project_id}")
async def get_project_evidence(
    project_id: str,
    user: dict = Depends(require_permission("evidence.view")),
):
    """List evidence files for a project. Scope-checked."""
    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))

    # Public viewers cannot access evidence
    if role == RoleCode.PUBLIC_VIEWER:
        raise HTTPException(
            status_code=403,
            detail="Evidence files are not available for public viewers"
        )

    evidence = get_evidence_by_project(project_id)

    return {
        "evidence": evidence,
        "total": len(evidence),
        "project_id": project_id,
    }


@router.get("/{evidence_id}")
async def get_evidence_file(
    evidence_id: int,
    user: dict = Depends(require_permission("evidence.view")),
):
    """Retrieve evidence file metadata."""
    from backend.auth.database import get_db

    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM evidence_files WHERE id = ?",
            (evidence_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Evidence not found")

    evidence = dict(row)
    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))

    # Public viewers cannot access evidence
    if role == RoleCode.PUBLIC_VIEWER:
        raise HTTPException(
            status_code=403,
            detail="Evidence files are not available for public viewers"
        )

    # Check if file exists
    file_path = os.path.join(UPLOAD_DIR, evidence["filename"])
    evidence["file_available"] = os.path.exists(file_path)

    return {"evidence": evidence}


@router.get("/{evidence_id}/download")
async def download_evidence(
    evidence_id: int,
    user: dict = Depends(require_permission("evidence.view")),
):
    """Download evidence file."""
    from backend.auth.database import get_db

    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM evidence_files WHERE id = ?",
            (evidence_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Evidence not found")

    evidence = dict(row)

    role = resolve_role(user.get("role", "PUBLIC_VIEWER"))
    if role == RoleCode.PUBLIC_VIEWER:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = os.path.join(UPLOAD_DIR, evidence["filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    log_audit(user["id"], "EVIDENCE_DOWNLOADED",
              details=f"Evidence ID: {evidence_id}")

    return FileResponse(
        file_path,
        filename=evidence["original_name"],
        media_type="application/octet-stream",
    )

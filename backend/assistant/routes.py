"""
Nirikshak AI — Assistant API Routes
=======================================
FastAPI router for the Decision Support Assistant.
POST /api/assistant/query

Uses existing auth system. Anonymous users get glossary/help only.
Authenticated users get full data access scoped by role.
"""

import time
import logging
from typing import Optional, Dict
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse

from backend.assistant.schemas import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ErrorResponse,
)
from backend.assistant.intent_router import classify_intent, Intent
from backend.assistant.entity_resolver import (
    resolve_entities, get_session, ResolvedEntities,
)
from backend.assistant.query_handlers import handle_query
from backend.assistant.data_repository import get_repository
from backend.assistant.llm_adapter import is_llm_enabled, enhance_response
from backend.assistant.glossary import find_glossary_entry

log = logging.getLogger("nirikshak.assistant.routes")

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


# ─── Rate Limiting (simple in-memory) ────────────────────────────────────────

_rate_store: Dict[str, list] = defaultdict(list)
RATE_LIMIT_WINDOW = 60   # seconds
RATE_LIMIT_MAX = 30       # requests per window


def _check_rate_limit(client_id: str) -> bool:
    """Return True if within rate limit."""
    now = time.time()
    _rate_store[client_id] = [
        t for t in _rate_store[client_id]
        if now - t < RATE_LIMIT_WINDOW
    ]
    if len(_rate_store[client_id]) >= RATE_LIMIT_MAX:
        return False
    _rate_store[client_id].append(now)
    return True


# ─── Auth Helper (optional — allows anonymous for help/glossary) ──────────

async def _get_optional_user(request: Request) -> Optional[Dict]:
    """Try to extract authenticated user, return None if unauthenticated."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]
    try:
        from backend.auth.security import verify_jwt
        from backend.auth.database import get_user_by_id
        payload = verify_jwt(token)
        user_id = payload.get("user_id")
        if user_id:
            user = get_user_by_id(user_id)
            if user and user.get("is_active"):
                return user
    except Exception:
        pass
    return None


# Intents allowed for anonymous users
ANONYMOUS_INTENTS = {
    Intent.HELP,
    Intent.DEFINITION,
    Intent.UNKNOWN,
}


# ─── Main Query Endpoint ────────────────────────────────────────────────────

@router.post("/query", response_model=AssistantQueryResponse)
async def assistant_query(request: Request):
    """
    Process a natural-language query against precomputed analytics.
    
    Anonymous: help & glossary only.
    Authenticated: all intents, scoped by role.
    """
    # Parse request body
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")

    try:
        query = AssistantQueryRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before sending more requests.")

    # Auth (optional)
    user = await _get_optional_user(request)
    is_authenticated = user is not None

    # Get repository
    repo = get_repository()

    # Classify intent
    t0 = time.time()
    intent = classify_intent(query.message)

    # Access control: restrict anonymous users
    if not is_authenticated and intent not in ANONYMOUS_INTENTS:
        return AssistantQueryResponse(
            status="success",
            intent=intent,
            answer=(
                "This query requires authentication. Please log in to access "
                "detailed project, MP, constituency, and anomaly information.\n\n"
                "As a guest, I can help with:\n"
                "• Platform explanations — \"What can you help me with?\"\n"
                "• Glossary questions — \"What does HHI mean?\"\n"
                "• General information about Nirikshak AI"
            ),
            suggestions=[
                "What can you help me with?",
                "What does risk score mean?",
                "What is HHI?",
            ],
        )

    # Resolve entities
    context_dict = query.context.dict() if query.context else None
    session = get_session(query.conversation_id)

    entities = resolve_entities(
        message=query.message,
        intent=intent,
        repo=repo,
        context=context_dict,
        session=session,
    )

    # Check clarification needed
    if entities.clarification_needed:
        return AssistantQueryResponse(
            status="success",
            intent=intent,
            answer=(
                f"I found multiple matches. Please select one:\n\n"
                + "\n".join(f"• {opt}" for opt in entities.clarification_options[:5])
            ),
            clarification={
                "type": entities.clarification_type,
                "options": entities.clarification_options[:5],
            },
            suggestions=entities.clarification_options[:3],
        )

    # Execute query handler
    response = handle_query(
        intent=intent,
        message=query.message,
        entities=entities,
        repo=repo,
        context=context_dict,
    )

    # Optional LLM enhancement
    if is_llm_enabled() and response.status == "success":
        evidence_dict = {
            "items": [e.dict() for e in response.evidence[:10]],
        }
        enhanced = enhance_response(
            user_question=query.message,
            intent=intent,
            evidence_package=evidence_dict,
            deterministic_answer=response.answer,
        )
        if enhanced:
            response.answer = enhanced

    # Update session context
    session.update(entities.to_dict(), intent)
    if response.related_records:
        session.last_results = response.related_records[:5]

    elapsed_ms = (time.time() - t0) * 1000
    log.info(
        f"Query processed: intent={intent}, "
        f"entities={list(entities.to_dict().keys())}, "
        f"elapsed={elapsed_ms:.0f}ms"
    )

    return response


# ─── Health/Status Endpoint ──────────────────────────────────────────────────

@router.get("/status")
async def assistant_status():
    """Return assistant loading status (admin diagnostics)."""
    repo = get_repository()
    status = repo.get_loading_status()
    return {
        "status": "ok",
        "assistant_mode": "deterministic" if not is_llm_enabled() else "llm",
        "artifacts_loaded": len(status["loaded"]),
        "artifacts": status["loaded"],
        "errors": list(status["errors"].keys()),
        "snapshot": repo.get_snapshot_info(),
    }


@router.post("/refresh")
async def assistant_refresh(request: Request):
    """Refresh artifact cache (requires auth)."""
    user = await _get_optional_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if user.get("role") not in ("ADMIN", "MOSPI_OFFICER"):
        raise HTTPException(status_code=403, detail="Admin access required")

    repo = get_repository()
    repo.refresh()
    return {"status": "ok", "message": "Artifact cache refreshed"}

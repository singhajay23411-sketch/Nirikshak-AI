"""
Nirikshak AI — FastAPI Server
===============================
Main application entrypoint with CORS, auth routes, and database initialization.

Usage:
    python -m backend.server
    # or
    uvicorn backend.server:app --reload --port 8000
"""

import logging
import os
import sys

# Ensure backend package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth.routes import router as auth_router
from backend.auth.database import init_database

# ─── Logging Setup ───

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("nirikshak.server")


# ─── FastAPI Application ───

app = FastAPI(
    title="Nirikshak AI — MPLADS Risk Intelligence API",
    description="Authentication, RBAC, and Risk Intelligence API for Nirikshak AI",
    version="1.0.0",
)


# ─── CORS (allow frontend dev server) ───

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Include Routers ───

app.include_router(auth_router)


# ─── Startup Event ───

@app.on_event("startup")
async def startup():
    log.info("═══════════════════════════════════════════════")
    log.info("  NIRIKSHAK AI — Backend Server Starting")
    log.info("═══════════════════════════════════════════════")
    init_database()
    log.info("Auth database initialized. Server ready.")


# ─── Health Check ───

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Nirikshak AI API"}


# ─── Entry Point ───

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

"""
Nirikshak AI — Artifact Registry
====================================
Explicit allowlist of permitted precomputed data artifacts.
Rejects path traversal and unknown artifact names.
"""

import os
import logging
from typing import Dict, List, Optional

log = logging.getLogger("nirikshak.assistant.registry")


# ─── Data directory configuration ────────────────────────────────────────────

def get_data_dir() -> str:
    """
    Resolve the data directory from environment variable or safe fallback.
    Never hardcodes a single OS path. Supports OCI Linux and local environments.
    """
    env_dir = os.environ.get("NIRIKSHAK_DATA_DIR")
    if env_dir and os.path.isdir(env_dir):
        return os.path.abspath(env_dir)

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    
    candidates = [
        os.path.join(project_root, "frontend", "public", "data"),
        os.path.join(project_root, "frontend", "data"),
        os.path.join(project_root, "data", "live_exports"),
        os.path.join(project_root, "data"),
        "/var/www/nirikshak/frontend/data",
        "/var/www/nirikshak/frontend/public/data",
        "/var/www/nirikshak/data/live_exports",
        "/var/www/nirikshak/data",
    ]

    for cand in candidates:
        if os.path.isdir(cand) and os.path.isfile(os.path.join(cand, "real_projects.json")):
            return os.path.abspath(cand)

    for cand in candidates:
        if os.path.isdir(cand):
            return os.path.abspath(cand)

    fallback = os.path.join(project_root, "frontend", "public", "data")
    log.warning(f"No fully matched data directory found. Using {fallback}")
    return fallback


# ─── Artifact Registration ───────────────────────────────────────────────────

class ArtifactSpec:
    """Specification for a single precomputed artifact."""

    def __init__(
        self,
        safe_name: str,
        filename: str,
        id_fields: List[str],
        supported_intents: List[str],
        source_label: str,
        required: bool = False,
        is_geojson: bool = False,
    ):
        self.safe_name = safe_name
        self.filename = filename
        self.id_fields = id_fields
        self.supported_intents = supported_intents
        self.source_label = source_label
        self.required = required
        self.is_geojson = is_geojson


# ─── Master Artifact Registry ───────────────────────────────────────────────

ARTIFACT_REGISTRY: Dict[str, ArtifactSpec] = {}


def _register(spec: ArtifactSpec):
    ARTIFACT_REGISTRY[spec.safe_name] = spec


_register(ArtifactSpec(
    safe_name="unified_evaluations",
    filename="unified_project_evaluations.json",
    id_fields=["work_id", "mp_id", "constituency_id", "state_id"],
    supported_intents=[
        "explain_project_risk", "find_high_risk",
    ],
    source_label="Unified Project Risk Evaluations",
    required=True,
))

_register(ArtifactSpec(
    safe_name="cost_delay_anomalies",
    filename="cost_and_delay_anomalies.json",
    id_fields=["work_id"],
    supported_intents=[
        "cost_delay_anomalies", "explain_project_risk",
    ],
    source_label="Cost & Delay Anomalies",
    required=True,
))

_register(ArtifactSpec(
    safe_name="duplicate_alerts",
    filename="duplicate_project_alerts.json",
    id_fields=["work_id_A", "work_id_B"],
    supported_intents=[
        "duplicate_alerts", "explain_project_risk",
    ],
    source_label="Duplicate Project Alerts",
    required=True,
))

_register(ArtifactSpec(
    safe_name="mp_scorecards",
    filename="mp_scorecard_summary.json",
    id_fields=["mp_id", "mp_name"],
    supported_intents=[
        "mp_scorecard", "compare_mps",
    ],
    source_label="MP Scorecard Summary",
    required=True,
))

_register(ArtifactSpec(
    safe_name="constituency_risk",
    filename="constituency_risk_heatmap.json",
    id_fields=["constituency_id", "const_name"],
    supported_intents=[
        "constituency_risk",
    ],
    source_label="Constituency Risk Heatmap",
))

_register(ArtifactSpec(
    safe_name="constituency_hhi",
    filename="constituency_hhi.json",
    id_fields=["constituency_id", "constituency_name"],
    supported_intents=[
        "vendor_concentration", "constituency_risk",
    ],
    source_label="Constituency HHI (Vendor Concentration)",
))

_register(ArtifactSpec(
    safe_name="vendor_risk_network",
    filename="vendor_risk_network.json",
    id_fields=["vendor_name"],
    supported_intents=[
        "vendor_concentration",
    ],
    source_label="Vendor Risk Network",
))

_register(ArtifactSpec(
    safe_name="vendor_cartel_groups",
    filename="vendor_cartel_groups.json",
    id_fields=["cartel_id"],
    supported_intents=[
        "vendor_concentration",
    ],
    source_label="Vendor Network Groups",
))

_register(ArtifactSpec(
    safe_name="finguard_anomalies",
    filename="finguard_anomalies.json",
    id_fields=["work_id"],
    supported_intents=[
        "cost_delay_anomalies", "explain_project_risk",
    ],
    source_label="FinGuard Financial Anomalies",
))

_register(ArtifactSpec(
    safe_name="finguard_constituency",
    filename="finguard_constituency_summary.json",
    id_fields=["constituency_id", "const_name"],
    supported_intents=[
        "constituency_risk",
    ],
    source_label="FinGuard Constituency Summary",
))

_register(ArtifactSpec(
    safe_name="geointel_heatmap",
    filename="geointel_heatmap.geojson",
    id_fields=["constituency_id", "const_name"],
    supported_intents=[
        "geospatial_intel", "constituency_risk",
    ],
    source_label="Geospatial Intelligence Heatmap",
    is_geojson=True,
))

_register(ArtifactSpec(
    safe_name="real_projects",
    filename="real_projects.json",
    id_fields=["id"],
    supported_intents=[
        "explain_project_risk", "find_high_risk",
    ],
    source_label="MPLADS Projects Database",
))

_register(ArtifactSpec(
    safe_name="export_manifest",
    filename="export_manifest.json",
    id_fields=[],
    supported_intents=[],
    source_label="Export Manifest",
    required=True,
))


# ─── Safe Path Resolution ───────────────────────────────────────────────────

def resolve_artifact_path(safe_name: str, data_dir: Optional[str] = None) -> Optional[str]:
    """
    Resolve a safe artifact name to its absolute file path.
    Rejects path traversal and unknown artifact names.
    """
    if safe_name not in ARTIFACT_REGISTRY:
        log.warning(f"Unknown artifact name rejected: {safe_name}")
        return None

    spec = ARTIFACT_REGISTRY[safe_name]
    base_dir = data_dir or get_data_dir()
    base_dir = os.path.abspath(base_dir)

    # Build path and resolve
    candidate = os.path.abspath(os.path.join(base_dir, spec.filename))

    # Path traversal prevention: ensure resolved path is within the base dir
    if not candidate.startswith(base_dir):
        log.warning(f"Path traversal attempt blocked for artifact: {safe_name}")
        return None

    if os.path.isfile(candidate):
        return candidate

    # Search in all known fallback locations if not in primary base_dir
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    alt_dirs = [
        os.path.join(project_root, "frontend", "public", "data"),
        os.path.join(project_root, "frontend", "data"),
        os.path.join(project_root, "data", "live_exports"),
        os.path.join(project_root, "data"),
        "/var/www/nirikshak/frontend/data",
        "/var/www/nirikshak/frontend/public/data",
        "/var/www/nirikshak/data/live_exports",
        "/var/www/nirikshak/data",
    ]
    for alt in alt_dirs:
        alt_cand = os.path.abspath(os.path.join(alt, spec.filename))
        if os.path.isfile(alt_cand):
            return alt_cand

    return None


def get_available_artifacts(data_dir: Optional[str] = None) -> Dict[str, str]:
    """
    Return a dict of {safe_name: absolute_path} for all artifacts that exist.
    """
    available = {}
    for safe_name in ARTIFACT_REGISTRY:
        path = resolve_artifact_path(safe_name, data_dir)
        if path:
            available[safe_name] = path
    return available


def get_intents_for_artifact(safe_name: str) -> List[str]:
    """Return the supported intents for an artifact."""
    spec = ARTIFACT_REGISTRY.get(safe_name)
    return spec.supported_intents if spec else []

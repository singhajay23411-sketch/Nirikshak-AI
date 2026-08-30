"""
Nirikshak AI — Build Assistant Index & Manifest
===================================================
Generates compact search indexes and artifact manifest from precomputed
JSON/GeoJSON files. Derived exclusively from precomputed artifacts.
Never connects to PostgreSQL or executes SQL.

Output artifacts:
- assistant_search_index.json
- assistant_manifest.json
"""

import os
import sys
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Set
from collections import defaultdict

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.assistant.artifact_registry import ARTIFACT_REGISTRY, get_data_dir, resolve_artifact_path
from backend.assistant.normalizer import normalize_name, normalize_state, normalize_text


INDEX_VERSION = "1.0.0"


def compute_file_hash(filepath: str) -> str:
    """Compute deterministic SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def build_assistant_indexes(data_dir: str = None, output_dir: str = None) -> Dict[str, Any]:
    """
    Read all precomputed artifacts, validate schemas, and build deterministic indexes.
    """
    target_data_dir = data_dir or get_data_dir()
    out_dir = output_dir or target_data_dir

    print(f"[*] Reading precomputed artifacts from: {target_data_dir}")
    print(f"[*] Output directory: {out_dir}")

    # Track manifest metadata
    source_hashes = {}
    source_counts = {}
    total_records = 0

    # Entity Indexes
    work_id_to_origin = {}
    mp_index = {}
    state_index = defaultdict(list)
    constituency_index = defaultdict(list)
    vendor_index = defaultdict(list)
    risk_level_index = defaultdict(list)
    category_index = defaultdict(list)

    # 1. Process Unified Project Evaluations
    upe_path = resolve_artifact_path("unified_evaluations", target_data_dir)
    if upe_path and os.path.exists(upe_path):
        source_hashes["unified_project_evaluations.json"] = compute_file_hash(upe_path)
        with open(upe_path, "r", encoding="utf-8") as f:
            upe_data = json.load(f)
        source_counts["unified_project_evaluations.json"] = len(upe_data)
        total_records += len(upe_data)

        for rec in upe_data:
            wid = str(rec.get("work_id", "")).strip()
            if wid:
                work_id_to_origin[wid] = {
                    "origin": "unified_project_evaluations.json",
                    "title": (rec.get("work_description") or rec.get("activity_name") or "")[:120],
                    "state": rec.get("state_name"),
                    "constituency": rec.get("const_name"),
                    "mp_id": rec.get("mp_id"),
                    "mp_name": rec.get("mp_name"),
                    "is_high_risk": bool(rec.get("is_high_risk")),
                    "is_anomaly": bool(rec.get("is_anomaly")),
                    "agency_risk_tier": rec.get("agency_risk_tier"),
                    "category": rec.get("work_category"),
                }

                # Risk level categorization
                if rec.get("is_high_risk"):
                    risk_level_index["HIGH"].append(wid)
                elif rec.get("agency_risk_tier") == "CRITICAL":
                    risk_level_index["CRITICAL"].append(wid)
                elif rec.get("agency_risk_tier") == "MODERATE":
                    risk_level_index["MODERATE"].append(wid)
                else:
                    risk_level_index["LOW"].append(wid)

                # Categories
                cat = rec.get("work_category")
                if cat:
                    category_index[cat].append(wid)

                # States & Constituencies
                st = rec.get("state_name")
                if st:
                    state_index[st].append(wid)
                cn = rec.get("const_name")
                if cn:
                    constituency_index[cn].append(wid)

                # Vendors
                vn = rec.get("primary_vendor_name")
                if vn:
                    vendor_index[vn].append(wid)

    # 2. Process Cost and Delay Anomalies
    cda_path = resolve_artifact_path("cost_delay_anomalies", target_data_dir)
    if cda_path and os.path.exists(cda_path):
        source_hashes["cost_and_delay_anomalies.json"] = compute_file_hash(cda_path)
        with open(cda_path, "r", encoding="utf-8") as f:
            cda_data = json.load(f)
        source_counts["cost_and_delay_anomalies.json"] = len(cda_data)
        total_records += len(cda_data)

        for rec in cda_data:
            wid = str(rec.get("work_id", "")).strip()
            if wid and wid not in work_id_to_origin:
                work_id_to_origin[wid] = {
                    "origin": "cost_and_delay_anomalies.json",
                    "title": (rec.get("work_description") or "")[:120],
                    "state": rec.get("state_name"),
                    "constituency": rec.get("const_name"),
                    "mp_name": rec.get("mp_name"),
                    "severity_score": rec.get("severity_score"),
                }

    # 3. Process MP Scorecard Summary
    mps_path = resolve_artifact_path("mp_scorecards", target_data_dir)
    if mps_path and os.path.exists(mps_path):
        source_hashes["mp_scorecard_summary.json"] = compute_file_hash(mps_path)
        with open(mps_path, "r", encoding="utf-8") as f:
            mps_data = json.load(f)
        source_counts["mp_scorecard_summary.json"] = len(mps_data)
        total_records += len(mps_data)

        for rec in mps_data:
            mp_id = str(rec.get("mp_id", "")).strip()
            mp_name = rec.get("mp_name", "").strip()
            if mp_id or mp_name:
                norm_name = normalize_name(mp_name)
                mp_index[norm_name] = {
                    "mp_id": rec.get("mp_id"),
                    "mp_name": mp_name,
                    "state_name": rec.get("state_name"),
                    "const_name": rec.get("const_name"),
                    "total_works": rec.get("total_works", 0),
                    "composite_integrity_score": rec.get("composite_integrity_score"),
                    "origin": "mp_scorecard_summary.json",
                }

    # 4. Process Real Projects (MPLADS formatted IDs)
    rp_path = resolve_artifact_path("real_projects", target_data_dir)
    if rp_path and os.path.exists(rp_path):
        source_hashes["real_projects.json"] = compute_file_hash(rp_path)
        with open(rp_path, "r", encoding="utf-8") as f:
            rp_data = json.load(f)
        source_counts["real_projects.json"] = len(rp_data)
        total_records += len(rp_data)

        for rec in rp_data:
            pid = str(rec.get("id", "")).strip()
            if pid:
                work_id_to_origin[pid] = {
                    "origin": "real_projects.json",
                    "title": rec.get("title", "")[:120],
                    "state": rec.get("state"),
                    "constituency": rec.get("constituency"),
                    "category": rec.get("category"),
                    "cost": rec.get("cost"),
                    "status": rec.get("status"),
                }

    # 5. Process Duplicate Project Alerts
    dpa_path = resolve_artifact_path("duplicate_alerts", target_data_dir)
    if dpa_path and os.path.exists(dpa_path):
        source_hashes["duplicate_project_alerts.json"] = compute_file_hash(dpa_path)
        with open(dpa_path, "r", encoding="utf-8") as f:
            dpa_data = json.load(f)
        source_counts["duplicate_project_alerts.json"] = len(dpa_data)
        total_records += len(dpa_data)

    # 6. Process Constituency Risk Heatmap
    crh_path = resolve_artifact_path("constituency_risk", target_data_dir)
    if crh_path and os.path.exists(crh_path):
        source_hashes["constituency_risk_heatmap.json"] = compute_file_hash(crh_path)
        with open(crh_path, "r", encoding="utf-8") as f:
            crh_data = json.load(f)
        source_counts["constituency_risk_heatmap.json"] = len(crh_data)
        total_records += len(crh_data)

    # 7. Process Constituency HHI
    hhi_path = resolve_artifact_path("constituency_hhi", target_data_dir)
    if hhi_path and os.path.exists(hhi_path):
        source_hashes["constituency_hhi.json"] = compute_file_hash(hhi_path)
        with open(hhi_path, "r", encoding="utf-8") as f:
            hhi_data = json.load(f)
        source_counts["constituency_hhi.json"] = len(hhi_data)
        total_records += len(hhi_data)

    # 8. Process Vendor Risk Network
    vrn_path = resolve_artifact_path("vendor_risk_network", target_data_dir)
    if vrn_path and os.path.exists(vrn_path):
        source_hashes["vendor_risk_network.json"] = compute_file_hash(vrn_path)
        with open(vrn_path, "r", encoding="utf-8") as f:
            vrn_data = json.load(f)
        source_counts["vendor_risk_network.json"] = len(vrn_data)
        total_records += len(vrn_data)

    # 9. Process FinGuard Anomalies
    fga_path = resolve_artifact_path("finguard_anomalies", target_data_dir)
    if fga_path and os.path.exists(fga_path):
        source_hashes["finguard_anomalies.json"] = compute_file_hash(fga_path)
        with open(fga_path, "r", encoding="utf-8") as f:
            fga_data = json.load(f)
        source_counts["finguard_anomalies.json"] = len(fga_data)
        total_records += len(fga_data)

    # 10. Process GeoIntel Heatmap
    geo_path = resolve_artifact_path("geointel_heatmap", target_data_dir)
    if geo_path and os.path.exists(geo_path):
        source_hashes["geointel_heatmap.geojson"] = compute_file_hash(geo_path)
        with open(geo_path, "r", encoding="utf-8") as f:
            geo_data = json.load(f)
        features = geo_data.get("features", []) if isinstance(geo_data, dict) else []
        source_counts["geointel_heatmap.geojson"] = len(features)
        total_records += len(features)

    # Build Search Index
    search_index = {
        "index_version": INDEX_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_works_indexed": len(work_id_to_origin),
        "total_mps_indexed": len(mp_index),
        "total_states_indexed": len(state_index),
        "total_constituencies_indexed": len(constituency_index),
        "works": work_id_to_origin,
        "mps": mp_index,
        "states": {k: sorted(list(set(v))) for k, v in sorted(state_index.items())},
        "constituencies": {k: sorted(list(set(v))) for k, v in sorted(constituency_index.items())},
        "categories": {k: sorted(list(set(v))) for k, v in sorted(category_index.items())},
        "risk_levels": {k: sorted(list(set(v))) for k, v in sorted(risk_level_index.items())},
    }

    # Build Assistant Manifest
    manifest = {
        "index_version": INDEX_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_artifact_hashes": source_hashes,
        "source_record_counts": source_counts,
        "total_records_analyzed": total_records,
        "total_works_indexed": len(work_id_to_origin),
        "total_mps_indexed": len(mp_index),
    }

    # Write files deterministically
    search_index_file = os.path.join(out_dir, "assistant_search_index.json")
    manifest_file = os.path.join(out_dir, "assistant_manifest.json")

    with open(search_index_file, "w", encoding="utf-8") as f:
        json.dump(search_index, f, indent=2, sort_keys=True)

    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)

    print(f"[OK] Generated assistant search index: {search_index_file} ({len(work_id_to_origin)} works, {len(mp_index)} MPs)")
    print(f"[OK] Generated assistant manifest: {manifest_file} ({len(source_hashes)} artifacts tracked)")

    return {
        "search_index": search_index,
        "manifest": manifest,
    }


if __name__ == "__main__":
    data_dir_arg = sys.argv[1] if len(sys.argv) > 1 else None
    out_dir_arg = sys.argv[2] if len(sys.argv) > 2 else None
    build_assistant_indexes(data_dir=data_dir_arg, output_dir=out_dir_arg)

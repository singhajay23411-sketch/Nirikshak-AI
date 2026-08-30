"""
Nirikshak AI — Data Repository
==================================
Lazy-loads, caches, and indexes precomputed analytics artifacts.
No database connections, no heavy ML models.
"""

import json
import os
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict

from backend.assistant.artifact_registry import (
    ARTIFACT_REGISTRY, get_data_dir, resolve_artifact_path,
)
from backend.assistant.normalizer import normalize_name, normalize_text

log = logging.getLogger("nirikshak.assistant.repository")


class DataRepository:
    """
    In-memory repository of precomputed analytics artifacts.
    Loads lazily on first access, caches results, builds indexes
    for fast entity lookups.
    """

    def __init__(self, data_dir: Optional[str] = None):
        self._data_dir = data_dir or get_data_dir()
        self._cache: Dict[str, Any] = {}           # safe_name → parsed data
        self._mtimes: Dict[str, float] = {}         # safe_name → file mtime
        self._available: Dict[str, str] = {}        # safe_name → path
        self._manifest: Optional[Dict] = None
        self._indexes_built = False

        # ─── Indexes for fast entity lookup ──────────────────────────
        self.idx_work_id: Dict[str, Dict] = {}          # work_id (str) → record
        self.idx_mplads_id: Dict[str, Dict] = {}         # MPLADS-style id → record
        self.idx_mp_id: Dict[int, List[Dict]] = defaultdict(list)
        self.idx_mp_name: Dict[str, List[Dict]] = defaultdict(list)  # normalized
        self.idx_state: Dict[str, List[Dict]] = defaultdict(list)    # lower
        self.idx_constituency: Dict[str, List[Dict]] = defaultdict(list)  # lower
        self.idx_vendor: Dict[str, List[Dict]] = defaultdict(list)   # lower

        # Duplicate alert indexes
        self.idx_dup_by_work: Dict[str, List[Dict]] = defaultdict(list)

        # MP scorecard indexes
        self.idx_mp_scorecard: Dict[int, Dict] = {}
        self.idx_mp_scorecard_name: Dict[str, Dict] = {}

        # Constituency indexes
        self.idx_constituency_risk: Dict[str, Dict] = {}    # lower name
        self.idx_constituency_hhi: Dict[str, Dict] = {}     # lower name

        # FinGuard indexes
        self.idx_finguard_work: Dict[str, Dict] = {}
        self.idx_finguard_constituency: Dict[str, Dict] = {}

        # Geospatial indexes
        self.idx_geo_constituency: Dict[str, Dict] = {}     # lower name

        # Vendor indexes
        self.idx_vendor_network: Dict[str, Dict] = {}       # lower name

        self._loading_errors: Dict[str, str] = {}
        self._load_times: Dict[str, float] = {}

    # ─── Initialization ──────────────────────────────────────────────────

    def initialize(self):
        """Load all available artifacts and build indexes. Call on startup."""
        start = time.time()
        self._discover_artifacts()
        self._load_all()
        self._build_indexes()
        elapsed = time.time() - start
        log.info(
            f"Data repository initialized in {elapsed:.2f}s — "
            f"{len(self._cache)} artifacts loaded, "
            f"{len(self._loading_errors)} errors"
        )

    def _discover_artifacts(self):
        """Find which artifacts are available on disk."""
        self._available = {}
        for safe_name in ARTIFACT_REGISTRY:
            path = resolve_artifact_path(safe_name, self._data_dir)
            if path:
                self._available[safe_name] = path
            else:
                spec = ARTIFACT_REGISTRY[safe_name]
                if spec.required:
                    log.warning(f"Required artifact missing: {safe_name} ({spec.filename})")

    def _load_all(self):
        """Load and parse all discovered artifacts."""
        for safe_name, path in self._available.items():
            self._load_artifact(safe_name, path)

    def _load_artifact(self, safe_name: str, path: str):
        """Load a single artifact from disk."""
        t0 = time.time()
        try:
            mtime = os.path.getmtime(path)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._cache[safe_name] = data
            self._mtimes[safe_name] = mtime
            elapsed = time.time() - t0
            self._load_times[safe_name] = elapsed

            count = len(data) if isinstance(data, list) else (
                len(data.get("features", [])) if isinstance(data, dict) and "features" in data
                else 1
            )
            log.info(
                f"  ✓ {safe_name}: {count} records, "
                f"{os.path.getsize(path) / 1024:.0f} KB, "
                f"{elapsed:.3f}s"
            )
        except json.JSONDecodeError as e:
            self._loading_errors[safe_name] = f"JSON parse error: {e}"
            log.error(f"  ✗ {safe_name}: malformed JSON — {e}")
        except Exception as e:
            self._loading_errors[safe_name] = str(e)
            log.error(f"  ✗ {safe_name}: load error — {e}")

    # ─── Index Building ──────────────────────────────────────────────────

    def _build_indexes(self):
        """Build in-memory indexes for fast entity lookup."""
        t0 = time.time()

        # Index unified_evaluations
        evals = self._cache.get("unified_evaluations", [])
        for rec in evals:
            wid = str(rec.get("work_id", ""))
            if wid:
                self.idx_work_id[wid] = rec

            mp_id = rec.get("mp_id")
            if mp_id:
                self.idx_mp_id[mp_id].append(rec)

            mp_name = rec.get("mp_name", "")
            if mp_name:
                self.idx_mp_name[normalize_name(mp_name)].append(rec)

            state = rec.get("state_name", "")
            if state:
                self.idx_state[state.lower()].append(rec)

            const = rec.get("const_name", "")
            if const:
                self.idx_constituency[const.lower()].append(rec)

            vendor = rec.get("primary_vendor_name", "")
            if vendor:
                self.idx_vendor[vendor.lower()].append(rec)

        # Index real_projects (MPLADS-style IDs)
        real_projects = self._cache.get("real_projects", [])
        for rec in real_projects:
            pid = rec.get("id", "")
            if pid:
                self.idx_mplads_id[pid.upper()] = rec

        # Index cost_delay_anomalies
        cda = self._cache.get("cost_delay_anomalies", [])
        for rec in cda:
            wid = str(rec.get("work_id", ""))
            if wid:
                if wid not in self.idx_work_id:
                    self.idx_work_id[wid] = rec

        # Index duplicate_alerts
        dups = self._cache.get("duplicate_alerts", [])
        for rec in dups:
            wid_a = str(rec.get("work_id_A", ""))
            wid_b = str(rec.get("work_id_B", ""))
            if wid_a:
                self.idx_dup_by_work[wid_a].append(rec)
            if wid_b:
                self.idx_dup_by_work[wid_b].append(rec)

        # Index mp_scorecards
        mps = self._cache.get("mp_scorecards", [])
        for rec in mps:
            mp_id = rec.get("mp_id")
            if mp_id:
                self.idx_mp_scorecard[mp_id] = rec
            mp_name = rec.get("mp_name", "")
            if mp_name:
                self.idx_mp_scorecard_name[normalize_name(mp_name)] = rec

        # Index constituency risk
        crhm = self._cache.get("constituency_risk", [])
        for rec in crhm:
            cname = rec.get("const_name", "")
            if cname:
                self.idx_constituency_risk[cname.lower()] = rec

        # Index constituency HHI
        chhi = self._cache.get("constituency_hhi", [])
        for rec in chhi:
            cname = rec.get("constituency_name", "")
            if cname:
                self.idx_constituency_hhi[cname.lower()] = rec

        # Index finguard anomalies
        fg = self._cache.get("finguard_anomalies", [])
        for rec in fg:
            wid = str(rec.get("work_id", ""))
            if wid:
                self.idx_finguard_work[wid] = rec

        # Index finguard constituency
        fcs = self._cache.get("finguard_constituency", [])
        for rec in fcs:
            cname = rec.get("const_name", "")
            if cname:
                self.idx_finguard_constituency[cname.lower()] = rec

        # Index geointel
        geo = self._cache.get("geointel_heatmap")
        if geo and isinstance(geo, dict) and "features" in geo:
            for feature in geo["features"]:
                props = feature.get("properties", {})
                cname = props.get("const_name", "")
                if cname:
                    self.idx_geo_constituency[cname.lower()] = {
                        **props,
                        "coordinates": feature.get("geometry", {}).get("coordinates"),
                    }

        # Index vendor risk network
        vrn = self._cache.get("vendor_risk_network", [])
        for rec in vrn:
            vname = rec.get("vendor_name", "")
            if vname:
                self.idx_vendor_network[vname.lower()] = rec

        self._indexes_built = True
        elapsed = time.time() - t0
        log.info(
            f"Indexes built in {elapsed:.3f}s — "
            f"works: {len(self.idx_work_id)}, "
            f"mplads_ids: {len(self.idx_mplads_id)}, "
            f"mp_scorecards: {len(self.idx_mp_scorecard)}, "
            f"constituencies: {len(self.idx_constituency_risk)}, "
            f"vendors: {len(self.idx_vendor_network)}"
        )

    # ─── Cache Refresh ───────────────────────────────────────────────────

    def refresh(self):
        """Reload artifacts whose mtime has changed."""
        changed = False
        for safe_name, path in self._available.items():
            try:
                current_mtime = os.path.getmtime(path)
                if self._mtimes.get(safe_name) != current_mtime:
                    log.info(f"Refreshing changed artifact: {safe_name}")
                    self._load_artifact(safe_name, path)
                    changed = True
            except OSError:
                pass

        if changed:
            self._clear_indexes()
            self._build_indexes()

    def _clear_indexes(self):
        """Clear all indexes for rebuilding."""
        self.idx_work_id.clear()
        self.idx_mplads_id.clear()
        self.idx_mp_id.clear()
        self.idx_mp_name.clear()
        self.idx_state.clear()
        self.idx_constituency.clear()
        self.idx_vendor.clear()
        self.idx_dup_by_work.clear()
        self.idx_mp_scorecard.clear()
        self.idx_mp_scorecard_name.clear()
        self.idx_constituency_risk.clear()
        self.idx_constituency_hhi.clear()
        self.idx_finguard_work.clear()
        self.idx_finguard_constituency.clear()
        self.idx_geo_constituency.clear()
        self.idx_vendor_network.clear()

    # ─── Accessor Methods ────────────────────────────────────────────────

    def get_artifact(self, safe_name: str) -> Optional[Any]:
        """Get a raw artifact by safe name."""
        return self._cache.get(safe_name)

    def get_manifest(self) -> Optional[Dict]:
        """Get the export manifest."""
        return self._cache.get("export_manifest")

    def get_snapshot_info(self) -> Dict[str, Any]:
        """Get data snapshot info for responses."""
        manifest = self.get_manifest()
        if manifest:
            return {
                "generated_at": manifest.get("sync_timestamp"),
                "version": manifest.get("dataset_version_hash"),
                "total_records_analyzed": manifest.get("total_records_analyzed"),
            }
        return {}

    def is_available(self, safe_name: str) -> bool:
        """Check if an artifact is loaded."""
        return safe_name in self._cache

    def get_loading_status(self) -> Dict[str, Any]:
        """Return loading status for diagnostics."""
        return {
            "loaded": list(self._cache.keys()),
            "errors": dict(self._loading_errors),
            "load_times": dict(self._load_times),
            "data_dir": self._data_dir,
        }

    # ─── Lookup Methods ──────────────────────────────────────────────────

    def lookup_work(self, work_id: str) -> Optional[Dict]:
        """Look up a work by numeric ID or MPLADS-style ID."""
        # Try numeric first
        rec = self.idx_work_id.get(str(work_id))
        if rec:
            return rec
        # Try MPLADS-style
        rec = self.idx_mplads_id.get(str(work_id).upper())
        if rec:
            return rec
        # Try stripping MPLADS- prefix for numeric lookup
        if work_id.upper().startswith("MPLADS"):
            stripped = work_id.split("-")[-1] if "-" in work_id else work_id[6:]
            rec = self.idx_work_id.get(stripped)
            if rec:
                return rec
        return None

    def lookup_finguard(self, work_id: str) -> Optional[Dict]:
        """Look up FinGuard anomaly data for a work."""
        return self.idx_finguard_work.get(str(work_id))

    def lookup_duplicates(self, work_id: str) -> List[Dict]:
        """Look up duplicate alerts involving a work."""
        return self.idx_dup_by_work.get(str(work_id), [])

    def lookup_cost_delay(self, work_id: str) -> Optional[Dict]:
        """Look up cost/delay anomaly for a work."""
        cda = self._cache.get("cost_delay_anomalies", [])
        for rec in cda:
            if str(rec.get("work_id")) == str(work_id):
                return rec
        return None

    def search_mp_by_name(self, query: str) -> List[Tuple[str, Dict]]:
        """Search MP scorecards by name. Returns list of (name, record)."""
        normalized = normalize_name(query)
        results = []
        for name, rec in self.idx_mp_scorecard_name.items():
            if normalized in name or name in normalized:
                results.append((rec.get("mp_name", name), rec))
        return results

    def search_constituency(self, query: str) -> List[Tuple[str, Dict]]:
        """Search constituencies by name."""
        q = query.lower().strip()
        results = []
        for name, rec in self.idx_constituency_risk.items():
            if q in name or name in q:
                results.append((rec.get("const_name", name), rec))
        return results

    def get_high_risk_works(
        self,
        state: Optional[str] = None,
        constituency: Optional[str] = None,
        mp_name: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict]:
        """Get high-risk works with optional filters across all anomaly and risk feeds."""
        candidates = []
        candidates.extend(self._cache.get("unified_evaluations", []))
        candidates.extend(self._cache.get("finguard_anomalies", []))
        candidates.extend(self._cache.get("cost_delay_anomalies", []))

        # Filter and deduplicate
        seen_ids = set()
        filtered = []
        for rec in candidates:
            wid = str(rec.get("work_id", rec.get("id", "")))
            if not wid or wid in seen_ids:
                continue

            if state and (rec.get("state_name") or rec.get("state", "")).lower() != state.lower():
                continue
            if constituency and (rec.get("const_name") or rec.get("constituency", "")).lower() != constituency.lower():
                continue
            if mp_name:
                rec_mp = normalize_name(rec.get("mp_name", rec.get("mp", "")))
                if normalize_name(mp_name) not in rec_mp and rec_mp not in normalize_name(mp_name):
                    continue
            if category and category.lower() not in (rec.get("work_category") or rec.get("category", "")).lower():
                continue

            seen_ids.add(wid)
            filtered.append(rec)

        # Sort by risk indicators
        def risk_sort_key(r):
            final_risk = r.get("final_risk_score") or 0
            sev = r.get("severity_score") or 0
            cost_z = abs(r.get("cost_z_score") or 0)
            delay_z = abs(r.get("delay_z_score") or 0)
            agency = r.get("agency_risk_score_x") or 0
            is_high = 100 if r.get("is_high_risk") else 0
            return -(final_risk * 2 + sev * 1.5 + cost_z * 10 + delay_z * 10 + agency + is_high)

        filtered.sort(key=risk_sort_key)
        return filtered[:min(limit, 25)]

    def get_high_risk_anomalies(
        self,
        state: Optional[str] = None,
        constituency: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict]:
        """Get top cost/delay anomalies."""
        cda = self._cache.get("cost_delay_anomalies", [])
        filtered = []
        for rec in cda:
            if state and rec.get("state_name", "").lower() != state.lower():
                continue
            if constituency and rec.get("const_name", "").lower() != constituency.lower():
                continue
            filtered.append(rec)

        filtered.sort(key=lambda r: -(r.get("severity_score") or 0))
        return filtered[:min(limit, 25)]

    def get_delayed_works(
        self,
        min_days: int = 0,
        state: Optional[str] = None,
        constituency: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict]:
        """Get works with highest completion delays."""
        evals = self._cache.get("unified_evaluations", []) + self._cache.get("cost_delay_anomalies", [])
        filtered = []
        seen = set()
        for rec in evals:
            wid = str(rec.get("work_id", ""))
            if not wid or wid in seen:
                continue
            delay = rec.get("completion_delay_days")
            if delay is not None and delay > min_days:
                if state and rec.get("state_name", "").lower() != state.lower():
                    continue
                if constituency and rec.get("const_name", "").lower() != constituency.lower():
                    continue
                seen.add(wid)
                filtered.append(rec)

        filtered.sort(key=lambda r: -(r.get("completion_delay_days") or 0))
        return filtered[:min(limit, 25)]

    def get_finguard_anomalies(
        self,
        state: Optional[str] = None,
        constituency: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict]:
        """Get top FinGuard anomalies."""
        fg = self._cache.get("finguard_anomalies", [])
        filtered = []
        for rec in fg:
            if state and rec.get("state_name", "").lower() != state.lower():
                continue
            if constituency and rec.get("const_name", "").lower() != constituency.lower():
                continue
            filtered.append(rec)

        def fg_score(r):
            return -(
                (r.get("financial_risk_score") or 0) +
                (r.get("isolation_forest_score") or 0)
            )
        filtered.sort(key=fg_score)
        return filtered[:min(limit, 25)]

    def get_top_duplicate_alerts(
        self,
        state: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict]:
        """Get top-confidence duplicate alerts."""
        dups = self._cache.get("duplicate_alerts", [])
        filtered = []
        for rec in dups:
            if state:
                # Check state in both A and B side
                a_state = rec.get("A_state_name", "") or ""
                b_state = rec.get("B_state_name", "") or ""
                if (state.lower() not in a_state.lower() and
                        state.lower() not in b_state.lower()):
                    continue
            filtered.append(rec)

        filtered.sort(key=lambda r: -(r.get("risk_confidence_score") or 0))
        return filtered[:min(limit, 25)]

    def get_top_mp_scorecards(
        self,
        state: Optional[str] = None,
        limit: int = 5,
        sort_by: str = "risk",
    ) -> List[Dict]:
        """Get MP scorecards sorted by risk or integrity."""
        mps = self._cache.get("mp_scorecards", [])
        filtered = []
        for rec in mps:
            if state and rec.get("state_name", "").lower() != state.lower():
                continue
            if rec.get("total_works", 0) < 1:
                continue
            filtered.append(rec)

        # Graceful fallback if state filter eliminated all or if empty
        if not filtered and mps:
            filtered = [r for r in mps if r.get("total_works", 0) >= 1]
            if not filtered:
                filtered = list(mps)

        if sort_by == "risk":
            filtered.sort(key=lambda r: r.get("composite_integrity_score", 100))
        else:
            filtered.sort(key=lambda r: -(r.get("composite_integrity_score", 0)))

        return filtered[:min(limit, 25)]

    def get_vendor_network_top(self, limit: int = 10) -> List[Dict]:
        """Get top vendors by risk score."""
        vrn = self._cache.get("vendor_risk_network", [])
        sorted_vrn = sorted(vrn, key=lambda r: -(r.get("risk_score") or 0))
        return sorted_vrn[:min(limit, 25)]

    def get_all_state_names(self) -> List[str]:
        """Get unique state names from loaded data."""
        return sorted(set(self.idx_state.keys()))

    def get_all_constituency_names(self) -> List[str]:
        """Get unique constituency names from loaded data."""
        names = set(
            list(self.idx_constituency_risk.keys()) +
            list(self.idx_constituency.keys())
        )
        for rec in self._cache.get("unified_evaluations", []):
            ida = rec.get("ida_name")
            if ida:
                names.add(ida.split("(")[0].strip().lower())
        for rec in self._cache.get("real_projects", []):
            c = rec.get("constituency")
            if c:
                names.add(c.lower())
        return sorted(names)

    def get_all_mp_names(self) -> List[str]:
        """Get unique MP names from scorecards."""
        return [rec.get("mp_name", "") for rec in self._cache.get("mp_scorecards", [])]


# ─── Singleton Instance ─────────────────────────────────────────────────────

_repository: Optional[DataRepository] = None


def get_repository() -> DataRepository:
    """Get or create the singleton repository instance."""
    global _repository
    if _repository is None:
        _repository = DataRepository()
        _repository.initialize()
    return _repository


def initialize_repository(data_dir: Optional[str] = None):
    """Explicitly initialize the repository (call during startup)."""
    global _repository
    _repository = DataRepository(data_dir)
    _repository.initialize()
    return _repository

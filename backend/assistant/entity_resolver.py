"""
Nirikshak AI — Entity Resolver
==================================
Extracts and resolves entities (work IDs, MP names, states,
constituencies, vendors) from user messages. Supports fuzzy
matching and session context for follow-ups.
"""

import re
import logging
from typing import Optional, Dict, List, Any, Tuple

from backend.assistant.normalizer import (
    extract_work_ids, normalize_state, normalize_name, normalize_text,
)
from backend.assistant.data_repository import DataRepository

log = logging.getLogger("nirikshak.assistant.entity_resolver")

# Try to import rapidfuzz; fall back to basic matching
try:
    from rapidfuzz import fuzz, process as rfprocess
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False
    log.info("rapidfuzz not available — using basic string matching")


# ─── Session Context ─────────────────────────────────────────────────────────

class SessionContext:
    """Limited conversation context for a session."""

    def __init__(self):
        self.last_work_id: Optional[str] = None
        self.last_mp_name: Optional[str] = None
        self.last_mp_id: Optional[int] = None
        self.last_constituency: Optional[str] = None
        self.last_state: Optional[str] = None
        self.last_intent: Optional[str] = None
        self.last_results: List[Dict] = []

    def update(self, entities: Dict[str, Any], intent: str):
        """Update context from resolved entities."""
        if entities.get("work_id"):
            self.last_work_id = entities["work_id"]
        if entities.get("mp_name"):
            self.last_mp_name = entities["mp_name"]
        if entities.get("mp_id"):
            self.last_mp_id = entities["mp_id"]
        if entities.get("constituency"):
            self.last_constituency = entities["constituency"]
        if entities.get("state"):
            self.last_state = entities["state"]
        self.last_intent = intent


# ─── Session Store ───────────────────────────────────────────────────────────

_sessions: Dict[str, SessionContext] = {}
MAX_SESSIONS = 500


def get_session(conversation_id: Optional[str]) -> SessionContext:
    """Get or create session context."""
    if not conversation_id:
        return SessionContext()

    if conversation_id not in _sessions:
        # Limit session count
        if len(_sessions) >= MAX_SESSIONS:
            oldest_key = next(iter(_sessions))
            del _sessions[oldest_key]
        _sessions[conversation_id] = SessionContext()

    return _sessions[conversation_id]


# ─── Entity Resolution ──────────────────────────────────────────────────────

class ResolvedEntities:
    """Container for resolved entities."""

    def __init__(self):
        self.work_id: Optional[str] = None
        self.mp_name: Optional[str] = None
        self.mp_id: Optional[int] = None
        self.state: Optional[str] = None
        self.constituency: Optional[str] = None
        self.vendor: Optional[str] = None
        self.limit: int = 5
        self.clarification_needed: bool = False
        self.clarification_options: List[str] = []
        self.clarification_type: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {}
        if self.work_id:
            d["work_id"] = self.work_id
        if self.mp_name:
            d["mp_name"] = self.mp_name
        if self.mp_id:
            d["mp_id"] = self.mp_id
        if self.state:
            d["state"] = self.state
        if self.constituency:
            d["constituency"] = self.constituency
        if self.vendor:
            d["vendor"] = self.vendor
        d["limit"] = self.limit
        return d


def resolve_entities(
    message: str,
    intent: str,
    repo: DataRepository,
    context: Optional[Dict] = None,
    session: Optional[SessionContext] = None,
) -> ResolvedEntities:
    """
    Extract and resolve entities from user message and context.
    """
    resolved = ResolvedEntities()
    text = message.strip()

    # 1. Extract work IDs
    work_ids = extract_work_ids(text)
    if work_ids:
        resolved.work_id = work_ids[0]
    elif context and context.get("selected_work_id"):
        resolved.work_id = context["selected_work_id"]
    elif _refers_to_previous(text) and session and session.last_work_id:
        resolved.work_id = session.last_work_id

    # 2. Extract result limit
    limit_match = re.search(r'\b(top|first|show|list)\s+(\d{1,2})\b', text, re.I)
    if limit_match:
        resolved.limit = min(int(limit_match.group(2)), 25)
    else:
        limit_match2 = re.search(r'\b(\d{1,2})\s+(highest|top|most|worst|best)\b', text, re.I)
        if limit_match2:
            resolved.limit = min(int(limit_match2.group(1)), 25)

    # 3. Extract state
    state = _extract_state(text, repo)
    if state:
        resolved.state = state
    elif context and context.get("selected_state"):
        state = normalize_state(context["selected_state"])
        if state:
            resolved.state = state
    elif _refers_to_previous(text) and session and session.last_state:
        resolved.state = session.last_state

    # 4. Extract constituency
    constituency = _extract_constituency(text, repo)
    if constituency:
        resolved.constituency = constituency
    elif context and context.get("selected_constituency"):
        resolved.constituency = context["selected_constituency"]
    elif _refers_to_previous(text) and session and session.last_constituency:
        resolved.constituency = session.last_constituency

    # 5. Extract MP name
    mp_result = _extract_mp(text, repo)
    if mp_result:
        if isinstance(mp_result, list) and len(mp_result) > 1:
            resolved.clarification_needed = True
            resolved.clarification_type = "mp"
            resolved.clarification_options = [m[0] for m in mp_result[:5]]
        elif isinstance(mp_result, list) and len(mp_result) == 1:
            resolved.mp_name = mp_result[0][0]
            resolved.mp_id = mp_result[0][1].get("mp_id")
        elif isinstance(mp_result, tuple):
            resolved.mp_name = mp_result[0]
            resolved.mp_id = mp_result[1].get("mp_id")
    elif context and context.get("selected_mp_id"):
        resolved.mp_id = context["selected_mp_id"]
    elif _refers_to_previous(text) and session and session.last_mp_name:
        resolved.mp_name = session.last_mp_name
        resolved.mp_id = session.last_mp_id

    # 6. Extract vendor name
    vendor = _extract_vendor(text, repo)
    if vendor:
        resolved.vendor = vendor

    return resolved


# ─── Private Helpers ─────────────────────────────────────────────────────────

PREVIOUS_REFS = re.compile(
    r'\b(this|that|the same|same|it|its|these|those|previous|last|current|above)\b',
    re.I,
)


def _refers_to_previous(text: str) -> bool:
    """Check if user is referring to previous context."""
    return bool(PREVIOUS_REFS.search(text))


def _extract_state(text: str, repo: DataRepository) -> Optional[str]:
    """Try to extract a state name from text."""
    lower = text.lower()

    # Check direct state names from data
    for state_lower in repo.get_all_state_names():
        if state_lower in lower:
            # Return canonical form
            canonical = normalize_state(state_lower)
            if canonical:
                return canonical
            # Capitalize each word
            return state_lower.title()

    # Check abbreviations and aliases
    words = re.findall(r'\b\w+\b', text)
    for word in words:
        canonical = normalize_state(word)
        if canonical:
            return canonical

    # Check 2-word state names
    for state_lower in repo.get_all_state_names():
        if " " in state_lower and state_lower in lower:
            return state_lower.title()

    return None


STOP_WORDS = {
    "have", "more", "than", "show", "cost", "risk", "work", "works", "year", "years",
    "most", "best", "which", "what", "where", "find", "list", "from", "with", "tell",
    "give", "some", "many", "anomalies", "anomaly", "projects", "project", "delayed",
    "delay", "stalled", "high", "highest", "critical", "score", "scorecard", "between",
    "difference", "vendor", "contractor", "corruption", "explain", "summarize",
    "summary", "profile", "about", "these", "those", "that", "this", "help", "view",
    "please", "state", "states", "district", "districts", "constituency", "constituencies",
    "bihar", "kerala", "delhi", "punjab", "assam", "gujarat", "odisha", "goa", "sikkim",
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
}


def _extract_constituency(text: str, repo: DataRepository) -> Optional[str]:
    """Try to extract a constituency name from text."""
    lower = text.lower()
    all_constituencies = repo.get_all_constituency_names()

    # Punctuation-safe exact whole-word match
    matches = []
    for c_lower in all_constituencies:
        if len(c_lower) > 3 and c_lower not in STOP_WORDS:
            prefix = r'(?:\b|^|\s)'
            suffix = r'(?:\b|$|\s|[?.!,])'
            pattern = prefix + re.escape(c_lower) + suffix
            if re.search(pattern, lower):
                matches.append(c_lower)

    if len(matches) == 1:
        # Find canonical casing
        for rec in repo._cache.get("constituency_risk", []):
            if rec.get("const_name", "").lower() == matches[0]:
                return rec["const_name"]
        return matches[0].title()
    elif len(matches) > 1:
        best = max(matches, key=len)
        for rec in repo._cache.get("constituency_risk", []):
            if rec.get("const_name", "").lower() == best:
                return rec["const_name"]
        return best.title()

    if not matches and HAS_RAPIDFUZZ:
        target_words = []
        loc_match = re.search(r'\b(?:in|of|for|at)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', text, re.I)
        if loc_match:
            candidate_phrase = loc_match.group(1).lower().strip()
            if candidate_phrase not in STOP_WORDS and len(candidate_phrase) >= 4:
                target_words.append(candidate_phrase)

        candidates = [c for c in all_constituencies if len(c) > 3 and c not in STOP_WORDS]
        for word in target_words:
            result = rfprocess.extractOne(
                word, candidates,
                scorer=fuzz.ratio,
                score_cutoff=85,
            )
            if result:
                matched_name = result[0]
                for rec in repo._cache.get("constituency_risk", []):
                    if rec.get("const_name", "").lower() == matched_name:
                        return rec["const_name"]
                return matched_name.title()

    return None


def _extract_mp(text: str, repo: DataRepository):
    """Try to extract MP name from text. Returns list of (name, record) tuples or None."""
    lower = text.lower()

    # Check if "MP" or "member" is mentioned
    mp_context = re.search(
        r'\b(?:mp|member|scorecard)\s+(?:of\s+|for\s+|named?\s+)?(.{3,40}?)(?:\s*[?.!,]|\s+and\s+|\s+in\s+|\s+from\s+|$)',
        text, re.I,
    )

    query = None
    if mp_context:
        candidate = mp_context.group(1).strip()
        # Avoid treating generic query phrases as an MP's name
        candidate_lower = candidate.lower()
        generic_phrases = {
            "have the highest risk", "highest risk", "lowest integrity", "lowest score",
            "highest", "lowest", "risk", "worst", "best", "top", "list", "all",
            "scorecard", "scorecards", "performance", "summary", "profile", "ranking"
        }
        if candidate_lower not in generic_phrases and not any(p in candidate_lower for p in ["highest risk", "lowest integrity", "have the"]):
            query = candidate
    
    if not query:
        # Check for "Shri/Smt/Dr" prefixed names
        name_match = re.search(r'\b((?:Shri|Smt\.?|Dr\.?)\s+\S+(?:\s+\S+){0,3})', text, re.I)
        if name_match:
            query = name_match.group(1).strip()

    if not query or len(query) < 3:
        return None

    # Search by name
    results = repo.search_mp_by_name(query)

    if not results and HAS_RAPIDFUZZ:
        all_mp_names = repo.get_all_mp_names()
        normalized_names = {normalize_name(n): n for n in all_mp_names if n}
        match = rfprocess.extractOne(
            normalize_name(query),
            list(normalized_names.keys()),
            scorer=fuzz.token_sort_ratio,
            score_cutoff=65,
        )
        if match:
            original_name = normalized_names[match[0]]
            results = repo.search_mp_by_name(original_name)

    return results if results else None


def _extract_vendor(text: str, repo: DataRepository) -> Optional[str]:
    """Try to extract vendor name from text."""
    lower = text.lower()

    # Check vendor names in the network
    for vname_lower, rec in repo.idx_vendor_network.items():
        if vname_lower in lower:
            return rec.get("vendor_name", vname_lower)

    return None


def extract_compare_entities(text: str, repo: DataRepository) -> List[Dict]:
    """Extract two MP entities for comparison."""
    # Try "compare X and Y" pattern
    compare_match = re.search(
        r'compare\s+(.+?)\s+(?:and|vs\.?|versus|with)\s+(.+?)(?:\s*[?.!]|$)',
        text, re.I,
    )
    if not compare_match:
        return []

    name_a = compare_match.group(1).strip()
    name_b = compare_match.group(2).strip()

    results = []
    for name in [name_a, name_b]:
        matches = repo.search_mp_by_name(name)
        if matches:
            results.append({"mp_name": matches[0][0], "record": matches[0][1]})
        elif HAS_RAPIDFUZZ:
            all_mp_names = repo.get_all_mp_names()
            normalized_names = {normalize_name(n): n for n in all_mp_names if n}
            match = rfprocess.extractOne(
                normalize_name(name),
                list(normalized_names.keys()),
                scorer=fuzz.token_sort_ratio,
                score_cutoff=60,
            )
            if match:
                original_name = normalized_names[match[0]]
                found = repo.search_mp_by_name(original_name)
                if found:
                    results.append({"mp_name": found[0][0], "record": found[0][1]})

    return results

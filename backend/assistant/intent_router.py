"""
Nirikshak AI — Intent Router
================================
Deterministic intent classification using keyword/pattern matching.
No heavy ML models. Handles case-insensitive matching, common
punctuation, and minor typos.
"""

import re
import logging
from typing import Optional, Dict, List, Tuple

log = logging.getLogger("nirikshak.assistant.intent_router")


# ─── Intent Definitions ─────────────────────────────────────────────────────

class Intent:
    HELP = "help_capabilities"
    EXPLAIN_RISK = "explain_project_risk"
    FIND_HIGH_RISK = "find_high_risk"
    COST_DELAY = "cost_delay_anomalies"
    DUPLICATES = "duplicate_alerts"
    MP_SCORECARD = "mp_scorecard"
    COMPARE_MPS = "compare_mps"
    CONSTITUENCY_RISK = "constituency_risk"
    VENDOR_CONCENTRATION = "vendor_concentration"
    GEOSPATIAL = "geospatial_intel"
    DEFINITION = "definition"
    UNKNOWN = "unknown"

    ALL = [
        HELP, EXPLAIN_RISK, FIND_HIGH_RISK, COST_DELAY,
        DUPLICATES, MP_SCORECARD, COMPARE_MPS,
        CONSTITUENCY_RISK, VENDOR_CONCENTRATION,
        GEOSPATIAL, DEFINITION, UNKNOWN,
    ]


# ─── Pattern Definitions ────────────────────────────────────────────────────
# Each pattern group: (intent, list_of_regex_patterns, priority)

INTENT_PATTERNS: List[Tuple[str, List[re.Pattern], int]] = [
    # Help / capabilities (priority 5 - check early)
    (Intent.HELP, [
        re.compile(r"\b(help|what can you|what do you|how can you|capabilities|what.*ask|what.*questions|how does nirikshak|what.*nirikshak.*do)\b", re.I),
        re.compile(r"^(hi|hello|hey|namaste|greetings)\s*[!?.]?\s*$", re.I),
    ], 5),

    # Definition / glossary (priority 8 - targeted glossary terms)
    (Intent.DEFINITION, [
        re.compile(r"\b(what\s+is|what\s+does|what\s+are|define|meaning\s+of)\b.*\b(hhi|z.?score|risk\s+score|confidence|anomal\w*|duplicate|delay|concentration|geospatial|cluster|human.?in|isolation|utilization|ghost|split|severity|agency|fraud)\b", re.I),
        re.compile(r"\bwhat\s+(is|does|are)\b.*\b(hhi|z.?score|risk\s+score|confidence|delay|concentration|fraud|cluster|anomaly)\b.*\bmean\b", re.I),
        re.compile(r"\bwhat\s+does\s+hhi\s+mean\b", re.I),
        re.compile(r"\bdefin(e|ition|itions)\b.*\b(hhi|z.?score|risk\s+score|confidence|anomal\w*|duplicate|delay|concentration|geospatial|cluster|human.?in|isolation|utilization|ghost|split|severity|agency|fraud)\b", re.I),
        re.compile(r"\bdoes.*\bprove\b.*\b(fraud|corruption|cartel|collusion|guilt)\b", re.I),
        re.compile(r"\b(difference\s+between\s+anomaly\s+and\s+fraud|anomaly\s+vs\s+fraud)\b", re.I),
    ], 8),

    # Vendor concentration / network risk (priority 12)
    (Intent.VENDOR_CONCENTRATION, [
        re.compile(r"\b(vendors?|contractors?|suppliers?)\b.*\b(risk|concentration|monopol\w*|cartel\w*|network|dominan\w*)\b", re.I),
        re.compile(r"\b(risk|concentration)\b.*\b(vendors?|contractors?|suppliers?)\b", re.I),
        re.compile(r"\b(hhi|herfindahl|market\s+concentration)\b", re.I),
        re.compile(r"\b(vendors?|contractors?)\b.*\b(across|multiple|connected)\b", re.I),
        re.compile(r"\bconcentration\s*risk\b", re.I),
        re.compile(r"\b(vendors?|contractors?|suppliers?)\s*(with|have|of)?\s*(high|highest)\b", re.I),
        re.compile(r"\bwhich\b.*\b(vendors?|contractors?)\b", re.I),
    ], 12),

    # Duplicate alerts (priority 15)
    (Intent.DUPLICATES, [
        re.compile(r"\b(duplicate|duplicates|duplicated|duplication|similar\s+projects?|split.?works?)\b", re.I),
        re.compile(r"\b(why.*considered\s+similar|why.*similar|similarity\s+score)\b", re.I),
        re.compile(r"\bduplicate\s*(alerts?|detections?|candidates?|pairs?)\b", re.I),
    ], 15),

    # MP scorecard (priority 18)
    (Intent.MP_SCORECARD, [
        re.compile(r"\b(scorecards?|score\s*cards?)\b", re.I),
        re.compile(r"\bsummar(y|ize|ise|ized|ised)\b.*\b(mp|mps|member|members|parliament)\b", re.I),
        re.compile(r"\b(mp|mps|member|members)\b.*\b(summary|profile|scorecards?|performance|integrity|score)\b", re.I),
        re.compile(r"\bwhich\s+(mp|member)s?\b.*\b(risk|highest|lowest|best|worst)\b", re.I),
        re.compile(r"\bwhich\s+(mp|member)s?\b", re.I),
        re.compile(r"\bmp.*utili[sz]ation\b", re.I),
        re.compile(r"\b(mp|member)s?\b.*\bhigh\w*\s*risk\b", re.I),
        re.compile(r"\bhigh\w*\s*risk\b.*\b(mp|member)s?\b", re.I),
    ], 18),

    # Compare MPs (priority 20)
    (Intent.COMPARE_MPS, [
        re.compile(r"\bcompare\b.*\b(mp|member|scorecard)s?\b", re.I),
        re.compile(r"\b(mp|member)s?\b.*\bcompare\b", re.I),
        re.compile(r"\bcompare\b.*\band\b", re.I),
    ], 20),

    # Explain project risk (priority 25 - specific to a work/project)
    (Intent.EXPLAIN_RISK, [
        re.compile(r"\b(why\s+is|explain|what.*risk|evidence.*for)\b.*\b(works?|projects?|flags?|high.?risk|MPLADS[-_]?\S*)\b", re.I),
        re.compile(r"\b(works?|projects?)\b.*\b(risks?|anomal\w*|flags?|scores?)\b", re.I),
        re.compile(r"\brisk\s*(scores?|levels?|ratings?|factors?)\b.*\b(of|for)\s*(work|project|\d+|MPLADS)\b", re.I),
        re.compile(r"\bexplain\b.*\b(this|the)\b.*\b(projects?|works?|risks?|anomal\w*)\b", re.I),
        re.compile(r"\bexplain\s+(the\s+)?risk\s+of\s+project\b", re.I),
        re.compile(r"\bwhy.*\bwork\s*\d+\b", re.I),
        re.compile(r"\bwhy.*\b(is|was)\b.*\b(flagged|high\s*risk)\b", re.I),
        re.compile(r"\bwhat.*evidence\s*(is|available|for)\b", re.I),
    ], 25),

    # Constituency risk (priority 30)
    (Intent.CONSTITUENCY_RISK, [
        re.compile(r"\b(constituency|constituencies|districts?)\b.*\b(risk|anomal\w*|summary|profile|works?)\b", re.I),
        re.compile(r"\b(risk|anomal\w*)\b.*\b(constituency|constituencies|districts?)\b", re.I),
        re.compile(r"\bsummar\w+\s+risk\s+in\b", re.I),
        re.compile(r"\brisk\s+(in|of|for|profile)\s+(the\s+)?(constituency|district|area|region)\b", re.I),
        re.compile(r"\brisk\s+profile\s+of\b", re.I),
        re.compile(r"\brisk\s+in\s+[A-Za-z]+\b", re.I),
        re.compile(r"\bwhich\s+constituenc\w+\b", re.I),
    ], 30),

    # Cost and delay anomalies (priority 40)
    (Intent.COST_DELAY, [
        re.compile(r"\b(cost|financial|expenditure)\s*(anomal\w*|overruns?|outliers?|over.?disburs\w*)\b", re.I),
        re.compile(r"\b(delay|delayed|stalled|overdue)\b.*\b(projects?|works?|years?|months?|days?)\b", re.I),
        re.compile(r"\b(over.?disburs\w*|ghost.?disburs\w*|march.?rush|payment\s+fragmentation)\b", re.I),
        re.compile(r"\b(extreme|severe|critical)\s*(cost|financial|anomal\w*)\b", re.I),
        re.compile(r"\bseverity\s*scores?\b", re.I),
        re.compile(r"\bwhy.*marked.*over.?disburs\w*\b", re.I),
        re.compile(r"\bfinguard\b", re.I),
        re.compile(r"\b(show|list|find)\b.*\b(cost|delay|financial)\b.*\banomal\w*\b", re.I),
        re.compile(r"\banomal\w*\b.*\b(cost|delay|financial)\b", re.I),
        re.compile(r"\b(delayed|stalled)\b.*\b(more than|over|above|\d+)\b", re.I),
        re.compile(r"\bcost\s*anomal\w*\b", re.I),
    ], 40),

    # Find high-risk projects (priority 45)
    (Intent.FIND_HIGH_RISK, [
        re.compile(r"\b(show|list|find|top|highest|get)\b.*\b(high.?risk|risks?|critical|flagged)\b.*\b(projects?|works?)\b", re.I),
        re.compile(r"\b(high.?risk|critical|flagged)\b.*\b(projects?|works?)\b", re.I),
        re.compile(r"\bprojects?.*require\s*(attention|verification|inspection)\b", re.I),
        re.compile(r"\btop\s*\d+\b.*\b(risks?|projects?|works?)\b", re.I),
        re.compile(r"\bshow\b.*\brisk\b.*\b(projects?|works?)\b", re.I),
    ], 45),

    # Geospatial intelligence (priority 50)
    (Intent.GEOSPATIAL, [
        re.compile(r"\b(geographic|geospatial|spatial|geo.?intel|clusters?|hotspots?|maps?)\b.*\b(risk|clusters?|patterns?|evidence|intelligence)\b", re.I),
        re.compile(r"\b(risk|high.?risk)\b.*\b(clusters?|geographic|areas?|regions?|spatial)\b", re.I),
    ], 50),
]


# ─── Intent Classification ──────────────────────────────────────────────────

def classify_intent(message: str) -> str:
    """
    Classify user message into an intent using pattern matching.
    Returns the best-matching intent string.
    """
    text = message.strip()
    if not text:
        return Intent.UNKNOWN

    # Sort patterns by priority (lower = checked first)
    sorted_patterns = sorted(INTENT_PATTERNS, key=lambda x: x[2])

    for intent, patterns, _priority in sorted_patterns:
        for pattern in patterns:
            if pattern.search(text):
                return intent

    return Intent.UNKNOWN


def get_intent_description(intent: str) -> str:
    """Get a human-readable description for an intent."""
    descriptions = {
        Intent.HELP: "Help & capabilities",
        Intent.EXPLAIN_RISK: "Explain project risk",
        Intent.FIND_HIGH_RISK: "Find high-risk projects",
        Intent.COST_DELAY: "Cost & delay anomalies",
        Intent.DUPLICATES: "Duplicate project alerts",
        Intent.MP_SCORECARD: "MP scorecard",
        Intent.COMPARE_MPS: "Compare MPs",
        Intent.CONSTITUENCY_RISK: "Constituency risk",
        Intent.VENDOR_CONCENTRATION: "Vendor concentration",
        Intent.GEOSPATIAL: "Geospatial intelligence",
        Intent.DEFINITION: "Definition & methodology",
        Intent.UNKNOWN: "Unknown intent",
    }
    return descriptions.get(intent, "Unknown")

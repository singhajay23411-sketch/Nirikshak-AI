"""
Nirikshak AI — Curated Glossary
=================================
Definitions for analytical terms used by the assistant.
All entries use responsible, understandable language.
"""

GLOSSARY = {
    "risk_score": {
        "term": "Risk Score",
        "definition": (
            "A composite numerical indicator (0–100) that aggregates multiple "
            "signals — financial anomalies, delay patterns, vendor concentration, "
            "and geographic clustering — to prioritize projects for human field "
            "verification. A higher score indicates more anomaly signals were "
            "detected, NOT that fraud has been confirmed."
        ),
        "aliases": ["risk score", "composite risk", "risk rating"],
    },
    "confidence_score": {
        "term": "Confidence Score",
        "definition": (
            "A measure (0–100) of how strongly multiple independent signals "
            "converge on the same anomaly pattern. A confidence score of 100 "
            "means all evaluated gates (text similarity, financial match, "
            "agency match, temporal match, location match) agree. This "
            "indicates analytical confidence, not proof of wrongdoing."
        ),
        "aliases": ["confidence", "risk confidence"],
    },
    "cost_z_score": {
        "term": "Cost Z-Score",
        "definition": (
            "A statistical measure showing how far a project's cost deviates "
            "from the median cost of comparable projects in the same category "
            "and region. A z-score above 3 indicates the cost is significantly "
            "higher than typical. This is a statistical outlier signal, not "
            "evidence of wrongdoing."
        ),
        "aliases": ["z-score", "z score", "cost zscore", "cost deviation"],
    },
    "hhi": {
        "term": "Herfindahl-Hirschman Index (HHI)",
        "definition": (
            "A widely-used measure of market concentration. It is calculated "
            "by summing the squares of the market share percentages of all "
            "vendors in a constituency. An HHI below 1,500 indicates a "
            "competitive market; 1,500–2,500 indicates moderate concentration; "
            "above 2,500 indicates high concentration. A high HHI means fewer "
            "vendors hold larger shares of the work — it does NOT prove "
            "collusion, corruption, or cartel behaviour."
        ),
        "aliases": ["hhi", "herfindahl", "herfindahl-hirschman", "market concentration"],
    },
    "duplicate_similarity": {
        "term": "Duplicate Similarity Score",
        "definition": (
            "A measure (0–1) of textual similarity between two project "
            "descriptions. A score near 1.0 means the descriptions are "
            "nearly identical. This flags candidate duplicate pairs for "
            "review — it does NOT confirm that the projects are actually "
            "duplicated, as legitimate reasons for similar descriptions exist."
        ),
        "aliases": ["similarity score", "text similarity", "duplicate score"],
    },
    "delay_risk": {
        "term": "Delay Risk",
        "definition": (
            "A signal indicating that a project has exceeded its expected "
            "completion timeline by a significant margin. Delay is measured "
            "in days from the sanction date to the actual end date (or "
            "current date if incomplete). Delays can have legitimate causes "
            "and require contextual review."
        ),
        "aliases": ["delay", "completion delay", "project delay"],
    },
    "vendor_concentration": {
        "term": "Vendor Concentration",
        "definition": (
            "A measure of how much project funding in a constituency is "
            "captured by a small number of vendors. High concentration "
            "means fewer vendors handle most of the work. This is a "
            "structural observation that requires verification — it does "
            "NOT imply wrongdoing or monopoly abuse."
        ),
        "aliases": ["vendor risk", "contractor concentration", "monopoly risk"],
    },
    "geospatial_cluster": {
        "term": "Geospatial Cluster",
        "definition": (
            "A geographic grouping of constituencies or projects that share "
            "similar risk patterns, identified through spatial analysis. "
            "Clusters help identify regional patterns that may warrant "
            "coordinated review across nearby areas."
        ),
        "aliases": ["spatial cluster", "geographic cluster", "risk cluster", "cluster"],
    },
    "human_in_the_loop": {
        "term": "Human-in-the-Loop",
        "definition": (
            "A design principle where AI-generated risk signals and anomaly "
            "detections are always reviewed by authorized human officials "
            "before any action is taken. Nirikshak AI is a decision-support "
            "tool — it flags patterns for human verification, not automated "
            "enforcement."
        ),
        "aliases": ["human verification", "human review", "hitl"],
    },
    "anomaly_vs_fraud": {
        "term": "Anomaly vs. Confirmed Fraud",
        "definition": (
            "An anomaly is a statistically unusual pattern detected by "
            "analytical models. It is a signal that warrants investigation, "
            "NOT a finding of fraud. Confirmed fraud can only be determined "
            "through authorized human investigation, field verification, "
            "and due process. Nirikshak AI detects anomalies — it does not "
            "determine guilt or confirm fraud."
        ),
        "aliases": [
            "anomaly", "fraud", "anomaly vs fraud",
            "is this fraud", "does this mean fraud",
            "confirmed fraud",
        ],
    },
    "severity_score": {
        "term": "Severity Score",
        "definition": (
            "A numerical indicator of how extreme a particular anomaly "
            "signal is, often derived from the cost z-score. Higher severity "
            "indicates a more statistically extreme deviation. This "
            "prioritizes which anomalies to review first."
        ),
        "aliases": ["severity", "anomaly severity"],
    },
    "isolation_forest": {
        "term": "Isolation Forest Score",
        "definition": (
            "A score from an unsupervised machine learning algorithm that "
            "identifies data points differing significantly from the majority. "
            "A high isolation forest score means the project's financial "
            "pattern is unusual compared to peers. This is a statistical "
            "signal, not evidence of wrongdoing."
        ),
        "aliases": ["isolation forest", "if score", "isolation score"],
    },
    "utilization_rate": {
        "term": "Utilization Rate",
        "definition": (
            "The ratio of actual expenditure (or disbursement) to the "
            "total sanctioned amount. A very low utilization rate may "
            "indicate stalled projects; a rate above 100% may indicate "
            "over-disbursement. Both extremes warrant review."
        ),
        "aliases": ["utilization", "fund utilization", "expenditure rate"],
    },
    "ghost_disbursal": {
        "term": "Ghost Disbursal",
        "definition": (
            "A flag raised when disbursements are recorded for a project "
            "that shows no corresponding physical progress or completion. "
            "This is an anomaly signal requiring field inspection to verify "
            "whether work was actually performed."
        ),
        "aliases": ["ghost disbursal", "ghost disbursement", "ghost payment"],
    },
    "split_work": {
        "term": "Split Work Alert",
        "definition": (
            "A duplicate-detection alert type indicating that a single "
            "project may have been split into multiple smaller works, "
            "potentially to stay below sanctioning thresholds. This is "
            "a candidate alert requiring verification."
        ),
        "aliases": ["split work", "work splitting", "split tender"],
    },
    "agency_risk": {
        "term": "Agency Risk Score",
        "definition": (
            "A score evaluating the historical performance and capacity of "
            "the implementing district agency. It considers factors like "
            "execution delay rates, workload relative to capacity, and "
            "governance patterns. Moderate scores indicate typical "
            "performance."
        ),
        "aliases": ["agency risk", "agency score", "ida risk"],
    },
}


def find_glossary_entry(query: str):
    """Find a glossary entry matching the query string (case-insensitive)."""
    query_lower = query.lower().strip()

    # Direct key match
    if query_lower.replace(" ", "_") in GLOSSARY:
        return GLOSSARY[query_lower.replace(" ", "_")]

    # Search aliases
    for key, entry in GLOSSARY.items():
        if query_lower == entry["term"].lower():
            return entry
        for alias in entry.get("aliases", []):
            if alias.lower() == query_lower:
                return entry

    # Partial match
    for key, entry in GLOSSARY.items():
        if query_lower in entry["term"].lower():
            return entry
        for alias in entry.get("aliases", []):
            if query_lower in alias.lower() or alias.lower() in query_lower:
                return entry

    return None


def get_all_terms():
    """Return a list of all glossary term names."""
    return [entry["term"] for entry in GLOSSARY.values()]

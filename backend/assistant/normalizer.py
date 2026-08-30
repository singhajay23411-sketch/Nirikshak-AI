"""
Nirikshak AI — Text Normalizer & Entity Helpers
===================================================
Normalize names, extract IDs, handle abbreviations.
"""

import re
from typing import Optional, List


# ─── State Name Normalization ────────────────────────────────────────────────

STATE_ABBREVIATIONS = {
    "ap": "Andhra Pradesh",
    "ar": "Arunachal Pradesh",
    "as": "Assam",
    "br": "Bihar",
    "cg": "Chhattisgarh",
    "ct": "Chhattisgarh",
    "ga": "Goa",
    "gj": "Gujarat",
    "hr": "Haryana",
    "hp": "Himachal Pradesh",
    "jk": "Jammu And Kashmir",
    "jh": "Jharkhand",
    "ka": "Karnataka",
    "kl": "Kerala",
    "mp": "Madhya Pradesh",
    "mh": "Maharashtra",
    "mn": "Manipur",
    "ml": "Meghalaya",
    "mz": "Mizoram",
    "nl": "Nagaland",
    "od": "Odisha",
    "or": "Odisha",
    "pb": "Punjab",
    "rj": "Rajasthan",
    "sk": "Sikkim",
    "tn": "Tamil Nadu",
    "tg": "Telangana",
    "ts": "Telangana",
    "tr": "Tripura",
    "up": "Uttar Pradesh",
    "uk": "Uttarakhand",
    "ut": "Uttarakhand",
    "wb": "West Bengal",
    "dl": "Delhi",
    "an": "Andaman And Nicobar Islands",
    "ch": "Chandigarh",
    "dn": "Dadra And Nagar Haveli",
    "dd": "Daman And Diu",
    "ld": "Lakshadweep",
    "py": "Puducherry",
    "la": "Ladakh",
}

# Common full-name variations
STATE_ALIASES = {
    "bihar": "Bihar",
    "uttar pradesh": "Uttar Pradesh",
    "madhya pradesh": "Madhya Pradesh",
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    "west bengal": "West Bengal",
    "tamil nadu": "Tamil Nadu",
    "jammu and kashmir": "Jammu And Kashmir",
    "jammu & kashmir": "Jammu And Kashmir",
    "j&k": "Jammu And Kashmir",
    "andaman and nicobar": "Andaman And Nicobar Islands",
    "andaman & nicobar": "Andaman And Nicobar Islands",
    "a&n": "Andaman And Nicobar Islands",
    "dadra and nagar haveli": "Dadra And Nagar Haveli",
    "daman and diu": "Daman And Diu",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "chhattisgarh": "Chhattisgarh",
    "chattisgarh": "Chhattisgarh",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "telangana": "Telangana",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "maharashtra": "Maharashtra",
    "rajasthan": "Rajasthan",
    "punjab": "Punjab",
    "haryana": "Haryana",
    "goa": "Goa",
    "assam": "Assam",
    "jharkhand": "Jharkhand",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "sikkim": "Sikkim",
    "tripura": "Tripura",
    "gujarat": "Gujarat",
    "delhi": "Delhi",
    "chandigarh": "Chandigarh",
    "lakshadweep": "Lakshadweep",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "ladakh": "Ladakh",
}


def normalize_state(text: str) -> Optional[str]:
    """Normalize a state name or abbreviation to its canonical form."""
    cleaned = text.strip().lower()
    # Check abbreviation first
    if cleaned in STATE_ABBREVIATIONS:
        return STATE_ABBREVIATIONS[cleaned]
    # Check aliases
    if cleaned in STATE_ALIASES:
        return STATE_ALIASES[cleaned]
    # Title-case match against known values
    for alias, canonical in STATE_ALIASES.items():
        if canonical.lower() == cleaned:
            return canonical
    return None


# ─── Work ID Extraction ─────────────────────────────────────────────────────

# Matches numeric IDs like "8871", "105744", "999999999"
NUMERIC_WORK_ID_PATTERN = re.compile(r'\b(\d{3,10})\b')
# Matches MPLADS-style IDs like "MPLADS-8871", "MPLADS-BI-M00520"
MPLADS_ID_PATTERN = re.compile(r'MPLADS[-_]?(\S+)', re.IGNORECASE)
# Matches "work X" or "project X" patterns
WORK_REF_PATTERN = re.compile(
    r'(?:work|project|work_id|workid|id)\s*(?:number|num|no\.?|#)?\s*'
    r'[:\s]*(\d{3,10}|MPLADS[-_]?\S+)',
    re.IGNORECASE,
)


def extract_work_ids(text: str) -> List[str]:
    """Extract potential work IDs from user text."""
    ids = []

    # First try explicit work/project references
    for m in WORK_REF_PATTERN.finditer(text):
        ids.append(m.group(1))

    # Then try MPLADS-style IDs
    for m in MPLADS_ID_PATTERN.finditer(text):
        full_id = f"MPLADS-{m.group(1)}" if not m.group(0).upper().startswith("MPLADS-") else m.group(0)
        ids.append(full_id)

    # Then try standalone numeric IDs (only if >= 4 digits to avoid false matches)
    if not ids:
        for m in NUMERIC_WORK_ID_PATTERN.finditer(text):
            ids.append(m.group(1))

    # Deduplicate preserving order
    seen = set()
    unique = []
    for wid in ids:
        key = wid.strip()
        if key not in seen:
            seen.add(key)
            unique.append(key)
    return unique


# ─── General Text Normalization ──────────────────────────────────────────────

def normalize_text(text: str) -> str:
    """Lowercase, strip punctuation, normalize whitespace."""
    cleaned = text.lower().strip()
    cleaned = re.sub(r'[^\w\s-]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def normalize_name(name: str) -> str:
    """Normalize a person/entity name for comparison."""
    cleaned = name.lower().strip()
    # Remove common prefixes
    for prefix in ["shri ", "smt. ", "smt ", "dr. ", "dr ", "hon'ble ", "honble "]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
    # Remove tenure info in parentheses
    cleaned = re.sub(r'\s*\(.*?\)\s*', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def format_currency(amount: float) -> str:
    """Format an amount in INR with appropriate unit (lakhs/crores)."""
    if amount is None:
        return "N/A"
    abs_amt = abs(amount)
    if abs_amt >= 1e7:
        return f"₹{amount / 1e7:.2f} Cr"
    elif abs_amt >= 1e5:
        return f"₹{amount / 1e5:.2f} L"
    else:
        return f"₹{amount:,.0f}"


def format_number(value) -> str:
    """Format a number for display."""
    if value is None:
        return "N/A"
    if isinstance(value, float):
        if value == int(value):
            return f"{int(value):,}"
        return f"{value:,.2f}"
    return f"{value:,}"

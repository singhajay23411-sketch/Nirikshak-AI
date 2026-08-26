"""cleaner.py

Data cleaning and normalization utility functions for the FinGuard module.
Provides methods to strip project-specific prefixes from activity names
and standardise tenure representations.
"""

import re

# Robust pattern matching WS/MP..., WS/RS... or other houses, and financial years, or NA- prefixes.
# e.g., 'WS/MP519/2023-2024/60423-Construction of...' -> 'Construction of...'
# e.g., 'NA-Construction of...' -> 'Construction of...'
PREFIX_PATTERN = re.compile(r'^(WS/(?:MP|RS)?\d+/\d{4}-\d{4}/\d+-|NA-)', re.IGNORECASE)

def clean_activity_name(activity_name: str) -> str:
    """Normalises raw activity names by stripping project-specific prefixes.
    
    Args:
        activity_name: The raw activity name string.
        
    Returns:
        The cleaned, generic activity name suitable for grouping.
    """
    if not isinstance(activity_name, str):
        return ""
    
    # Strip leading/trailing spaces
    cleaned = activity_name.strip()
    
    # Apply regex to remove prefix
    cleaned = PREFIX_PATTERN.sub('', cleaned)
    
    # Strip any additional whitespace left over
    return cleaned.strip()

def normalize_tenure(tenure: str) -> str:
    """Standardises tenure string representations to ensure consistent composite keys.
    
    Args:
        tenure: The raw tenure representation.
        
    Returns:
        Standardised tenure representation.
    """
    if not isinstance(tenure, str):
        return ""
    
    val = tenure.strip()
    if val == "17":
        return "17th Lok Sabha"
    if val == "18":
        return "18th Lok Sabha"
    
    return val

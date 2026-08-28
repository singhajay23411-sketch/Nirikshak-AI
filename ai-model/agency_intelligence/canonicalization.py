"""canonicalization.py

Conservative, deterministic in-memory entity resolution and canonicalization engine
for executing agencies (IA) and district nodal authorities (IDA).
Preserves parent organization and branch-level operational hierarchy.
"""

import re
from typing import Tuple, Dict, Any, List, Optional
import pandas as pd


def clean_branch(text: str, remove_patterns: List[str]) -> str:
    """Extract and standardize branch/division identifier from agency name."""
    cleaned = text
    for p in remove_patterns:
        cleaned = re.sub(r'\b' + re.escape(p) + r'\b', '', cleaned, flags=re.I)
    cleaned = re.sub(
        r'^(?:LTD|LIMITED|PVT|AO|E\.E\.|EE|EXECUTIVE\s+ENGINEER|EXCUTIVE\s+ENGINEER|AREA\s+MANAGER|OFFICE|DIVISION|WORKS\s+DIVISION|IA|KSHETRIYA\s+PRABANDHAK|DISTT|DISTRICT)[,.\-_\s:]+',
        '', cleaned, flags=re.I
    )
    cleaned = re.sub(r'[,.\-_\s:]+(?:LTD|LIMITED|PVT|AO|IA)$', '', cleaned, flags=re.I)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip(" ,-_.:/")
    return cleaned.title() if cleaned else "General / Head Office"


def canonicalize_ia(raw_name: Optional[str]) -> Tuple[str, str, str, str, str, str]:
    """
    Canonically resolve raw Implementing Agency (IA) string into structured entity metadata.

    Returns:
        (canonical_agency_parent, agency_branch, agency_type, match_method, confidence, evidence)
    """
    if not isinstance(raw_name, str) or not raw_name.strip():
        return ("UNKNOWN_AGENCY", "General", "Other", "UNRESOLVED", "LOW", "Empty or non-string IA name")

    # Stage A: Safe formatting normalization
    norm = raw_name.strip()
    norm = re.sub(r'\s+', ' ', norm)
    norm = re.sub(r'^[,\-._/:\s]+|[,\-._/:\s]+$', '', norm)
    upper = norm.upper()

    # 1. UPSIC (UP Small Industries Corporation)
    if (
        bool(re.search(r'\b(UPSIC|UPSICL|U\s*P\s*S\s*I\s*C|UP\s*SIC|UPSIDC)\b', upper)) or
        bool(re.search(r'(?:UTTAR\s+PRADESH|U\s*P|UP)\s+(?:SMALL\s+IND|SMALL\s+INDUSTRIES|LAGHU\s+UD[HY]+OG)', upper)) or
        bool(re.search(r'\bLAGHU\s+UD[HY]+OG\s+NIGAM\b', upper))
    ):
        branch = clean_branch(norm, [
            'UPSIC', 'UPSICL', 'U P S I C', 'UP SIC', 'UTTAR PRADESH SMALL INDUSTRIES CORPORATION',
            'UP SMALL INDUSTRIES CORPORATION', 'UP SMALL INDUSTRIES', 'U P SMALL IND CORP',
            'U P SMALL INDUSTRIES', 'LAGHU UDHYOG NIGAM', 'LAGHU UDYOG NIGAM', 'U P LAGHU UDHYOG NIGA'
        ])
        return (
            "Uttar Pradesh Small Industries Corporation Ltd (UPSIC)",
            branch,
            "Corporation/PSU",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched UPSIC/Laghu Udyog pattern in '{raw_name}'"
        )

    # 2. PCCD (Provincial Co-operative Construction & Development Ltd)
    if bool(re.search(r'\bPCCD\b|PROVINCIAL\s*CO[\s\-]*OP(?:ER|ERR|R)ATIVE\s*C(?:ONST?R|\s*AND\s*D)', upper)):
        branch = clean_branch(norm, [
            'PCCD', 'PROVINCIAL CO OPERATIVE CONSTRUTION AND DEVELOPMENT',
            'PROVINCIAL CO-OPERRATIVE CONSTRUCTION AND DEVELOPMENT',
            'PROVINCIAL CO-OPRATIVE C AND D', 'PROVINCIAL CO OPERATIVE CONSTRUCTION AND DEVELOPMENT'
        ])
        return (
            "Provincial Co-operative Construction & Development Ltd (PCCD)",
            branch,
            "Cooperative",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched PCCD pattern in '{raw_name}'"
        )

    # 3. UP SCIDCO (State Construction & Infrastructure Development Corp)
    if bool(re.search(r'\b(SCIDCO|UP\s*SCIDCO)\b|STATE\s*CONSTRUCTION\s*(?:AND|&)\s*INFRASTRUCTURE', upper)):
        branch = clean_branch(norm, ['SCIDCO', 'UP SCIDCO', 'STATE CONSTRUCTION AND INFRASTRUCTURE DEVELOPMENT CORPORATION'])
        return (
            "UP State Construction and Infrastructure Development Corporation (UP SCIDCO)",
            branch,
            "Corporation/PSU",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched UP SCIDCO pattern in '{raw_name}'"
        )

    # 4. State Agro Industries Development Corporations (MP, UP, WB, etc.)
    if bool(re.search(r'\b(?:AGRO\s+IND|AGRO\s+INDUSTRIES|AGRO\s+INDUSTRIAL)\b', upper)):
        state_corp = "State Agro Industries Development Corporation"
        if bool(re.search(r'\b(?:M\s*P|MADHYA\s*PRADESH)\b', upper)):
            state_corp = "MP State Agro Industries Development Corporation Ltd"
        elif bool(re.search(r'\b(?:U\s*P|UTTAR\s*PRADESH)\b', upper)):
            state_corp = "UP State Agro Industrial Corporation Ltd"
        elif bool(re.search(r'\b(?:W\s*B|WEST\s*BENGAL)\b', upper)):
            state_corp = "West Bengal Agro Industries Corporation Ltd"
        branch = clean_branch(norm, ['MP AGRO', 'M P AGRO', 'AGRO IND DEV CO LTD', 'AGRO INDUSTRIES DEV CORP LTD', 'AGRO INDUSTRIAL CORPORATION LTD'])
        return (
            state_corp,
            branch,
            "Corporation/PSU",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched Agro Industries Corporation pattern in '{raw_name}'"
        )

    # 5. UP Jal Nigam / C&DS (Construction & Design Services)
    if bool(re.search(r'\b(JAL\s*NIGAM|CONSTRUCTION\s*AND\s*DESIGN\s*SERVICES|C&DS|CDS)\b', upper)):
        branch = clean_branch(norm, ['CONSTRUCTION AND DESIGN SERVICES', 'UP JAL NIGAM', 'JAL NIGAM', 'C&DS', 'CDS'])
        return (
            "UP Jal Nigam - Construction and Design Services (C&DS)",
            branch,
            "Corporation/PSU",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched UP Jal Nigam / CDS pattern in '{raw_name}'"
        )

    # 6. KRIDL (Karnataka Rural Infrastructure Development Limited)
    if bool(re.search(r'\b(KRIDL|KLAC)\b|KARNATAKA\s*RURAL\s*INFRASTRUCTURE', upper)):
        branch = clean_branch(norm, ['KRIDL', 'KLAC', 'KARNATAKA RURAL INFRASTRUCTURE DEVELOPMENT LIMITED'])
        return (
            "Karnataka Rural Infrastructure Development Ltd (KRIDL)",
            branch,
            "Corporation/PSU",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched KRIDL pattern in '{raw_name}'"
        )

    # 7. Nirmithi Kendra / Building Center
    if bool(re.search(r'\b(NIRMITHI\s*KENDRA|NIRMITI\s*KENDRA|BUILDING\s*CENTRE|BUILDING\s*CENTER)\b', upper)):
        branch = clean_branch(norm, ['NIRMITHI KENDRA', 'NIRMITI KENDRA', 'BUILDING CENTRE'])
        return (
            "Nirmithi Kendra / Building Centre",
            branch,
            "Corporation/PSU",
            "LOCAL_BODY_RULE",
            "HIGH",
            f"Matched Nirmithi Kendra pattern in '{raw_name}'"
        )

    # 8. Panchayati Raj Engineering Division / PRED / DPRE
    if bool(re.search(r'\b(P\s*R\s*E\s*DIVISION|PANCHAYAT\s*RAJ\s*ENG|PANCHAYATH\s*RAJ\s*ENG|PANCHYAT\s*RAJ\s*ENG|PRED|DPRE)\b', upper)):
        branch = clean_branch(norm, [
            'PRE DIVISION', 'PANCHAYAT RAJ ENGG DIVISION', 'PANCHAYATH RAJ ENGINEERING DIVISION',
            'PANCHYAT RAJ ENGINEERING DEVISION', 'DIST PANCHYAT RAJ ENGINEER', 'DPRE', 'PRED'
        ])
        return (
            "Panchayati Raj Engineering Division (PRED)",
            branch,
            "Engineering Department",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched Panchayati Raj Engineering Division pattern in '{raw_name}'"
        )

    # 9. Rural Engineering Department / Services (RED / RES)
    is_red = bool(re.search(r'\b(RURAL\s*ENGINEERING|R\.E\.S\.|RED|RES|RURAL\s*ENGINEERING\s*DEPORTMENT|RURAL\s*DEVELOPMENT\s*SPECIAL\s*DIVISION)\b', upper))
    is_pred = bool(re.search(r'PANCHAYAT\s*RAJ', upper))
    if is_red and not is_pred:
        branch = clean_branch(norm, [
            'RURAL ENGINEERING DEPARTMENT', 'RURAL ENGINEERING SERVICES', 'RED', 'RES',
            'RURAL ENGINEERING DEPORTMENT', 'RURAL DEVELOPMENT SPECIAL DIVISION'
        ])
        return (
            "Rural Engineering Department / Services (RED/RES)",
            branch,
            "Engineering Department",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched Rural Engineering Department/Services pattern in '{raw_name}'"
        )

    # 10. Local Area Engineering Organization (LAEO)
    if bool(re.search(r'\b(LAEO|L\.A\.E\.O|LOCAL\s*AREA\s*ENGINEERING)\b', upper)):
        branch = clean_branch(norm, ['LAEO', 'L.A.E.O', 'LOCAL AREA ENGINEERING ORGANIZATION'])
        return (
            "Local Area Engineering Organization (LAEO)",
            branch,
            "Engineering Department",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched LAEO pattern in '{raw_name}'"
        )

    # 11. NREP (National Rural Employment Programme execution cell)
    if bool(re.search(r'\b(NREP|N\.R\.E\.P)\b', upper)):
        branch = clean_branch(norm, ['NREP', 'N.R.E.P', 'NATIONAL RURAL EMPLOYMENT PROGRAMME'])
        return (
            "National Rural Employment Programme (NREP) Division",
            branch,
            "Engineering Department",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched NREP pattern in '{raw_name}'"
        )

    # 12. Minor Irrigation / Water Resources / Irrigation Department
    if bool(re.search(r'\b(MINOR\s*IRRIGATION|IRRIGATION\s*DIVISION|IRRIGATION\s*DEPARTMENT|WATER\s*RESOURCE|WATER\s*RESOURCES)\b', upper)):
        branch = clean_branch(norm, [
            'MINOR IRRIGATION DIVISION', 'IRRIGATION DIVISION', 'IRRIGATION DEPARTMENT',
            'WATER RESOURCE DEPARTMENT', 'WATER RESOURCES DEPARTMENT'
        ])
        return (
            "Minor Irrigation / Water Resources Department",
            branch,
            "Engineering Department",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched Irrigation / Water Resources pattern in '{raw_name}'"
        )

    # 13. Public Works Department (PWD / CPWD / APWD)
    if bool(re.search(r'\b(PWD|P\.W\.D\.|PUBLIC\s*WORKS\s*DEPARTMENT|APWD|CPWD)\b', upper)):
        pwd_name = "Public Works Department (PWD)"
        if "CPWD" in upper:
            pwd_name = "Central Public Works Department (CPWD)"
        elif "APWD" in upper:
            pwd_name = "Andaman Public Works Department (APWD)"
        branch = clean_branch(norm, ['PUBLIC WORKS DEPARTMENT', 'PWD', 'CPWD', 'APWD'])
        return (
            pwd_name,
            branch,
            "PWD",
            "ABBREV_AND_ENTITY_NORM",
            "HIGH",
            f"Matched PWD pattern in '{raw_name}'"
        )

    # 14. Zila Parishad / District Panchayat
    if bool(re.search(r'\b(ZILA\s*PARISHAD|ZILLA\s*PARISHAD|DISTRICT\s*PANCHAYAT|ZP\b)\b', upper)):
        branch = clean_branch(norm, ['ZILA PARISHAD', 'ZILLA PARISHAD', 'DISTRICT PANCHAYAT', 'ZP'])
        return (
            "Zila Parishad / District Panchayat",
            branch,
            "Panchayat",
            "LOCAL_BODY_RULE",
            "HIGH",
            f"Matched Zila Parishad pattern in '{raw_name}'"
        )

    # 15. Gram Panchayat (GP / Gaon Panchayat)
    if bool(re.search(r'\b(GRAM\s*PANCHAYAT|GRAM\s*PANCHYAT|G\.P\.|GP\b|GAON\s*PANCHAYAT)\b', upper)):
        branch = clean_branch(norm, ['GRAM PANCHAYAT', 'GRAM PANCHYAT', 'G.P.', 'GP', 'GAON PANCHAYAT'])
        return (
            "Gram Panchayat (GP)",
            branch,
            "Panchayat",
            "LOCAL_BODY_RULE",
            "HIGH",
            f"Matched Gram Panchayat pattern in '{raw_name}'"
        )

    # 16. Block Development Office / Panchayat Samiti / Janpad Panchayat / BDPO / Block <Name>
    if (
        bool(re.search(r'\b(BDO|BDPO|BLOCK\s*DEVELOPMENT|PANCHAYAT\s*SAMITI|JANPAD\s*PANCHAYAT|TALUKA\s*PANCHAYAT|PS\b|JP\b|BP\b)\b', upper)) or
        bool(re.match(r'^BLOCK[-\s]+[A-Z0-9]', upper)) or
        bool(re.match(r'^BDO[A-Z]', upper))
    ):
        branch = clean_branch(norm, [
            'BDO OFFICE', 'BDO', 'BDPO', 'BLOCK DEVELOPMENT OFFICER',
            'BLOCK DEVELOPMENT AND PANCHYAT OFFICE', 'BLOCK DEVELOPMENT AND PANCHAYAT OFFICE',
            'PANCHAYAT SAMITI', 'JANPAD PANCHAYAT', 'TALUKA PANCHAYAT', 'BLOCK'
        ])
        return (
            "Block Development Office / Panchayat Samiti",
            branch,
            "Panchayat",
            "LOCAL_BODY_RULE",
            "HIGH",
            f"Matched Block Development Office / Panchayat Samiti pattern in '{raw_name}'"
        )

    # 17. Urban Local Body / Municipality / Nagar Nigam / Nagar Palika / DUDA
    if bool(re.search(r'\b(NAGAR\s*NIGAM|MUNICIPAL\s*CORPORATION|MUNICIPALITY|NAGAR\s*PALIKA|NAGAR\s*PARISHAD|MUNICIPAL\s*COUNCIL|TOWN\s*PANCHAYAT|NAGAR\s*PANCHAYAT|DUDA)\b', upper)):
        branch = clean_branch(norm, [
            'NAGAR NIGAM', 'MUNICIPAL CORPORATION', 'MUNICIPALITY', 'NAGAR PALIKA',
            'NAGAR PARISHAD', 'MUNICIPAL COUNCIL', 'TOWN PANCHAYAT', 'NAGAR PANCHAYAT', 'DUDA'
        ])
        return (
            "Urban Local Body / Municipality / Nagar Nigam",
            branch,
            "Municipal body",
            "LOCAL_BODY_RULE",
            "HIGH",
            f"Matched Municipal / Urban Local Body pattern in '{raw_name}'"
        )

    # 18. Planning & Development / DPO / DRDA / ITDA
    if bool(re.search(r'\b(DPO|DRDA|ITDA|DISTRICT\s*PLANNING|PLANNING\s*AND\s*DEVELOPMENT|INTEGRATED\s*TRIBAL\s*DEVELOPMENT|PLANNING\s*ECONOMIC)\b', upper)):
        branch = clean_branch(norm, [
            'DPO', 'DRDA', 'ITDA', 'DISTRICT PLANNING OFFICER', 'DISTRICT PLANNING OFFICE',
            'PLANNING AND DEVELOPMENT DEPARTMENT', 'PLANNING ECONOMIC AND STATISTICS OFFICE'
        ])
        return (
            "District Planning / Development Agency (DPO/DRDA/ITDA)",
            branch,
            "Line Department/Officer",
            "DISTRICT_AGENCY_RULE",
            "HIGH",
            f"Matched District Development Agency pattern in '{raw_name}'"
        )

    # 19. Education
    if bool(re.search(r'\b(EDUCATION|COLLEGE|SCHOOL|UNIVERSITY|POLYTECHNIC|ITI)\b', upper)):
        branch = clean_branch(norm, ['DEPARTMENT OF TECHNICAL EDUCATION', 'TECHNICAL EDUCATION DEPARTMENT', 'EDUCATION DEPARTMENT'])
        return (
            "Education Department / Institution",
            branch,
            "Line Department/Officer",
            "DEPARTMENT_RULE",
            "HIGH",
            f"Matched Education Institution/Department pattern in '{raw_name}'"
        )

    # 20. Animal Husbandry
    if bool(re.search(r'\b(ANIMAL\s*HUSBANDRY|VETERINARY)\b', upper)):
        branch = clean_branch(norm, ['ANIMAL HUSBANDRY AND VETERINARY SERVICES', 'ANIMAL HUSBANDRY DEPARTMENT'])
        return (
            "Animal Husbandry & Veterinary Services",
            branch,
            "Line Department/Officer",
            "DEPARTMENT_RULE",
            "HIGH",
            f"Matched Animal Husbandry pattern in '{raw_name}'"
        )

    # 21. Health & Medical
    if bool(re.search(r'\b(HEALTH|HOSPITAL|FAMILY\s*WELFARE|MEDICAL|CHIEF\s*MEDICAL\s*OFFICER|CMO)\b', upper)):
        branch = clean_branch(norm, ['HEALTH AND FAMILY WELFARE', 'MEDICAL DEPARTMENT', 'CHIEF MEDICAL OFFICER', 'HOSPITAL'])
        return (
            "Health & Family Welfare / Medical Services",
            branch,
            "Line Department/Officer",
            "DEPARTMENT_RULE",
            "HIGH",
            f"Matched Health & Medical Services pattern in '{raw_name}'"
        )

    # 22. Forest
    if bool(re.search(r'\b(FOREST|DFO|DIVISIONAL\s*FOREST\s*OFFICER)\b', upper)):
        branch = clean_branch(norm, ['FOREST DEPARTMENT', 'DIVISIONAL FOREST OFFICER', 'DFO'])
        return (
            "Forest Department",
            branch,
            "Line Department/Officer",
            "DEPARTMENT_RULE",
            "HIGH",
            f"Matched Forest Department pattern in '{raw_name}'"
        )

    # 23. Cooperative
    if bool(re.search(r'\b(CO[\s\-]*OPERATIVE|COLD\s*STORAGE\s*FEDERATION|CLDF|FEDERATION)\b', upper)):
        branch = clean_branch(norm, ['COOPERATIVE FEDERATION', 'FEDERATION'])
        return (
            "Co-operative Federation / Society",
            branch,
            "Cooperative",
            "COOPERATIVE_RULE",
            "MEDIUM",
            f"Matched Co-operative pattern in '{raw_name}'"
        )

    # 24. KEL
    if bool(re.search(r'\b(KEL\s*KUNDARA|KERALA\s*ELECTRICAL)\b', upper)):
        return (
            "Kerala Electrical & Allied Engineering Co. Ltd. (KEL)",
            "Kundara",
            "Corporation/PSU",
            "ENTITY_NORM",
            "HIGH",
            f"Matched KEL pattern in '{raw_name}'"
        )

    # Fallback 1: Officer title
    clean_title = norm.title()
    if bool(re.match(r'^(?:Executive\s+Engineer|Exe\.?\s*Eng\.?|E\.E\.?|Assistant\s+Engineer|A\.E\.?)[,\s]+', clean_title, re.I)):
        branch = re.sub(r'^(?:Executive\s+Engineer|Exe\.?\s*Eng\.?|E\.E\.?|Assistant\s+Engineer|A\.E\.?)[,\s]+', '', clean_title, flags=re.I).strip()
        return (
            "State Engineering Division (General)",
            branch.title() if branch else "General",
            "Engineering Department",
            "ENGINEERING_OFFICER_RULE",
            "MEDIUM",
            f"Standardized Executive Engineer title: '{raw_name}'"
        )

    return (
        clean_title,
        "General",
        "Other",
        "FALLBACK_CLEAN",
        "MEDIUM" if len(raw_name) > 5 else "LOW",
        f"Cleaned capitalization and whitespace: '{raw_name}'"
    )


def canonicalize_ida(raw_name: Optional[str]) -> Tuple[str, str]:
    """
    Canonically resolve raw Implementing District Authority (IDA) string.

    Returns:
        (canonical_ida_name, district)
    """
    if not isinstance(raw_name, str) or not raw_name.strip():
        return ("UNKNOWN_IDA", "UNKNOWN")
    raw = raw_name.strip()
    raw_clean = re.sub(r'\s+', ' ', raw)
    m = re.match(r"^(.*?)\s*\((.*?)\)$", raw_clean)
    if m:
        clean_dist = m.group(1).strip().title()
        role = re.sub(r'\bDISTRICT MAGISTRAE\b', 'DISTRICT MAGISTRATE', m.group(2).strip(), flags=re.I)
        role = re.sub(r'_IDA$', '', role).strip()
        role = re.sub(r'_\d+$', '', role).strip()
        return f"District Authority - {clean_dist} ({role})", clean_dist
    clean = raw_clean.title()
    return f"District Authority - {clean}", clean

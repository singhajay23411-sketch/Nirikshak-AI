"""scrape_rajya_sabha.py

Production-grade ETL pipeline for Rajya Sabha MPLADS records.
Fetches data for ALL states across India with resilience, checkpointing, and batch commits.
Appends safely alongside Lok Sabha records in PostgreSQL.
"""

import os
import json
import time
import requests
from typing import List, Optional
from datetime import datetime
from tqdm import tqdm
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

# Local imports
from backend.database import (
    get_connection,
    ensure_database_exists,
    initialise_schema,
    upsert_state,
    upsert_constituency,
    upsert_mp,
    upsert_mp_allocation,
    batch_upsert_works,
    batch_upsert_vendors,
    batch_insert_expenditures,
    get_table_counts,
    State,
    Constituency,
    MP,
    MPAllocation,
    Work,
    Vendor,
    Expenditure,
)

# ---------------------------------------------------------------------------
# Constants & Config
# ---------------------------------------------------------------------------
BASE_URL = "https://mplads.mospi.gov.in/rest/PreLoginDashboardData"
HEADERS = {
    "Content-Type": "application/json; charset=UTF-8",
    "Origin": "https://mplads.mospi.gov.in",
    "Referer": "https://mplads.mospi.gov.in/digigov/dashboard.html",
    "X-Requested-With": "XMLHttpRequest",
}

# Rajya Sabha = 1
HOUSE_TYPE = 1
# Tenure ID (using 7 as baseline for current APIs)
TENURE_ID = 7
# Checkpoint file path specifically for Rajya Sabha
CHECKPOINT_FILE = os.path.join(os.path.dirname(__file__), "checkpoint_rs.json")

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ---------------------------------------------------------------------------
# Checkpoint Management
# ---------------------------------------------------------------------------
def load_checkpoint() -> dict:
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            pass
    return {"last_state_id": None, "last_mp_id": None}

def save_checkpoint(state_id: Optional[int], mp_id: Optional[int]):
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump({"last_state_id": state_id, "last_mp_id": mp_id}, f)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def parse_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str or date_str.strip() == "":
        return None
    for fmt in ("%d-%b-%Y", "%b %d, %Y %I:%M:%S %p", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

# ---------------------------------------------------------------------------
# Resilient API Wrappers
# ---------------------------------------------------------------------------
@retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(5), 
       retry=retry_if_exception_type((requests.exceptions.RequestException, json.JSONDecodeError)))
def resilient_post(url: str, payload: dict) -> dict:
    resp = SESSION.post(url, json=payload, timeout=30, verify=False)
    resp.raise_for_status()
    raw = resp.json()
    if isinstance(raw, str):
        return json.loads(raw)
    return raw

def fetch_states() -> List[dict]:
    return resilient_post(f"{BASE_URL}/getStateData", {})

def fetch_mp_names(state_id: int) -> List[dict]:
    combo = f"{state_id},{HOUSE_TYPE},{TENURE_ID}"
    return resilient_post(f"{BASE_URL}/getMpNamesData", {"state_combo": combo})

def fetch_tile_report(combo: str, key: str) -> list:
    raw = resilient_post(f"{BASE_URL}/getTilesReportData", {"combo": combo, "key": key})
    if isinstance(raw, dict):
        for v in raw.values():
            if isinstance(v, str):
                try:
                    return json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    pass
        return [raw]
    return raw if isinstance(raw, list) else []

# ---------------------------------------------------------------------------
# Data Processing logic per MP
# ---------------------------------------------------------------------------
def process_mp(conn, state_id: int, const_id: int, mp_id: int, mp_name: str, state_name: str, const_name: str):
    """Fetch and store all data for a single Rajya Sabha MP."""
    # For Rajya Sabha, constituency ID in the combo is usually 0
    combo_mp = f"{state_id},0,{mp_id},{HOUSE_TYPE},{TENURE_ID}"
    
    all_works = {}
    vendors_seen = {}
    expenditures = []
    
    # 1. Works (Recommended, Sanctioned, Completed)
    tile_configs = [
        ("Works Recommended", "Recommended"),
        ("Works Sanctioned", "Sanctioned"),
        ("Works Completed", "Completed"),
    ]
    
    for tile_key, status_label in tile_configs:
        items = fetch_tile_report(combo_mp, tile_key)
        for item in items:
            work_id = item.get("WORK_RECOMMENDATION_DTL_ID") or item.get("WORK_ID")
            if not work_id:
                continue

            existing = all_works.get(work_id)
            work = Work(
                work_id=work_id,
                activity_name=item.get("ACTIVITY_NAME"),
                work_description=item.get("WORK_DESCRIPTION"),
                work_category=item.get("WORK_CATEGORY"),
                mp_id=mp_id,
                house_type=HOUSE_TYPE,
                tenure="Rajya Sabha",
                constituency_id=const_id,
                state_id=state_id,
                ida_name=item.get("IDA_NAME"),
                letter_no=item.get("LETTER_NO"),
                recommended_amount=item.get("RECOMMENDED_AMOUNT"),
                sanction_amount=item.get("SANCTION_AMOUNT"),
                actual_amount=item.get("ACTUAL_AMOUNT"),
                recommendation_date=parse_date(item.get("RECOMMENDATION_DATE")),
                sanction_date=parse_date(item.get("SANCTION_DATE")),
                actual_end_date=parse_date(item.get("ACTUAL_END_DATE")),
                work_stage=item.get("WORK_STAGE"),
                work_status=status_label,
                average_rating=item.get("AVERAGE_RATING"),
                flag=item.get("FLAG"),
            )

            if existing:
                work.recommended_amount = work.recommended_amount or existing.recommended_amount
                work.sanction_amount = work.sanction_amount or existing.sanction_amount
                work.actual_amount = work.actual_amount or existing.actual_amount
                work.recommendation_date = work.recommendation_date or existing.recommendation_date
                work.sanction_date = work.sanction_date or existing.sanction_date
                work.actual_end_date = work.actual_end_date or existing.actual_end_date
                work.average_rating = work.average_rating or existing.average_rating
                
                status_rank = {"Recommended": 1, "Sanctioned": 2, "Completed": 3}
                if status_rank.get(work.work_status, 0) < status_rank.get(existing.work_status, 0):
                    work.work_status = existing.work_status

            all_works[work_id] = work
    
    # 2. Expenditures
    exp_items = fetch_tile_report(combo_mp, "Expenditure on Completed and On-going Works as on Date")
    for item in exp_items:
        vendor_id = item.get("VENDOR_ID")
        vendor_name = item.get("VENDOR_NAME", "")
        if vendor_id and vendor_name:
            vendors_seen[vendor_id] = vendor_name

        work_id = item.get("WORK_RECOMMENDATION_DTL_ID")
        if not work_id:
            str_id = item.get("WORK_ID", "")
            if "-" in str_id:
                work_id = int(str_id.split("-")[-1])
            elif "/" in str_id:
                work_id = int(str_id.split("/")[-1])
            else:
                work_id = int(str_id) if str_id else None

        if work_id:
            expenditures.append(Expenditure(
                work_id=work_id,
                vendor_id=vendor_id,
                fund_disbursed_amount=item.get("FUND_DISBURSED_AMT"),
                expenditure_date=parse_date(item.get("EXPENDITURE_DATE")),
                ia_name=item.get("IA_NAME"),
                mp_id=mp_id,
                house_type=HOUSE_TYPE,
                tenure="Rajya Sabha",
                constituency=const_name, # Nodal District mapping
                work_status=item.get("WORK_STATUS"),
            ))

    # Perform DB batch inserts safely alongside Lok Sabha (UPSERT logic handles duplicates cleanly)
    batch_upsert_works(conn, list(all_works.values()))
    
    vendor_objs = [Vendor(vendor_id=vid, vendor_name=vname) for vid, vname in vendors_seen.items()]
    batch_upsert_vendors(conn, vendor_objs)
    
    batch_insert_expenditures(conn, expenditures)

    return len(all_works), len(expenditures)


# ---------------------------------------------------------------------------
# Main Routine
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("NIRIKSHAK AI - RAJYA SABHA ETL SCRAPER")
    print("=" * 60)
    
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    ensure_database_exists()
    conn = get_connection()
    initialise_schema(conn)

    checkpoint = load_checkpoint()
    last_state_id = checkpoint.get("last_state_id")
    last_mp_id = checkpoint.get("last_mp_id")
    
    if last_state_id:
        print(f"Resuming Rajya Sabha from checkpoint (State ID: {last_state_id}, MP ID: {last_mp_id})")

    print("Fetching master list of states...")
    states = fetch_states()
    
    for state_item in tqdm(states, desc="[Rajya Sabha] States"):
        state_id = state_item["STATE_ID"]
        state_name = state_item["STATE_NAME"]
        
        if last_state_id and state_id < last_state_id:
            continue
            
        upsert_state(conn, State(state_id=state_id, state_name=state_name))
        
        # Create a generic Nodal District constituency for the Rajya Sabha MPs of this state
        nodal_const_id = -state_id  # Use negative IDs to avoid colliding with actual Lok Sabha constituencies
        nodal_const_name = f"{state_name} (Rajya Sabha Nodal District)"
        
        upsert_constituency(conn, Constituency(
            constituency_id=nodal_const_id, 
            constituency_name=nodal_const_name, 
            state_id=state_id
        ))
        
        mp_list = fetch_mp_names(state_id)
        if not mp_list:
            continue

        for mp_item in tqdm(mp_list, desc=f"[Rajya Sabha] [{state_name}] MPs", leave=False):
            mp_id = mp_item["ID"]
            mp_name = mp_item["CAPTION"]
            
            if last_state_id and last_mp_id and state_id == last_state_id and mp_id <= last_mp_id:
                continue

            upsert_mp(conn, MP(
                mp_id=mp_id, 
                mp_name=mp_name, 
                constituency_id=nodal_const_id,
                house_type=HOUSE_TYPE, 
                tenure="Rajya Sabha"
            ))

            process_mp(conn, state_id, nodal_const_id, mp_id, mp_name, state_name, nodal_const_name)
            
            conn.commit()
            save_checkpoint(state_id, mp_id)
            time.sleep(0.3)

    print("\n" + "=" * 60)
    print("RAJYA SABHA EXTRACTION COMPLETE")
    print("=" * 60)
    counts = get_table_counts(conn)
    for table, count in counts.items():
        print(f"  {table}: {count} rows")

    conn.close()
    
    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)

if __name__ == "__main__":
    main()

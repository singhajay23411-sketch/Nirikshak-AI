"""scraper.py

ETL pipeline for MPLADS government records.
Fetches States -> Constituencies -> MPs -> Allocations -> Works -> Expenditures
from the MPLADS dashboard API and stores everything into PostgreSQL.
"""

import json
import time
import requests
from typing import List, Optional
from datetime import datetime

# Local imports
from .database import (
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
    fetch_all_for_analytics,
    State,
    Constituency,
    MP,
    MPAllocation,
    Work,
    Vendor,
    Expenditure,
)

# ---------------------------------------------------------------------------
# API configuration
# ---------------------------------------------------------------------------
BASE_URL = "https://mplads.mospi.gov.in/rest/PreLoginDashboardData"
STATE_URL = f"{BASE_URL}/getStateData"
CONST_URL = f"{BASE_URL}/getConstituencyData"
MP_NAMES_URL = f"{BASE_URL}/getMpNamesData"
TILES_URL = f"{BASE_URL}/getTilesData"
TILES_REPORT_URL = f"{BASE_URL}/getTilesReportData"

HEADERS = {
    "Content-Type": "application/json; charset=UTF-8",
    "Origin": "https://mplads.mospi.gov.in",
    "Referer": "https://mplads.mospi.gov.in/digigov/dashboard.html",
    "X-Requested-With": "XMLHttpRequest",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

# Lok Sabha = 2, Rajya Sabha = 1
HOUSE_TYPE = 2
# 18th Lok Sabha tenure ID
TENURE_ID = 7

# ---------------------------------------------------------------------------
# Date parsing helper
# ---------------------------------------------------------------------------

def parse_date(date_str: Optional[str]) -> Optional[str]:
    """Parse various date formats from the API into YYYY-MM-DD for PostgreSQL."""
    if not date_str or date_str.strip() == "":
        return None
    # Try "dd-MMM-yyyy" format (e.g. "02-Apr-2025")
    for fmt in ("%d-%b-%Y", "%b %d, %Y %I:%M:%S %p", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# API fetch helpers
# ---------------------------------------------------------------------------

def fetch_states() -> List[dict]:
    """Fetch all states. Response keys: STATE_ID, STATE_NAME."""
    resp = SESSION.post(STATE_URL, json={})
    resp.raise_for_status()
    return resp.json()


def fetch_constituencies(state_id: int) -> List[dict]:
    """Fetch constituencies for a state. Payload: {"id": "<state_id>"}."""
    resp = SESSION.post(CONST_URL, json={"id": str(state_id)})
    resp.raise_for_status()
    return resp.json()


def fetch_mp_names(state_id: int, house_type: int = HOUSE_TYPE,
                   tenure_id: int = TENURE_ID) -> List[dict]:
    """Fetch MP names. Payload: {"state_combo": "stateId,houseType,tenureId"}."""
    combo = f"{state_id},{house_type},{tenure_id}"
    resp = SESSION.post(MP_NAMES_URL, json={"state_combo": combo})
    resp.raise_for_status()
    return resp.json()


def fetch_tiles_summary(state_id: int, const_id: int = 0,
                        mp_id: int = 0, house_type: int = HOUSE_TYPE,
                        tenure_id: int = TENURE_ID) -> dict:
    """Fetch dashboard tile summary metrics."""
    uname = f"{state_id},{const_id},{mp_id},{house_type},{tenure_id}"
    resp = SESSION.post(TILES_URL, json={"uname": uname})
    resp.raise_for_status()
    return resp.json()


def fetch_tile_report(combo: str, key: str) -> list:
    """Fetch detailed tile report data. May return JSON-string-wrapped lists."""
    resp = SESSION.post(TILES_REPORT_URL, json={"combo": combo, "key": key})
    resp.raise_for_status()
    raw = resp.json()
    if isinstance(raw, str):
        return json.loads(raw)
    if isinstance(raw, dict):
        for v in raw.values():
            if isinstance(v, str):
                try:
                    return json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    pass
        return [raw]
    return raw


# ---------------------------------------------------------------------------
# MP-to-Constituency mapping builder
# ---------------------------------------------------------------------------

def build_mp_constituency_map(state_id: int, constituencies: List[dict]) -> dict:
    """For each constituency, fetch tiles to find which MP belongs there.
    Returns {mp_name: constituency_id}."""
    mp_const_map = {}
    for const in constituencies:
        combo = f"{state_id},{const['ID']},0,{HOUSE_TYPE},{TENURE_ID}"
        try:
            report = fetch_tile_report(combo, "Allocated Limit for Hon'ble MPs")
            if isinstance(report, list):
                for item in report:
                    mp_name = item.get("MP_NAME", "").strip()
                    if mp_name:
                        mp_const_map[mp_name] = const["ID"]
        except Exception:
            pass
        time.sleep(0.1)  # gentle throttle
    return mp_const_map


# ---------------------------------------------------------------------------
# Main ingestion pipeline
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("NIRIKSHAK AI - MPLADS ETL PIPELINE")
    print("=" * 60)

    # -- Setup --
    print("\n[1/8] Setting up database...")
    ensure_database_exists()
    conn = get_connection()
    initialise_schema(conn)
    print("  Database schema ready.")

    # -- States --
    print("\n[2/8] Fetching states...")
    states = fetch_states()
    print(f"  Got {len(states)} states.")

    bihar = next((s for s in states if s.get("STATE_NAME") == "Bihar"), None)
    if not bihar:
        print("  ERROR: State 'Bihar' not found. Aborting.")
        return

    bihar_id = bihar["STATE_ID"]
    state = State(state_id=bihar_id, state_name=bihar["STATE_NAME"])
    upsert_state(conn, state)
    print(f"  Inserted: {state.state_name} (id={state.state_id})")

    # -- Constituencies --
    print(f"\n[3/8] Fetching constituencies for {state.state_name}...")
    consts = fetch_constituencies(state.state_id)
    if not consts:
        print("  ERROR: No constituencies returned. Aborting.")
        return
    print(f"  Got {len(consts)} constituencies.")

    const_id_map = {}  # name -> id
    for c in consts:
        constituency = Constituency(
            constituency_id=c["ID"],
            constituency_name=c["CAPTION"],
            state_id=state.state_id,
        )
        upsert_constituency(conn, constituency)
        const_id_map[c["CAPTION"].strip().upper()] = c["ID"]
    print(f"  Inserted {len(consts)} constituencies.")

    # -- MPs --
    print(f"\n[4/8] Fetching MPs for {state.state_name} (Lok Sabha)...")
    mp_list = fetch_mp_names(state.state_id)
    if not mp_list:
        print("  ERROR: No MP data returned. Aborting.")
        return
    print(f"  Got {len(mp_list)} MPs.")

    # We need MP-constituency mapping from allocation data
    # Fetch allocations first to get constituency info per MP
    combo_state = f"{state.state_id},0,0,{HOUSE_TYPE},{TENURE_ID}"
    print("  Fetching allocation data for MP-constituency mapping...")
    alloc_data = fetch_tile_report(combo_state, "Allocated Limit for Hon'ble MPs")
    time.sleep(0.3)

    # Build name->constituency mapping from allocation data
    mp_name_to_const = {}
    if isinstance(alloc_data, list):
        for item in alloc_data:
            mp_name = item.get("MP_NAME", "").strip()
            const_name = item.get("CONSTITUENCY", "").strip().upper()
            if mp_name and const_name:
                # Handle suffixed names like "AURANGABAD_BR"
                for key in const_id_map:
                    if const_name.startswith(key) or key.startswith(const_name):
                        mp_name_to_const[mp_name.upper()] = const_id_map[key]
                        break
                else:
                    # Exact match attempt
                    if const_name in const_id_map:
                        mp_name_to_const[mp_name.upper()] = const_id_map[const_name]

    # Build MP id -> name mapping
    mp_id_map = {}  # name -> mp_id
    first_const_id = consts[0]["ID"]  # fallback
    for mp_item in mp_list:
        mp_name_upper = mp_item["CAPTION"].strip().upper()
        const_id = mp_name_to_const.get(mp_name_upper, first_const_id)
        mp = MP(
            mp_id=mp_item["ID"],
            mp_name=mp_item["CAPTION"],
            constituency_id=const_id,
            house_type=HOUSE_TYPE,
            tenure="18th Lok Sabha",
        )
        upsert_mp(conn, mp)
        mp_id_map[mp_name_upper] = mp_item["ID"]
    print(f"  Inserted {len(mp_list)} MPs with constituency mappings.")

    # -- Allocations --
    print(f"\n[5/8] Inserting MP allocations...")
    alloc_count = 0
    if isinstance(alloc_data, list):
        for item in alloc_data:
            mp_name = item.get("MP_NAME", "").strip().upper()
            mp_id = mp_id_map.get(mp_name)
            if mp_id:
                alloc = MPAllocation(
                    mp_id=mp_id,
                    allocated_amount=item.get("ALLOCATED_AMT", 0),
                    house_name=item.get("HOUSE_NAME", "Lok Sabha"),
                    tenure=item.get("TENURE", "18th Lok Sabha"),
                )
                upsert_mp_allocation(conn, alloc)
                alloc_count += 1
    print(f"  Inserted {alloc_count} allocation records.")

    # -- Works (Recommended + Sanctioned + Completed) --
    print(f"\n[6/8] Fetching work records...")
    tile_configs = [
        ("Works Recommended", "Recommended"),
        ("Works Sanctioned", "Sanctioned"),
        ("Works Completed", "Completed"),
    ]

    all_works = {}  # work_id -> Work (deduplicate by work_id)
    for tile_key, status_label in tile_configs:
        print(f"  Fetching '{tile_key}'...")
        try:
            items = fetch_tile_report(combo_state, tile_key)
        except Exception as e:
            print(f"    ERROR: {e}")
            continue

        if not isinstance(items, list):
            print(f"    Unexpected response type: {type(items)}")
            continue

        print(f"    Got {len(items)} records.")
        for item in items:
            work_id = item.get("WORK_RECOMMENDATION_DTL_ID") or item.get("WORK_ID")
            if not work_id:
                continue

            mp_name = item.get("MP_NAME", "").strip().upper()
            mp_id = mp_id_map.get(mp_name)
            const_id_val = item.get("CONSTITUENCY_ID")
            const_name = item.get("CONSTITUENCY", "").strip().upper()
            if not const_id_val and const_name:
                for key in const_id_map:
                    if const_name.startswith(key) or key.startswith(const_name):
                        const_id_val = const_id_map[key]
                        break

            # Build or update work record
            existing = all_works.get(work_id)
            work = Work(
                work_id=work_id,
                activity_name=item.get("ACTIVITY_NAME"),
                work_description=item.get("WORK_DESCRIPTION"),
                work_category=item.get("WORK_CATEGORY"),
                mp_id=mp_id,
                constituency_id=const_id_val,
                state_id=state.state_id,
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

            # Merge with existing if we've seen this work_id before
            if existing:
                work.recommended_amount = work.recommended_amount or existing.recommended_amount
                work.sanction_amount = work.sanction_amount or existing.sanction_amount
                work.actual_amount = work.actual_amount or existing.actual_amount
                work.recommendation_date = work.recommendation_date or existing.recommendation_date
                work.sanction_date = work.sanction_date or existing.sanction_date
                work.actual_end_date = work.actual_end_date or existing.actual_end_date
                work.average_rating = work.average_rating or existing.average_rating
                # Keep the most advanced status
                status_rank = {"Recommended": 1, "Sanctioned": 2, "Completed": 3}
                if status_rank.get(work.work_status, 0) < status_rank.get(existing.work_status, 0):
                    work.work_status = existing.work_status

            all_works[work_id] = work
        time.sleep(0.3)

    # Batch insert all deduplicated works
    works_list = list(all_works.values())
    batch_upsert_works(conn, works_list)
    print(f"  Total unique works: {len(works_list)}")

    # -- Expenditures --
    print(f"\n[7/8] Fetching expenditure records...")
    try:
        exp_items = fetch_tile_report(
            combo_state,
            "Expenditure on Completed and On-going Works as on Date"
        )
    except Exception as e:
        print(f"  ERROR: {e}")
        exp_items = []

    vendors_seen = {}
    expenditures = []
    if isinstance(exp_items, list):
        print(f"  Got {len(exp_items)} expenditure records.")
        for item in exp_items:
            vendor_id = item.get("VENDOR_ID")
            vendor_name = item.get("VENDOR_NAME", "")
            if vendor_id and vendor_name:
                vendors_seen[vendor_id] = vendor_name

            work_id = item.get("WORK_RECOMMENDATION_DTL_ID")
            if not work_id:
                # Fallback: extract the trailing number from the string WORK_ID
                str_id = item.get("WORK_ID", "")
                if "-" in str_id:
                    work_id = int(str_id.split("-")[-1])
                elif "/" in str_id:
                    work_id = int(str_id.split("/")[-1])
                else:
                    work_id = int(str_id) if str_id else None

            mp_name = item.get("MP_NAME", "").strip().upper()
            mp_id = mp_id_map.get(mp_name)

            expenditures.append(Expenditure(
                work_id=work_id,
                vendor_id=vendor_id,
                fund_disbursed_amount=item.get("FUND_DISBURSED_AMT"),
                expenditure_date=parse_date(item.get("EXPENDITURE_DATE")),
                ia_name=item.get("IA_NAME"),
                mp_id=mp_id,
                constituency=item.get("CONSTITUENCY"),
                work_status=item.get("WORK_STATUS"),
            ))

    # Insert vendors first (FK dependency)
    vendor_objs = [Vendor(vendor_id=vid, vendor_name=vname)
                   for vid, vname in vendors_seen.items()]
    batch_upsert_vendors(conn, vendor_objs)
    print(f"  Inserted {len(vendor_objs)} unique vendors.")

    # Insert expenditures
    batch_insert_expenditures(conn, expenditures)
    print(f"  Inserted {len(expenditures)} expenditure records.")

    # -- Verification --
    print(f"\n[8/8] Verification...")
    print("=" * 60)
    counts = get_table_counts(conn)
    for table, count in counts.items():
        print(f"  {table}: {count} rows")

    print("\nSample analytics data (first 5 works):")
    df = fetch_all_for_analytics(conn)
    if not df.empty:
        print(df.head(5).to_string(index=False))
    else:
        print("  (No data)")

    conn.close()
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    main()

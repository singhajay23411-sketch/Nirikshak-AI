"""sync_incremental.py

Incremental Synchronization Pipeline.
Fetches active 18th Lok Sabha and Rajya Sabha data.
Uses MD5 hashing to detect deltas and only inserts/updates new or changed records.
"""

import os
import json
import time
import hashlib
import requests
import psycopg2
import psycopg2.extras
from typing import List, Optional, Tuple, Dict
from datetime import datetime
from tqdm import tqdm
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from backend.database import get_connection

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

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def parse_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str or str(date_str).strip() == "":
        return None
    for fmt in ("%d-%b-%Y", "%b %d, %Y %I:%M:%S %p", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(date_str).strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def gen_hash(*args) -> str:
    """Generate MD5 hash from a list of arguments."""
    hash_str = "_".join(str(a) for a in args)
    return hashlib.md5(hash_str.encode()).hexdigest()

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

def fetch_constituencies(state_id: int) -> List[dict]:
    return resilient_post(f"{BASE_URL}/getConstituencyData", {"id": str(state_id)})

def fetch_mp_names(state_combo: str) -> List[dict]:
    return resilient_post(f"{BASE_URL}/getMpNamesData", {"state_combo": state_combo})

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
# Main Sync Logic
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("NIRIKSHAK AI - INCREMENTAL DELTA SYNC")
    print("=" * 60)
    start_time = time.time()
    
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    conn = get_connection()
    cur = conn.cursor()

    # Preload Hashes
    print("Preloading hashes into memory...")
    
    cur.execute("SELECT work_id, record_hash FROM works")
    works_hashes = {str(row[0]): row[1] for row in cur.fetchall()}
    
    cur.execute("SELECT mp_id, house_type, tenure, record_hash FROM mp_allocations")
    alloc_hashes = {f"{row[0]}_{row[1]}_{row[2]}": row[3] for row in cur.fetchall()}
    
    cur.execute("SELECT work_id, vendor_id, expenditure_date, record_hash FROM expenditures")
    exp_hashes = {f"{row[0]}_{row[1]}_{row[2]}": row[3] for row in cur.fetchall()}

    stats = {
        "works": {"inspected": 0, "skipped": 0, "new": 0, "updated": 0},
        "expenditures": {"inspected": 0, "skipped": 0, "new": 0, "updated": 0},
        "allocations": {"inspected": 0, "skipped": 0, "new": 0, "updated": 0},
    }

    print("Fetching master list of states...")
    states = fetch_states()
    
    new_works, updated_works = [], []
    new_exps, updated_exps = [], []
    new_allocs, updated_allocs = [], []
    
    # Target Active MPs Only: 18th LS (HOUSE=2, TENURE=7) and RS (HOUSE=1, TENURE=7)
    target_configs = [
        {"name": "18th Lok Sabha", "house_type": 2, "tenure_id": 7, "tenure_label": "18th Lok Sabha"},
        {"name": "Rajya Sabha", "house_type": 1, "tenure_id": 7, "tenure_label": "Rajya Sabha"}
    ]

    for config in target_configs:
        house_type = config["house_type"]
        tenure_id = config["tenure_id"]
        tenure_label = config["tenure_label"]
        
        for state_item in tqdm(states, desc=f"[{config['name']}] States"):
            state_id = state_item["STATE_ID"]
            
            # Constituencies (Fetch or simulate for RS)
            if house_type == 2:
                constituencies = fetch_constituencies(state_id)
            else:
                constituencies = [{"ID": -state_id, "CAPTION": f"{state_item['STATE_NAME']} (Rajya Sabha Nodal District)"}]
                
            combo_mp_names = f"{state_id},{house_type},{tenure_id}"
            mp_list = fetch_mp_names(combo_mp_names)
            
            for mp_item in tqdm(mp_list, desc="MPs", leave=False):
                mp_id = mp_item["ID"]
                const_id = constituencies[0]["ID"] if constituencies else 0
                combo = f"{state_id},{const_id},{mp_id},{house_type},{tenure_id}"
                
                # 1. MP Allocations
                alloc_data = fetch_tile_report(combo, "Allocated Limit for Hon'ble MPs")
                if alloc_data:
                    alloc = alloc_data[0]
                    alloc_amt = alloc.get("ALLOCATED_AMT", 0)
                    alloc_hash = gen_hash(mp_id, alloc_amt)
                    
                    stats["allocations"]["inspected"] += 1
                    key = f"{mp_id}_{house_type}_{tenure_label}"
                    
                    record = (mp_id, house_type, tenure_label, alloc_amt, "Lok Sabha" if house_type == 2 else "Rajya Sabha", alloc_hash)
                    
                    if key not in alloc_hashes:
                        new_allocs.append(record)
                        stats["allocations"]["new"] += 1
                    elif alloc_hashes[key] != alloc_hash:
                        updated_allocs.append(record)
                        stats["allocations"]["updated"] += 1
                    else:
                        stats["allocations"]["skipped"] += 1

                # 2. Works
                tile_configs = [
                    ("Works Recommended", "Recommended"),
                    ("Works Sanctioned", "Sanctioned"),
                    ("Works Completed", "Completed"),
                ]
                
                works_seen_this_mp = {}
                for tile_key, status_label in tile_configs:
                    items = fetch_tile_report(combo, tile_key)
                    for item in items:
                        work_id = str(item.get("WORK_RECOMMENDATION_DTL_ID") or item.get("WORK_ID"))
                        if not work_id or work_id == "None": continue
                        
                        sanc_amt = item.get("SANCTION_AMOUNT")
                        act_amt = item.get("ACTUAL_AMOUNT")
                        end_date = parse_date(item.get("ACTUAL_END_DATE"))
                        
                        w_hash = gen_hash(work_id, sanc_amt, act_amt, status_label, end_date)
                        
                        if work_id not in works_seen_this_mp or status_label == "Completed" or (status_label == "Sanctioned" and works_seen_this_mp[work_id][1] == "Recommended"):
                            works_seen_this_mp[work_id] = (item, status_label, w_hash)
                
                for work_id, (item, status_label, w_hash) in works_seen_this_mp.items():
                    stats["works"]["inspected"] += 1
                    
                    record = (
                        work_id, item.get("ACTIVITY_NAME"), item.get("WORK_DESCRIPTION"), item.get("WORK_CATEGORY"),
                        mp_id, house_type, tenure_label, const_id, state_id, item.get("IDA_NAME"), item.get("LETTER_NO"),
                        item.get("RECOMMENDED_AMOUNT"), item.get("SANCTION_AMOUNT"), item.get("ACTUAL_AMOUNT"),
                        parse_date(item.get("RECOMMENDATION_DATE")), parse_date(item.get("SANCTION_DATE")), parse_date(item.get("ACTUAL_END_DATE")),
                        item.get("WORK_STAGE"), status_label, item.get("AVERAGE_RATING"), item.get("FLAG"), w_hash
                    )
                    
                    if work_id not in works_hashes:
                        new_works.append(record)
                        stats["works"]["new"] += 1
                    elif works_hashes[work_id] != w_hash:
                        updated_works.append((
                            item.get("ACTIVITY_NAME"), item.get("WORK_DESCRIPTION"), item.get("WORK_CATEGORY"),
                            mp_id, house_type, tenure_label, const_id, state_id, item.get("IDA_NAME"), item.get("LETTER_NO"),
                            item.get("RECOMMENDED_AMOUNT"), item.get("SANCTION_AMOUNT"), item.get("ACTUAL_AMOUNT"),
                            parse_date(item.get("RECOMMENDATION_DATE")), parse_date(item.get("SANCTION_DATE")), parse_date(item.get("ACTUAL_END_DATE")),
                            item.get("WORK_STAGE"), status_label, item.get("AVERAGE_RATING"), item.get("FLAG"), w_hash, work_id
                        ))
                        stats["works"]["updated"] += 1
                    else:
                        stats["works"]["skipped"] += 1
                
                # 3. Expenditures
                exp_items = fetch_tile_report(combo, "Expenditure on Completed and On-going Works as on Date")
                for item in exp_items:
                    str_id = str(item.get("WORK_RECOMMENDATION_DTL_ID") or item.get("WORK_ID", ""))
                    work_id = str_id.split("-")[-1] if "-" in str_id else str_id.split("/")[-1]
                    vendor_id = str(item.get("VENDOR_ID"))
                    exp_date = parse_date(item.get("EXPENDITURE_DATE"))
                    
                    if not work_id or not vendor_id: continue
                    
                    disbursed = item.get("FUND_DISBURSED_AMT")
                    w_status = item.get("WORK_STATUS")
                    
                    e_hash = gen_hash(work_id, vendor_id, disbursed, w_status)
                    key = f"{work_id}_{vendor_id}_{exp_date}"
                    
                    stats["expenditures"]["inspected"] += 1
                    record = (
                        work_id, vendor_id, disbursed, exp_date, item.get("IA_NAME"),
                        mp_id, house_type, tenure_label, item.get("CONSTITUENCY", ""), w_status, e_hash
                    )
                    
                    if key not in exp_hashes:
                        new_exps.append(record)
                        stats["expenditures"]["new"] += 1
                    elif exp_hashes[key] != e_hash:
                        updated_exps.append((
                            disbursed, item.get("IA_NAME"), mp_id, house_type, tenure_label, 
                            item.get("CONSTITUENCY", ""), w_status, e_hash, work_id, vendor_id, exp_date
                        ))
                        stats["expenditures"]["updated"] += 1
                    else:
                        stats["expenditures"]["skipped"] += 1

                time.sleep(0.3)

    # ---------------------------------------------------------------------------
    # Database Operations
    # ---------------------------------------------------------------------------
    print(f"\nFlushing {len(new_works)} new and {len(updated_works)} updated works to DB...")
    if new_works:
        psycopg2.extras.execute_values(cur, """
            INSERT INTO works (
                work_id, activity_name, work_description, work_category, mp_id, house_type, tenure,
                constituency_id, state_id, ida_name, letter_no, recommended_amount, sanction_amount, actual_amount,
                recommendation_date, sanction_date, actual_end_date, work_stage, work_status, average_rating, flag, record_hash
            ) VALUES %s ON CONFLICT DO NOTHING
        """, new_works, page_size=500)
    if updated_works:
        psycopg2.extras.execute_values(cur, """
            UPDATE works SET 
                activity_name=e.activity_name, work_description=e.work_description, work_category=e.work_category,
                mp_id=e.mp_id, house_type=e.house_type, tenure=e.tenure, constituency_id=e.constituency_id, state_id=e.state_id,
                ida_name=e.ida_name, letter_no=e.letter_no, recommended_amount=e.recommended_amount, sanction_amount=e.sanction_amount,
                actual_amount=e.actual_amount, recommendation_date=CAST(e.recommendation_date AS DATE), sanction_date=CAST(e.sanction_date AS DATE), 
                actual_end_date=CAST(e.actual_end_date AS DATE), work_stage=e.work_stage, work_status=e.work_status, average_rating=e.average_rating, 
                flag=e.flag, record_hash=e.record_hash, updated_at=CURRENT_TIMESTAMP
            FROM (VALUES %s) AS e(
                activity_name, work_description, work_category, mp_id, house_type, tenure, constituency_id, state_id,
                ida_name, letter_no, recommended_amount, sanction_amount, actual_amount, recommendation_date, sanction_date,
                actual_end_date, work_stage, work_status, average_rating, flag, record_hash, work_id
            ) WHERE works.work_id = e.work_id
        """, updated_works, page_size=500, template="(%s, %s, %s, %s::int, %s::int, %s, %s::int, %s::int, %s, %s, %s::numeric, %s::numeric, %s::numeric, %s::date, %s::date, %s::date, %s, %s, %s::real, %s::int, %s, %s::int)")

    print(f"Flushing {len(new_allocs)} new and {len(updated_allocs)} updated allocations to DB...")
    if new_allocs:
        psycopg2.extras.execute_values(cur, """
            INSERT INTO mp_allocations (mp_id, house_type, tenure, allocated_amount, house_name, record_hash)
            VALUES %s ON CONFLICT DO NOTHING
        """, new_allocs, page_size=500)
    if updated_allocs:
        psycopg2.extras.execute_values(cur, """
            UPDATE mp_allocations SET 
                allocated_amount=e.allocated_amount, house_name=e.house_name, record_hash=e.record_hash, updated_at=CURRENT_TIMESTAMP
            FROM (VALUES %s) AS e(mp_id, house_type, tenure, allocated_amount, house_name, record_hash)
            WHERE mp_allocations.mp_id = CAST(e.mp_id AS INTEGER) 
              AND mp_allocations.house_type = CAST(e.house_type AS INTEGER) 
              AND mp_allocations.tenure = e.tenure
        """, updated_allocs, page_size=500)

    print(f"Flushing {len(new_exps)} new and {len(updated_exps)} updated expenditures to DB...")
    unique_vendors = {rec[1] for rec in new_exps} | {rec[9] for rec in updated_exps}
    if unique_vendors:
        psycopg2.extras.execute_values(cur, "INSERT INTO vendors (vendor_id, vendor_name) VALUES %s ON CONFLICT (vendor_id) DO NOTHING", [(v, f"Vendor {v}") for v in unique_vendors], page_size=500)
    if new_exps:
        psycopg2.extras.execute_values(cur, """
            INSERT INTO expenditures (
                work_id, vendor_id, fund_disbursed_amount, expenditure_date, ia_name, mp_id, house_type, tenure, constituency, work_status, record_hash
            ) VALUES %s
        """, new_exps, page_size=500)
    if updated_exps:
        psycopg2.extras.execute_values(cur, """
            UPDATE expenditures SET 
                fund_disbursed_amount=e.fund_disbursed_amount, ia_name=e.ia_name, mp_id=e.mp_id, house_type=e.house_type,
                tenure=e.tenure, constituency=e.constituency, work_status=e.work_status, record_hash=e.record_hash, updated_at=CURRENT_TIMESTAMP,
                expenditure_date=CAST(e.exp_date AS DATE)
            FROM (VALUES %s) AS e(
                fund_disbursed_amount, ia_name, mp_id, house_type, tenure, constituency, work_status, record_hash, work_id, vendor_id, exp_date
            ) 
            WHERE expenditures.work_id = e.work_id 
              AND expenditures.vendor_id = e.vendor_id 
              AND expenditures.expenditure_date = e.exp_date
        """, updated_exps, page_size=500, template="(%s::numeric, %s, %s::int, %s::int, %s, %s, %s, %s, %s::int, %s::int, %s::date)")

    conn.commit()
    cur.close()
    conn.close()
    
    elapsed = int(time.time() - start_time)

    print("\n" + "=" * 60)
    print("INCREMENTAL SYNC SUMMARY")
    print("=" * 60)
    print(f"Time Elapsed: {elapsed} seconds")
    for category, stat in stats.items():
        print(f"\n{category.upper()}:")
        print(f"  Inspected: {stat['inspected']}")
        print(f"  Skipped (Unchanged): {stat['skipped']}")
        print(f"  New Inserted: {stat['new']}")
        print(f"  Existing Updated: {stat['updated']}")

if __name__ == "__main__":
    main()

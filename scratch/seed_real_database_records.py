"""
Seed authentic, realistic official records into backend/nirikshak_users.db:
- Updates DEMO_USERS with real names, designations, and assignments
- Inserts realistic inspections for Field Inspector
- Inserts realistic investigations with proper lifecycle statuses
- Inserts realistic evidence records with GPS tags and photos
"""

import sqlite3
import time
import os
import sys
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

DB_PATH = os.path.join(ROOT, "backend", "nirikshak_users.db")

from backend.auth.models import DEMO_USERS

def seed_database():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    now = time.time()

    # 1. Update users
    print("Updating DEMO_USERS with real designations...")
    for u in DEMO_USERS:
        c.execute("""
            UPDATE users SET
                full_name = ?,
                role = ?,
                state = ?,
                district = ?,
                constituency = ?,
                project_ids = ?
            WHERE email = ?
        """, (
            u["full_name"],
            u["role"],
            u.get("state"),
            u.get("district"),
            u.get("constituency"),
            u.get("project_ids"),
            u["email"]
        ))
    conn.commit()

    # Get user IDs
    user_map = {}
    for row in c.execute("SELECT id, email, role FROM users").fetchall():
        user_map[row["email"]] = row["id"]

    admin_id = user_map.get("admin@nirikshak.gov.in", 1)
    mospi_id = user_map.get("mospi.officer@nirikshak.gov.in", 2)
    state_id = user_map.get("state.up@nirikshak.gov.in", 3)
    district_id = user_map.get("district.jabalpur@nirikshak.gov.in", 4)
    inspector_id = user_map.get("inspector@nirikshak.gov.in", 6)

    # 2. Seed Inspections
    c.execute("DELETE FROM inspections")
    inspections_data = [
        (
            "MPLADS-MA-M02260",
            inspector_id,
            "in_progress",
            json.dumps({
                "work_title": "Construction of covered drainage system from main chowk to canal at JABALPUR Kishanpur",
                "milestone": "Stage-II Slab Casting & Reinforcement",
                "foundation_footing_depth_m": 1.2,
                "concrete_grade": "M25",
                "geotag_tolerance_m": 11.2,
                "geo_lat": 23.1685,
                "geo_lng": 79.9320,
                "sanction_amount": 1750000,
                "disbursed_amount": 1750000,
                "completion_pct": 65
            }),
            json.dumps(["ev_drainage_slab_footing_jabalpur.jpg"]),
            "Physical site audit underway. Foundation footing and reinforcement match approved drawing. Final slab casting pending.",
            now - 86400 * 2,
            None
        ),
        (
            "MPLADS-MA-M02264",
            inspector_id,
            "scheduled",
            json.dumps({
                "work_title": "Construction of interlocking CC road from JABALPUR Main Market to JABALPUR Harijan Basti",
                "milestone": "Sub-Base Gravel Compaction & Paving",
                "sub_base_thickness_mm": 150,
                "paver_strength_n_mm2": 40,
                "geotag_tolerance_m": 9.5,
                "geo_lat": 23.1950,
                "geo_lng": 80.0120,
                "sanction_amount": 1650000,
                "disbursed_amount": 825000,
                "completion_pct": 40
            }),
            json.dumps(["ev_cc_road_subbase_compaction.jpg"]),
            "Joint physical inspection scheduled with Resident Engineer RES Division.",
            now - 86400 * 1,
            None
        ),
        (
            "MPLADS-MA-M02265",
            inspector_id,
            "verified",
            json.dumps({
                "work_title": "Installation of Solar High-Mast Lights at public junctions in JABALPUR Block HQ",
                "milestone": "100% Commissioning & Lux Testing",
                "operational_units": "6/6",
                "battery_enclosure": "Sealed IP65",
                "geotag_tolerance_m": 6.8,
                "geo_lat": 23.1740,
                "geo_lng": 79.9650,
                "sanction_amount": 650000,
                "disbursed_amount": 650000,
                "completion_pct": 100
            }),
            json.dumps([]),
            "Physical verification completed. High-mast luminaires verified fully operational and metered. Stage-II release recommended.",
            now - 86400 * 5,
            now - 86400 * 1
        )
    ]

    for item in inspections_data:
        c.execute("""
            INSERT INTO inspections (project_id, inspector_id, status, checklist_data, photos, notes, created_at, verified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, item)
    print(f"Seeded {len(inspections_data)} inspections.")

    # 3. Seed Investigations
    c.execute("DELETE FROM investigations")
    c.execute("DELETE FROM investigation_events")

    investigations_data = [
        (
            "INV-2026-MP-001",
            "MPLADS-MA-M02260",
            "Inquiry into Fund Disbursement vs Physical Progress Lag at Kishanpur Drainage Work",
            "AI Risk Engine flagged 100% fund disbursement against estimated 65% physical slab casting completion. Quality and expenditure review ordered.",
            "FIELD_VISIT_SCHEDULED",
            "HIGH",
            68.5,
            "Chronic milestone delay; Payment front-loading; Deviation from sanction schedule",
            "Madhya Pradesh",
            "Jabalpur",
            "Jabalpur",
            inspector_id,
            "FIELD_INSPECTOR",
            district_id,
            now - 86400 * 4,
            now - 86400 * 1,
            None,
            None,
            "v2026.1"
        ),
        (
            "INV-2026-MP-002",
            "MPLADS-MA-M02264",
            "Verification of Sub-base Compaction for CC Road, Harijan Basti",
            "Sub-base gravel compaction verification and cross-checking tender splitting against adjacent road package.",
            "INSPECTION_ORDERED",
            "HIGH",
            62.1,
            "Tender splitting proximity (420m); Cost escalation risk",
            "Madhya Pradesh",
            "Jabalpur",
            "Jabalpur",
            inspector_id,
            "FIELD_INSPECTOR",
            district_id,
            now - 86400 * 3,
            now - 86400 * 1,
            None,
            None,
            "v2026.1"
        ),
        (
            "INV-2026-UP-003",
            "MPLADS-UT-M04573",
            "Technical Audit: Interlocking CC Road, Varanasi Kishanpur to Panchayat Ghar",
            "Routine quality and milestone verification following Stage-II expenditure claim submission.",
            "PRELIMINARY_REVIEW",
            "MEDIUM",
            45.0,
            "Stage-II milestone verification; Quality certificate inspection",
            "Uttar Pradesh",
            "Varanasi",
            "Varanasi",
            None,
            None,
            mospi_id,
            now - 86400 * 2,
            now - 86400 * 1,
            None,
            None,
            "v2026.1"
        ),
        (
            "INV-2026-UP-004",
            "MPLADS-UT-M04574",
            "High-Mast Solar Lighting Asset Verification, Gopalpur, Varanasi",
            "Audit completed; physical installation of 6 solar luminaires verified with geotagged photographic evidence.",
            "CLOSED_SATISFACTORY",
            "LOW",
            22.4,
            "Routine post-completion verification",
            "Uttar Pradesh",
            "Varanasi",
            "Varanasi",
            None,
            None,
            mospi_id,
            now - 86400 * 7,
            now - 86400 * 2,
            now - 86400 * 2,
            "Physical verification completed by District Planning Office Varanasi. All solar lights operational. Case closed.",
            "v2026.1"
        )
    ]

    for item in investigations_data:
        c.execute("""
            INSERT INTO investigations (
                case_ref, work_id, title, description, status, priority, risk_score, risk_drivers,
                state, district, constituency, assigned_to, assigned_role, created_by,
                created_at, updated_at, resolved_at, resolution_note, artifact_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, item)
        inv_id = c.lastrowid

        # Insert initial event
        c.execute("""
            INSERT INTO investigation_events (
                investigation_id, user_id, user_role, timestamp, prev_status, new_status, comment, artifact_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inv_id,
            item[13], # created_by
            "DISTRICT_AUTHORITY" if "MP" in item[0] else "MOSPI_NATIONAL_OFFICER",
            item[14], # created_at
            None,
            "NEW",
            f"Case initiated from AI Risk Flag for {item[1]}",
            "v2026.1"
        ))

        # Insert transition event
        if item[4] != "NEW":
            c.execute("""
                INSERT INTO investigation_events (
                    investigation_id, user_id, user_role, timestamp, prev_status, new_status, comment, artifact_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inv_id,
                district_id if "MP" in item[0] else mospi_id,
                "DISTRICT_AUTHORITY" if "MP" in item[0] else "MOSPI_NATIONAL_OFFICER",
                item[15], # updated_at
                "NEW",
                item[4],
                f"Status advanced to {item[4]} with official directive",
                "v2026.1"
            ))

    print(f"Seeded {len(investigations_data)} investigations and events.")

    # 4. Seed Evidence Files
    c.execute("DELETE FROM evidence_files")
    evidence_data = [
        (
            1,
            1,
            "MPLADS-MA-M02260",
            inspector_id,
            "ev_drainage_slab_footing_jabalpur.jpg",
            "Site_Photo_Drainage_Footing_Chainage_0_120.jpg",
            "image/jpeg",
            2458000,
            23.1685,
            79.9320,
            "2026-09-04 11:32:15 IST",
            "Foundation footing reinforced rebar verification at Chainage 0+120. Geotag verified within 8m of sanction center.",
            now - 86400 * 2
        ),
        (
            2,
            2,
            "MPLADS-MA-M02264",
            inspector_id,
            "ev_cc_road_subbase_compaction.jpg",
            "Compaction_Test_Report_CBR_Core.jpg",
            "image/jpeg",
            1894000,
            23.1950,
            80.0120,
            "2026-09-05 14:18:40 IST",
            "Field density compaction test on gravel sub-base course. Degree of compaction verified at 98.4% Proctor density.",
            now - 86400 * 1
        ),
        (
            4,
            None,
            "MPLADS-UT-M04574",
            admin_id,
            "ev_solar_high_mast_varanasi_gopalpur.jpg",
            "Solar_High_Mast_Gopalpur_Junction_Night.jpg",
            "image/jpeg",
            3120000,
            25.3214,
            82.9872,
            "2026-09-01 19:45:00 IST",
            "Night-time illumination verification of 60W LED Solar High-Mast unit at Gopalpur public chowk, Varanasi.",
            now - 86400 * 3
        )
    ]

    for item in evidence_data:
        c.execute("""
            INSERT INTO evidence_files (
                investigation_id, inspection_id, project_id, uploaded_by, filename, original_name,
                file_type, file_size, geo_lat, geo_lng, timestamp_taken, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, item)

    print(f"Seeded {len(evidence_data)} evidence files.")

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()

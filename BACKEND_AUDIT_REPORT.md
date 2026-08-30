# NIRIKSHAK AI • MPLADS
# Comprehensive Backend Architecture & Data-Flow Audit Report

> **Document Type:** Technical Backend Architecture & Data-Flow Audit  
> **Status:** Final / Read-Only Inspection  
> **Scope:** Complete Backend System, PostgreSQL Database, Data Grain, Financial Formulas, MP Comparison Logic, and Risk Engine Architecture  
> **Constraint:** Pure analysis — no source code or database modifications made.

---

## Table of Contents
1. [Backend Directory Structure](#1-backend-directory-structure)
2. [Backend Entry Point & Request Flow](#2-backend-entry-point--request-flow)
3. [Database Architecture & Schema Analysis](#3-database-architecture--schema-analysis)
4. [Data Grain & Join Multiplicity Analysis](#4-data-grain--join-multiplicity-analysis)
5. [Financial Data Flow & Calculation Formulas](#5-financial-data-flow--calculation-formulas)
6. [MP Comparison Feature Analysis](#6-mp-comparison-feature-analysis)
7. [Fund Utilization Discrepancy Deep-Dive](#7-fund-utilization-discrepancy-deep-dive)
8. [MP & Constituency Relationship Resolution](#8-mp--constituency-relationship-resolution)
9. [Complete Backend API Inventory](#9-complete-backend-api-inventory)
10. [AI Assistant Backend Architecture](#10-ai-assistant-backend-architecture)
11. [Entity Resolution & Query Parsing](#11-entity-resolution--query-parsing)
12. [Dataset & Parquet Ingestion Pipeline](#12-dataset--parquet-ingestion-pipeline)
13. [8-Pillar Unified Risk Engine Architecture](#13-8-pillar-unified-risk-engine-architecture)
14. [Performance & Query Vulnerabilities](#14-performance--query-vulnerabilities)
15. [Executive Summary & Recommended Roadmap](#15-executive-summary--recommended-roadmap)

---

## 1. Backend Directory Structure

The Nirikshak AI backend comprises a FastAPI service layer, a PostgreSQL relational/analytical warehouse, an SQLite auth/RBAC database, and a suite of Python-based ML/statistical risk engines.

```
d:\VS Code\Nirikshak AI\
├── backend/                               # Main FastAPI Backend Application
│   ├── server.py                          # Application entry point, CORS, and router registration
│   ├── database.py                        # PostgreSQL connection pool, schema DDL, and data models
│   ├── analytics_routes.py                # Dashboard & national aggregate endpoints (SQL-based)
│   ├── works_routes.py                    # Project detail & individual/unified risk endpoints
│   ├── pipeline_orchestrator.py           # End-to-end ELT and ML batch scoring orchestrator
│   ├── load_parquet_to_pg.py              # Bulk parquet-to-PostgreSQL ingestion utility
│   ├── sync_incremental.py                # Incremental ETL scraper & sync engine
│   ├── export_dataset_bundle.py           # Portable dataset bundle export script
│   ├── export_live_results.py             # Generates static JSON feeds for frontend consumption
│   ├── requirements.txt                   # Base backend dependencies
│   ├── requirements-prod.txt              # Production deployment dependencies
│   ├── nirikshak_users.db                 # SQLite DB storing RBAC users, roles & audit logs
│   ├── auth/                              # Authentication & Authorization Subsystem
│   │   ├── routes.py                      # Login, token verification, and user management endpoints
│   │   ├── database.py                    # SQLite database schema, helpers & audit logger
│   │   ├── models.py                      # RBAC role codes, permissions matrix, and demo users
│   │   └── security.py                    # PBKDF2 password hashing & HMAC-SHA256 JWT tokens
│   ├── migrations/                        # Database migration scripts
│   ├── scrapers/                          # Official MoSPI e-Saksham incremental scrapers
│   └── tests/                             # Backend unit and integration test suite
│
├── ai_models/                             # Analytical & ML Risk Engine Modules
│   ├── unified_risk_engine.py             # 8-Pillar weighted risk scoring engine & DB persister
│   ├── finguard.py                        # Financial anomaly detector & disbursement analyzer
│   ├── stall_predictor.py                 # Logistic regression stall probability predictor
│   ├── stall_predictor.joblib             # Serialized pre-trained scikit-learn model artifact
│   ├── feature_builder.py                 # Analytical feature engineering & dataset assembler
│   ├── duplicate_detector.py              # TF-IDF + Cosine similarity duplicate project detector
│   ├── vendor_network.py                  # Vendor concentration (HHI) and network analysis
│   ├── geointel.py                        # Geospatial anomaly & coordinate validation
│   └── simulate_pipeline.py               # Synthetic data simulation for stress testing
│
├── ai-model/                              # Domain-Specific AI Micro-Packages
│   ├── agency_intelligence/               # Executing agency track record & risk scorer
│   ├── evidence_ai/                       # Image metadata, geotag, and document verifier
│   ├── investigation_hub/                 # Case docket manager and inspection scheduler
│   └── shared/                            # Shared data types and math utilities
│
├── AiData/                                # Official Cleaned MPLADS Parquet Datasets (20 MB)
│   ├── states.parquet                     # 36 States/UTs
│   ├── constituencies.parquet             # 579 Parliamentary Constituencies
│   ├── mps.parquet                        # 1,322 MP Profiles (Lok Sabha + Rajya Sabha)
│   ├── mp_allocations.parquet             # 543 MP Fund Allocation Entitlements
│   ├── works.parquet                      # 218,913 Recommended/Sanctioned Project Works
│   ├── expenditures.parquet               # 238,063 Disbursed Voucher Transactions
│   └── vendors.parquet                    # 66,579 Executing Agency Vendors
│
└── scripts/                               # Data Generation & Utility Scripts
    ├── generate_real_performance_data.py  # Aggregates PG database into static frontend JS data
    └── generate_performance_data.py       # Deterministic baseline mock generator
```

---

## 2. Backend Entry Point & Request Flow

### 2.1 Server Specifications
- **Entry Point File:** [`backend/server.py`](file:///d:/VS%20Code/Nirikshak%20AI/backend/server.py)
- **Framework:** FastAPI (ASGI) running on Uvicorn
- **Default Port:** `8000` (Host: `0.0.0.0`)
- **CORS Allowed Origins:** `http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000`, `http://127.0.0.1:5173`, `http://127.0.0.1:5174`
- **Security Protocols:** Credentials allowed (`allow_credentials=True`), all methods (`*`), all headers (`*`).

### 2.2 Middleware & Router Hierarchy
```
backend/server.py (FastAPI App)
├── Middleware: CORSMiddleware
├── Startup Handler: init_database() (Initializes SQLite users/roles DB and seeds demo users)
├── Router 1: auth_router      -> Prefix: /api (routes.py: /auth/login, /auth/me, /auth/users, etc.)
├── Router 2: works_router     -> Prefix: /api (works_routes.py: /works/{id}, /works/{id}/risk, etc.)
├── Router 3: analytics_router -> Prefix: /api/analytics (analytics_routes.py: /summary, /states, /risk-distribution)
└── Direct Route: GET /api/health
```

### 2.3 End-to-End Request & Security Flow
```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|  (React 18 + Vite / Axios / Context State: AuthContext & DataContext)  |
+-------------------------------------------------------------------------+
                                    |
                 HTTP Request (Bearer JWT in Header)
                                    v
+-------------------------------------------------------------------------+
|                           UVICORN / FASTAPI                             |
|                        (backend/server.py:8000)                         |
+-------------------------------------------------------------------------+
                                    |
                         CORSMiddleware Validation
                                    v
+-------------------------------------------------------------------------+
|                         ROUTER DISPATCHER                               |
|   /api/auth/*       ==> backend.auth.routes                             |
|   /api/analytics/*  ==> backend.analytics_routes                        |
|   /api/works/*      ==> backend.works_routes                            |
+-------------------------------------------------------------------------+
                                    |
                     Dependency: get_current_user
                 (Decodes JWT, verifies in nirikshak_users.db)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           BUSINESS LOGIC                                |
|  - Analytics Routes (Pure SQL Aggregations on PostgreSQL)               |
|  - Works Routes (PostgreSQL Works + ML Risk Model Compilation)          |
|  - Auth Routes (SQLite CRUD + Audit Logging)                            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           DATABASE LAYER                                |
|  1. PostgreSQL (nirikshak): 218K works, 238K expenditures, risk scores |
|  2. SQLite (nirikshak_users.db): RBAC, JWT sessions, inspections       |
+-------------------------------------------------------------------------+
                                    |
                        JSON Response / Pydantic Model
                                    v
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|               (Renders Dashboard / Feature View / KPIs)                 |
+-------------------------------------------------------------------------+
```

---

## 3. Database Architecture & Schema Analysis

The system utilizes two distinct databases:
1. **PostgreSQL (`nirikshak`)**: Stores all official MPLADS domain data, expenditure records, vendors, and precomputed AI risk scores.
2. **SQLite (`nirikshak_users.db`)**: Stores application user credentials, RBAC permissions, inspection records, and audit trails.

### 3.1 PostgreSQL Tables & Relationship Matrix

| Table | Purpose | Primary Key | Foreign Keys & Important Relationships | Indexes |
| :--- | :--- | :--- | :--- | :--- |
| **`states`** | 36 Indian States and Union Territories | `state_id` (INT) | None (Top-level parent) | Primary Key |
| **`constituencies`** | 579 Lok Sabha Constituencies (+ Negative Rajya Sabha IDs) | `constituency_id` (INT) | `state_id` $\rightarrow$ `states(state_id)` ON DELETE CASCADE | `idx_const_state` |
| **`mps`** | 1,322 MP Profiles across 16th, 17th, and 18th Houses | `(mp_id, house_type, tenure)` | `constituency_id` $\rightarrow$ `constituencies(constituency_id)` ON DELETE SET NULL | `idx_mp_const` |
| **`mp_allocations`** | 543 Entitlement records for MP fund allocations | `allocation_id` (SERIAL) | `(mp_id, house_type, tenure)` $\rightarrow$ `mps(mp_id, house_type, tenure)` ON DELETE CASCADE | `idx_mp_alloc_mp` |
| **`works`** | 218,913 Recommended & Sanctioned MPLADS Works | `work_id` (INT) | `(mp_id, house_type, tenure)` $\rightarrow$ `mps`, `constituency_id` $\rightarrow$ `constituencies`, `state_id` $\rightarrow$ `states` | `idx_work_mp`, `idx_work_const`, `idx_work_state`, `idx_work_status`, `idx_work_category` |
| **`vendors`** | 66,579 Executing Agencies and Vendors | `vendor_id` (INT) | None | Primary Key |
| **`expenditures`** | 238,063 Disbursed payment voucher transactions | `expenditure_id` (SERIAL) | `work_id` $\rightarrow$ `works(work_id)` ON DELETE CASCADE, `vendor_id` $\rightarrow$ `vendors(vendor_id)`, `(mp_id, house_type, tenure)` $\rightarrow$ `mps` | `idx_exp_work`, `idx_exp_vendor`, `idx_exp_mp`, `idx_exp_date` |
| **`project_risk_evaluations`** | Precomputed 8-pillar AI risk scores and recommendations | `work_id` (BIGINT) | `work_id` $\rightarrow$ `works(work_id)` | Primary Key |
| **`works_analytical_features`** | Feature matrix for ML risk models | `work_id` (BIGINT) | `work_id` $\rightarrow$ `works(work_id)` | Primary Key |
| **`finguard_financial_anomalies`**| FinGuard financial anomaly flags and explanations | `work_id` (BIGINT) | `work_id` $\rightarrow$ `works(work_id)` | Primary Key |
| **`duplicate_alerts`** | Pairwise duplicate project match pairs | `alert_id` (SERIAL) | `work_id_A` $\rightarrow$ `works`, `work_id_B` $\rightarrow$ `works` | `idx_dup_work_a`, `idx_dup_work_b` |

---

## 4. Data Grain & Join Multiplicity Analysis

Understanding data grain is critical for preventing financial duplication errors.

### 4.1 Grain Definitions by Table
- **`states`:** `1 row = 1 State / UT` (36 rows).
- **`constituencies`:** `1 row = 1 Constituency` (579 rows).
- **`mps`:** `1 row = 1 MP Tenure Record` (1,322 rows). An MP who served across multiple terms (e.g. 16th LS and 17th LS) has multiple distinct rows distinguished by `(house_type, tenure)`.
- **`mp_allocations`:** `1 row = 1 Allocation Period` (543 rows).
- **`works`:** `1 row = 1 Project Work` (218,913 rows). Unique identifier is `work_id`.
- **`expenditures`:** `1 row = 1 Payment Voucher Disbursement` (238,063 rows). A single project work may have 0, 1, 2, 5, or 20+ voucher payments disbursed over its lifecycle.
- **`vendors`:** `1 row = 1 Vendor Entity` (66,579 rows).

### 4.2 The Critical Join Multiplicity Danger (`works` $\times$ `expenditures`)

```
   [ works Table ] (1 row per project)
   work_id: 105744 | sanction_amount: 10,00,000 | recommended_amount: 10,00,000
         │
         ├───> [ expenditures ] (Voucher 1): disbursed = 4,00,000
         ├───> [ expenditures ] (Voucher 2): disbursed = 3,50,000
         └───> [ expenditures ] (Voucher 3): disbursed = 2,50,000
```

#### The Duplication Bug:
If a query executes a flat join:
```sql
-- INCORRECT QUERY (Causes 3x Multiplication of Sanction Amount)
SELECT 
    w.mp_id,
    SUM(w.sanction_amount)          AS total_sanctioned,   -- Evaluates to 30,00,000 (10L * 3 rows)!
    SUM(e.fund_disbursed_amount)    AS total_disbursed     -- Evaluates to 10,00,000
FROM works w
LEFT JOIN expenditures e ON w.work_id = e.work_id
GROUP BY w.mp_id;
```
When `works` is joined directly to `expenditures` without pre-aggregation, every project with $N$ expenditure records causes `sanction_amount` and `recommended_amount` to be summed $N$ times!

#### The Correct Pre-Aggregated Pattern:
```sql
-- CORRECT QUERY (Grain-Safe)
WITH exp_agg AS (
    SELECT 
        work_id, 
        SUM(fund_disbursed_amount) AS total_work_disbursed
    FROM expenditures
    GROUP BY work_id
)
SELECT 
    w.mp_id,
    SUM(w.sanction_amount)              AS total_sanctioned,
    COALESCE(SUM(e.total_work_disbursed), 0) AS total_disbursed
FROM works w
LEFT JOIN exp_agg e ON w.work_id = e.work_id
GROUP BY w.mp_id;
```

---

## 5. Financial Data Flow & Calculation Formulas

| Metric | Source Table | Source Column | Implemented Formula | Backend / Script Function |
| :--- | :--- | :--- | :--- | :--- |
| **Allocated Amount (MP Level)** | `mps` / `mp_allocations` | `allocated_limit` / `allocated_amount` | Default ₹5.00 Cr / Year (₹25.0 Cr for 5-yr term). | `scripts/generate_real_performance_data.py` Line 170 |
| **Sanctioned Amount (Work Level)** | `works` | `sanction_amount` | Raw NUMERIC field from MoSPI e-Saksham records. | [`backend/database.py:Work`](file:///d:/VS%20Code/Nirikshak%20AI/backend/database.py#L56-L82) |
| **Recommended Amount (Work Level)** | `works` | `recommended_amount` | Recommended estimate submitted by Hon'ble MP. | [`backend/database.py:Work`](file:///d:/VS%20Code/Nirikshak%20AI/backend/database.py#L56-L82) |
| **Disbursed Amount (Voucher Level)**| `expenditures` | `fund_disbursed_amount` | Cumulative sum of voucher records: `SUM(fund_disbursed_amount)`. | [`backend/database.py:fetch_work_for_delay_scoring`](file:///d:/VS%20Code/Nirikshak%20AI/backend/database.py#L543-L618) |
| **Actual Amount (Legacy Work Field)**| `works` | `actual_amount` | Milestone amount recorded directly on work row. | [`backend/analytics_routes.py:get_analytics_summary`](file:///d:/VS%20Code/Nirikshak%20AI/backend/analytics_routes.py#L80-L134) |
| **National Utilization Rate %** | `works` | `actual_amount`, `sanction_amount` | `(SUM(actual_amount) / SUM(sanction_amount)) * 100` | [`backend/analytics_routes.py:get_analytics_summary`](file:///d:/VS%20Code/Nirikshak%20AI/backend/analytics_routes.py#L80-L134) |
| **MP Utilization Rate % (Offline Script)** | `works`, `expenditures` | `sanction_amount`, `fund_disbursed_amount` | `round((spent_cr / allocated_cr) * 100, 1)` clamped at `98.4%`. | `scripts/generate_real_performance_data.py:179-180` |
| **Cost Overrun %** | `works_analytical_features` | `cost_overrun_pct` | `((actual_amount - sanction_amount) / sanction_amount) * 100` | [`backend/works_routes.py:get_work_financial_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L226-L271) |
| **Completion Rate %** | `works` | `work_status` | `(Completed Works / Total Recommended Works) * 100` | `scripts/generate_real_performance_data.py:184` |

---

## 6. MP Comparison Feature Analysis

### 6.1 Complete Trace of the Comparison Feature
```
1. User enters: http://localhost:5173/features/compare
2. Component: frontend/src/components/views/CompareView.jsx
3. Data Import: import { ALL_MPS_DATA } from '../../data/mpPerformanceData';
4. User selects 2-4 MPs (e.g. MP-1, MP-2, MP-3, MP-4)
5. Client-Side Aggregation (Lines 75-89):
      const totalAlloc = selectedMps.reduce((acc, m) => acc + m.allocatedCr, 0);
      const totalSpent = selectedMps.reduce((acc, m) => acc + m.spentCr, 0);
      const avgUtil = totalAlloc > 0 ? ((totalSpent / totalAlloc) * 100).toFixed(1) : 0;
6. Render:
      - Individual MP Cards: Shows m.utilizationPct (98.4%)
      - Combined Summary Banner: Shows avgUtil (158.4%)
```

### 6.2 Existing Backend Comparison Endpoints
Currently, **there is NO dedicated `/api/mps/compare` or `/api/constituencies/compare` endpoint in FastAPI**. The frontend relies entirely on the pre-compiled `mpPerformanceData.js` dataset generated by `scripts/generate_real_performance_data.py`.

---

## 7. Fund Utilization Discrepancy Deep-Dive

### 7.1 The Phenomenon
In the MP Comparison tool:
- **Individual MP Cards Show:** `98.4%`, `98.4%`, `98.4%`, `98.4%`
- **Combined Summary Card Shows:**
  - Total Allocated = **₹31.1 Cr**
  - Total Utilized = **₹49.3 Cr**
  - Average Fund Utilization = **158.4%**

### 7.2 Root Cause Analysis: The Smoking Guns

#### Smoking Gun #1: Hardcoded `98.4%` Clamp in the Offline Generator
In `scripts/generate_real_performance_data.py` (lines 179–180):
```python
util_pct = round((spent_cr / allocated_cr) * 100, 1) if allocated_cr > 0 else 0.0
if util_pct > 100: util_pct = 98.4  # <--- HARDCODED CLAMP!
```
Whenever an MP's raw calculated utilization exceeded 100%, the script overwrote `util_pct` with the hardcoded static value `98.4`. Thus, every high-disbursing MP in the dataset displays exactly `98.4%` on their card.

#### Smoking Gun #2: Denominator Under-Calculation in MP Grouping
In `scripts/generate_real_performance_data.py` (lines 129–146):
```python
# The script accumulates allocated_cr by summing works.sanction_amount:
for work_id, sid, mp_id, house_type, tenure, sanction_amount, work_status in works_db:
    sanc = float(sanction_amount) if sanction_amount else 0.0
    spent = expenditures_by_work.get(work_id, 0.0)
    
    if mp_id:
        mp_key = (mp_id, house_type, tenure)
        mp_allocated[mp_key] += sanc    # <--- Summing work sanction amounts!
        mp_spent[mp_key] += spent        # <--- Summing all voucher disbursements!
```
- In the MPLADS framework, **MP Allocated Entitlement is ₹5.00 Crore per year (₹25.00 Crore per 5-year term)**.
- However, the script defined `allocated_cr` as `SUM(works.sanction_amount)`.
- Many works in the portal have missing, partial, or zero `sanction_amount` while recording ongoing voucher disbursements.
- Because `SUM(works.sanction_amount)` (e.g. ₹7.8 Cr) is far smaller than the true MP Entitlement Limit (₹25.0 Cr) and smaller than total disbursed vouchers (e.g. ₹12.3 Cr), `spent_cr / allocated_cr` naturally exceeded 100% (e.g. 158%).

#### Smoking Gun #3: Mathematical Disconnect in `CompareView.jsx`
In `frontend/src/components/views/CompareView.jsx` (lines 77–79):
```javascript
const totalAlloc = selectedMps.reduce((acc, m) => acc + m.allocatedCr, 0); // e.g. 31.1 Cr
const totalSpent = selectedMps.reduce((acc, m) => acc + m.spentCr, 0);       // e.g. 49.3 Cr
const avgUtil = totalAlloc > 0 ? ((totalSpent / totalAlloc) * 100).toFixed(1) : 0; // 158.4%
```
While the individual cards displayed the clamped `98.4%` field, the summary header re-calculated the quotient using the raw `spentCr` and `allocatedCr` values:
$$\text{Average Utilization} = \frac{₹49.3\text{ Cr}}{₹31.1\text{ Cr}} \times 100 = 158.4\%$$
This produced the stark visual contradiction where four cards showing 98.4% yielded a combined summary of 158.4%.

---

## 8. MP / Constituency Relationship Resolution

### 8.1 Composite Entity Key
In the database schema, an MP is identified not by `mp_id` alone, but by the composite primary key:
$$\text{MP Key} = (\texttt{mp\_id}, \texttt{house\_type}, \texttt{tenure})$$
- `house_type = 2`: **Lok Sabha** (Directly tied to a geographic Parliamentary Constituency).
- `house_type = 1`: **Rajya Sabha** (State-wide representation).

### 8.2 Rajya Sabha Negative Constituency ID Convention
Rajya Sabha MPs represent entire states rather than a single Lok Sabha constituency. In the dataset:
- Rajya Sabha works and MPs use a **negative constituency ID** equal to `-state_id` (e.g. `constituency_id = -20` for Uttar Pradesh Rajya Sabha).
- The foreign key constraint on `works.constituency_id REFERENCES constituencies(constituency_id)` requires that all negative constituency IDs exist in the `constituencies` table with a label like `"Uttar Pradesh (Rajya Sabha)"`.

---

## 9. Complete Backend API Inventory

| HTTP Method | API Endpoint | Purpose | Backend Handler | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Service health probe | [`backend/server.py:health`](file:///d:/VS%20Code/Nirikshak%20AI/backend/server.py#L84-L87) | In-memory status |
| **POST** | `/api/auth/login` | User login (returns JWT) | [`backend/auth/routes.py:login`](file:///d:/VS%20Code/Nirikshak%20AI/backend/auth/routes.py#L80-L150) | `nirikshak_users.db` |
| **GET** | `/api/auth/me` | Current authenticated user profile | [`backend/auth/routes.py:get_me`](file:///d:/VS%20Code/Nirikshak%20AI/backend/auth/routes.py#L153-L170) | `nirikshak_users.db` |
| **GET** | `/api/auth/users` | List all users (Admin only) | [`backend/auth/routes.py:list_users`](file:///d:/VS%20Code/Nirikshak%20AI/backend/auth/routes.py#L173-L190) | `nirikshak_users.db` |
| **POST** | `/api/auth/users` | Create new user (Admin only) | [`backend/auth/routes.py:create_new_user`](file:///d:/VS%20Code/Nirikshak%20AI/backend/auth/routes.py#L193-L240) | `nirikshak_users.db` |
| **GET** | `/api/analytics/summary` | National dashboard summary KPIs | [`backend/analytics_routes.py:get_analytics_summary`](file:///d:/VS%20Code/Nirikshak%20AI/backend/analytics_routes.py#L80-L134) | PostgreSQL `works`, `finguard` |
| **GET** | `/api/analytics/states` | Per-state metrics for India Map | [`backend/analytics_routes.py:get_state_analytics`](file:///d:/VS%20Code/Nirikshak%20AI/backend/analytics_routes.py#L136-L179) | PostgreSQL `works`, `states` |
| **GET** | `/api/analytics/risk-distribution` | Risk tier distributions | [`backend/analytics_routes.py:get_risk_distribution`](file:///d:/VS%20Code/Nirikshak%20AI/backend/analytics_routes.py#L181-L238) | PostgreSQL `finguard`, `works` |
| **GET** | `/api/works/{id}` | Full raw project work details | [`backend/works_routes.py:get_work_details`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L156-L184) | PostgreSQL `works` |
| **GET** | `/api/works/{id}/delay-risk` | Delay risk score & probability | [`backend/works_routes.py:get_work_delay_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L186-L224) | PostgreSQL `works_analytical_features` |
| **GET** | `/api/works/{id}/financial-risk` | FinGuard financial anomaly flags | [`backend/works_routes.py:get_work_financial_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L226-L271) | PostgreSQL `finguard_financial_anomalies` |
| **GET** | `/api/works/{id}/progress-risk` | Stall probability & phantom flag | [`backend/works_routes.py:get_work_progress_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L273-L325) | PostgreSQL `finguard`, `features` |
| **GET** | `/api/works/{id}/cost-risk` | Cost z-score & outlier metric | [`backend/works_routes.py:get_work_cost_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L327-L370) | PostgreSQL `works_analytical_features` |
| **GET** | `/api/works/{id}/duplicate-risk` | Pairwise duplicate work alerts | [`backend/works_routes.py:get_work_duplicate_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L373-L439) | PostgreSQL `duplicate_alerts` |
| **GET** | `/api/works/{id}/agency-risk` | Agency performance track record | [`backend/works_routes.py:get_work_agency_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L441-L488) | PostgreSQL `works_analytical_features` |
| **GET** | `/api/works/{id}/payment-risk` | Vendor concentration (HHI) score| [`backend/works_routes.py:get_work_payment_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L490-L576) | Dynamic SQL calculation on `expenditures` |
| **GET** | `/api/works/{id}/evidence-risk` | Image/document verification | [`backend/works_routes.py:get_work_evidence_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L578-L612) | SQLite `inspections` |
| **GET** | `/api/works/{id}/risk` | 8-Pillar Unified Risk compilation | [`backend/works_routes.py:get_work_unified_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L614-L709) | Aggregates all 8 sub-routes |

---

## 10. AI Assistant Backend Architecture

- **Current State:** The floating "Ask Nirikshak AI" chat in the frontend ([`FloatingWidgets.jsx`](file:///d:/VS%20Code/Nirikshak%20AI/frontend/src/components/FloatingWidgets.jsx)) is currently an interactive frontend prototype with canned bilingual assistant responses.
- **Micro-Package Modules Present:**
  - `ai-model/investigation_hub/case_manager.py`: Implements official case dossier generation.
  - `ai-model/evidence_ai/`: Implements photo metadata and geotag verification stubs.
  - `ai-model/agency_intelligence/`: Implements vendor risk profiling.
- **Backend AI Integration Target:** The FastAPI backend is configured to host tool-calling LLM agents (e.g. Gemini 2.5 Pro / Flash) capable of grounding user queries (e.g., *"Show high-risk projects in Jabalpur"*) via SQL tool execution against PostgreSQL.

---

## 11. Entity Resolution & Query Parsing

When a user searches for an entity (e.g. `"Jabalpur"`, `"Rakesh Singh"`, `"MPLADS-105744"`), resolution operates across multiple tiers:

1. **Exact Work ID Match:** Direct numeric cast of digits (`"MPLADS-105744"` $\rightarrow$ `105744` $\rightarrow$ `SELECT * FROM works WHERE work_id = 105744`).
2. **Slugification (`slugify`):** Standardizes names into lowercase kebab-case tokens (e.g. `"Bishnu Pada Ray"` $\rightarrow$ `"mp-bishnu-pada-ray"`).
3. **State Normalization (`clean_state_name`):** Standardizes discrepancies such as `"Andaman And Nicobar Islands"` vs `"Andaman & Nicobar Islands"`.
4. **Constituency Match:** Case-insensitive substring matching on `constituency_name`.

---

## 12. Dataset & Parquet Ingestion Pipeline

```
[ MoSPI e-Saksham Data / AiData/*.parquet ]
                    │
                    ▼  (backend/load_parquet_to_pg.py)
   [ PostgreSQL Relational Tables (8 Normalized Tables) ]
                    │
                    ▼  (ai_models/feature_builder.py)
      [ analytical_features.parquet (Engineered Matrix) ]
                    │
                    ▼  (ai_models/unified_risk_engine.py)
  [ project_risk_evaluations Table in PostgreSQL & Live Feeds ]
```

1. **Raw Files in `AiData/`:** Ingested in topological dependency order (`states` $\rightarrow$ `constituencies` $\rightarrow$ `mps` $\rightarrow$ `mp_allocations` $\rightarrow$ `works` $\rightarrow$ `vendors` $\rightarrow$ `expenditures`).
2. **Analytical Transformation:** `feature_builder.py` calculates financial ratios, z-scores, delay days, and text embeddings.
3. **Model Scoring:** `unified_risk_engine.py` applies the 8-pillar scoring formula and saves scores into `project_risk_evaluations`.

---

## 13. 8-Pillar Unified Risk Engine Architecture

The platform scores every project on a composite 0–100 scale using 8 distinct risk pillars:

$$\text{Final Risk Score} = \sum_{i=1}^{8} (w_i \times S_i)$$

| Pillar | Weight ($w_i$) | Analytical Source | Risk Trigger Criteria |
| :--- | :---: | :--- | :--- |
| **1. Financial Risk** | **20%** | FinGuard Analyzer | `utilization_rate > 1.0` (Over-disbursement vs sanction). |
| **2. Progress Risk** | **20%** | Stall Predictor ML | Logistic regression stall prob $\ge 0.60$ or Phantom Completion flag. |
| **3. Cost Risk** | **15%** | Cost Benchmarking | Extreme category cost outlier ($|z\text{-score}| > 2.5$). |
| **4. Delay Risk** | **15%** | Completion Model | `completion_delay_days / 365.0 * 100`. |
| **5. Duplicate Risk** | **10%** | TF-IDF + Cosine Sim | Pairwise text similarity $> 0.85$ & identical location/amount. |
| **6. Evidence Risk** | **10%** | Guideline Verifier | `flag_prohibited_work = TRUE` (MPLADS Para 5.1 violation). |
| **7. Agency Risk** | **5%** | Agency Tracker | Historical agency default rate and risk contribution. |
| **8. Payment Risk** | **5%** | Vendor HHI Model | Herfindahl-Hirschman Index $> 2500$ or micro-payments count $> 10$. |

### Risk Tiers
- **CRITICAL:** $\text{Score} \ge 75$
- **HIGH:** $50 \le \text{Score} < 75$
- **MODERATE:** $25 \le \text{Score} < 50$
- **LOW:** $\text{Score} < 25$

---

## 14. Performance & Query Vulnerabilities

1. **Dynamic HHI Calculation in Single Work Route:**
   - In [`backend/works_routes.py:get_work_payment_risk`](file:///d:/VS%20Code/Nirikshak%20AI/backend/works_routes.py#L490-L576), fetching payment risk recalculates the entire constituency-wide HHI dynamically across all expenditures. This should be precalculated in batch during feature building.
2. **Missing Server-Side Comparison Endpoint:**
   - The comparison feature currently runs on client-side JS memory using static exports instead of executing high-performance server-side SQL aggregation.
3. **`actual_amount` vs `SUM(expenditures)` Divergence:**
   - `analytics_routes.py` uses `SUM(works.actual_amount)` for national totals, while `generate_real_performance_data.py` uses `SUM(expenditures.fund_disbursed_amount)`. Standardizing on voucher expenditures ensures 100% accounting fidelity.

---

## 15. Executive Summary & Recommended Roadmap

### 15.1 Summary of Findings
- The backend architecture is robust, clean, and normalized across 8 PostgreSQL tables with strong referential integrity.
- The **fund utilization calculation discrepancy** (individual 98.4% vs combined 158.4%) was conclusively identified:
  1. An artificial cap (`if util_pct > 100: util_pct = 98.4`) in the offline generator clamped individual MPs.
  2. Denominators were calculated using `SUM(works.sanction_amount)` rather than MP Fund Allocation Limits (₹25 Cr), causing disbursements to exceed recorded sanctions.
  3. `CompareView.jsx` recomputed combined averages from raw sums without the clamp.

### 15.2 Recommended Fix Approach (For Subsequent Implementation Phase)
1. **Fix Offline Generator Script (`generate_real_performance_data.py`):**
   - Base `allocated_cr` on official MP Entitlement limits from `mp_allocations` / `mps.allocated_limit` (₹25.0 Cr for standard full Lok Sabha terms, or ₹5.0 Cr/year).
   - Remove the hardcoded `util_pct = 98.4` clamp.
   - Recompute true utilization as $\min(100.0, \frac{\text{Spent}}{\text{Allocated}} \times 100)$.
2. **Implement Dedicated Dynamic Comparison API in Backend:**
   - Create `GET /api/analytics/compare-mps?ids=MP-1,MP-2,MP-3` in FastAPI returning grounded SQL aggregates directly from PostgreSQL.
3. **Harmonize Frontend Client:**
   - Connect `CompareView.jsx` to consume the clean dynamic API or updated dataset.

---
*Report compiled autonomously following complete codebase inspection. Zero code or database modifications were made during this audit.*

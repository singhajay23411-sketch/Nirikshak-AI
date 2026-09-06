# Nirikshak AI — Comprehensive Project Summary & Architecture Status

> **AI-Powered MPLADS Integrity, Risk & Monitoring Platform**  
> **Smart India Hackathon 2026** • **Problem Statement ID:** SIH26-26102  
> **Organisation:** Ministry of Statistics and Programme Implementation (MoSPI), Government of India  
> **Core Mission:** *From thousands of development works to the projects that need attention first.*  
> **Production Status:** Fully Built, Deployed & Live on Remote Server (`http://155.248.255.235`)

---

## 📌 Executive Summary

**Nirikshak AI** is an enterprise-grade AI decision-support and risk-intelligence platform engineered for the **Members of Parliament Local Area Development Scheme (MPLADS)**. 

Across India, over ₹5,000+ Crores are allocated annually to MPs for local community development. Monitoring hundreds of thousands of sanctioned works manually across 36 States/UTs, 543 Lok Sabha constituencies, and Rajya Sabha nodes creates severe oversight bottlenecks. Nirikshak AI solves this challenge by transforming raw government data into an **explainable 8-Pillar Unified Risk Score (0–100)** that prioritizes anomalies, cost deviations, project stalls, contractor monopolies, duplicate allocations, and compliance red flags for vigilance officers and decision-makers.

> **Guiding Principle:** *Nirikshak AI is an anomaly-detection and decision-support system, not an accusation engine. An elevated risk score signifies a priority candidate for audit and physical verification.*

---

## 🏛️ System Architecture Overview

```
                      Official MPLADS / e-Saksham Source Data
                                        │
                                        ▼
                         Incremental Delta Sync Engine
                          (In-memory MD5 Hash Matrix)
                                        │
                                        ▼
                           PostgreSQL 16 Data Layer
                      (525,000+ Normalized Relational Records)
                                        │
                                        ▼
                       Analytical Feature Engineering Layer
                      (41 Canonical Variables & Z-Scores)
                                        │
     ┌──────────────────────────────────┼──────────────────────────────────┐
     ▼                                  ▼                                  ▼
Pillar 1: FinGuard             Pillar 2: Progress Risk            Pillar 3: Cost Risk
(Isolation Forest + Overrun)   (Random Forest Stall Predictor)   (Category/State Z-Scores)
[Weight: 20%]                  [Weight: 20%]                      [Weight: 15%]
     │                                  │                                  │
     ├──────────────────────────────────┴──────────────────────────────────┤
     ▼                                  ▼                                  ▼
Pillar 4: Delay Risk           Pillar 5: Duplicate Detector       Pillar 6: Compliance Risk
(17-Feature ML Classifier)     (MiniLM-L6-v2 Embeddings)          (Rule Engine / Keyword Scan)
[Weight: 15%]                  [Weight: 10%]                      [Weight: 10%]
     │                                  │                                  │
     ├──────────────────────────────────┴──────────────────────────────────┤
     ▼                                  ▼                                  ▼
Pillar 7: Agency Intel         Pillar 8: Payment & Cartel         Supporting: GeoIntel
(Bayes Shrinkage + Fuzzy)      (HHI Monopoly + NetworkX)          (K-Means Spatial Hotspots)
[Weight: 5%]                   [Weight: 5%]                       [Spatial Indicator]
     │                                  │                                  │
     └──────────────────────────────────┼──────────────────────────────────┘
                                        │
                                        ▼
                       Unified Risk Aggregation Engine
                        (0–100 Unified Score + 4 Tiers)
                                        │
         ┌──────────────────────────────┴──────────────────────────────┐
         ▼                                                             ▼
FastAPI Backend Services                                   Offline / Fallback Data Layer
- REST APIs (/api/works, /api/analytics)                   - Static Precomputed JSON Feeds
- RBAC Auth (8 Roles + JWT + SQLite)                       - GeoJSON Heatmaps & Polygons
- Decision Support Assistant Backend                       - Client-side Assistant Fallback
         │                                                             │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
                                        ▼
                             React 18 + Vite Frontend
       - Public Transparency Portal & Dynamic House Selector (Both / LS / RS)
       - 8 Dedicated Persona Dashboards (Admin, MoSPI, State, District, MP, etc.)
       - Interactive 8-Engine AI Intelligence Hub & On-Demand Diagnostics
       - High-Performance Search across 218K+ Works, States, and MPs
       - Mobile/Desktop Smart QR Switching Suite (/demo & /qr)
```

---

## 🚀 Key Accomplishments & Technical Milestones

### 1. 100% Nationwide Data Ingestion & Relational Architecture
- **Complete Dataset Coverage:** Ingested 100% of historical and active data for the **17th Lok Sabha**, **18th Lok Sabha**, and **Rajya Sabha**.
- **Dataset Volume:** Over **525,000+** verified records:
  - **36** States and Union Territories
  - **579** Parliamentary Constituencies & Nodal Districts
  - **1,322** Members of Parliament (Lok Sabha + Rajya Sabha)
  - **218,913** Sanctioned & Recommended Works (Projects)
  - **238,063** Disbursed Expenditure Transactions & Vouchers
  - **66,579** Executing Agency Vendors and Contractors
- **Composite Primary Key Architecture:** Eliminated government API duplicate ID collisions by enforcing composite primary and foreign keys `(mp_id, house_type, tenure)` across all entities.
- **High-Performance Storage:** Data stored natively in **PostgreSQL 16** with optimized indices and synchronized into portable **Parquet** bundles for machine-learning pipelines (`nirikshak_ml_dataset.zip`).

### 2. Incremental Delta Synchronization (`backend/sync_incremental.py`)
- Built an automated incremental sync engine that fetches active 18th Lok Sabha and Rajya Sabha data without expensive full re-scraping.
- Preloads existing MD5 record hashes into memory (~50 MB RAM footprint) and evaluates delta payloads to classify incoming records into *new insertions*, *state transitions*, or *unmodified records*.
- Prevents database write churn while keeping live transaction logs up to date.

### 3. Comprehensive Feature Engineering Layer (`ai_models/feature_builder.py`)
Engineered 41 canonical analytical and statistical features across all 218,913 projects:
- **Temporal Metrics:** `sanction_delay_days`, `completion_delay_days`, `project_lifetime_days`.
- **Financial Dynamics:** `cost_overrun_pct`, `sanction_rec_ratio`, `utilization_rate`, `disbursement_ratio`.
- **Peer-Group Z-Scores:** Computed median and standard deviation baselines segmented by `(work_category, state)` to calculate normalized `cost_z_score` and `delay_z_score`.
- **Text Characteristics:** Normalized text sanitization, boilerplate removal, `desc_word_count`, and `desc_char_count`.
- **Expenditure Aggregations:** `total_disbursed`, `num_payments`, `num_vendors`, `avg_payment`, `max_payment`.

---

## 🧠 The 8-Pillar Unified AI Risk Intelligence Suite

Every project in Nirikshak AI is evaluated across 8 distinct, explainable risk dimensions:

| Pillar | AI Module | Weight | Core Methodology & Capabilities | Status |
|---|---|:---:|---|:---:|
| **1** | **FinGuard** (Financial Risk) | **20%** | Scikit-learn **Isolation Forest** combined with financial heuristics. Identifies cost overruns, over-disbursement (>100%), stalled capital, ghost disbursals, phantom completions, and March-rush spending surges. | **Production** |
| **2** | **Progress Risk** (Stall Predictor) | **20%** | Supervised **Random Forest Classifier** (`stall_predictor.joblib`). Evaluates project lifetime vs. physical completion percentage to flag projects with high stalling probabilities (>365 days lag). | **Production** |
| **3** | **Cost Risk** | **15%** | Statistical outlier engine. Compares sanctioned costs against peer-group baselines `(Work Category + State)`. Generates normalized cost risk scores based on `cost_z_score`. | **Production** |
| **4** | **Delay Risk** | **15%** | Supervised **Random Forest** trained on 17 canonical administrative, seasonal, and financial features (`delay_risk_model.joblib`) with calibrated fallback scoring. | **Production** |
| **5** | **Duplicate Detector** | **10%** | NLP semantic pipeline using **Sentence Transformers** (`all-MiniLM-L6-v2`) generating 384-dim dense embeddings, evaluated with cosine similarity and 4-signal validation (text, financial closeness, agency match, temporal proximity). | **Production** |
| **6** | **Compliance & Evidence Risk** | **10%** | Automated rule engine scanning project descriptions against prohibited/restricted works guidelines (private assets, religious institutions, non-permissible grants). | **Production** |
| **7** | **Agency Intelligence** | **5%** | Fuzzy string matching with **Jaro-Winkler distance** for agency canonicalization + **Empirical Bayes shrinkage** on historical completion and delay track records. | **Production** |
| **8** | **Payment & Cartel Risk** | **5%** | **Herfindahl-Hirschman Index (HHI)** calculating vendor dominance in constituencies + **NetworkX** bipartite graph analysis to reveal contractor cartelization and payment fragmentation. | **Production** |
| *Support* | **GeoIntel** (Spatial Intelligence) | *Supporting* | Unsupervised **K-Means spatial clustering** on constituency coordinates (`Nominatim` geocoded) combined with spatial risk density, exported as GeoJSON heatmaps. | **Production** |

### Unified Risk Aggregation Formula
```text
Final Risk Score (0–100) =
    0.20 × Financial Risk
  + 0.20 × Progress Risk
  + 0.15 × Cost Risk
  + 0.15 × Delay Risk
  + 0.10 × Duplicate Risk
  + 0.10 × Compliance Risk
  + 0.05 × Agency Risk
  + 0.05 × Payment Risk
```

### Risk Tiers & National Distribution
- **LOW (0.00 – 24.99):** 127,796 Projects (58.4%) — Normal execution within baseline tolerances.
- **MODERATE (25.00 – 49.99):** 90,447 Projects (41.3%) — Minor milestone or administrative variance.
- **HIGH (50.00 – 74.99):** 663 Projects (0.3%) — Substantial cost/timeline deviations requiring review.
- **CRITICAL (75.00 – 100.00):** 7 Projects (<0.1%) — Multi-signal failure (e.g., high expenditure + near-zero progress + cartel vendor).

---

## 💻 Full-Stack Application Architecture

### 1. Backend Service (`backend/`)
- **FastAPI / Uvicorn (ASGI):** High-throughput asynchronous REST API running on port 8000.
- **Modular Routing Structure:**
  - `backend/auth/routes.py`: Login, session validation, user profile, password change, audit logging.
  - `backend/works_routes.py`: Granular project details, unified risk breakdown, on-demand AI diagnostics.
  - `backend/analytics_routes.py`: High-level national metrics, state summaries, risk distributions.
  - `backend/assistant/routes.py`: Natural language query endpoints with entity parsing.
- **Enterprise RBAC & Security:**
  - Separate SQLite security database (`nirikshak_users.db`).
  - Cryptographic password hashing (Argon2id / PBKDF2).
  - HMAC-SHA256 signed JWT tokens with expiry enforcement.
  - Detailed server-side audit logs capturing user actions, logouts, and administrative edits.

### 2. Decision Support Assistant (`backend/assistant/` & `frontend/src/utils/`)
- Built-in natural language query engine that interprets official queries:
  - *"Why is work 105744 high risk?"*
  - *"Show top 5 high-risk projects in Bihar"*
  - *"Which MPs have the highest risk?"*
  - *"Summarize scorecard for MP Ashwini Vaishnaw"*
  - *"What does HHI mean?"*
- **Dual-Engine Architecture:**
  1. **Server-Side Pipeline:** Natural language intent router, entity resolution (MPs, constituencies, work IDs), and response generation.
  2. **Client-Side Resilient Fallback (`clientAssistantEngine.js`):** In-browser query engine that parses precomputed JSON artifacts directly, guaranteeing **zero downtime** and immediate responses even during network interruptions.

### 3. Frontend Portal (`frontend/src/`)
- **Framework & Build:** React 18, Vite, React Router, Lucide Icons, Recharts.
- **Public Citizen & Oversight Portal:**
  - Modern government design system with dark blue & saffron accents, high readability typography, and accessible contrasts.
  - Interactive **Hero**, **Live Stats Marquee**, **Pathways Grid**, **What Nirikshak AI Detects**, and **Virtual Office** risk calculator.
  - **Dynamic House Selector:** Real-time state toggling between **Both Houses**, **Lok Sabha**, and **Rajya Sabha** with instant statistic re-calculation.
  - **India Map Visualizer:** High-resolution interactive state/constituency risk map.
  - **Bilingual Interface:** Instant switching between English and Hindi across the entire interface.
- **Comprehensive Deep-Dive Views:**
  - `FindProjectsView`: Multi-field search engine across 218K+ projects with filters for state, district, status, and cost ranges.
  - `BrowseStatesView` & `StateDetailView`: State-by-state scorecards, fund absorption rates, and district rankings.
  - `BrowseMpsView` & `MpDetailView`: Complete profiles for 1,322 MPs with fund utilization benchmarks.
  - `CompareView`: Side-by-side comparative analysis of two constituencies or MPs.
  - `UnifiedAiIntelligenceView`: Interactive workspace displaying all 8 AI engines in standby, computing live risk scores and diagnostic radar breakdowns upon user interaction.
  - `MeetTheTeamView`: Team Sage presentation layout showcasing all 6 team members and verified project contributions.
  - `QrDemoView`: Smart device-selection interface (`/demo` and `/qr`) providing responsive options for laptop and mobile access.

---

## 👥 Role-Based Access Control (RBAC) Matrix

Nirikshak AI provides 8 distinct persona environments populated with realistic precomputed data:

| Role | Official Display Title | Sample Email ID | Jurisdiction | Tailored Capabilities & View |
|:---|:---|:---|:---|:---|
| **Admin** | System Administrator | `admin@nirikshak.gov.in` | National | User creation, role modification, password resets, audit logs |
| **MoSPI Officer** | MoSPI Joint Secretary | `mospi.officer@nirikshak.gov.in` | National | Macro national trends, fund utilization benchmarks, high-risk works |
| **State Officer** | State Nodal Officer (UP) | `state.up@nirikshak.gov.in` | Uttar Pradesh | State district rankings, delayed works, agency performance |
| **District Officer**| District Magistrate (Jabalpur) | `district.jabalpur@nirikshak.gov.in` | Jabalpur | Granular project approvals, local contractor monitoring, timeline alerts |
| **Hon'ble MP** | Member of Parliament | `mp.loksabha@nirikshak.gov.in` | Varanasi | Constituency portfolio, sanction-to-disbursal health, progress tracker |
| **Field Inspector**| Field Quality Inspector | `inspector@nirikshak.gov.in` | Central Zone | Physical inspection portal, MB verification checklist, photo upload |
| **Policy Analyst** | MoSPI Policy Analyst | `analyst@nirikshak.gov.in` | National | Advanced ML feature distributions, HHI monopoly graphs, cartel detection |
| **Viewer** | Public Citizen / Auditor | `viewer@nirikshak.gov.in` | National | Public transparency portal, RTI verification, sanitized project views |

*Demo Standard Password:* `nirikshak@2026` *(Quick-login buttons available on login screen).*

---

## 📊 Key Anomaly Insights (Nationwide Findings)

Based on empirical runs of Nirikshak AI across the full nationwide dataset:

| Signal / Anomaly Dimension | Affected Records | Governance & Oversight Significance |
|---|:---:|---|
| **Chronic Execution Delays (> 365 Days)** | **29,947 Works** | ~14% of sanctioned works exceed 1 year beyond target completion date. |
| **Statistical Delay Outliers (`delay_z_score > 2`)** | **8,345 Works** | Extreme execution bottlenecks relative to state/category peers. |
| **Severe Cost Outliers (`\|cost_z_score\| > 2`)** | **5,567 Works** | Projects costing 2+ standard deviations above the category median. |
| **Over-Disbursed Works (> 100% Disbursal)** | **3,540 Works** | Projects where total vendor disbursals exceed total sanctioned funds. |
| **High-Confidence Duplicate Candidates** | **29,402 Pairs** | Work pairs sharing high semantic NLP similarity, matching amounts, and identical locations. |
| **High Contractor Concentration (`HHI > 2500`)** | **64 Districts** | Districts where more than 50% of MPLADS expenditure flows to a single vendor. |
| **Extreme Payment Fragmentation** | **Max 191 Vouchers** | Individual projects split across dozens of sub-threshold vouchers to bypass tender limits. |

---

## 🌐 Production Deployment & DevOps

- **Remote Host:** Ubuntu 22.04 LTS Cloud Instance (`155.248.255.235`) at `/var/www/nirikshak`.
- **Process Orchestration:** `systemd` managed service (`nirikshak-backend.service`) running Uvicorn ASGI with auto-restart on failure.
- **Reverse Proxy & Static Asset Serving:** Nginx routing API requests to FastAPI (:8000) and serving built Vite bundles from `/var/www/nirikshak/frontend`.
- **Automated Deployment Pipeline (`deploy.ps1`):**
  1. Executes local `npm run build` in `frontend/`.
  2. Syncs production bundles via SSH/SCP to remote web directories.
  3. Re-synchronizes precomputed JSON analytics across server data paths (`/var/www/nirikshak/frontend/public/data/` and `/var/www/nirikshak/data/live_exports/`).
  4. Restarts `nirikshak-backend.service` cleanly with zero downtime.

---

## 🔮 Future Roadmap & Scalability

1. **Computer Vision & Physical Evidence AI (`ai-model/evidence_ai/`):**
   - Implement **Perceptual Hashing (`pHash`)** to detect duplicate project photos uploaded across multiple works.
   - Extract **EXIF metadata** (GPS coordinates and timestamps) to verify that uploaded inspection photos match the actual project site.
   - Deploy **before-and-after satellite/drone imagery comparison** to verify ground truth physical progress.
2. **Automated Document Intelligence & OCR:**
   - Integrate OCR pipelines to ingest scanned **Measurement Books (MBs)**, **Utilization Certificates (UCs)**, and **Vendor Invoices**, cross-referencing GSTIN checksums automatically.
3. **End-to-End Investigation Case Hub (`ai-model/investigation_hub/`):**
   - Connect high-risk alerts to formal investigation case dockets with assignable inspection deadlines, evidence logs, and MoSPI escalation workflows.
4. **Scheme Expansion:**
   - Re-use the 8-pillar risk architecture for other central infrastructure programs, including **PMGSY (Pradhan Mantri Gram Sadak Yojana)** and **AMRUT**.

---

## 👥 Team Sage — SIH 2026

* **Problem Statement:** AI-based Analysis of MPLADS Fund Utilization (SIH26-26102)
* **Lead Organisation:** Ministry of Statistics and Programme Implementation (MoSPI)
* **Team Members:**
1. **Vishal Kumar Singh** — Backend, Data Engineering & Integration Lead
2. **Ajay Raj** — Frontend & Product Interface Lead
3. **Prasann Puri Goswami** — AI Analytics & Backend Engineer
4. **Aditya Mishra** — Quality Assurance & Data Validation Associate
5. **Prachi Phadke** — UX Review, Presentation & Demo Lead
6. **Srishti Kumari** — Domain Research & Documentation Lead


# Nirakshak AI

> **AI-Powered MPLADS Integrity and Monitoring Platform**
> *From thousands of projects to the ones that need attention.*

## Smart India Hackathon 2026

**Problem Statement ID:** SIH26-26102
**Organisation:** Ministry of Statistics and Programme Implementation (MoSPI)
**Problem Statement:** Development of an AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme implementation.

---

## What are we building?

**Nirakshak AI** is an AI-powered decision-support platform for monitoring MPLADS works and fund utilisation.

MPLADS involves thousands of development works across India, including roads, schools, community assets, water facilities and civic infrastructure. Officials must monitor recommendations, sanctions, expenditure, payments, work progress and completion across a large number of projects.

Nirakshak AI helps authorities identify **which projects require attention first** by detecting unusual patterns, delays, probable duplicate works, cost deviations and expenditure-progress mismatches.

It is **not an accusation engine**. The system only identifies anomalies and generates evidence-backed risk alerts. Final verification and action remain with authorised human officers.

---

## Problem We Are Solving

Existing MPLADS/eSAKSHI systems are designed mainly for recording, tracking and reporting project information.

However, manually comparing thousands of works to identify issues such as these is difficult:

* A project has spent 90% of its sanctioned amount but shows only 40% physical progress.
* A road project costs much more than similar projects in the same region.
* A work has missed its completion deadline by several months.
* Two projects have very similar descriptions, costs and nearby locations.
* An implementing agency repeatedly appears in delayed or high-risk projects.
* Payment records show unusual bursts, repeated amounts or suspicious patterns.

**Nirakshak AI adds an intelligence layer on top of MPLADS data.** It compares projects, detects risks, explains the reasons and creates a prioritised investigation queue.

---

## Core Solution

```text
MPLADS / eSAKSHI Data
        ↓
Data Cleaning and Standardisation
        ↓
AI and Rule-Based Risk Analysis
        ↓
Explainable Unified Risk Score (0-100)
        ↓
Alerts, Investigation Workflow and Reports
```

Each project receives:

* A risk score from **0 to 100**
* Risk band: Low, Medium, High or Critical
* Confidence score based on data availability
* Clear reasons behind the score
* Supporting evidence
* Recommended verification action

Example:

```text
Risk Score: 87/100 - Critical

Reasons:
- 90% of sanctioned amount spent but only 40% physical progress reported
- Cost is 48% above comparable nearby projects
- Expected completion date exceeded by 11 months
- Implementing agency has multiple prior delay flags

Recommended Action:
Physical inspection and verification of bills, measurements and project photographs.
```

---

## Key Modules

### 1. FinGuard - Financial Intelligence

Detects financial and cost-related anomalies.

Features:

* Cost-overrun detection
* Cost benchmarking against similar works
* Expenditure-versus-progress mismatch
* Budget utilisation analysis
* Payment-pattern anomaly detection
* Fund-release and expenditure tracking

### 2. GeoIntel - Geospatial Intelligence

Uses project locations to identify spatial patterns and possible overlaps.

Features:

* Project geo-mapping
* Risk heatmaps
* Nearby-project comparison
* Geographic clustering
* Duplicate/overlapping work detection
* District and constituency-level risk analysis

### 3. Duplicate Project Detection

Identifies potentially duplicate or highly similar projects using:

* Project title and description similarity
* Work category
* Sanctioned amount
* Implementing agency
* Geographic proximity
* Project dates

The system does not mark a project as duplicate based on text similarity alone. It requires multiple supporting signals.

### 4. Delay Risk Prediction

Identifies projects likely to be delayed or already delayed.

Signals include:

* Time elapsed since sanction
* Expected completion date
* Progress percentage
* Expenditure level
* Work category
* Implementing agency history

### 5. EvidenceAI - Image and Document Verification

This is an advanced module for future/authorised-data integration.

Planned features:

* Duplicate photo detection
* Before-after image comparison
* Project-photo relevance checks
* Metadata verification
* Document consistency checks

### 6. Investigation Hub

Enables authorised officials to review alerts and document action.

Workflow:

```text
Alert
→ Review
→ Evidence Check
→ Investigation Case
→ Officer Notes
→ Field Verification
→ Resolution / Escalation
```

### 7. Reports and Audit Trail

The platform can generate investigation-ready reports containing:

* Project summary
* Risk score and reasons
* Financial and progress evidence
* Similar/duplicate project evidence
* Location information
* Officer notes
* Investigation status
* Full audit trail

---

## Intended Users

| User                             | Access                                             |
| -------------------------------- | -------------------------------------------------- |
| MoSPI / Ministry Official        | National-level monitoring, analytics and reports   |
| State Nodal Authority            | State-level projects, alerts and assignments       |
| District Authority               | District projects, investigation and verification  |
| MP / Constituency Representative | Read-only constituency project monitoring          |
| Implementing Agency              | Its own project updates and alerts                 |
| Investigation / Audit Officer    | Assigned cases, evidence, notes and reports        |
| Citizen                          | Public project information and feedback/complaints |

---

## Data Strategy

Nirakshak AI follows a strict data-provenance approach.

### Official Public Data

Public MPLADS dashboard data will be used for:

* Real aggregate statistics
* State, MP and constituency-level insights
* Real-world distribution/reference patterns
* Validation of dashboard metrics

### Project-Level Data

We are currently identifying the relevant public dashboard XHR/API calls for individual MPLADS works.

Once available and permissible, project-level records may include:

* Work ID
* Project title and description
* Location
* Category
* Sanctioned amount
* Expenditure
* Physical progress
* Project status
* Dates
* Implementing agency
* Supporting documents/images, where authorised

### Synthetic Demonstration Data

For SIH model development and controlled testing, we may use clearly labelled synthetic project-level data.

Synthetic records will:

* Never be presented as real government records
* Be marked with `is_synthetic = true`
* Preserve realistic MPLADS-like cost, category, timeline and location patterns
* Include labelled anomalies to evaluate model performance

Example injected anomalies:

* Cost inflation
* High expenditure with low work progress
* Delayed completion
* Duplicate project descriptions and locations
* Suspicious payment patterns
* High-risk agency clusters
* Missing/incomplete data

---

## AI and Analytics Approach

Nirakshak AI uses a hybrid approach: **rules + machine learning**.

| Risk Area                     | Initial Method                            |
| ----------------------------- | ----------------------------------------- |
| Financial anomaly detection   | Isolation Forest + rules                  |
| Cost benchmarking             | Z-score / peer comparison                 |
| Expenditure-progress mismatch | Rule-based thresholds                     |
| Delay risk                    | Rule-based model, later XGBoost           |
| Duplicate descriptions        | NLP embeddings + cosine similarity        |
| Location comparison           | PostGIS / Haversine distance              |
| Photo reuse                   | Perceptual hash, later CLIP embeddings    |
| Explainability                | Rule explanations + feature contributions |

### Unified Risk Score

```text
Financial Risk                 20%
Progress Risk                  20%
Cost Risk                      15%
Delay Risk                     15%
Duplicate Project Risk         10%
Evidence Risk                  10%
Agency Risk                     5%
Payment Risk                    5%
-----------------------------------
Final Risk Score              100%
```

The final score is confidence-adjusted based on data completeness.

---

## Planned Technology Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Recharts
* Leaflet for maps

### Backend

* Python
* FastAPI
* JWT authentication
* Role-Based Access Control

### Database and Storage

* PostgreSQL
* PostGIS for location-based intelligence
* Object storage for documents and images
* Redis/Celery for background analysis jobs, if required

### AI/ML

* Pandas
* Scikit-learn
* XGBoost / LightGBM
* Sentence Transformers
* SHAP
* OpenCV / Pillow
* PostGIS
* NetworkX, as future scope

---

## MVP Scope

The first working MVP will include:

* Project database and data ingestion pipeline
* Financial anomaly detection
* Cost benchmarking
* Expenditure-progress mismatch detection
* Delay detection
* Duplicate project detection using text, cost and location
* Explainable risk score
* Risk dashboard
* Project detail page
* Alert and investigation workflow
* Generated investigation report

### Future Scope

* Image/photo reuse detection
* Document OCR and consistency checks
* Advanced payment analytics
* Vendor/agency network analysis
* Multilingual complaint intelligence
* Cross-scheme expansion to PMAY, PMGSY, Jal Jeevan Mission and Smart Cities projects
* Authorised integration with eSAKSHI APIs/exports

---

## Project Principles

1. **Human-in-the-loop:** AI recommends; authorised officers decide.
2. **Explainability-first:** Every risk score must show the reasons and evidence.
3. **No false accusations:** Use terms such as “anomaly detected” and “requires verification,” never “fraud confirmed.”
4. **Data provenance:** Every record must identify its source.
5. **Privacy and security:** Role-based access, audit logs, secure storage and controlled data access.
6. **No replacement claim:** Nirakshak AI complements existing MPLADS/eSAKSHI monitoring systems; it does not replace them.

---

## Current Status

* [x] Problem statement analysed
* [x] Product vision finalised
* [x] Name finalised: **Nirakshak AI**
* [x] Public MPLADS dashboard endpoints identified
* [ ] Individual-work XHR/API contract discovery
* [ ] Database schema
* [ ] Synthetic project-data generator
* [ ] Risk engine
* [ ] Backend APIs
* [ ] Dashboard frontend
* [ ] Investigation workflow
* [ ] SIH demo and presentation

---

## One-Line Pitch

> **Nirakshak AI transforms MPLADS data into explainable, evidence-backed risk intelligence—helping authorities identify which development works need attention first.**

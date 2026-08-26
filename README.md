# Nirikshak AI

> **AI-Powered MPLADS Integrity & Monitoring Platform**
> *From thousands of projects to the ones that need attention.*

## Smart India Hackathon 2026

* **Problem Statement ID:** SIH26-26102
* **Organisation:** Ministry of Statistics and Programme Implementation (MoSPI)
* **Category:** Software
* **Problem Statement:** Development of an AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme implementation.

---

## About the Project

**Nirikshak AI** is an AI-powered decision-support platform for monitoring MPLADS works and fund utilisation.

MPLADS involves thousands of development works across India, such as roads, schools, water facilities, community halls and other civic assets. Monitoring every project manually is difficult because authorities must track recommendations, sanctions, expenditure, progress, payments and completion across many districts.

Nirikshak AI helps officials identify **which works require attention first**. It detects unusual financial patterns, cost deviations, delayed works, expenditure-progress mismatches and probable duplicate projects, then presents them through clear risk alerts and evidence-backed dashboards.

> Nirikshak AI is **not an accusation engine**. It identifies anomalies that require verification. Every final decision remains with authorised human officials.

---

## Problem We Are Solving

Existing MPLADS/eSAKSHI systems are mainly designed for data entry, project tracking and reporting. They can show what is happening, but officials still need to manually compare thousands of works to identify suspicious patterns.

Examples of issues that are hard to detect manually:

* A project has spent 90% of its sanctioned amount but has only 40% physical progress.
* A work costs much more than similar works in the same region.
* A project is delayed for several months beyond its expected completion date.
* Two projects have very similar titles, costs and nearby locations.
* An implementing agency repeatedly appears in delayed or high-risk works.
* Payment records contain unusual bursts or repeated patterns.

---

## Our Solution

```text
MPLADS / eSAKSHI Data
        ↓
Data Cleaning and Standardisation
        ↓
AI + Rule-Based Risk Analysis
        ↓
Explainable Unified Risk Score (0-100)
        ↓
Alerts, Investigation Workflow and Reports
```

For every project, Nirikshak AI will provide:

* Risk score from **0 to 100**
* Risk band: Low, Medium, High or Critical
* Confidence score based on available data
* Reasons behind the risk score
* Supporting evidence
* Recommended verification action

### Example Alert

```text
Risk Score: 87/100 - Critical

Reasons:
- 90% of sanctioned amount spent, but only 40% physical progress reported
- Cost is 48% above comparable nearby projects
- Work is delayed by 11 months
- Implementing agency has multiple prior delay flags

Recommended action:
Conduct physical inspection and verify bills, measurements and progress records.
```

---

## Core Modules

### 1. FinGuard - Financial Intelligence

Detects financial and cost-related anomalies.

* Cost-overrun detection
* Cost benchmarking against comparable works
* Expenditure-versus-progress mismatch
* Budget utilisation analysis
* Fund-release and expenditure tracking
* Payment-pattern anomaly detection

### 2. GeoIntel - Geospatial Intelligence

Uses location data to identify spatial patterns.

* Project geo-mapping
* Risk heatmaps
* Nearby-project comparison
* Geographic clustering
* Duplicate/overlapping work detection
* District and constituency-level risk analysis

### 3. Duplicate Project Detection

Identifies potentially duplicate or highly similar works using:

* Title and description similarity
* Work category
* Sanctioned cost
* Implementing agency
* Geographic proximity
* Project timelines

A project will not be marked as duplicate on text similarity alone. Multiple signals must support the alert.

### 4. Delay Risk Detection

Identifies completed-late, currently delayed and likely-to-be-delayed works using:

* Sanction date
* Expected completion date
* Physical progress
* Expenditure percentage
* Work category
* Implementing agency history

### 5. EvidenceAI - Image and Document Verification

Advanced module for authorised data integration.

* Duplicate-image detection
* Project-photo relevance checks
* Before-after progress comparison
* Metadata verification
* Document consistency checks

### 6. Investigation Hub

A structured workflow for authorised officials.

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

Nirikshak AI can generate investigation-ready reports containing:

* Project summary
* Risk score and explanations
* Financial and progress evidence
* Similar-project evidence
* Location data
* Officer notes
* Investigation status
* Audit trail

---

## Intended Users

| User                             | Access                                            |
| -------------------------------- | ------------------------------------------------- |
| MoSPI / Ministry Official        | National monitoring, analytics and reports        |
| State Nodal Authority            | State-level alerts and project analysis           |
| District Authority               | District projects, investigation and verification |
| MP / Constituency Representative | Read-only constituency monitoring                 |
| Implementing Agency              | Own-project updates and alerts                    |
| Investigation / Audit Officer    | Assigned cases, evidence and reports              |
| Citizen                          | Public project information and feedback           |

---

## Data Strategy

Nirikshak AI maintains strict data provenance.

### Official Public MPLADS Data

Public MPLADS dashboard data will be used for:

* Real aggregate statistics
* State, MP and constituency-level insights
* Reference patterns for costs, utilisation and project trends
* Dashboard validation

### Individual Work Data

We are currently identifying the public dashboard XHR/API calls that provide individual MPLADS work records.

Target fields include:

```text
Work ID
Project title and description
Work category
State, district and constituency
MP and implementing agency
Sanctioned amount and expenditure
Physical progress
Project dates and status
Location coordinates
Project images and documents, where permitted
```

### Synthetic Demonstration Data

For controlled SIH testing, synthetic work-level records may be used where authorised project-level data is unavailable.

Rules:

* Synthetic records are never presented as real government records.
* Every synthetic record uses `is_synthetic = true`.
* Every record identifies its `data_source`.
* Synthetic data follows MPLADS-like patterns for cost, category, geography and timelines.
* Known anomalies are deliberately injected to test the AI models.

Injected anomaly types:

* Cost inflation
* High expenditure with low physical progress
* Delayed completion
* Duplicate descriptions and nearby locations
* Suspicious payment patterns
* High-risk agency clusters
* Missing/incomplete data

---

## AI and Analytics Approach

Nirikshak AI combines **rule-based checks** with **machine-learning models**.

| Risk Area                     | Method                                          |
| ----------------------------- | ----------------------------------------------- |
| Financial anomaly detection   | Isolation Forest + rules                        |
| Cost benchmarking             | Z-score and peer comparison                     |
| Expenditure-progress mismatch | Rule-based thresholds                           |
| Delay risk                    | Rules initially, XGBoost later                  |
| Duplicate descriptions        | NLP embeddings + cosine similarity              |
| Location comparison           | PostGIS / Haversine distance                    |
| Photo reuse                   | Perceptual hash, later CLIP                     |
| Explainability                | Rules, feature contributions and evidence links |

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

The final score is adjusted according to data completeness and model confidence.

---

## Technology Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Recharts
* Leaflet

### Backend

* Python
* FastAPI
* JWT Authentication
* Role-Based Access Control

### Database and Storage

* PostgreSQL
* PostGIS
* Object storage for documents and images
* Redis/Celery for background processing if needed

### AI / ML

* Pandas
* Scikit-learn
* XGBoost / LightGBM
* Sentence Transformers
* SHAP
* OpenCV / Pillow
* NetworkX for future graph analysis

---

## MVP Scope

The first working version will include:

* Project database and data pipeline
* Financial anomaly detection
* Cost benchmarking
* Expenditure-progress mismatch detection
* Delay detection
* Duplicate project detection using title, cost and location
* Explainable unified risk score
* Risk dashboard
* Project detail page
* Alert and investigation workflow
* Downloadable investigation report

### Future Scope

* Photo reuse detection
* OCR and document consistency checks
* Advanced payment analytics
* Vendor/agency network analysis
* Multilingual complaint intelligence
* Cross-scheme expansion to PMAY, PMGSY, Jal Jeevan Mission and Smart Cities
* Authorised eSAKSHI API/export integration

---

## Project Principles

1. **Human-in-the-loop:** AI recommends; officials decide.
2. **Explainability-first:** Every risk score must show reasons and evidence.
3. **No false accusations:** Use “anomaly detected” and “requires verification,” never “fraud confirmed.”
4. **Data provenance:** Every record must identify its source.
5. **Privacy and security:** Role-based access, audit logs and secure storage.
6. **Integration layer:** Nirikshak AI complements existing MPLADS/eSAKSHI systems; it does not replace them.

---

## Current Status

* [x] SIH problem statement analysed
* [x] Product vision defined
* [x] Project name finalised: **Nirikshak AI**
* [x] Public MPLADS dashboard endpoints identified
* [ ] Individual-work XHR/API request capture
* [ ] Database schema
* [ ] Synthetic project-data generator
* [ ] AI risk engine
* [ ] Backend APIs
* [ ] Frontend dashboard
* [ ] Investigation workflow
* [ ] SIH demo and presentation

---

## One-Line Pitch

> **Nirikshak AI transforms MPLADS data into explainable, evidence-backed risk intelligence, helping authorities identify which development works need attention first.**

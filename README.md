# Nirikshak AI

> **AI-Powered MPLADS Integrity, Risk & Monitoring Platform**
> *From thousands of development works to the projects that need attention first.*

## Smart India Hackathon 2026

* **Problem Statement ID:** SIH26-26102
* **Organisation:** Ministry of Statistics and Programme Implementation (MoSPI)
* **Category:** Software
* **Problem Statement:** Development of an AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme implementation.

---

# About Nirikshak AI

**Nirikshak AI** is an AI-assisted monitoring and risk-analysis platform designed for **MPLADS (Members of Parliament Local Area Development Scheme)** projects.

MPLADS involves a large number of development works distributed across states, districts and parliamentary constituencies. Monitoring these projects requires analysing information related to:

* Project recommendations
* Sanctioned amounts
* Expenditure
* Project timelines
* Work completion
* Implementing agencies
* Vendors
* Payments
* Geographic distribution
* Similar or potentially duplicate works

Nirikshak AI processes this information through a combination of **machine-learning models, statistical analysis, rule-based anomaly detection, NLP similarity analysis and geographic intelligence**.

The platform converts these individual signals into an **explainable unified project risk score**, helping authorised officials identify projects that may require further review.

> **Nirikshak AI is an anomaly-detection and decision-support system, not an accusation engine. A detected anomaly indicates that a project may require verification; it does not establish fraud or wrongdoing.**

---

# Problem We Are Solving

Monitoring a large number of MPLADS projects manually makes it difficult to identify unusual patterns across thousands of records.

Potentially important patterns can include:

* A project consuming a disproportionately large amount of its sanctioned funds.
* A project showing significant cost deviation compared with similar works.
* A project remaining delayed for an unusually long period.
* A project showing unusual expenditure patterns.
* Multiple projects having highly similar descriptions and financial characteristics.
* An implementing agency repeatedly appearing in delayed or high-risk projects.
* A vendor dominating expenditure within a constituency.
* Multiple vendors exhibiting potentially connected patterns.
* High-risk projects forming geographic clusters.

Traditional dashboards can show project information, but Nirikshak AI adds an analytical layer that helps answer:

> **Which projects require attention first, and why?**

---

# System Architecture

```text
                 MPLADS / Official Data
                         │
                         ▼
              Data Ingestion & Sync
                         │
                         ▼
              PostgreSQL Data Layer
                         │
                         ▼
                Feature Engineering
                  feature_builder
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   FinGuard         Progress Risk     Cost Risk
        │                │                │
        ├────────────┬───┴───────┬────────┤
        │            │           │
        ▼            ▼           ▼
   Delay Risk   Duplicate     Agency
                Detector    Intelligence
        │            │           │
        └────────────┼───────────┘
                     │
                     ▼
              Payment Risk
                     │
                     ▼
           Unified Risk Engine
                     │
                     ▼
       Final Risk Score + Risk Tier
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   Project Evaluations     GeoIntel
          │                     │
          ▼                     ▼
       JSON Data          GeoJSON / Clusters
          │                     │
          └──────────┬──────────┘
                     ▼
              React + Vite UI
```

---

# Core Risk Architecture

Nirikshak AI currently contains the following weighted risk components:

| Risk Module                         |     Weight | Status                           |
| ----------------------------------- | ---------: | -------------------------------- |
| **FinGuard / Financial Risk**       |        20% | Implemented                      |
| **Progress Risk / Stall Predictor** |        20% | Implemented                      |
| **Cost Risk**                       |        15% | Implemented                      |
| **Delay Risk**                      |        15% | Implemented                      |
| **Duplicate Project Risk**          |        10% | Implemented                      |
| **Evidence / Compliance Risk**      |        10% | Rule-based check only            |
| **Agency Intelligence**             |         5% | Implemented                      |
| **Payment Risk**                    |         5% | Implemented                      |
| **GeoIntel**                        | Supporting | Implemented backend / partial UI |
| **Unified Risk Engine**             | Aggregator | Implemented                      |

### Unified Risk Formula

```text
Final Risk Score =
    0.20 × Financial Risk
  + 0.20 × Progress Risk
  + 0.15 × Cost Risk
  + 0.15 × Delay Risk
  + 0.10 × Duplicate Risk
  + 0.10 × Evidence Risk
  + 0.05 × Agency Risk
  + 0.05 × Payment Risk
```

The resulting score is mapped into four risk tiers:

```text
0  – 24.99     LOW
25 – 49.99     MODERATE
50 – 74.99     HIGH
75 – 100       CRITICAL
```

---

# Core Modules

## 1. FinGuard — Financial Risk Intelligence

**FinGuard** analyses project financial behaviour and identifies unusual expenditure and fund-utilisation patterns.

### Detects

* Cost overruns
* Over-disbursement
* Statistical cost outliers
* Ghost disbursal
* Phantom completion
* Stalled capital
* Payment fragmentation
* March-end expenditure concentration

### Techniques

FinGuard combines:

* Rule-based financial checks
* Statistical outlier analysis
* Isolation Forest
* Expenditure aggregation
* Project-progress consistency checks

### Example Signals

```text
Cost Overrun
Over-Disbursement
Ghost Disbursal
Phantom Completion
Stalled Capital
Payment Fragmentation
March Rush
```

### Output

```text
financial_risk_score
anomaly_reasons
recommended_actions
financial anomaly flags
```

### Unified Risk Contribution

**20%**

### Main Implementation

```text
ai_models/finguard.py
backend/export_live_results.py
```

---

# 2. Progress Risk — Stall Predictor

**Progress Risk** evaluates whether a project is progressing normally or shows characteristics associated with stalled projects.

The module analyses project lifetime, delays, expenditure utilisation and other engineered features.

### Important Features

* Sanction delay
* Completion delay
* Project lifetime
* Utilisation rate
* Disbursement ratio
* Number of payments
* Sanction amount
* Description characteristics

### Stall Detection

A project can be considered stalled when conditions such as the following are satisfied:

```text
completion_delay_days > 365
```

or

```text
project_lifetime_days > 365
AND
disbursement_ratio < 0.40
```

### Machine Learning

The module uses a:

**Random Forest Classifier**

with a heuristic fallback when the trained model artifact is unavailable.

### Output

```text
stall_probability
stall_probability_score
progress_risk_score
```

### Unified Risk Contribution

**20%**

### Main Implementation

```text
ai_models/stall_predictor.py
ai_models/feature_builder.py
```

---

# 3. Cost Risk

**Cost Risk** identifies projects whose sanctioned cost deviates significantly from comparable projects.

Instead of considering a project's cost in isolation, the system establishes statistical baselines based on:

```text
Work Category
+
State
```

The system calculates:

* Median cost
* Standard deviation
* Cost Z-score

### Z-Score

```text
cost_z_score =
(sanction_amount - group_median_cost)
/
group_standard_deviation
```

The resulting deviation is converted into a normalized **0–100 Cost Risk Score**.

### Unified Risk Contribution

**15%**

### Main Implementation

```text
ai_models/feature_builder.py
ai_models/unified_risk_engine.py
```

---

# 4. Delay Risk Detection

**Delay Risk** predicts the probability and severity of project completion delays.

The module uses a supervised machine-learning model together with engineered temporal, financial and administrative features.

### Canonical Features

The current Delay Risk pipeline uses **17 canonical features**, including:

* Recommendation-to-sanction lag
* Sanction year
* Sanction month
* Sanction quarter
* Sanction day of week
* Log sanctioned amount
* Log recommended amount
* Recommendation/sanction amount difference
* Recommendation/sanction amount ratio
* Work category code
* House type code
* Tenure code
* State code
* Constituency code
* 90-day expenditure count
* 90-day disbursed amount
* 90-day disbursement ratio

### Model

```text
Random Forest Classifier
```

A calibrated heuristic fallback is available when the model artifact is unavailable.

### Risk Tiers

```text
LOW        < 30
MODERATE   < 50
HIGH       < 70
CRITICAL   >= 70
```

### Output

```text
delay_probability
delay_risk_score
delay_risk_tier
unified_risk_contribution
risk factors
```

### Unified Risk Contribution

**15%**

### Main Implementation

```text
ai_models/delay_risk/
    scoring.py
    model.py
    delay_risk_model.joblib
```

---

# 5. Duplicate Project Detector

The **Duplicate Project Detector** identifies potentially duplicate or split-work projects.

It does not rely on project-description similarity alone.

The detector uses a **multi-signal verification architecture**.

### Detection Pipeline

```text
Project Descriptions
        │
        ▼
Sentence Embeddings
        │
        ▼
Cosine Similarity
        │
        ▼
Candidate Projects
        │
        ├── Financial Proximity
        ├── Agency Match
        └── Temporal Proximity
                 │
                 ▼
          Multi-Signal Check
                 │
                 ▼
             Alert
```

### NLP Model

```text
sentence-transformers/
all-MiniLM-L6-v2
```

The model generates semantic embeddings for project descriptions.

### Verification Signals

A candidate pair is evaluated using:

1. **Text similarity**
2. **Financial proximity**
3. **Agency similarity**
4. **Temporal proximity**

The detector requires strong textual similarity plus multiple supporting signals before generating an alert.

### Risk Confidence

```text
risk_confidence =
    0.40 × text similarity
  + 0.20 × financial match
  + 0.20 × agency match
  + 0.20 × temporal match
```

### Output

```text
Candidate duplicate pairs
Duplicate / Split-work alert
Text similarity
Financial match
Agency match
Temporal match
Risk confidence
```

### Database

```text
duplicate_alerts
```

### Unified Risk Contribution

**10%**

### Main Implementation

```text
ai_models/duplicate_detector.py
backend/export_live_results.py
```

---

# 6. Agency Intelligence

**Agency Intelligence** evaluates the historical performance of implementing agencies and district authorities.

The purpose is to avoid judging an agency solely from a small number of projects.

### Analysis Includes

* Historical completed projects
* Delay history
* Project duration
* Agency workload
* District authority performance
* Agency credibility based on sample size

### Agency Name Canonicalization

Different representations of the same agency can occur in source data.

The system uses fuzzy matching and **Jaro-Winkler similarity** to canonicalize agency names.

### Empirical Bayes Shrinkage

Instead of directly using raw delay rates, the module applies statistical shrinkage based on the number of completed projects.

```text
shrunken_delay_rate =
(delay_count + α)
/
(completed_projects + α + β)
```

### Adaptive Blending

The system combines:

```text
Implementing Agency Score
+
District Authority Score
```

The contribution of the agency score depends on the credibility of its historical sample.

### Output

```text
agency_risk_score
agency_risk_tier
agency_risk_contribution
explainable audit factors
```

### Unified Risk Contribution

**5%**

### Main Implementation

```text
ai-model/agency_intelligence/
    profiling.py
    scoring.py
    canonicalization.py
```

---

# 7. Payment Risk & Vendor Network Intelligence

**Payment Risk** analyses expenditure and vendor-distribution patterns.

It focuses on identifying potentially unusual vendor concentration and payment fragmentation.

### Current Signals

* Number of payments
* Vendor concentration
* Constituency HHI
* Vendor dominance
* Cross-constituency vendor activity
* Potential vendor network relationships

### HHI

The system calculates the **Herfindahl-Hirschman Index (HHI)** to measure vendor concentration.

```text
HHI = Σ(Market Share %)²
```

High HHI indicates strong concentration of expenditure among a small number of vendors.

### Vendor Network

The system builds a bipartite relationship between:

```text
Constituency ↔ Vendor
```

It can identify:

* Dominant vendors
* High-centrality vendors
* Constituency-level monopolies
* Potential vendor groups

### Output

```text
payment_risk_score
constituency HHI
vendor risk network
vendor groups
```

### Unified Risk Contribution

**5%**

### Main Implementation

```text
ai_models/vendor_network.py
ai_models/unified_risk_engine.py
```

---

# 8. GeoIntel — Geographic Intelligence

**GeoIntel** is the geographic intelligence and spatial-analysis component of Nirikshak AI.

It provides geographic context around project risk and identifies areas where high-risk projects may form spatial clusters.

> **GeoIntel is a supporting intelligence module. It does not directly contribute a percentage to the Unified Risk Score.**

### Main Functions

#### Constituency Risk Aggregation

The system calculates a constituency-level spatial risk indicator based on the proportion of high-risk projects.

```text
Spatial Risk =
High-Risk Projects
/
Total Projects
```

#### Geocoding

Constituency and state information is converted into geographic coordinates.

The system uses:

```text
Nominatim
```

with local caching to reduce repeated geocoding requests.

#### Spatial Clustering

GeoIntel applies **K-Means clustering** using geographic and risk-related features such as:

```text
Latitude
Longitude
Spatial Risk Score
```

This helps identify geographic concentrations or hotspots.

#### GeoJSON Generation

The resulting geographic intelligence is exported as a standard:

```text
GeoJSON FeatureCollection
```

containing:

* Constituency coordinates
* Spatial risk scores
* Cluster IDs
* Geographic properties

### Output

```text
geointel_heatmap.geojson
```

### Main Implementation

```text
ai_models/geointel.py
backend/export_live_results.py
```

### Frontend Status

The GeoIntel backend pipeline is implemented.

The current frontend map contains the geographic visualization layer, but the generated GeoIntel GeoJSON is **not yet fully consumed as the live frontend heatmap source**. Some displayed map overlays remain static/mock data.

Therefore:

```text
Backend GeoIntel: Implemented
Frontend GeoIntel integration: Partial
Unified Risk Weight: Supporting module / no direct weight
```

---

# 9. Evidence & Compliance Risk

The repository currently contains an **Evidence/Compliance risk slot inside the Unified Risk Engine**, but this should not be confused with a completed Evidence AI system.

### Currently Implemented

The feature-engineering pipeline performs a **rule-based compliance keyword check**.

Certain prohibited or restricted keywords can increase the evidence/compliance risk score.

This is a lightweight text-based compliance signal.

### Not Implemented

The following are **NOT currently implemented as Evidence AI**:

* Image verification
* EXIF analysis
* Perceptual image hashing
* OCR-based invoice verification
* Before/after image comparison
* Advanced document verification

Therefore:

> **Evidence AI is not a completed module in the current repository.**

The current 10% Unified Risk Engine slot represents the existing **rule-based evidence/compliance signal**, not a full Evidence AI implementation.

---

# 10. Unified Risk Engine

The **Unified Risk Engine** is the central risk aggregation component.

It receives the scores produced by the individual risk modules and calculates a single project-level risk score.

### Input Signals

```text
Financial Risk
Progress Risk
Cost Risk
Delay Risk
Duplicate Risk
Evidence/Compliance Risk
Agency Risk
Payment Risk
```

### Weighted Aggregation

```text
Financial       20%
Progress        20%
Cost            15%
Delay           15%
Duplicate       10%
Evidence        10%
Agency           5%
Payment          5%
```

### Output

For every evaluated project, the engine generates:

```text
final_risk_score
risk_tier
top_risk_drivers
project_summary
recommended_actions
```

### Explainability

The engine identifies major contributing risk signals and produces an explainable summary instead of returning only a numerical score.

### Main Implementation

```text
ai_models/unified_risk_engine.py
backend/export_live_results.py
```

### Database

```text
project_risk_evaluations
```

---

# Feature Engineering

The **Feature Builder** creates analytical variables used by several risk modules.

```text
Raw Project Data
       ↓
Cleaning
       ↓
Date Processing
       ↓
Financial Calculations
       ↓
Expenditure Aggregation
       ↓
Statistical Baselines
       ↓
Text Processing
       ↓
Analytical Features
```

### Major Feature Groups

#### Temporal

```text
sanction_delay_days
completion_delay_days
project_lifetime_days
```

#### Financial

```text
cost_overrun_pct
sanction_rec_ratio
utilization_rate
```

#### Statistical

```text
cost_z_score
delay_z_score
median_cost
std_cost
median_delay
std_delay
```

#### Text

```text
clean_description
desc_word_count
desc_char_count
```

#### Expenditure

```text
total_disbursed
num_payments
num_vendors
avg_payment
max_payment
disbursement_ratio
```

The generated analytical data is used as the common feature layer for downstream risk modules.

---

# Data Pipeline

Nirikshak AI contains a structured ingestion and analytics pipeline.

```text
MPLADS Data
     ↓
Incremental Sync
     ↓
Data Cleaning
     ↓
PostgreSQL
     ↓
Feature Builder
     ↓
Analytical Dataset
     ↓
Risk Modules
     ↓
Unified Risk Engine
     ↓
Live Result Export
     ↓
Frontend
```

### Incremental Synchronisation

The project contains an incremental synchronisation process that avoids unnecessarily processing unchanged records.

```text
sync_incremental.py
```

The system uses hashing/delta comparison to identify changes.

### Dataset Export

Analytical and model-ready data can be exported in formats including:

```text
Parquet
PostgreSQL dump
JSON
GeoJSON
```

---

# Database Architecture

The primary application database uses **PostgreSQL**.

The current relational structure contains entities including:

```text
states
    │
    └── constituencies
            │
            ├── MPs
            │
            └── works
                    │
                    └── expenditures
                            │
                            └── vendors

works
    │
    └── project_risk_evaluations

duplicate_alerts
```

### Major Tables

* `states`
* `constituencies`
* `mps`
* `mp_allocations`
* `works`
* `vendors`
* `expenditures`
* `project_risk_evaluations`
* `duplicate_alerts`

The database maintains relationships between projects, constituencies, MPs, agencies, vendors, expenditures and risk evaluations.

---

# Backend

The backend is built using:

```text
Python
FastAPI
PostgreSQL
JWT Authentication
```

### Backend Responsibilities

* API serving
* Authentication
* User management
* Role-based access
* Database connectivity
* Data synchronisation
* Risk-result export
* Analytics integration

### Authentication

The project includes authentication functionality with:

* Login
* JWT tokens
* User profiles
* Roles
* Geographic scope
* Admin user management
* Audit logs

### Main Backend Files

```text
backend/server.py
backend/routes.py
backend/database.py
backend/sync_incremental.py
backend/export_live_results.py
backend/auth/
```

---

# Frontend

The frontend is built using:

```text
React
Vite
JavaScript / JSX
```

The interface contains dashboard components for visualising project and risk information.

### Current Dashboard Areas

* Key project metrics
* Overall project risk
* FinGuard financial anomalies
* Duplicate project alerts
* GeoIntel
* Project-level risk information
* Administrative/user management

The frontend consumes exported analytical data and project evaluations generated by the backend pipeline.

---

# Technology Stack

## Backend

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| Python       | Data processing and AI modules |
| FastAPI      | Backend API                    |
| PostgreSQL   | Relational project database    |
| SQLite       | Authentication-related storage |
| JWT          | Authentication                 |
| Pandas       | Data processing                |
| NumPy        | Numerical computation          |
| Scikit-learn | ML and statistical analysis    |
| PyArrow      | Parquet processing             |

## AI / ML

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| Random Forest         | Progress and Delay Risk        |
| Isolation Forest      | Financial anomaly detection    |
| Sentence Transformers | Semantic project similarity    |
| all-MiniLM-L6-v2      | Project-description embeddings |
| Cosine Similarity     | Duplicate candidate detection  |
| K-Means               | Geographic clustering          |
| Empirical Bayes       | Agency risk estimation         |
| NetworkX              | Vendor network analysis        |

## Frontend

| Technology       | Purpose                       |
| ---------------- | ----------------------------- |
| React            | UI                            |
| Vite             | Frontend build tooling        |
| JavaScript / JSX | Application development       |
| Interactive Map  | Geographic risk visualisation |

## Data

| Technology | Purpose                     |
| ---------- | --------------------------- |
| PostgreSQL | Structured application data |
| Parquet    | Analytical datasets         |
| JSON       | Frontend/result exports     |
| GeoJSON    | Geographic intelligence     |

---

# Risk Detection Philosophy

Nirikshak AI follows a **multi-signal and explainability-first approach**.

A single unusual value should not automatically be interpreted as fraud.

For example:

```text
High Cost
    +
Unusual Expenditure
    +
Long Delay
    +
Similar Nearby Project
```

creates a stronger investigation signal than any individual anomaly alone.

The platform therefore combines multiple analytical signals before presenting high-risk projects for human review.

---

# Explainability

Every major risk component is designed to provide meaningful reasons for its score.

Example:

```text
Project Risk: 82
Risk Tier: CRITICAL

Top Risk Drivers:

1. Financial Risk
   - Significant cost deviation
   - High expenditure relative to sanction

2. Delay Risk
   - Extended execution timeline
   - Low recent expenditure activity

3. Duplicate Risk
   - Highly similar project found
   - Similar financial characteristics
```

This allows officials to understand **why** a project has been prioritised.

---

# Data Safety & Human Oversight

Nirikshak AI is designed as a decision-support platform.

### Principles

**AI recommends — officials decide.**

A risk score means:

```text
Requires Attention
```

not:

```text
Fraud Confirmed
```

The system is intended to support:

* Audit prioritisation
* Field verification
* Financial review
* Project monitoring
* Data-driven decision making

Final action remains with authorised officials.

---

# Current Implementation Status

## Implemented

* [x] MPLADS data ingestion/synchronisation
* [x] PostgreSQL relational data layer
* [x] Analytical feature engineering
* [x] FinGuard
* [x] Progress Risk / Stall Predictor
* [x] Cost Risk
* [x] Delay Risk
* [x] Duplicate Project Detector
* [x] Agency Intelligence
* [x] Payment Risk
* [x] Vendor network analysis
* [x] GeoIntel backend pipeline
* [x] Unified Risk Engine
* [x] Project risk evaluations
* [x] Risk tiers
* [x] Explainable risk drivers
* [x] Recommended actions
* [x] Backend API
* [x] Authentication
* [x] Role-based access
* [x] Frontend dashboards
* [x] Financial anomaly dashboard
* [x] Duplicate detection dashboard
* [x] Geographic visualisation
* [x] Live result export pipeline

## Partially Implemented

* [~] GeoIntel frontend integration — backend GeoJSON generation exists, but the current frontend map does not fully consume the generated GeoJSON and contains static overlays.

## Not Yet Built

* [ ] Full Evidence AI
* [ ] Image perceptual-hash verification
* [ ] EXIF-based evidence verification
* [ ] OCR document/invoice verification
* [ ] Automated before/after project-photo analysis
* [ ] Complete Investigation Hub workflow
* [ ] Full field-inspection case management

---

# Git Development History

The repository has evolved through several major implementation stages:

```text
c9e0ba5
Project foundation

        ↓

c17555a
Initial Nirikshak AI monitoring platform UI

        ↓

b8ea5ab
Incremental synchronisation + ML dataset exporter

        ↓

0eeecb7
Production Delay Risk ML module

        ↓

f7a2774
Multi-signal Duplicate Detector

        ↓

df09fef
FinGuard + GeoIntel + Vendor Network

        ↓

64aafaa
Agency Intelligence integration

        ↓

451449b
Authentication + RBAC + backend

        ↓

54089a9
Duplicate/Vendor refactoring + Agency AI integration

        ↓

a4ec476
Unified Risk Engine + Stall Predictor + dynamic dashboard statistics
```

---

# Repository Structure

```text
Nirikshak-AI/
│
├── ai_models/
│   ├── feature_builder.py
│   ├── finguard.py
│   ├── stall_predictor.py
│   ├── duplicate_detector.py
│   ├── geointel.py
│   ├── vendor_network.py
│   ├── unified_risk_engine.py
│   │
│   └── delay_risk/
│       ├── model.py
│       ├── scoring.py
│       └── delay_risk_model.joblib
│
├── ai-model/
│   └── agency_intelligence/
│       ├── profiling.py
│       ├── scoring.py
│       └── canonicalization.py
│
├── backend/
│   ├── server.py
│   ├── routes.py
│   ├── database.py
│   ├── sync_incremental.py
│   ├── export_live_results.py
│   │
│   └── auth/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       └── views/
│
├── data/
├── parquet/
├── live_exports/
├── migrations/
├── scrapers/
└── tests/
```

---

# What Makes Nirikshak AI Different?

### 1. Multi-dimensional risk analysis

The system does not depend on a single anomaly detector.

It combines:

```text
Financial
Progress
Cost
Delay
Duplicate
Evidence/Compliance
Agency
Payment
Geographic
```

signals.

### 2. Explainable scoring

Instead of simply saying:

```text
Risk = 87
```

the system identifies the major factors contributing to that risk.

### 3. Multi-signal duplicate detection

Duplicate detection requires supporting evidence instead of relying only on textual similarity.

### 4. Historical agency intelligence

Agency performance is evaluated using historical behaviour while accounting for sample size.

### 5. Geographic intelligence

GeoIntel adds a spatial perspective by identifying geographic risk concentrations.

### 6. Human-in-the-loop design

The system prioritises projects for verification rather than making unsupported accusations.

---

# Future Development

Future versions can extend the current platform with:

* Full Evidence AI
* Image similarity and reuse detection
* OCR-based document verification
* Advanced document consistency analysis
* Live GeoIntel frontend integration
* Complete Investigation Hub
* Field inspection workflows
* Advanced vendor-network analysis
* Additional ML models
* Improved model explainability
* Broader authorised government-data integrations
* Expansion to other public infrastructure schemes

---

# One-Line Pitch

> **Nirikshak AI transforms MPLADS project data into explainable, multi-dimensional risk intelligence, helping authorities identify which development works need attention first.**

---

# Project Vision

```text
DATA
  ↓
INTELLIGENCE
  ↓
RISK DETECTION
  ↓
EXPLAINABILITY
  ↓
PRIORITISATION
  ↓
HUMAN VERIFICATION
  ↓
BETTER MONITORING
```

**Nirikshak AI — Turning public project data into actionable integrity intelligence.**

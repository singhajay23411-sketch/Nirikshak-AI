# Nirikshak AI - Executive Summary & Team Handoff

### 📌 Overview
This document contains the latest progress summary, database architecture decisions, pipeline details, and anomaly signals for **Nirikshak AI** to guide team members on current achievements and next steps.

---

## 🚀 Accomplishments & Milestones

### 1. 100% Nationwide Data Ingestion & Schema Restructuring
- **Data Ingested:** Ingested 100% of the **17th Lok Sabha**, **18th Lok Sabha**, and **Rajya Sabha** datasets into PostgreSQL (`nirikshak`).
- **Volume:** Over **525,000+** total records across:
  - 36 States/UTs
  - 579 Constituencies/Nodal Districts
  - 1,322 MPs
  - 218,913 Works (Projects)
  - 238,063 Expenditures
  - 66,579 Vendors (Contractors)
- **Composite Key Architecture:** Fixed government API MP ID re-use issues by implementing composite primary and foreign keys `(mp_id, house_type, tenure)` across all tables.

### 2. Incremental Delta Synchronization (`backend/sync_incremental.py`)
- Built an in-memory MD5 hashing pipeline to sync active 18th Lok Sabha and Rajya Sabha data without full re-scraping.
- Preloads existing hashes into memory (~50 MB RAM) and compares against live API payloads to categorize delta updates vs new insertions.
- Hashes applied to **Works**, **Expenditures**, and **MP Allocations**.

### 3. ML Dataset Exporter (`backend/export_dataset_bundle.py`)
- Created an automated export pipeline that converts all database tables into optimized **Parquet** format (`data/export/*.parquet`).
- Bundled files into `nirikshak_ml_dataset.zip` (14.66 MB) with a step-by-step `README.md` for instant Pandas/Polars loading.

### 4. Anomaly Feature Extraction Layer (`backend/analytics/feature_builder.py`)
Computed 41 enriched analytical features across 218,913 works and exported them to `data/parquet/analytical_features.parquet` & PostgreSQL `works_analytical_features`:
- **Temporal Features:** `sanction_delay_days`, `completion_delay_days`, `project_lifetime_days`.
- **Financial & Baseline Deviations:** `cost_overrun_pct`, `utilization_rate`, `cost_z_score` (grouped by category & state median), `delay_z_score`.
- **Text Normalization:** Lowercased, stripped punctuation/boilerplate tokens from descriptions (`clean_description`, `desc_word_count`).
- **Expenditure Aggregations:** `total_disbursed`, `num_payments`, `num_vendors`, `disbursement_ratio`.

---

## 📊 Key Anomaly Signals (Initial Feature EDA)

| Signal | Count | Significance / Risk Indicator |
|---|---|---|
| **Works delayed > 1 year** | **29,947** | ~14% of projects exceed 365 days post-sanction |
| **delay_z_score > 2** | **8,345** | Statistically abnormal delays relative to category/state peers |
| **\|cost_z_score\| > 2** | **5,567** | Projects costing 2+ standard deviations above/below group median |
| **Disbursement > 120%** | **3,540** | More funds disbursed to vendors than sanctioned |
| **Single-work anomalies** | Max 191 payments / 44 vendors | Extreme vendor collusion / payment splitting flags |

---

## 📋 Next Steps for Team Members (Roadmap)

1. **AI Anomaly Detection Models (`ai-model/`):**
   - Train Isolation Forest / XGBoost / Rule Engines on `data/parquet/analytical_features.parquet`.
   - Calculate unified risk scores (0–100) per work.
2. **API & Dashboard Integration:**
   - Connect risk score endpoints to the React frontend UI (`frontend/src/`).

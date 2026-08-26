# Nirikshak AI

> **AI-Powered MPLADS Integrity and Monitoring Platform**
> *From thousands of projects to the ones that need attention.*

## Smart India Hackathon 2026

**Problem Statement ID:** SIH26102 / SIH26-26102  
**Organisation:** Ministry of Statistics and Programme Implementation (MoSPI)  
**Problem Statement:** Development of an AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme implementation.

---

## What are we building?

**Nirikshak AI** is an AI-powered decision-support platform for monitoring MPLADS works and fund utilisation.

MPLADS involves thousands of development works across India, including roads, schools, community assets, water facilities and civic infrastructure. Officials must monitor recommendations, sanctions, expenditure, payments, work progress and completion across a large number of projects.

Nirikshak AI helps authorities identify **which projects require attention first** by detecting unusual patterns, delays, probable duplicate works, cost deviations and expenditure-progress mismatches.

It is **not an accusation engine**. The system only identifies anomalies and generates evidence-backed risk alerts. Final verification and action remain with authorised human officers.

---

## Directory Structure

```
Nirikshak AI/
├── frontend/       # React + Vite web platform UI & components
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/        # Reserved for API microservices & database connections
├── ai-model/       # Reserved for AI detection models & risk scoring pipelines
├── data/           # Reserved for MPLADS datasets & schema definitions
└── README.md       # Platform documentation
```

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

**Nirikshak AI adds an intelligence layer on top of MPLADS data.** It compares projects, detects risks, explains the reasons and creates a prioritised investigation queue.

---

## Core Solution Architecture

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

---

## Key Modules

### 1. FinGuard - Financial Intelligence
Detects financial and cost-related anomalies: cost-overrun detection, peer benchmarking, expenditure-progress mismatch, payment pattern analysis.

### 2. GeoIntel - Geospatial Intelligence
Project geo-mapping, risk heatmaps, nearby-project comparison, geographic clustering, duplicate work detection.

### 3. Duplicate Project Detection
Identifies potentially duplicate works using NLP similarity, sanctioned cost, implementing agency, and geographic proximity.

### 4. Delay Risk Prediction
Identifies projects likely to be delayed based on historical execution timelines and milestones.

### 5. EvidenceAI - Image & Document Verification
Duplicate photo detection, before-after image comparison, project-photo relevance checks, and metadata verification.

### 6. Investigation Hub & Audit Reports
Enables authorized officials to review alerts, record notes, initiate field inspections, and generate audit-ready reports.

---

## Unified Risk Score Composition

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

---

## Development Setup

### Frontend Application
To run the web interface locally:

```bash
cd frontend
npm install
npm run dev
```

Local dev server will launch at `http://localhost:5173/`.

### Production Build
To verify and compile the frontend production bundle:

```bash
cd frontend
npm run build
```

---

## One-Line Pitch

> **Nirikshak AI transforms MPLADS data into explainable, evidence-backed risk intelligence—helping authorities identify which development works need attention first.**

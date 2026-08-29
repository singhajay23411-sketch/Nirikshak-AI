# Nirikshak AI — SIH 2026 Project Summary

> **AI-Powered Risk Intelligence System for MPLADS Fund Oversight**
> Ministry of Statistics & Programme Implementation (MoSPI), Government of India

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                             │
│  ├── Landing Page (Public)                                           │
│  ├── Role-Based Dashboards (8 roles)                                 │
│  ├── India Geospatial Map                                            │
│  ├── AI Intelligence Hub (8-Pillar Risk Scoring)                     │
│  └── FinGuard / Duplicate Detection / Vendor Network Views           │
├──────────────────────────────────────────────────────────────────────┤
│  BACKEND (FastAPI + Uvicorn)                                         │
│  ├── JWT Authentication + RBAC (8 roles)                             │
│  ├── SQLite User DB (nirikshak_users.db)                             │
│  └── REST API: /api/auth/login, /api/auth/me, /api/admin/users      │
├──────────────────────────────────────────────────────────────────────┤
│  ML INTELLIGENCE PIPELINE (Python)                                   │
│  ├── Feature Builder (z-score statistical analysis)                  │
│  ├── FinGuard (Financial anomaly detection via Isolation Forest)     │
│  ├── Duplicate Detector (NLP + SentenceTransformers + Multi-Signal) │
│  ├── Vendor Network Analysis (HHI market dominance + NetworkX)       │
│  └── Unified Risk Engine (8-pillar composite scoring)                │
├──────────────────────────────────────────────────────────────────────┤
│  DATABASE LAYER                                                      │
│  ├── PostgreSQL 16 (525,000+ MPLADS records)                         │
│  └── SQLite (User auth & audit logs)                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## SIH 2026 Presentation Demo Credentials

Standard Password for all accounts: `nirikshak@2026`

| Role | Display Name | Official User ID / Email | Jurisdiction | Primary Target View |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@nirikshak.gov.in` | National | User & System Management |
| **MoSPI Officer** | MoSPI Joint Secretary | `mospi.officer@nirikshak.gov.in` | National | Ministry Executive Dashboard |
| **State Officer** | State Nodal Officer (UP) | `state.up@nirikshak.gov.in` | Uttar Pradesh | State Performance View |
| **District Officer** | District Magistrate (Jabalpur) | `district.jabalpur@nirikshak.gov.in` | Jabalpur | District Authority Deep Dive |
| **Hon'ble MP** | Hon'ble MP (Varanasi) | `mp.loksabha@nirikshak.gov.in` | Varanasi | MP Scorecard & Portfolio |
| **Field Inspector** | Field Quality Inspector | `inspector@nirikshak.gov.in` | Central Zone | Anomaly Verification Portal |
| **Policy Analyst** | MoSPI Policy Analyst | `analyst@nirikshak.gov.in` | National | Advanced ML & Cartel Graphs |
| **Viewer** | Public Citizen / Auditor | `viewer@nirikshak.gov.in` | National | Public Transparency View |

---

## Quick Start

### Prerequisites
- Node.js v22+
- Python 3.11+
- PostgreSQL 16 (portable or installed)

### 1. Start the Backend
```bash
cd Nirikshak-AI
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Access the Application
- **Public Landing Page:** http://localhost:5173
- **Login Portal:** http://localhost:5173/login
- **API Health Check:** http://localhost:8000/api/health
- **API Docs (Swagger):** http://localhost:8000/docs

---

## Data Pipeline Summary

| Module | Records Processed | Key Output |
| :--- | :--- | :--- |
| **Parquet Ingestion** | 525,555 raw records | PostgreSQL tables (works, expenditures, vendors) |
| **Feature Builder** | 218,913 works | Analytical z-scores & statistical features |
| **FinGuard** | 218,913 works | Cost overrun & financial anomaly flags |
| **Duplicate Detector** | 218,913 works (NLP) | 29,402 high-confidence duplicate alerts |
| **Vendor Network** | 66,579 vendors | HHI monopoly indices & cartel risk groups |
| **Unified Risk Engine** | 218,913 works | 8-pillar composite risk scores (LOW: 127,796 / MOD: 90,447 / HIGH: 670) |

---

## Frontend Data Sources

All analytical JSON files are served from `frontend/public/data/`:

| File | Size | Description |
| :--- | :--- | :--- |
| `Ministry_View.json` | ~6.7 MB | National stats, state benchmarks, top risk works |
| `District_Authority_View.json` | ~19.2 MB | Constituency aggregates, district risk profiles |
| `MP_View.json` | ~15.6 MB | 1,322 MP scorecards, fund utilization rates |
| `unified_project_evaluations.json` | ~88.7 MB | Full 8-pillar risk scores per project |
| `duplicate_project_alerts.json` | ~125.3 MB | 29,402 multi-signal duplicate pairs |
| `cost_and_delay_anomalies.json` | ~22 MB | Cost overrun & delay anomaly records |
| `finguard_anomalies.json` | ~77.6 MB | Financial anomaly detection results |
| `vendor_risk_network.json` | ~226 KB | Vendor risk graph data |
| `geointel_heatmap.geojson` | ~585 KB | Geospatial risk heatmap coordinates |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Login with email + password → JWT token |
| `GET` | `/api/auth/me` | Bearer | Get current user profile & permissions |
| `POST` | `/api/auth/logout` | Bearer | Server-side audit log of logout |
| `GET` | `/api/admin/users` | Admin | List all registered accounts |
| `POST` | `/api/admin/users` | Admin | Create a new user with role |
| `PUT` | `/api/admin/users/{id}` | Admin | Update user profile |
| `DELETE` | `/api/admin/users/{id}` | Admin | Soft-delete (deactivate) a user |
| `POST` | `/api/admin/users/{id}/reset-password` | Admin | Reset a user's password |
| `GET` | `/api/admin/audit-logs` | Admin | Fetch recent audit log entries |
| `GET` | `/api/health` | Public | API health check |

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router, Lucide Icons, Recharts |
| **Backend API** | FastAPI, Uvicorn, SQLite |
| **Auth & Security** | JWT (HMAC-SHA256), Argon2id password hashing, RBAC |
| **ML Pipeline** | SentenceTransformers, scikit-learn (Isolation Forest), NetworkX, Pandas |
| **Database** | PostgreSQL 16 (analytical data), SQLite (auth) |
| **Data Format** | JSON, GeoJSON, Parquet |

---

## Team

**Team Nirikshak AI** — Smart India Hackathon 2026
Problem Statement: AI-based Analysis of MPLADS Fund Utilization
Ministry: Ministry of Statistics & Programme Implementation (MoSPI)

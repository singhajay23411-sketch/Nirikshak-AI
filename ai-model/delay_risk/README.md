# Nirikshak-AI — Delay Risk Detection Module

**Author / Module Lead:** Delay Risk Detection Module Team  
**Module Version:** `1.0.0`  
**Integration Status:** Backend Production Ready  
**Unified Risk Weight:** **15%** of the Nirikshak-AI Unified Risk Score

---

## A. Module Overview

The **Delay Risk Detection** module is an AI-powered predictive engine designed to evaluate the risk that an approved MPLADS (Members of Parliament Local Area Development Scheme) project will exceed the standard statutory execution window.

By analyzing project initiation parameters, administrative turnaround lag, budget scale, geographic characteristics, and early financial disbursement velocity (within 90 days), the module assigns an operational **0–100 Delay Risk Score** and maps the project into actionable risk tiers for district magistrates, nodal officers, and citizens.

---

## B. Responsibility Boundary

> [!IMPORTANT]
> **CRITICAL SCOPE & ARCHITECTURAL BOUNDARY:**
> - This module owns **ONLY Delay Risk**.
> - Delay Risk accounts for exactly **15%** of the eventual Nirikshak-AI Unified Risk Score.
> - This module **DOES NOT** calculate or implement the complete 100% Unified Risk Score.
> - The other 7 risk components are owned and developed separately by other team members:
>   - Financial Risk (20%)
>   - Progress Risk (20%)
>   - Cost Risk (15%)
>   - Duplicate Project Risk (10%)
>   - Evidence Risk (10%)
>   - Agency Risk (5%)
>   - Payment Risk (5%)

---

## C. Delay Definition

Under Ministry of Statistics and Programme Implementation (MoSPI) MPLADS guidelines:
- **Statutory Benchmark:** Works are expected to be physically completed within **1 calendar year (365 days)** from the date of administrative sanction.
- **Ground Truth Target (`is_delayed`):**
  $$\text{completion\_duration\_days} = \text{actual\_end\_date} - \text{sanction\_date}$$
  $$\text{is\_delayed} = \begin{cases} 1 & \text{if } \text{completion\_duration\_days} > 365 \text{ days} \\ 0 & \text{if } \text{completion\_duration\_days} \le 365 \text{ days} \end{cases}$$

*Note: `actual_end_date` is strictly an outcome field used only to construct historical training labels; it is NEVER an input feature for prediction.*

---

## D. Model Information

- **Model Architecture:** `RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)`
- **Training Population:** 89,310 historical completed works (80% training partition)
- **Held-Out Test Performance (22,328 unseen records evaluated in Phase 8):**
  - **ROC-AUC:** `0.9287`
  - **PR-AUC:** `0.8415`
  - **Accuracy:** `86.00%`
  - **Precision:** `81.51%`
  - **Recall:** `61.84%`
  - **F1-Score:** `0.7032`
  - **Brier Score:** `0.0987`
- **Artifact Location:** `ai-model/delay_risk/delay_risk_model.joblib`

---

## E. 17 Model Features

The production model strictly requires the following 17 ML-safe features in exact canonical order:

| # | Feature Name | Dtype | Meaning & Description | Availability / Observation Rule |
| :-: | :--- | :---: | :--- | :--- |
| **1** | `recom_to_sanc_days` | Float | Administrative lag between recommendation and sanction ($t_{\text{sanc}} - t_{\text{recom}}$) | Known at sanction date ($t_{\text{obs}}$) |
| **2** | `sanction_year` | Int | Calendar year of administrative sanction | Known at sanction date |
| **3** | `sanction_month` | Int | Calendar month of sanction (1–12; monsoon seasonality) | Known at sanction date |
| **4** | `sanction_quarter` | Int | Calendar quarter of sanction (1–4; fiscal year rush) | Known at sanction date |
| **5** | `sanction_dayofweek` | Int | Day of week of sanction approval (0–6) | Known at sanction date |
| **6** | `log_sanction_amount` | Float | $\log(1 + \text{sanction\_amount})$ (budget scale) | Known at sanction date |
| **7** | `log_recommended_amount` | Float | $\log(1 + \text{recommended\_amount})$ (requested scale) | Known at sanction date |
| **8** | `recom_sanc_amount_diff` | Float | Budget modification variance ($\text{sanction} - \text{recommended}$) | Known at sanction date |
| **9** | `recom_sanc_amount_ratio` | Float | Budget revision ratio ($\text{sanction} / \text{recommended}$) | Known at sanction date |
| **10** | `category_code` | Int | Work category code (0: Normal, 1: Repair, 2: Trust) | Known at sanction date |
| **11** | `house_type_code` | Int | Parliamentary house code (1: Rajya Sabha, 2: Lok Sabha) | Known at sanction date |
| **12** | `tenure_code` | Int | Parliamentary tenure code (0: 17th LS, 1: 18th LS, 2: RS) | Known at sanction date |
| **13** | `state_id_code` | Int | State / UT jurisdiction identifier | Known at sanction date |
| **14** | `constituency_id_code` | Int | Parliamentary constituency identifier | Known at sanction date |
| **15** | `exp_count_90d` | Int | Count of disbursements $\le t_{\text{sanc}} + 90\text{d}$ | Evaluated in `early_progress` mode |
| **16** | `disbursed_amount_90d` | Float | Total funds disbursed $\le t_{\text{sanc}} + 90\text{d}$ | Evaluated in `early_progress` mode |
| **17** | `disbursed_ratio_90d` | Float | Disbursed ratio at 90 days ($\text{disbursed} / \text{sanction}$) | Evaluated in `early_progress` mode |

---

## F. Observation Modes

The module supports two explicit, mutually exclusive observation modes:

1. **Mode A — `initiation` ($t_{\text{obs}} = \text{sanction\_date}$):**
   - Evaluates project delay risk on Day 0 of administrative sanction.
   - Strictly zero post-sanction disbursements are used (`exp_count_90d = 0`, `disbursed_amount_90d = 0.0`, `disbursed_ratio_90d = 0.0`).
2. **Mode B — `early_progress` ($t_{\text{obs}} = \text{sanction\_date} + 90\text{ days}$):**
   - Evaluates risk during early in-flight execution.
   - Includes disbursements occurring strictly on or before $\text{sanction\_date} + 90\text{ days}$.
   - Any transactions with $\text{expenditure\_date} > t_{\text{sanc}} + 90\text{d}$ are strictly excluded.

---

## G. API Request Schema

**Endpoint (Conceptual / Backend Service):** `POST /api/ai/delay-risk`

```json
{
  "work_id": 60423,
  "mode": "early_progress",
  "recommendation_date": "2024-01-10",
  "sanction_date": "2024-02-15",
  "sanction_amount": 500000.0,
  "recommended_amount": 550000.0,
  "work_category": "Normal",
  "house_type": 2,
  "tenure": "18th LS",
  "state_id": 1,
  "constituency_id": 123,
  "expenditures": [
    {
      "expenditure_date": "2024-03-01",
      "fund_disbursed_amount": 50000.0
    }
  ]
}
```

---

## H. API Response Schema

```json
{
  "work_id": 60423,
  "mode": "early_progress",
  "delay_probability": 0.7245,
  "delay_risk_score": 72.45,
  "delay_risk_tier": "CRITICAL",
  "risk_weight": 0.15,
  "unified_risk_contribution": 10.87,
  "top_risk_factors": [
    "Elevated pre-sanction administrative lag (142 days vs 45-day statutory guideline) is a predictive signal of execution friction",
    "Zero contractor fund disbursement within 90 days of administrative sanction is associated with elevated delay risk",
    "High capital expenditure scale requiring multi-stage engineering execution is associated with higher baseline completion risk"
  ]
}
```

---

## I. Score Calculation Pipeline

```text
delay_probability = model.predict_proba(X)[0, 1]  ∈ [0.0, 1.0]
        ↓
delay_risk_score = delay_probability × 100.0       ∈ [0.0, 100.0]
        ↓
delay_risk_tier = map_score_to_tier(delay_risk_score)
        ↓
unified_risk_contribution = delay_risk_score × 0.15
```

---

## J. Operational Risk Tiers

| Tier Name | Score Range | Operational Meaning | Recommended District Action |
| :--- | :---: | :--- | :--- |
| **LOW** | `0.00 – 29.99` | Project on track; standard risk parameters | Routine quarterly dashboard tracking |
| **MODERATE** | `30.00 – 49.99` | Early caution indicators present | Proactive tracking of contractor milestones |
| **HIGH** | `50.00 – 69.99` | Elevated likelihood of execution delay | Active escalation of vendor deployment |
| **CRITICAL** | `70.00 – 100.00` | Severe delay risk; high probability of breach | Immediate physical inspection & audit |

---

## K. Integration With Future Unified Risk Engine

When the Unified Risk Engine is implemented in later phases, it will consume:
- `delay_risk_score` (0–100)
- `delay_risk_tier` (`LOW` / `MODERATE` / `HIGH` / `CRITICAL`)
- `unified_risk_contribution` (`delay_risk_score × 0.15`)

$$\text{Unified Risk Score} = (0.20 \times \text{Financial}) + (0.20 \times \text{Progress}) + (0.15 \times \text{Cost}) + \mathbf{(0.15 \times \text{Delay})} + (0.10 \times \text{Duplicate}) + (0.10 \times \text{Evidence}) + (0.05 \times \text{Agency}) + (0.05 \times \text{Payment})$$

---

## L. Frontend Integration Guide

The frontend dashboard can consume the response payload directly to render:
1. **Delay Risk Gauge / Badge:** Display `delay_risk_score` (e.g. `72.45 / 100`) colored by `delay_risk_tier` (Green for LOW, Amber for MODERATE, Orange for HIGH, Red for CRITICAL).
2. **Unified Risk Breakdown Card:** Display `unified_risk_contribution` as `10.87 / 15.0 pts` under the "Delay Risk (15%)" segment.
3. **Key Predictive Signals List:** Render `top_risk_factors` as bullet points in the Project Risk Analysis drawer.
4. **Observation Mode Indicator:** Show whether the score reflects Day 0 `initiation` or 90-day `early_progress`.

---

## M. Leakage Restrictions

The following fields must **NEVER** enter the prediction feature matrix:
- `actual_end_date` (Future completion date)
- `actual_amount` (Final accounting expenditure)
- `work_status` (Direct target proxy)
- `work_stage` (Intermediate status code)
- `completion_duration_days` (Target definition equivalent)
- `is_delayed` (Ground truth label)
- `record_hash` / `updated_at` (ETL metadata)
- Expenditures after observation cutoff ($> t_{\text{sanc}} + 90\text{d}$)

---

## N. Error Handling & Validation Rules

- **Invalid Mode:** Raises `ValueError: Invalid observation mode: '...'. Supported modes are: ['initiation', 'early_progress']`.
- **Target Leakage Fields:** Raises `ValueError: LEAKAGE VIOLATION: Forbidden target outcome attributes detected...`.
- **Invalid Negative Amounts:** Raises `ValueError: Invalid negative amount for 'sanction_amount': -50000.0`.
- **Invalid Date Strings:** Raises `ValueError: Invalid date format...`.

---

## O. Quick Start Example in Python

```python
from delay_risk import DelayRiskScorer

# Initialize scorer (loads production delay_risk_model.joblib automatically)
scorer = DelayRiskScorer()

project = {
    "work_id": 60423,
    "mode": "early_progress",
    "recommendation_date": "2024-01-10",
    "sanction_date": "2024-02-15",
    "sanction_amount": 500000.0,
    "recommended_amount": 550000.0,
    "work_category": "Normal",
    "house_type": 2,
    "tenure": "18th LS",
    "state_id": 1,
    "constituency_id": 123,
    "expenditures": [
        {"expenditure_date": "2024-03-01", "fund_disbursed_amount": 50000.0}
    ]
}

result = scorer.assess_project(project)
print(f"Delay Risk Score: {result['delay_risk_score']}/100 ({result['delay_risk_tier']})")
print(f"15% Unified Risk Contribution: {result['unified_risk_contribution']} pts")
print("Top Predictive Signals:")
for signal in result["top_risk_factors"]:
    print(f" - {signal}")
```

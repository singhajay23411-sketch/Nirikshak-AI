# Agency Intelligence & Risk Scoring Engine (`ai-model/agency_intelligence`)

---

## 1. Module Overview

The **Agency Intelligence** module evaluates the operational execution reliability, historical delay probability, turnaround speed, and active capacity workload of Implementing Agencies (IAs) and Implementing District Authorities (IDAs) across MPLADS infrastructure works in India.

### Key Tenets
* **Operational Risk Signal**: This module generates an intelligence/risk signal indicating the historical likelihood of delay and project turnaround inefficiencies.
* **Not Proof of Wrongdoing**: A high risk score does **NOT** constitute proof of corruption, fraud, collusion, or administrative misconduct.
* **Audit Trigger**: Elevated risk scores are designed to trigger further administrative investigation, on-site audits, or review before project sanction, rather than automatic punitive measures.

---

## 2. Problem Context

In MPLADS monitoring, projects are often evaluated in isolation. However, historical agency performance is critical for identifying systemic issues:
* **Repeated Delays**: Tracking whether specific agencies chronically fail to meet milestones.
* **Workload & Capacity Pressure**: Modeling concurrency limits where an agency becomes overloaded with too many concurrent projects.
* **Vendor Concentration**: Identifying cases where a single vendor dominates an agency's contracts (measured via HHI/Top Vendor Concentration).
* **Operational Anomalies**: Flagging chronic deviations from baseline performance and statutory benchmarks.

---

## 3. Agency Hierarchy

MPLADS works involve two distinct layers of governance:
1. **Implementing District Authority (IDA)** (Primary Anchor): The district-level nodal authority responsible for overall administrative coordination, accounting, and funding. Dynamic weight matches $70\% – 100\%$ of the score.
2. **Implementing Agency (IA)** (Secondary Modifier): The specific department, corporation, or local body executing the physical work on the ground. Dynamic weight matches $0\% – 30\%$ of the score.

### Hierarchical Blending Formula
To model this structure, the final score blends the two entities based on IA sample credibility ($N_{IA}$):

$$w_{IA} = \min\left(0.30, \frac{N_{IA}}{N_{IA} + 20} \times 0.30\right)$$

$$w_{IDA} = 1.0 - w_{IA}$$

This ensures that the IDA acts as the primary governance anchor, with the IA serving as a minor modifier scaling up in influence only when supported by a robust historical track record.

---

## 4. Data Sources & Fields

The module operates in a **strictly read-only** mode on the following backend datasets:
* **`works.parquet`**: Encompasses over 218,000 project records, containing `work_id`, `ida_name`, `sanction_date`, `actual_end_date`, and `work_status`.
* **`expenditures.parquet`**: Encompasses over 238,000 records, containing `work_id`, `ia_name`, `fund_disbursed_amount`, and `vendor_id`.
* **`vendors.parquet`**: Contains details of registered contractors and vendors.

---

## 5. Data Canonicalization

Agency names contain typos, case differences, and local branch designations. The module implements deterministic canonicalization engines in `canonicalization.py`:
* **`canonicalize_ida(raw_name)`**: Normalizes raw district strings (e.g. `JAUNPUR(DISTRICT MAGISTRATE JAUNPUR_IDA)` $\to$ `District Authority - Jaunpur (DISTRICT MAGISTRATE JAUNPUR)`).
* **`canonicalize_ia(raw_name)`**: Cleans whitespace, removes standard boilerplate suffixes, and maps variations (e.g. `UPSIC LKO` and `UP SMALL IND CORP` $\to$ `Uttar Pradesh Small Industries Corporation Ltd (UPSIC)`).

This mapping prevents statistical fragmentation where a single agency is evaluated as multiple separate entities.

---

## 6. Historical Performance Analysis

Dynamic profiling is executed in `profiling.py` by aggregating historical records:
* **Historical Projects ($N$)**: Completed projects count used to calculate evidence credibility.
* **Delayed Projects ($D$)**: Projects where actual execution duration exceeded the statutory limit (365 days).
* **Duration Speed**: Median turnaround time in days.
* **Workload Concurrency**: The peak active project pressure calculated via a sweep-line interval concurrency sweep.
* **Vendor Concentration**: Herfindahl-Hirschman Index (HHI) based on contract share.

The system builds **3,818 unique IA profiles** and **778 unique IDA profiles** from the national dataset.

---

## 7. Benchmarking

The engine compares performance against static mature benchmarks established from the 17th Lok Sabha baseline population:
* **`MATURE_BASELINE_DELAY_RATE = 0.364805`** ($36.48\%$ baseline delay rate).
* **`MATURE_BASELINE_MEDIAN_DAYS = 252.0`** (252-day median duration baseline).
* **`STATUTORY_DELAY_THRESHOLD_DAYS = 365`** (365-day delay cutoff threshold).

---

## 8. Anomaly Detection

Operational stress is flagged using deterministic boundaries:
* **Capacity Overload**: Flagged when an agency's concurrent workload pressure exceeds **$\ge 2.0\times$** its historical average.
* **Vendor Monopoly**: Flagged when a single contractor commands **$\ge 80\%$** of an agency's total active project portfolio.
* **Chronic Turnaround Overrun**: Flagged when median project duration exceeds the baseline by $+180$ days.

---

## 9. Risk Scoring Methodology

The scoring engine implements three layers of statistical correction:

### A. Empirical Bayes Beta-Binomial Shrinkage
To prevent small-sample bias (e.g. an agency with $N=1, D=1$ receiving a $100\%$ delay rate), raw rates are shrunk toward the national mature prior:

$$\theta_{shrunk} = \frac{D + \alpha}{N + \alpha + \beta}$$

Where:
* **$\alpha = 1.824$**
* **$\beta = 3.176$**
* **$M = 5.0$** (Prior strength equivalent to 5 completed projects).

### B. Confidence Modulation
Scores are modulated toward the neutral baseline score ($45.00$) based on data confidence ($w_{conf}$):

$$\text{Score}_{final} = w_{conf} \cdot \text{Score}_{raw} + (1 - w_{conf}) \cdot \text{NeutralBaselineScore}$$

Confidence weights are defined by Completed Projects ($N$):
* **Strong ($N \ge 100$):** $w_{conf} = 1.00$
* **Moderate ($20 \le N < 100$):** $w_{conf} = 0.85$
* **Low ($5 \le N < 20$):** $w_{conf} = 0.60$
* **Very Low ($N < 5$):** $w_{conf} = 0.30$

---

## 10. Risk Tiers

Scores are mapped into four operational categories:
* **`LOW`**: `0.0 – 29.99`
* **`MODERATE`**: `30.0 – 49.99`
* **`HIGH`**: `50.0 – 69.99`
* **`CRITICAL`**: `70.0 – 100.0`

* **`NEUTRAL_BASELINE_SCORE = 45.00`** (Assigned to unprofiled, missing, or zero-data entities).

---

## 11. Unified Risk Integration

The Agency Intelligence module contributes a fixed **$5\%$ weight** to the Nirikshak-AI platform Unified Risk Score:

$$\text{Contribution} = \text{Agency Risk Score} \times 0.05$$

* **Agency Risk Score**: `0 – 100` points
* **Unified Risk Contribution**: `0.0 – 5.0` points

---

## 12. Backend Integration

The backend pipeline extracts and processes data via:
1. **Database Layer** ([`backend/database.py`](file:///d:/Things/SIH%202026/Nirikshak-AI/backend/database.py)): Updates schemas and runs migrations.
2. **Feature Builder** ([`backend/analytics/feature_builder.py`](file:///d:/Things/SIH%202026/Nirikshak-AI/backend/analytics/feature_builder.py)): Implements `compute_agency_risk_features()`.
3. **Scoring Engine** ([`ai-model/agency_intelligence/scoring.py`](file:///d:/Things/SIH%202026/Nirikshak-AI/ai-model/agency_intelligence/scoring.py)): Computes scores and creates [`AgencyRiskResult`](file:///d:/Things/SIH%202026/Nirikshak-AI/ai-model/shared/types.py).
4. **Serialization**: Exports outputs cleanly to `JSONB` for PostgreSQL persistence and API presentation.

---

## 13. Validation Results (Phase 7)

Validated against the mature project cohort and 2024 temporal holdout:
* **Mature Cohort ($N = 128,887$)**: ROC-AUC = `0.6562`, PR-AUC = `0.5937`, Spearman = `+0.2709`.
* **2024 Temporal Holdout ($N = 112,250$)**: ROC-AUC = `0.6777`, PR-AUC = `0.6181`.
* **Relative Risk**: Low Risk delay rate = `34.79%` vs Critical Risk delay rate = `61.92%` (a **$1.78\times$** risk separation).

---

## 14. End-to-End Testing (Phase 9)

An automated End-to-End integration test suite is implemented in [`ai-model/agency_intelligence/tests/test_e2e.py`](file:///d:/Things/SIH%202026/Nirikshak-AI/ai-model/agency_intelligence/tests/test_e2e.py). E2E testing verified:
1. Ingestion of raw Parquet data.
2. Feature extraction and dynamic profiling.
3. Identity canonicalization.
4. Blending hierarchy and confidence modulation.
5. Error fallbacks and missing data robustness.
6. JSON serialization.

### Verification Summary
* **Existing Unit Tests**: 19 / 19 Passed
* **New E2E Tests**: 7 / 7 Passed
* **Total Agency Intelligence Suite**: 26 / 26 Passed
* **Repository-Wide Total**: 44 / 44 Passed

---

## 15. Real-Data Example

For `Work ID: 60423` (extracted during E2E verification):
* **IDA (South Andamans)**: Completed = $42$, Delays = $10$ $\to$ Score = `37.93` (Weight: $86\%$)
* **IA (APWD)**: Completed = $16$, Delays = $10$ $\to$ Score = `63.29` (Weight: $13\%$)
* **Final Agency Risk Score**: **`41.21 / 100`**
* **Tier**: **`MODERATE`**
* **Unified Contribution**: **`2.06 / 5.0`**

---

## 16. Error & Fallback Behavior

* **Missing IA**: If no IA is specified, IA weight is dropped to `0%` and the system relies entirely on the IDA anchor score.
* **Missing IDA / Unresolved Identity**: If names are invalid, null, or unresolved, the system assigns the default neutral baseline score of **`45.00`** without raising exceptions.
* **Limited Historical Data**: Empirical Bayes Prior pushes the rate toward the $36.48\%$ baseline, and low confidence modulation anchors the final score toward `45.00`.

---

## 17. Limitations

* **Historical Data Constraints**: Scores rely on the completeness and historical depth of recorded works. Recent/freshly registered agencies will cluster near the neutral baseline.
* **External Factors**: Operational delays are modeled statistically. Extreme weather, regulatory holds, or material shortages affecting an entire district are reflected in the score but are not indicative of local agency inefficiency.
* **Operational Flag Only**: A high score represents operational bottlenecks, not corruption or fraud.

---

## 18. Project Structure

```text
ai-model/agency_intelligence/
├── config.py             # Validation parameters, risk tiers, and baseline constants
├── canonicalization.py   # Deterministic regex-based clean-up of IA/IDA names
├── profiling.py          # Dynamic profile builder (concurrency, HHI, delay stats)
├── signals.py            # Blending math, shrinkage, and calibration equations
├── scoring.py            # Scorer public interface and project scoring wrappers
├── explainability.py     # Rule-based natural language risk factor generation
└── tests/
    ├── test_canonicalization.py
    ├── test_scoring.py
    ├── test_signals.py
    ├── test_explainability.py
    ├── test_temporal_safety.py
    └── test_e2e.py      # E2E integration and serialization tests
```

---

## 19. Quick Usage & Developer Reference

To run the complete test suite:
```powershell
python -m pytest ai-model/agency_intelligence/tests
```

To run all repository-wide tests:
```powershell
python -m pytest ai-model/agency_intelligence/tests ai-model/delay_risk/tests ai-model/evidence_ai/tests ai-model/investigation_hub/tests
```

To score a project dynamically:
```python
from agency_intelligence.scoring import AgencyRiskScorer

scorer = AgencyRiskScorer()
result = scorer.score_project(project_dict, ia_profiles, ida_profiles)
```

---

## 20. Status

```text
Agency Intelligence
Phases 1–9: COMPLETE
Phase 10 documentation: CURRENT
Git commit/push: Pending manual review
```

# Nirikshak AI — QA Intelligence Audit Report

**Generated:** 2026-08-30 01:06:33
**Audit Duration:** 71.5s
**Total Records Audited:** 715,291
**Total Violations Found:** 0
**Total Warnings:** 1

## Overall Verdict: ✅ ALL CHECKS PASSED

---

## ✅ Unified Risk Score Validation
- **Status:** PASSED
- **Records Audited:** 218,913
- **Violations:** 0
- **Warnings:** 0
- **Summary:** Bounds check on 218,913 records.

### Detailed Findings

- ✅ All scores ≥ 0 (verified on 218,913 records)
- ✅ All scores ≤ 100 (verified on 218,913 records)
- Risk tier distribution: {'LOW': 127796, 'MODERATE': 90447, 'HIGH': 670}
- Mean risk score: 22.00 | Median: 21.60

---

## ✅ Duplicate Detection Authenticity
- **Status:** PASSED
- **Records Audited:** 29,402
- **Violations:** 0
- **Warnings:** 0
- **Summary:** Validated 29,402 duplicate alert pairs.

### Detailed Findings

- ✅ No self-pairing found (verified on 29,402 alerts)
- ✅ Cross-referenced with works table — all duplicates within same state
- Mean confidence: 88.5 | High-confidence (≥80): 22,413

---

## ✅ FinGuard Financial Sanity
- **Status:** PASSED
- **Records Audited:** 218,913
- **Violations:** 0
- **Warnings:** 0
- **Summary:** Audited 218,913 works for financial integrity.

### Detailed Findings

- Works with zero/null sanction_amount: 383 / 218,913 (0.2%)
- Works with cost overrun > 100%: 0
- ✅ No extreme overruns to verify
- Global cost overrun rate: -54.58%
- Null actual_amount: 107,620 | Null recommended_amount: 739

---

## ✅ Vendor Network & HHI
- **Status:** PASSED
- **Records Audited:** 238,063
- **Violations:** 0
- **Warnings:** 0
- **Summary:** Audited vendor concentration across 238,063 expenditure records.

### Detailed Findings

- HHI computed for 63 constituencies
- ✅ All HHI values ≤ 10000
- ✅ All HHI values ≥ 0
- Market concentration: 2 monopolistic (>2500) | 58 competitive (<1500) constituencies
- Mean HHI: 497.7

---

## ✅ Memory & Performance Profiler
- **Status:** PASSED
- **Records Audited:** 10,000
- **Violations:** 0
- **Warnings:** 1
- **Summary:** Profiled on 10,000 record sample.

### Detailed Findings

- Full dataset: 218,913 records | Sample: 10,000 records
- **Feature computation (z-scores on 10,000 records):**
-   Time: 0.01s | Peak RAM: 3.4 MB
-   Projected full dataset (218,913): ~74 MB
- **SentenceTransformer encoding (1,000 texts):**
-   Time: 48.46s | Peak RAM: 249.0 MB
-   Projected full dataset (218,913): ~54508 MB
-   ⚠️ WARNING: Projected RAM (54508 MB) exceeds 8 GB
- **NetworkX graph construction (10,000 edges):**
-   Time: 6.15s | Peak RAM: 217.6 MB
-   Projected full dataset (238,063): ~5180 MB
-   Graph: 15879 nodes, 9856 edges

---

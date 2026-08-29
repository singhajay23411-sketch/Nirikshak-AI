# Nirikshak AI — QA Intelligence Audit Report

**Generated:** 2026-08-30 03:03:17
**Audit Duration:** 261.5s
**Total Records Audited:** 716,733
**Total Violations Found:** 1
**Total Warnings:** 1

## Overall Verdict: ❌ VIOLATIONS DETECTED

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

## ❌ Duplicate Detection Authenticity
- **Status:** FAILED
- **Records Audited:** 29,402
- **Violations:** 1
- **Warnings:** 0
- **Summary:** Validated 29,402 duplicate alert pairs.

### Detailed Findings

- ✅ No self-pairing found (verified on 29,402 alerts)
- ❌ LOCATION GATE FAILURE: 75 alerts flag works in different states
- Mean confidence: 88.5 | High-confidence (≥80): 22,413

---

## ✅ FinGuard Financial Sanity
- **Status:** PASSED
- **Records Audited:** 219,782
- **Violations:** 0
- **Warnings:** 0
- **Summary:** Audited 219,782 works for financial integrity.

### Detailed Findings

- Works with zero/null sanction_amount: 44,551 / 219,782 (20.3%)
- Works with cost overrun > 100%: 0
- ✅ No extreme overruns to verify
- Global cost overrun rate: -43.48%
- Null actual_amount: 108,520 | Null recommended_amount: 97,642

---

## ✅ Vendor Network & HHI
- **Status:** PASSED
- **Records Audited:** 238,636
- **Violations:** 0
- **Warnings:** 0
- **Summary:** Audited vendor concentration across 238,636 expenditure records.

### Detailed Findings

- HHI computed for 64 constituencies
- ✅ All HHI values ≤ 10000
- ✅ All HHI values ≥ 0
- Market concentration: 2 monopolistic (>2500) | 59 competitive (<1500) constituencies
- Mean HHI: 498.7

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
-   Time: 0.04s | Peak RAM: 3.4 MB
-   Projected full dataset (218,913): ~74 MB
- **SentenceTransformer encoding (1,000 texts):**
-   Time: 189.91s | Peak RAM: 249.3 MB
-   Projected full dataset (218,913): ~54566 MB
-   ⚠️ WARNING: Projected RAM (54566 MB) exceeds 8 GB
- **NetworkX graph construction (10,000 edges):**
-   Time: 23.05s | Peak RAM: 246.3 MB
-   Projected full dataset (238,636): ~5878 MB
-   Graph: 15859 nodes, 9861 edges

---

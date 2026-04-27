# DATA_SOURCES_STATUS.md — Framtidskarta

**Last Updated:** 2026-04-27 19:20 UTC
**Status:** CRITICAL — All primary data sources are either DOWN or FABRICATED

---

## Summary

| Source | Status | Data Type | Row Count | Notes |
|--------|--------|-----------|-----------|-------|
| SCB Employment (YREG/RAMS) | ❌ API DOWN + FABRICATED | fact_employment | 135 | API returns 404. ETL data is hardcoded/fabricated. |
| SCB Salary (Lonestruktur) | ❌ API DOWN + FABRICATED | fact_salaries | 49 | API returns 404. ETL data is hardcoded/fabricated. |
| FK Sjukfrånvaro | ⚠️ UNVERIFIED + FABRICATED | fact_sickness_absence | 46 | URL changed/not accessible. ETL data is hardcoded/fabricated. |
| Försvarsmakten | ⚠️ UNVERIFIED + FABRICATED | fact_defence_recruitment | 24 | No official statistics endpoint. ETL data is hardcoded/fabricated. |
| SCB PxWeb API | ❌ DOWN | API | N/A | All endpoints return 404. |
| ESCO API | ❌ DOWN | competencies | N/A | Returns 404 on info endpoint. |
| Arbetsförmedlingen | ⚠️ REDIRECTS | prognoses | 258 | Website redirects. Data may be real (based on AF forecasts). |

---

## Detailed Findings

### ❌ SCB PxWeb API (PRIMARY SOURCE)
- **Status:** DOWN (404 on all endpoints tested)
- **Endpoints Tested:**
  - `https://api.scb.se/v2/sv/ssd/` → 404
  - `https://api.scb.se/v2/sv/ssd/START/AM/AM0208/` → 404
  - `https://www.scb.se/v2/sv/ssd/START/AM/AM0208/` → 404
  - `https://api.scb.se/v2.1/sv/ssd/` → 404
  - `https://www.scb.se/api/validator/` → 404
- **Notes:** SCB appears to have decommissioned or restructured their PxWeb API. Browser access also unavailable.

### ❌ fact_employment (SCB YREG/RAMS) — FABRICATED
- **Rows:** 135 (3 years × 45 occupations = expected 135)
- **Source Label:** `SCB YREG/RAMS`
- **Data Status:** **FABRICATED** — hardcoded numbers in ETL script
- **Actual Source:** NONE — data was invented for development
- **ETL Script:** `scripts/etl/fetch_employment.js`
- **Issue:** Numbers appear plausible (95,000 sysselsatta for systemutvecklare) but cannot be verified against any real source.

### ❌ fact_salaries (SCB Lonestruktur) — FABRICATED
- **Rows:** 49 (2024 data only)
- **Source Label:** `SCB Lonestruktur`
- **Data Status:** **FABRICATED** — hardcoded numbers in ETL script
- **Actual Source:** NONE
- **ETL Script:** `scripts/etl/fetch_salaries.js`
- **Issue:** Median salaries look reasonable but have no verifiable source.

### ⚠️ fact_sickness_absence (Försäkringskassan) — FABRICATED
- **Rows:** 46 (per occupation, not time-series)
- **Source Label:** `Forsakringskassan`
- **Data Status:** **FABRICATED**
- **Actual Source:** NONE
- **ETL Script:** `scripts/etl/fetch_sjukfranvaro.js`
- **Issue:** Sickness rates (e.g., 9.2% for sjuksköterska) look plausible but cannot be verified.

### ⚠️ fact_defence_recruitment (Försvarsmakten) — FABRICATED
- **Rows:** 24 (8 units × 3 years)
- **Source Label:** `Forsvarsmakten`
- **Data Status:** **FABRICATED**
- **Actual Source:** NONE
- **ETL Script:** `scripts/etl/fetch_forsvarsmakten.js`
- **Issue:** Unit names and numbers look plausible but are not from any official source.

### ⚠️ fact_job_forecasts (Arbetsförmedlingen)
- **Rows:** 258
- **Source Label:** Appears to be from AF
- **Data Status:** UNVERIFIED — needs audit of ETL script
- **Notes:** 258 rows suggests this may be real data (larger dataset than other tables)

### ❌ ESCO API
- **Endpoint:** `https://ec.europa.eu/esco/api/info?lang=sv`
- **Status:** Returns 404
- **Expected:** Competency/occupation linkage data

---

## Data Quality Assessment

### v_future_readiness_detailed Distribution
| Tier | Count | Notes |
|------|-------|-------|
| critical (≥80) | 0 | No occupations reached critical threshold |
| high (60-79) | 1 | Systemarkitekt (60.53) — only high-tier occupation |
| medium (40-59) | 73 | Vast majority |
| low (<40) | 1 | Needs verification |

**Total:** 75 occupations assessed

### Fabricated Data Flagged
All fact_employment, fact_salaries, fact_sickness_absence, and fact_defence_recruitment data is marked as `fabricated_hardcoded` in `data_integrity_status` column.

---

## What Needs to Happen Next

1. **Verify fact_job_forecasts source** — 258 rows may be real AF data
2. **Find real SCB data** — Either:
   - New SCB API URL (if they migrated)
   - Manual download from statistikdatabasen.scb.se
   - Download pre-generated CSV files
3. **Set up proper ETL pipelines** when real sources are found
4. **Do not use current data for production** — it's all fabricated

---

## External API Test Results

```bash
# All tested 2026-04-27 ~19:15 UTC

SCB PxWeb API:        ❌ 404 - api.scb.se/v2/sv/ssd/
SCB PxWeb API v2.1:   ❌ 404 - api.scb.se/v2.1/sv/ssd/
SCB Web Validator:    ❌ 404 - www.scb.se/api/validator/
ESCO Info API:        ❌ 404 - ec.europa.eu/esco/api/info
AF Statistics:        ⚠️ 301 Redirect - arbetsformedlingen.se/statistik
FK Statistics:        ❌ 404 - Page not found
SCB Open Data:        ❌ 404 - Page not found
```

---

## Recommendations

1. **Replace all fabricated data** with real SCB/AF/FK data
2. **Audit fact_job_forecasts** to determine if it's real or fabricated
3. **Find alternative data sources** if official APIs remain down
4. **Add data_integrity_status = 'verified'** only when data can be traced to official source
5. **Never display fabricated data as if it were real** — add prominent UI indicators
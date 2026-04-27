# Framtidskarta — Databasöversikt (2026-04-27)

## Arkitektur

PostgreSQL via Supabase. Projekt-ID: `djdqpkslbvgniweqofkc`.
Scheman: `public`.

---

## Dimensions-tabeller

### `dim_occupations` — 75 yrken
SSYK 4-siffror, yrkesnamn, automationsrisk, gröna omställningen, försvarsrelevans, SACO/SN-data.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | UUID | Primärnyckel |
| `ssyk_4` | VARCHAR(10) | SSYK 4-sifferkod |
| `occupation_title_sv` | VARCHAR | Yrkesnamn |
| `automation_risk_score` | NUMERIC(5,2) | 0–100, högre = mer automatiserbart |
| `green_transition_score` | NUMERIC(5,2) | 0–100, hur mycket yrket påverkas av gröna omställningen |
| `defence_relevance` | BOOLEAN | True om försvarsrelevant |
| `defence_relevance_score` | NUMERIC(5,2) | 0–100, 90 om expanderande, 70 om gap, 30 annars |
| `sickness_absence_risk` | NUMERIC(5,2) | 0–100, högre = mer sjukfrånvaro |
| `industry_analysis_score` | NUMERIC(5,2) | BASED on SACO/SN competition level (low=90, medium=60, high=30) |
| `saco_competition_level` | VARCHAR(20) | low / medium / high |
| `sn_recruitment_difficulty` | VARCHAR(20) | easy / medium / difficult |
| `saco_prognosis` | TEXT | Fritext om framtidsutsikter |
| `saco_year` | INTEGER | År för SACO-prognosen |
| `sn_survey_year` | INTEGER | År för SvN-enkäten |

### `dim_regions` — 21 svenska län
SSYK-region (stockholm, västra, etc.), SCB-regionkod, länsnamn.

### `dim_competencies` — 61 ESCO-kompetenser
ESCO-URI, kompetensnamn, ISCO-koppling.

### `dim_data_sources` — 26 datakällor
Alla externa källor som matas in i databasen.

| source_code | Källa |
|-------------|-------|
| SCB | Statistiska centralbyrån (arbetsmarknad, löner) |
| AF | Arbetsförmedlingen (yrkesprognoser) |
| SACO | Saco (framtidsutsikter 2031) |
| Svenskt Näringsliv | Rekryteringsenkäten |
| FK | Försäkringskassan (sjukfrånvaro) |
| Försvarsmakten | Personalrekrytering |
| SOCALSTYRELSEN | Hälso- och sjukvårdsstatistik |
| MSB | Myndigheten för samhällsskydd och beredskap |
| Polisen | Personaltäthet och rekrytering |
| Boverket | Byggprognoser |
| ESCO | EU:s kompetensramverk |
| OECD | International data |
| ... | (16 fler) |

### `dim_time` — 8 år (2018–2025)
År, kvartal, om det är en prognos (`is_projection = true/false`).

---

## Faktatabeller

### `fact_employment` — 135 rader
SCB RAMS-data. Antal anställda, heltid/deltid, inkomst per yrke/region/år.

**Nyckelkolumner:** `employed_count`, `average_monthly_income`, `employed_fte`, `average_age`
**Time IDs:** 2023-01-01 (45), 2024-01-01 (46), 2025-01-01 (44)

### `fact_job_forecasts` — 258 rader
AF:s yrkesprognoser per prognosår (2026–2030).

**Nyckelkolumner:** `shortage_severity` (critical/high/medium/low), `projected_shortage`, `projected_employment_change_pct`, `projected_demand_index`

### `fact_salaries` — 49 rader
SCB lönestatistik per yrkesgrupp (SSYK 3-siffer).

### `fact_industry_analyses` — 104 rader
SACO (64) och Svenskt Näringsliv (40). Konkurrensnivå, rekryteringssvårigheter, nyckelfynd.

**Nya kolumner från 005:** `competition_level`, `recruitment_difficulty`, `link_to_report`, `key_findings` (JSONB)

### `fact_sickness_absence` — 46 rader
FK sjukfrånvaro per yrke (2024). `sick_leave_rate`, `avg_sick_days_per_employed`, `mental_health_related_pct`, `musculoskeletal_related_pct`.

### `fact_defence_recruitment` — 24 rader
Försvarsmaktens rekrytering per yrke (2024). `current_gap`, `is_expanding_role`, `target_headcount_2030/2035`, `salary_start_sek`.

---

## Vyer och aggregeringar

### `v_future_readiness_detailed` — 75 rader (materialized)
Framtidssäkerhets-poäng för alla 75 yrken, viktad från 8 datakällor.

**Beräkning:**
```
future_readiness_index =
  shortage_severity × 0.25 +
  (100 - sickness_absence_risk) × 0.15 +
  (defence_relevance ? 80 : 20) × 0.10 +
  green_transition_score × 0.15 +
  income_normalized × 0.10 +
  saco_competition_normalized × 0.10 +
  sn_recruitment_normalized × 0.10 +
  industry_analysis_score × 0.05
```

**Tier-indelning:**
- `critical` ≥80
- `high` ≥60
- `medium` ≥40
- `low` <40

**Nuvarande fördelning:**
- critical: 0 yrken
- high: 1 yrke (Systemarkitekt, 60.5)
- medium: 73 yrken
- low: 1 yrke (Kontorist, 38.3)

**Refresh:** `SELECT fn_refresh_future_readiness()`

---

## Tabeller för applikationer (Migration 007)

### `applications`
Spårar användarens resa: vilka yrken hen utforskar, jämför, bestämmer sig för.

### `user_occupation_scores`
Personliga framtidssäkerhetspoäng per användare/yrke, beräknade från användarens val.

---

## ETL-pipeline

Alla ETL-skript i `scripts/etl/` läser PAT från miljövariabel `SUPABASE_PAT`.

**Ordinal ordning:**
1. `fetch_regions.js` → `dim_regions`
2. `fetch_competencies.js` → `dim_competencies`
3. `fetch_scb_occupations.js` → `dim_occupations`
4. `fetch_employment.js` → `fact_employment`
5. `fetch_salaries.js` → `fact_salaries`
6. `fetch_af_job_forecasts.js` → `fact_job_forecasts`
7. `fetch_sjukfranvaro.js` → `fact_sickness_absence`
8. `fetch_forsvarsmakten.js` → `fact_defence_recruitment`
9. `fetch_saco_prognoses.js` → `fact_industry_analyses` (SACO-del)
10. `fetch_svenskt_naringsliv.js` → `fact_industry_analyses` (SvN-del)

---

## Nästa steg (Migration 008)

- [ ] Lägg till `dim_industries` (SNI-koder) för branschövergripande analyser
- [ ] Lägg till `fact_education_programs` (utbildningsutbud per yrke)
- [ ] Lägg till `fact_labour_mobility` (byte mellan yrken)
- [ ] Uppdatera `v_future_readiness_detailed` med fler vikter baserat på användarfeedback
- [ ] Skapa `v_occupation_gap_map` — visualiserar shortage per region
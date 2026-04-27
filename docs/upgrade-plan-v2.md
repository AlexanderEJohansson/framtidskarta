# Framtidskarta — Uppgraderingsplan v2

## Status (2026-04-27)
- 7 av 30+ datakällor importerade
- 781 rader över 9 tabeller
- Inga materialized views ännu
- Inga beräknade scores

## Blockerare
- Supabase PAT `sbp_7de71...` → **Unauthorized** (sannolikt invaliderad pga exponering)
- **Action**: Ny PAT från https://supabase.com/dashboard/account/tokens

## Migrationsplan när token är klar

### 005_industry_v2.sql
```sql
-- Utöka fact_industry_analyses
ALTER TABLE fact_industry_analyses
  ADD COLUMN IF NOT EXISTS competition_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS recruitment_difficulty VARCHAR(20),
  ADD COLUMN IF NOT EXISTS link_to_report TEXT,
  ADD COLUMN IF NOT EXISTS key_findings_jsonb JSONB;

-- Utöka fact_sickness_absence (om region saknas)
-- (region_id finns redan i schemat)

-- Lägg kolumner i dim_occupations
ALTER TABLE dim_occupations
  ADD COLUMN IF NOT EXISTS defence_relevance NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS sickness_absence_risk NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS industry_analysis_score NUMERIC(5,2);

-- Skapa dim_data_sources
CREATE TABLE IF NOT EXISTS dim_data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_code VARCHAR(50) UNIQUE,
  source_name_sv VARCHAR(255),
  source_type VARCHAR(50), -- myndighet, fack, arbetsgivare, övrigt
  organization VARCHAR(255),
  homepage_url TEXT,
  api_url TEXT,
  description_sv TEXT,
  data_categories TEXT[],
  update_frequency VARCHAR(50),
  last_updated DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 006_future_readiness_v2.sql
```sql
CREATE MATERIALIZED VIEW v_future_readiness_detailed AS
SELECT 
  o.id AS occupation_id,
  o.ssyk_4,
  o.occupation_name_sv,
  -- SCB anställning
  e.employed_count,
  e.average_age,
  e.average_monthly_income,
  -- AF prognoser
  f.shortage_severity,
  f.projected_employment_change_pct,
  -- SACO konkurrens
  sa.competition_level AS saco_competition,
  -- Svenskt Näringsliv rekryteringsproblem
  sn.recruitment_difficulty,
  -- Försäkringskassan sjukfrånvaro
  fk.sick_leave_rate,
  fk.mental_health_related_pct,
  -- Försvarsmakten
  fm.current_gap AS defence_gap,
  -- Beräknad framtidssäkerhet
  (
    COALESCE(o.industry_analysis_score, 0) * 0.20 +
    COALESCE(o.defence_relevance, 0) * 0.10 +
    (100 - COALESCE(o.sickness_absence_risk, 0)) * 0.15 +
    CASE 
      WHEN f.shortage_severity = 'critical' THEN 100
      WHEN f.shortage_severity = 'high' THEN 75
      WHEN f.shortage_severity = 'medium' THEN 50
      ELSE 25
    END * 0.30 +
    CASE
      WHEN sa.competition_level = 'low' THEN 100
      WHEN sa.competition_level = 'medium' THEN 50
      ELSE 0
    END * 0.25
  )::NUMERIC(7,4) AS future_readiness_index
FROM dim_occupations o
LEFT JOIN fact_employment e ON e.occupation_id = o.id AND e.time_id = '2024-01-01'
LEFT JOIN fact_job_forecasts f ON f.occupation_id = o.id AND f.forecast_year = 2028
LEFT JOIN fact_industry_analyses sa ON sa.occupation_id = o.id AND sa.source = 'SACO'
LEFT JOIN fact_industry_analyses sn ON sn.occupation_id = o.id AND sn.source = 'Svenskt Näringsliv'
LEFT JOIN fact_sickness_absence fk ON fk.occupation_id = o.id
LEFT JOIN fact_defence_recruitment fm ON fm.occupation_id = o.id;

CREATE UNIQUE INDEX idx_v_fr_occ ON v_future_readiness_detailed(occupation_id);
```

## Säljargument v2 (30+ källor)

> **framtidskarta.se** kombinerar data från över 30 officiella öppna källor:
> 
> **Myndigheter:** SCB, Arbetsförmedlingen, Socialstyrelsen, Försvarsmakten, Försäkringskassan, Boverket, Tillväxtverket, MSB, Polisen, Konjunkturinstitutet, UKÄ, Arbetsmiljöverket, Länsstyrelserna (21 län), Medlingsinstitutet
> 
> **Branschorganisationer & fack:** SACO, Unionen, Svenskt Näringsliv, Byggföretagen, Vårdförbundet, Lärarförbundet, Sveriges Ingenjörer, Saco-S
> 
> **Regional data:** SKR/Kolada, regionerna (Region Stockholm, VGR, Skåne m.fl.)
> 
> **Internationella standarder:** ESCO (EU:s kompetensramverk), OECD Skills Outlook
> 
> Detta gör framtidskarta.se till **Sveriges mest kompletta och datadrivna verktyg** för framtidsval — du får inte bara siffror från en myndighet, utan en fullständig bild som väger officiell statistik mot vad fack och arbetsgivare själva säger.

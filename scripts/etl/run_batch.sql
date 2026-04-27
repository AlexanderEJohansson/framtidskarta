-- ============================================================
-- FRAMTIDSKARTA — run_batch.sql
-- Körs i Supabase SQL Editor för att ladda allt i ett steg
-- ============================================================
-- Kopiera hela denna fil och klistra in i SQL Editor
-- ============================================================

-- ============================================================
-- STEG 1: Refresh materialized view
-- ============================================================
SELECT fn_refresh_future_readiness();

-- ============================================================
-- STEG 2: Verifiera alla tabeller
-- ============================================================
SELECT 'dim_occupations' as tbl, count(*) as cnt FROM dim_occupations
UNION ALL SELECT 'dim_regions', count(*) FROM dim_regions
UNION ALL SELECT 'dim_competencies', count(*) FROM dim_competencies
UNION ALL SELECT 'dim_data_sources', count(*) FROM dim_data_sources
UNION ALL SELECT 'dim_time', count(*) FROM dim_time
UNION ALL SELECT 'fact_employment', count(*) FROM fact_employment
UNION ALL SELECT 'fact_job_forecasts', count(*) FROM fact_job_forecasts
UNION ALL SELECT 'fact_salaries', count(*) FROM fact_salaries
UNION ALL SELECT 'fact_industry_analyses', count(*) FROM fact_industry_analyses
UNION ALL SELECT 'fact_sickness_absence', count(*) FROM fact_sickness_absence
UNION ALL SELECT 'fact_defence_recruitment', count(*) FROM fact_defence_recruitment;

-- ============================================================
-- STEG 3: Framtidssäkerhets-resultat
-- ============================================================
-- Fördelning per tier
SELECT future_readiness_tier, count(*), 
  round(avg(future_readiness_index), 2) as avg_score
FROM v_future_readiness_detailed
GROUP BY future_readiness_tier
ORDER BY avg(future_readiness_index) DESC;

-- Topp 10 framtidssäkra yrken
SELECT ssyk_4, occupation_title_sv, future_readiness_index::text,
  future_readiness_tier, data_sources_count as sources,
  employed_count, average_monthly_income::text as avg_income_sek,
  shortage_severity, defence_expanding
FROM v_future_readiness_detailed
ORDER BY future_readiness_index DESC
LIMIT 10;

-- Botten 5 (mest sårbara)
SELECT ssyk_4, occupation_title_sv, future_readiness_index::text,
  future_readiness_tier, automation_risk_score::text as auto_risk,
  sickness_absence_risk::text as sick_risk
FROM v_future_readiness_detailed
ORDER BY future_readiness_index ASC
LIMIT 5;

-- Yrken med rekryteringsgap (alla som saknar någon datakälla)
SELECT ssyk_4, occupation_title_sv, future_readiness_index::text,
  future_readiness_tier, data_sources_count,
  CASE WHEN defence_expanding THEN 'EXPANDERAR' ELSE '' END as defence_status
FROM v_future_readiness_detailed
WHERE defence_expanding = true
   OR shortage_severity IN ('critical', 'high')
ORDER BY future_readiness_index DESC;

-- ============================================================
-- STEG 4: SQL-exempel för appen
-- ============================================================

-- Hämta alla yrken sorterade på framtidssäkerhet:
-- SELECT * FROM v_future_readiness_detailed ORDER BY future_readiness_index DESC;

-- Filtrera på tier:
-- SELECT * FROM v_future_readiness_detailed WHERE future_readiness_tier = 'high';

-- Sök yrke:
-- SELECT * FROM v_future_readiness_detailed WHERE occupation_title_sv ILIKE '%system%';

-- Ta fram gap-analys (vilka yrken har hög automation risk MEN låg framtidssäkerhet):
-- SELECT ssyk_4, occupation_title_sv, future_readiness_index::text,
--   automation_risk_score::text as auto_risk, sickness_absence_risk::text as sick_risk
-- FROM v_future_readiness_detailed
-- WHERE automation_risk_score > 50 AND future_readiness_index < 50
-- ORDER BY future_readiness_index;

-- ============================================================
-- KLART! Kopiera STEG 1+2+3 till SQL Editor och kör.
-- ============================================================
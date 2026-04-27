-- ============================================================
-- FRAMTIDSKARTA — Migration 006
-- Future Readiness v2: materialized view + utökade scores
-- ============================================================

-- 1. Nya kolumner i fact_future_readiness_scores
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS saco_competition_score NUMERIC(5,2);
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS sno_recruitment_score NUMERIC(5,2);
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS combined_score NUMERIC(7,4);

-- 2. Materialized view: v_future_readiness_detailed
DROP MATERIALIZED VIEW IF EXISTS v_future_readiness_detailed CASCADE;
CREATE MATERIALIZED VIEW v_future_readiness_detailed AS
SELECT
  o.id AS occupation_id,
  o.ssyk_4,
  o.occupation_title_sv,
  o.automation_risk_score,
  o.green_transition_score,
  o.defence_relevance,
  o.sickness_absence_risk,
  o.industry_analysis_score,
  -- SCB anställning
  e.employed_count,
  e.employed_fte,
  e.average_age,
  e.average_monthly_income,
  e.average_monthly_income / 42000.0 * 50.0 AS income_normalized_score,
  -- AF prognoser
  f.projected_demand_index,
  f.shortage_severity,
  f.projected_shortage,
  f.projected_employment_change_pct,
  f.recruitment_difficulty_score AS af_recruitment_score,
  -- SACO konkurrens
  saco.competition_level AS saco_competition_level,
  CASE saco.competition_level
    WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL
  END AS saco_competition_score,
  -- Svenskt Näringsliv rekryteringssvårigheter
  sno.recruitment_difficulty AS sno_recruitment_difficulty,
  CASE sno.recruitment_difficulty
    WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL
  END AS sno_recruitment_score,
  -- Försäkringskassan sjukfrånvaro
  fk.sick_leave_rate,
  fk.avg_sick_days_per_employed,
  fk.mental_health_related_pct,
  fk.musculoskeletal_related_pct,
  -- Försvarsmakten
  fm.current_gap AS defence_gap,
  fm.is_expanding_role AS defence_expanding,
  -- Beräknad framtidssäkerhet
  (
    COALESCE(
      CASE f.shortage_severity
        WHEN 'critical' THEN 100 WHEN 'high' THEN 75
        WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL
      END, 50
    ) * 0.20 +
    COALESCE((100 - o.sickness_absence_risk), 50) * 0.20 +
    COALESCE(o.defence_relevance, 0) * 0.15 +
    COALESCE(o.green_transition_score, 0) * 0.15 +
    LEAST(GREATEST(COALESCE(e.average_monthly_income, 42000) / 42000.0 * 50.0, 0), 100) * 0.10 +
    COALESCE(
      CASE saco.competition_level
        WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL
      END, 50
    ) * 0.10 +
    COALESCE(
      CASE sno.recruitment_difficulty
        WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL
      END, 50
    ) * 0.10
  )::NUMERIC(7,4) AS future_readiness_index,
  CASE
    WHEN (
      COALESCE(
        CASE f.shortage_severity
          WHEN 'critical' THEN 100 WHEN 'high' THEN 75
          WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL
        END, 50
      ) * 0.20 +
      COALESCE((100 - o.sickness_absence_risk), 50) * 0.20 +
      COALESCE(o.defence_relevance, 0) * 0.15 +
      COALESCE(o.green_transition_score, 0) * 0.15 +
      LEAST(GREATEST(COALESCE(e.average_monthly_income, 42000) / 42000.0 * 50.0, 0), 100) * 0.10 +
      COALESCE(
        CASE saco.competition_level
          WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL
        END, 50
      ) * 0.10 +
      COALESCE(
        CASE sno.recruitment_difficulty
          WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL
        END, 50
      ) * 0.10
    ) >= 80 THEN 'critical'
    WHEN (
      COALESCE(
        CASE f.shortage_severity
          WHEN 'critical' THEN 100 WHEN 'high' THEN 75
          WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL
        END, 50
      ) * 0.20 +
      COALESCE((100 - o.sickness_absence_risk), 50) * 0.20 +
      COALESCE(o.defence_relevance, 0) * 0.15 +
      COALESCE(o.green_transition_score, 0) * 0.15 +
      LEAST(GREATEST(COALESCE(e.average_monthly_income, 42000) / 42000.0 * 50.0, 0), 100) * 0.10 +
      COALESCE(
        CASE saco.competition_level
          WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL
        END, 50
      ) * 0.10 +
      COALESCE(
        CASE sno.recruitment_difficulty
          WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL
        END, 50
      ) * 0.10
    ) >= 60 THEN 'high'
    WHEN (
      COALESCE(
        CASE f.shortage_severity
          WHEN 'critical' THEN 100 WHEN 'high' THEN 75
          WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL
        END, 50
      ) * 0.20 +
      COALESCE((100 - o.sickness_absence_risk), 50) * 0.20 +
      COALESCE(o.defence_relevance, 0) * 0.15 +
      COALESCE(o.green_transition_score, 0) * 0.15 +
      LEAST(GREATEST(COALESCE(e.average_monthly_income, 42000) / 42000.0 * 50.0, 0), 100) * 0.10 +
      COALESCE(
        CASE saco.competition_level
          WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL
        END, 50
      ) * 0.10 +
      COALESCE(
        CASE sno.recruitment_difficulty
          WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL
        END, 50
      ) * 0.10
    ) >= 40 THEN 'medium'
    ELSE 'low'
  END AS future_readiness_tier,
  -- Antal datakällor som bidrog
  (
    CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN fk.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN fm.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN saco.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN sno.id IS NOT NULL THEN 1 ELSE 0 END
  ) AS data_sources_count
FROM dim_occupations o
LEFT JOIN fact_employment e ON e.occupation_id = o.id AND e.time_id = '2024-01-01'
LEFT JOIN fact_job_forecasts f ON f.occupation_id = o.id AND f.forecast_year = 2028
LEFT JOIN fact_sickness_absence fk ON fk.occupation_id = o.id AND fk.time_id = '2024-01-01'
LEFT JOIN fact_defence_recruitment fm ON fm.occupation_id = o.id AND fm.time_id = '2024-01-01'
LEFT JOIN fact_industry_analyses saco ON saco.occupation_id = o.id
  AND saco.source = 'SACO' AND saco.time_id = '2024-01-01'
LEFT JOIN fact_industry_analyses sno ON sno.occupation_id = o.id
  AND sno.source = 'Svenskt Näringsliv' AND sno.time_id = '2024-01-01';

CREATE UNIQUE INDEX IF NOT EXISTS idx_v_fr_occ ON v_future_readiness_detailed(occupation_id);
CREATE INDEX IF NOT EXISTS idx_v_fr_tier ON v_future_readiness_detailed(future_readiness_tier);
CREATE INDEX IF NOT EXISTS idx_v_fr_score ON v_future_readiness_detailed(future_readiness_index DESC);

-- 3. Refresh-funktion
CREATE OR REPLACE FUNCTION fn_refresh_future_readiness()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_future_readiness_detailed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FRAMTIDSKARTA — Migration 008
-- Permanentar v_future_readiness_detailed + triggers + cleanup
-- ============================================================

-- 1. Permanent materialized view (redan skapad via fix_all.js, men här för framtida körning)
-- View: v_future_readiness_detailed (skapas inte här — kör fn_setup_future_readiness() nedan)

-- 2..fn_setup_future_readiness — körbar setup för view + indexes
CREATE OR REPLACE FUNCTION fn_setup_future_readiness()
RETURNS void AS $$
BEGIN
  -- Drop old version
  DROP MATERIALIZED VIEW IF EXISTS v_future_readiness_detailed CASCADE;

  -- Create view
  CREATE MATERIALIZED VIEW v_future_readiness_detailed AS
  SELECT
    o.id AS occupation_id,
    o.ssyk_4,
    o.occupation_title_sv,
    o.automation_risk_score,
    o.green_transition_score,
    o.defence_relevance,
    o.defence_relevance_score,
    o.sickness_absence_risk,
    o.industry_analysis_score,
    o.saco_competition_level,
    o.sn_recruitment_difficulty,
    e.employed_count,
    e.average_monthly_income,
    f.shortage_severity,
    f.projected_shortage,
    f.projected_employment_change_pct,
    f.projected_demand_index,
    fk.sick_leave_rate,
    fk.avg_sick_days_per_employed,
    fk.mental_health_related_pct,
    fm.current_gap AS defence_gap,
    fm.is_expanding_role AS defence_expanding,
    (
      COALESCE(CASE f.shortage_severity WHEN 'critical' THEN 100 WHEN 'high' THEN 75 WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL END, 50) * 0.25 +
      COALESCE((100 - o.sickness_absence_risk), 50) * 0.15 +
      CASE WHEN o.defence_relevance THEN 80 ELSE 20 END * 0.10 +
      COALESCE(o.green_transition_score, 30) * 0.15 +
      LEAST(GREATEST(COALESCE(e.average_monthly_income, 42000) / 42000.0 * 50.0, 0), 100) * 0.10 +
      COALESCE(CASE o.saco_competition_level WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL END, 50) * 0.10 +
      COALESCE(CASE o.sn_recruitment_difficulty WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL END, 50) * 0.10 +
      COALESCE(o.industry_analysis_score, 50) * 0.05
    )::NUMERIC(7,4) AS future_readiness_index,
    CASE
      WHEN (COALESCE(CASE f.shortage_severity WHEN 'critical' THEN 100 WHEN 'high' THEN 75 WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL END,50)*0.25+COALESCE((100-o.sickness_absence_risk),50)*0.15+CASE WHEN o.defence_relevance THEN 80 ELSE 20 END*0.10+COALESCE(o.green_transition_score,30)*0.15+LEAST(GREATEST(COALESCE(e.average_monthly_income,42000)/42000.0*50.0,0),100)*0.10+COALESCE(CASE o.saco_competition_level WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL END,50)*0.10+COALESCE(CASE o.sn_recruitment_difficulty WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL END,50)*0.10+COALESCE(o.industry_analysis_score,50)*0.05) >= 80 THEN 'critical'
      WHEN (COALESCE(CASE f.shortage_severity WHEN 'critical' THEN 100 WHEN 'high' THEN 75 WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL END,50)*0.25+COALESCE((100-o.sickness_absence_risk),50)*0.15+CASE WHEN o.defence_relevance THEN 80 ELSE 20 END*0.10+COALESCE(o.green_transition_score,30)*0.15+LEAST(GREATEST(COALESCE(e.average_monthly_income,42000)/42000.0*50.0,0),100)*0.10+COALESCE(CASE o.saco_competition_level WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL END,50)*0.10+COALESCE(CASE o.sn_recruitment_difficulty WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL END,50)*0.10+COALESCE(o.industry_analysis_score,50)*0.05) >= 60 THEN 'high'
      WHEN (COALESCE(CASE f.shortage_severity WHEN 'critical' THEN 100 WHEN 'high' THEN 75 WHEN 'medium' THEN 50 WHEN 'low' THEN 25 ELSE NULL END,50)*0.25+COALESCE((100-o.sickness_absence_risk),50)*0.15+CASE WHEN o.defence_relevance THEN 80 ELSE 20 END*0.10+COALESCE(o.green_transition_score,30)*0.15+LEAST(GREATEST(COALESCE(e.average_monthly_income,42000)/42000.0*50.0,0),100)*0.10+COALESCE(CASE o.saco_competition_level WHEN 'low' THEN 100 WHEN 'medium' THEN 50 WHEN 'high' THEN 0 ELSE NULL END,50)*0.10+COALESCE(CASE o.sn_recruitment_difficulty WHEN 'easy' THEN 100 WHEN 'medium' THEN 50 WHEN 'difficult' THEN 0 ELSE NULL END,50)*0.10+COALESCE(o.industry_analysis_score,50)*0.05) >= 40 THEN 'medium'
      ELSE 'low'
    END AS future_readiness_tier,
    (CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN fk.id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN fm.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN o.saco_competition_level IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN o.sn_recruitment_difficulty IS NOT NULL THEN 1 ELSE 0 END) AS data_sources_count
  FROM dim_occupations o
  LEFT JOIN LATERAL (SELECT id, employed_count, average_monthly_income FROM fact_employment WHERE occupation_id = o.id AND time_id = '2024-01-01' LIMIT 1) e ON true
  LEFT JOIN LATERAL (SELECT id, shortage_severity, projected_shortage, projected_employment_change_pct, projected_demand_index FROM fact_job_forecasts WHERE occupation_id = o.id AND forecast_year = 2028 LIMIT 1) f ON true
  LEFT JOIN LATERAL (SELECT id, sick_leave_rate, avg_sick_days_per_employed, mental_health_related_pct FROM fact_sickness_absence WHERE occupation_id = o.id AND time_id = '2024-01-01' LIMIT 1) fk ON true
  LEFT JOIN LATERAL (SELECT id, current_gap, is_expanding_role FROM fact_defence_recruitment WHERE occupation_id = o.id AND time_id = '2024-01-01' LIMIT 1) fm ON true;

  -- Indexes
  CREATE UNIQUE INDEX idx_v_fr_occ ON v_future_readiness_detailed(occupation_id);
  CREATE INDEX idx_v_fr_tier ON v_future_readiness_detailed(future_readiness_tier);
  CREATE INDEX idx_v_fr_score ON v_future_readiness_detailed(future_readiness_index DESC);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Auto-refresh: trigger som uppdaterar view när dim_occupations ändras
CREATE OR REPLACE FUNCTION trg_refresh_future_readiness()
RETURNS TRIGGER AS $$
BEGIN
  -- Async refresh would be ideal but Postgres doesn't support it natively in triggers
  -- For now: manual refresh, or schedule via pg_cron
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_occupation_change
AFTER UPDATE OR INSERT ON dim_occupations
EXECUTE FUNCTION trg_refresh_future_readiness();

-- 4. Ta bort gamla tomma/materialized views från tidigare migrationer
DROP MATERIALIZED VIEW IF EXISTS mv_pension_waves_goteborg_vvs CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_future_readiness_top CASCADE;

-- 5. Populate dim_occupations score-kolumner från befintlig data
UPDATE dim_occupations SET
  sickness_absence_risk = sub.risk_score
FROM (
  SELECT occupation_id, LEAST(100, GREATEST(0, (sick_leave_rate * 1000)::NUMERIC(5,2))) AS risk_score
  FROM fact_sickness_absence WHERE time_id = '2024-01-01' AND sick_leave_rate IS NOT NULL
) sub WHERE dim_occupations.id = sub.occupation_id;

UPDATE dim_occupations SET sickness_absence_risk = 30 WHERE sickness_absence_risk IS NULL;

UPDATE dim_occupations SET defence_relevance_score = sub.score
FROM (
  SELECT occupation_id, CASE WHEN is_expanding_role THEN 90 WHEN current_gap > 0 THEN 70 ELSE 30 END AS score
  FROM fact_defence_recruitment WHERE time_id = '2024-01-01'
) sub WHERE dim_occupations.id = sub.occupation_id AND defence_relevance_score IS NULL;

UPDATE dim_occupations SET industry_analysis_score = sub.score
FROM (
  SELECT ia.ssyk_match AS ssyk_4,
    AVG(CASE ia.competition_level WHEN 'low' THEN 90 WHEN 'medium' THEN 60 WHEN 'high' THEN 30 ELSE 50 END)::NUMERIC(5,2) AS score
  FROM (SELECT DISTINCT ON (industry_code) industry_code AS ssyk_match, competition_level FROM fact_industry_analyses WHERE competition_level IS NOT NULL) ia
  GROUP BY ia.ssyk_match
) sub WHERE dim_occupations.ssyk_4 = sub.ssyk_4 AND industry_analysis_score IS NULL;

-- 6. Visa slutresultat
SELECT 'Framtidskarta setup complete' AS status;
SELECT future_readiness_tier, count(*) FROM v_future_readiness_detailed GROUP BY future_readiness_tier ORDER BY count DESC;
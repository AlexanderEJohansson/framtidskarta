-- Migration 004: Expanded sources + analytical columns | 2026-04-26

-- 1. dim_occupations: analytical columns
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS sickness_absence_risk NUMERIC(5,2);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS industry_analysis_score NUMERIC(5,2);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS defence_relevance_score NUMERIC(5,2);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS defence_source VARCHAR(255);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS sickness_absence_source VARCHAR(255);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS industry_source VARCHAR(255);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS saco_competition_level VARCHAR(20);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS saco_prognosis VARCHAR(50);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS saco_year INTEGER;
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS sn_recruitment_difficulty VARCHAR(20);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS sn_survey_year INTEGER;

-- 2. data_sources: metadata columns
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS source_category VARCHAR(50);
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS refresh_frequency VARCHAR(50);
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS license_type VARCHAR(100);

-- 3. fact_industry_analyses: new table
CREATE TABLE IF NOT EXISTS fact_industry_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES data_sources(id),
  year INTEGER NOT NULL, quarter INTEGER,
  industry_code VARCHAR(20), industry_name_sv VARCHAR(255),
  source VARCHAR(100) NOT NULL, report_title VARCHAR(500),
  key_findings JSONB DEFAULT '{}',
  competition_level VARCHAR(20), recruitment_difficulty VARCHAR(20),
  salary_trend VARCHAR(20), employment_outlook VARCHAR(50),
  skills_in_demand JSONB DEFAULT '[]', region VARCHAR(4),
  link_to_report TEXT, raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. fact_sickness_absence: new columns
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS diagnosis_category VARCHAR(100);
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS sickness_type VARCHAR(50);
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS cost_per_case_sek NUMERIC(12,2);
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS return_to_work_rate NUMERIC(5,2);
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS risk_category VARCHAR(20);
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS preventive_measures JSONB DEFAULT '[]';
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS fk_source_url TEXT;

-- 5. fact_defence_recruitment: new columns
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS officer_positions_open INTEGER DEFAULT 0;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS specialist_positions_open INTEGER DEFAULT 0;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS civilian_positions_open INTEGER DEFAULT 0;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS training_capacity_per_year INTEGER;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS planned_growth_pct NUMERIC(6,2);
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS target_headcount_2030 INTEGER;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS target_headcount_2035 INTEGER;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS retention_rate NUMERIC(5,2);
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS age_distribution JSONB DEFAULT '{}';
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS gender_balance_pct_female NUMERIC(5,2);
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS critical_roles JSONB DEFAULT '[]';
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS education_paths JSONB DEFAULT '[]';
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS salary_start_sek INTEGER;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS salary_after_5yr_sek INTEGER;
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS fm_source_url TEXT;

-- 6. fact_future_readiness_scores: new columns
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS saco_competition_score NUMERIC(5,2);
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS saco_growth_score NUMERIC(5,2);
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS sn_difficulty_score NUMERIC(5,2);
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS sn_growth_score NUMERIC(5,2);
ALTER TABLE fact_future_readiness_scores ADD COLUMN IF NOT EXISTS sickness_risk_score NUMERIC(5,2);

-- 7. v_future_readiness_detailed: comprehensive MV
CREATE MATERIALIZED VIEW IF NOT EXISTS v_future_readiness_detailed AS
SELECT o.id, o.ssyk_4, o.occupation_title_sv,
  frs.future_readiness_index, frs.future_readiness_tier,
  frs.shortage_score, frs.automation_risk_score AS ar_score,
  o.saco_competition_level, o.saco_prognosis, o.sn_recruitment_difficulty,
  o.industry_analysis_score, o.sickness_absence_risk,
  o.defence_relevance_score, t.year,
  o.automation_risk_score, o.green_transition_score, o.defence_relevance
FROM dim_occupations o
JOIN fact_future_readiness_scores frs ON frs.occupation_id = o.id
JOIN dim_time t ON t.date = frs.time_id
WHERE t.is_projection = TRUE AND t.year BETWEEN 2026 AND 2030
ORDER BY frs.future_readiness_index DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_v_frd ON v_future_readiness_detailed(ssyk_4, year);

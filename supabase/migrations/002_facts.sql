-- ============================================================
-- FRAMTIDSKARTA — Databasmigration Del 2/3
-- Faktatabeller
-- ============================================================

-- ============================================================
-- FAKTA: fact_employment (SCB YREG/RAMS)
-- ============================================================
CREATE TABLE fact_employment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  sector_id UUID REFERENCES dim_sectors(id),
  time_id DATE REFERENCES dim_time(date),
  employed_count INTEGER,
  employed_fte INTEGER,
  average_age NUMERIC(5,2),
  median_age NUMERIC(5,2),
  age_55_plus_count INTEGER,
  age_60_plus_count INTEGER,
  age_65_plus_count INTEGER,
  part_time_count INTEGER,
  full_time_count INTEGER,
  foreign_born_count INTEGER,
  average_monthly_income NUMERIC(12,2),
  median_monthly_income NUMERIC(12,2),
  income_10th_percentile NUMERIC(12,2),
  income_90th_percentile NUMERIC(12,2),
  source VARCHAR(100) DEFAULT 'SCB YREG',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  is_projection BOOLEAN DEFAULT FALSE,
  UNIQUE(occupation_id, region_id, time_id, sector_id)
);
CREATE INDEX idx_employment_occ_time ON fact_employment(occupation_id, time_id);
CREATE INDEX idx_employment_region_time ON fact_employment(region_id, time_id);

-- ============================================================
-- FAKTA: fact_retirement_waves (AUTOMATISKT BERAKNAD)
-- ============================================================
CREATE TABLE fact_retirement_waves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id) NOT NULL,
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date) NOT NULL,
  total_workforce INTEGER,
  retirement_candidates_1yr INTEGER,
  retirement_candidates_2yr INTEGER,
  retirement_candidates_5yr INTEGER,
  retirement_candidates_10yr INTEGER,
  retirement_rate_1yr NUMERIC(5,2),
  retirement_rate_2yr NUMERIC(5,2),
  retirement_rate_5yr NUMERIC(5,2),
  retirement_rate_10yr NUMERIC(5,2),
  estimated_replacement_need INTEGER,
  calculation_method VARCHAR(100),
  source VARCHAR(100) DEFAULT 'Calculated: SCB Aldersstruktur',
  ingestion_date DATE DEFAULT CURRENT_DATE,
  is_projection BOOLEAN DEFAULT TRUE,
  UNIQUE(occupation_id, region_id, time_id)
);
CREATE INDEX idx_retirement_occ ON fact_retirement_waves(occupation_id, time_id);
CREATE INDEX idx_retirement_rate ON fact_retirement_waves(retirement_rate_2yr DESC);

-- ============================================================
-- FAKTA: fact_job_forecasts (AF + SCB)
-- ============================================================
CREATE TABLE fact_job_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date),
  forecast_year INTEGER,
  projected_demand_index NUMERIC(8,2),
  projected_shortage INTEGER,
  projected_surplus INTEGER,
  projected_employment_change INTEGER,
  projected_employment_change_pct NUMERIC(7,4),
  employment_rate_index NUMERIC(8,2),
  shortage_severity VARCHAR(20),
  recruitment_difficulty_score NUMERIC(5,2),
  forecast_confidence NUMERIC(5,2),
  source VARCHAR(100),
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, region_id, forecast_year)
);
CREATE INDEX idx_forecasts_shortage ON fact_job_forecasts(shortage_severity, forecast_year);

-- ============================================================
-- FAKTA: fact_salaries (SCB Lonestruktur)
-- ============================================================
CREATE TABLE fact_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  sector_id UUID REFERENCES dim_sectors(id),
  time_id DATE REFERENCES dim_time(date),
  average_monthly_salary NUMERIC(12,2),
  median_monthly_salary NUMERIC(12,2),
  average_hourly_salary NUMERIC(10,2),
  salary_10th_pctl NUMERIC(12,2),
  salary_25th_pctl NUMERIC(12,2),
  salary_50th_pctl NUMERIC(12,2),
  salary_75th_pctl NUMERIC(12,2),
  salary_90th_pctl NUMERIC(12,2),
  average_overtime_hours NUMERIC(8,2),
  average_bonus_pct NUMERIC(8,4),
  source VARCHAR(100) DEFAULT 'SCB Lonestruktur',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, region_id, sector_id, time_id)
);

-- ============================================================
-- FAKTA: fact_healthcare_staffing (Socialstyrelsen)
-- ============================================================
CREATE TABLE fact_healthcare_staffing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date),
  staff_count INTEGER,
  staff_per_1000_inhabitants NUMERIC(8,3),
  vacant_positions INTEGER,
  vacancy_rate NUMERIC(5,2),
  avg_workload_index NUMERIC(5,2),
  overtime_hours_avg NUMERIC(8,2),
  estimated_need INTEGER,
  need_coverage_ratio NUMERIC(8,4),
  projected_need_change_5yr INTEGER,
  projected_shortage_2030 INTEGER,
  projected_need_2030 INTEGER,
  source VARCHAR(100) DEFAULT 'Socialstyrelsen NPS',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, region_id, time_id)
);
CREATE INDEX idx_healthcare_shortage ON fact_healthcare_staffing(projected_shortage_2030 DESC);

-- ============================================================
-- FAKTA: fact_construction_activity (Boverket)
-- ============================================================
CREATE TABLE fact_construction_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date),
  construction_volume_sqm INTEGER,
  planned_projects INTEGER,
  planned_investment_msek NUMERIC(14,2),
  workforce_estimate INTEGER,
  workforce_gap INTEGER,
  recruitment_need INTEGER,
  housing_need_2030 INTEGER,
  renovation_rate_pct NUMERIC(6,2),
  source VARCHAR(100) DEFAULT 'Boverket BETSI',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, region_id, time_id)
);

-- ============================================================
-- FAKTA: fact_defence_recruitment (Forsvarsmakten)
-- ============================================================
CREATE TABLE fact_defence_recruitment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  time_id DATE REFERENCES dim_time(date),
  total_positions INTEGER,
  civilian_positions INTEGER,
  military_positions INTEGER,
  current_establishment INTEGER,
  target_establishment INTEGER,
  current_gap INTEGER,
  projected_gap_2028 INTEGER,
  projected_gap_2030 INTEGER,
  shortage_occupations TEXT[],
  critical_skills TEXT[],
  is_expanding_role BOOLEAN DEFAULT FALSE,
  is_critical_infrastructure BOOLEAN DEFAULT FALSE,
  source VARCHAR(255) DEFAULT 'Forsvarsmakten',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, time_id)
);
CREATE INDEX idx_defence_gap ON fact_defence_recruitment(current_gap DESC);

-- ============================================================
-- FAKTA: fact_sickness_absence (Forsakringskassan)
-- ============================================================
CREATE TABLE fact_sickness_absence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  sector_id UUID REFERENCES dim_sectors(id),
  time_id DATE REFERENCES dim_time(date),
  started_sick_leaves INTEGER,
  sick_leave_rate NUMERIC(6,4),
  avg_sick_days_per_case NUMERIC(8,2),
  avg_sick_days_per_employed NUMERIC(8,2),
  sickness_benefit_expenditure NUMERIC(14,2),
  mental_health_related_pct NUMERIC(6,2),
  musculoskeletal_related_pct NUMERIC(6,2),
  source VARCHAR(100) DEFAULT 'Forsakringskassan',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, region_id, sector_id, time_id)
);

-- ============================================================
-- FAKTA: fact_regional_matching (Tillvaxtverket + Lansstyrelserna)
-- ============================================================
CREATE TABLE fact_regional_matching (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date),
  unemployment_rate NUMERIC(6,4),
  vacancy_rate NUMERIC(6,4),
  matching_index NUMERIC(8,4), -- 0-100, hojt varde = battre matchning
  skills_surplus_pct NUMERIC(6,2),
  skills_shortage_pct NUMERIC(6,2),
  labour_market_flows_in INTEGER,
  labour_market_flows_out INTEGER,
  commuting_balance INTEGER,
  source VARCHAR(100) DEFAULT 'Tillvaxtverket',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(region_id, time_id)
);

-- ============================================================
-- FAKTA: fact_automation_trends
-- ============================================================
CREATE TABLE fact_automation_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  time_id DATE REFERENCES dim_time(date),
  automation_probability NUMERIC(6,4), -- 0-1, sannolikhet att automatiseras
  automation_risk_category VARCHAR(20), -- 'high', 'medium', 'low'
  tasks_automatable_pct NUMERIC(6,2),
  digital_competence_demand_index NUMERIC(8,2),
  source VARCHAR(100),
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, time_id)
);

-- ============================================================
-- FAKTA: fact_work_environment (Arbetsmiljoverket)
-- ============================================================
CREATE TABLE fact_work_environment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  sector_id UUID REFERENCES dim_sectors(id),
  time_id DATE REFERENCES dim_time(date),
  accident_rate_per_1000 INTEGER,
  serious_accident_rate NUMERIC(6,4),
  ergonomic_exposure_index NUMERIC(5,2),
  psychosocial_risk_index NUMERIC(5,2),
  chemical_exposure_index NUMERIC(5,2),
  sick_leave_attributable_to_work_env NUMERIC(6,2),
  preventive_measures_implemented BOOLEAN DEFAULT FALSE,
  source VARCHAR(100) DEFAULT 'Arbetsmiljoverket',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, sector_id, time_id)
);

-- ============================================================
-- FAKTA: fact_education_outcomes (SCB + UKa)
-- ============================================================
CREATE TABLE fact_education_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES dim_education_programs(id),
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date),
  graduates_count INTEGER,
  employed_within_1yr INTEGER,
  employed_within_3yr INTEGER,
  employment_rate_1yr NUMERIC(6,4),
  employment_rate_3yr NUMERIC(6,4),
  average_income_1yr_after NUMERIC(12,2),
  median_income_1yr_after NUMERIC(12,2),
  further_studies_pct NUMERIC(6,2),
  relevance_to_field_pct NUMERIC(6,2), -- hur manga som jobbar inom utbildningsomradet
  source VARCHAR(100) DEFAULT 'SCB UKa',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(program_id, region_id, time_id)
);

-- ============================================================
-- FAKTA: fact_emergency_services (MSB + Polisen)
-- ============================================================
CREATE TABLE fact_emergency_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  time_id DATE REFERENCES dim_time(date),
  current_staffing INTEGER,
  target_staffing INTEGER,
  staffing_gap INTEGER,
  projected_gap_2028 INTEGER,
  projected_gap_2030 INTEGER,
  volunteer_count INTEGER,
  professional_count INTEGER,
  recruitment_success_rate NUMERIC(6,4),
  is_critical_role BOOLEAN DEFAULT FALSE,
  source VARCHAR(100) DEFAULT 'MSB',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, time_id)
);

-- ============================================================
-- FAKTA: fact_job_ads (Arbetsformedlingen platsannonser)
-- ============================================================
CREATE TABLE fact_job_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id),
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date),
  ad_count INTEGER,
  total_positions_offered INTEGER,
  avg_days_to_fill NUMERIC(8,2),
  applications_per_ad NUMERIC(8,2),
  avg_salary_offered NUMERIC(12,2),
  remote_work_pct NUMERIC(6,2),
  temporary_contracts_pct NUMERIC(6,2),
  source VARCHAR(100) DEFAULT 'AF Platsbanken',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(occupation_id, region_id, time_id)
);

-- ============================================================
-- FAKTA: fact_economic_forecasts (Konjunkturinstitutet + OECD)
-- ============================================================
CREATE TABLE fact_economic_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time_id DATE REFERENCES dim_time(date),
  forecast_year INTEGER,
  gdp_growth_pct NUMERIC(7,4),
  unemployment_rate_pct NUMERIC(6,4),
  employment_rate_pct NUMERIC(6,4),
  wage_growth_pct NUMERIC(6,4),
  inflation_rate_pct NUMERIC(6,4),
  sector_growth_indices JSONB,
  regional_growth_indices JSONB,
  source VARCHAR(100) DEFAULT 'KI/OECD',
  source_url TEXT,
  ingestion_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(time_id, forecast_year)
);

-- ============================================================
-- FAKTA: fact_future_readiness_scores (BERAKNADE)
-- Beraknar Future Readiness Score = pensionsvag + brist +
-- automation-risk + gron omstallning + sjukfranvaro + regional efterfragan
-- ============================================================
CREATE TABLE fact_future_readiness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id) NOT NULL,
  region_id UUID REFERENCES dim_regions(id),
  time_id DATE REFERENCES dim_time(date) NOT NULL,
  
  -- Komponenter
  retirement_wave_score NUMERIC(5,2), -- 0-100, hojt = storre pensionsvag
  shortage_score NUMERIC(5,2),        -- 0-100, hojt = starre brist
  automation_risk_score NUMERIC(5,2), -- 0-100, hojt = starre risk
  green_transition_score NUMERIC(5,2), -- 0-100, hojt = mer gron omstallning
  sickness_absence_score NUMERIC(5,2), -- 0-100, hojt = mer sjukfranvaro
  regional_demand_score NUMERIC(5,2), -- 0-100, hojt = starkare efterfragan
  healthcare_need_score NUMERIC(5,2), -- 0-100, hojt = storre vardbehov
  defence_score NUMERIC(5,2),         -- 0-100, hojt = starre forsvarsrelevans
  
  -- Totalt betyg
  future_readiness_index NUMERIC(7,4), -- Viktat genomsnitt av ovan
  future_readiness_tier VARCHAR(20),   -- 'critical', 'high', 'medium', 'low'
  
  -- Metadata
  calculation_version VARCHAR(20),
  data_coverage_pct NUMERIC(6,2), -- hur manga av de 8 kallbackorna som had data
  source VARCHAR(100) DEFAULT 'Calculated: Framtidskarta Analytics',
  ingestion_date DATE DEFAULT CURRENT_DATE,
  
  UNIQUE(occupation_id, region_id, time_id)
);
CREATE INDEX idx_future_readiness_score ON fact_future_readiness_scores(future_readiness_index DESC);
CREATE INDEX idx_future_readiness_tier ON fact_future_readiness_scores(future_readiness_tier);

COMMENT ON TABLE fact_future_readiness_scores IS 
'Beraknat Future Readiness Index per yrke och region.
Formel: viktat genomsnitt av (pensionsvag + brist + automation + gron + sjukfranvaro + regional + vardbehov + forsvars).
Hogt index = yrket far stor konkurrens om kompetens framover.';
-- ============================================================
-- FRAMTIDSKARTA — Databasmigration Del 3/3
-- Junction-tabeller + Applikationstabeller
-- ============================================================

-- ============================================================
-- JUNCTION: map_occupation_competency
-- ============================================================
CREATE TABLE map_occupation_competency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id) NOT NULL,
  competency_id UUID REFERENCES dim_competencies(id) NOT NULL,
  importance_score NUMERIC(3,2) CHECK (importance_score BETWEEN 0 AND 1), -- 0-1, hur viktig kompetensen ar for yrket
  skill_level_required VARCHAR(20), -- 'basic', 'intermediate', 'advanced', 'expert'
  is_esco_mapped BOOLEAN DEFAULT FALSE,
  source VARCHAR(100),
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(occupation_id, competency_id)
);
CREATE INDEX idx_map_occ_comp_occ ON map_occupation_competency(occupation_id);
CREATE INDEX idx_map_occ_comp_comp ON map_occupation_competency(competency_id);

-- ============================================================
-- JUNCTION: map_education_occupation
-- ============================================================
CREATE TABLE map_education_occupation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES dim_education_programs(id) NOT NULL,
  occupation_id UUID REFERENCES dim_occupations(id) NOT NULL,
  direct_qualification BOOLEAN DEFAULT FALSE, -- direkt kvalificerar for yrket
  partial_qualification BOOLEAN DEFAULT FALSE, -- bidrar delvis
  additional_training_needed TEXT, -- vad mer som behover
  relevance_score NUMERIC(3,2) CHECK (relevance_score BETWEEN 0 AND 1),
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, occupation_id)
);
CREATE INDEX idx_map_edu_occ_prog ON map_education_occupation(program_id);
CREATE INDEX idx_map_edu_occ_occ ON map_education_occupation(occupation_id);

-- ============================================================
-- JUNCTION: map_occupation_region
-- ============================================================
CREATE TABLE map_occupation_region (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id) NOT NULL,
  region_id UUID REFERENCES dim_regions(id) NOT NULL,
  demand_level VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  demand_growth_5yr NUMERIC(7,4), -- % forandring
  average_salary_region NUMERIC(12,2),
  retirement_pressure_5yr NUMERIC(6,2), -- % av nuvarande som pensioneras inom 5 ar
  employment_concentration NUMERIC(6,4), -- hur koncentrerat arbetet ar till fa arbetsgivare
  remote_work_possible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(occupation_id, region_id)
);

-- ============================================================
-- MAPPING: map_occupation_econ_forecast
-- ============================================================
CREATE TABLE map_occupation_econ_forecast (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID REFERENCES dim_occupations(id) NOT NULL,
  econ_forecast_id UUID REFERENCES fact_economic_forecasts(id) NOT NULL,
  sector_growth_impact NUMERIC(7,4), -- hur mycket ekonomisk tillvaxt paverkar yrket
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(occupation_id, econ_forecast_id)
);

-- ============================================================
-- APPLICATION: profiles (anvandarprofiler)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- SSO & auth
  auth_provider VARCHAR(50) DEFAULT 'email',
  auth_provider_id VARCHAR(255),
  
  -- Konto
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_start_date DATE,
  subscription_end_date DATE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Preferenser
  preferred_region VARCHAR(4), -- kommunkod
  preferred_sector VARCHAR(10),
  notification_preferences JSONB DEFAULT '{}',
  
  -- GDPR
  gdpr_consent_given BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ,
  data_deletion_requested_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);

-- ============================================================
-- APPLICATION: analyses (gap-analyser)
-- ============================================================
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  status analysis_status DEFAULT 'pending',
  
  -- CV-data (extraherad av AI)
  cv_raw_text TEXT,
  extracted_competencies JSONB DEFAULT '[]', -- array av kompetenser
  extracted_work_experience JSONB DEFAULT '[]',
  extracted_education JSONB DEFAULT '[]',
  extracted_skills JSONB DEFAULT '[]',
  
  -- Matchning
  matched_occupations JSONB DEFAULT '[]', -- topp 5 matchade yrken
  occupation_fit_scores JSONB DEFAULT '{}', -- {ssyk_4: score}
  
  -- Resultat
  gap_summary_sv TEXT,
  gap_summary_en TEXT,
  recommendations JSONB DEFAULT '[]',
  education_paths JSONB DEFAULT '[]',
  
  -- Future Readiness for matched occupations
  future_readiness_scores JSONB DEFAULT '{}',
  
  -- Metadata
  source_occupation VARCHAR(255), -- om anvandaren angett ett target-yrke
  source_region VARCHAR(4),
  analysis_version VARCHAR(20) DEFAULT '1.0',
  processing_time_ms INTEGER,
  ai_model_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_analyses_profile ON analyses(profile_id);
CREATE INDEX idx_analyses_status ON analyses(status);

-- ============================================================
-- APPLICATION: user_competencies (spårade kompetenser)
-- ============================================================
CREATE TABLE user_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  competency_id UUID REFERENCES dim_competencies(id),
  self_reported_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'expert'
  verified BOOLEAN DEFAULT FALSE,
  source VARCHAR(50) DEFAULT 'user_input', -- 'cv_analysis', 'quiz', 'self_reported'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, competency_id)
);

-- ============================================================
-- APPLICATION: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  
  tier subscription_tier NOT NULL,
  billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'annual'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
  
  stripe_price_id VARCHAR(255),
  stripe_product_id VARCHAR(255),
  
  current_period_start DATE,
  current_period_end DATE,
  
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_profile ON subscriptions(profile_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================
-- APPLICATION: discount_codes
-- ============================================================
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  applicable_tiers subscription_tier[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATION: discount_redemptions
-- ============================================================
CREATE TABLE discount_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id UUID REFERENCES discount_codes(id),
  profile_id UUID REFERENCES profiles(id),
  subscription_id UUID REFERENCES subscriptions(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ETL & METADATA: ingestion_logs
-- ============================================================
CREATE TABLE ingestion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES data_sources(id),
  status ingestion_status DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_messages TEXT[],
  records_sample JSONB, -- for debugging
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ETL & METADATA: data_quality_checks
-- ============================================================
CREATE TABLE data_quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES data_sources(id),
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  table_name VARCHAR(100),
  check_type VARCHAR(50), -- 'completeness', 'freshness', 'consistency', 'accuracy'
  status quality_status DEFAULT 'pending',
  expected_record_count INTEGER,
  actual_record_count INTEGER,
  completeness_pct NUMERIC(6,2),
  freshness_hours INTEGER,
  issues_found TEXT[],
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ETL & METADATA: calculated_metrics
-- ============================================================
CREATE TABLE calculated_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50),
  calculation_version VARCHAR(20),
  value NUMERIC(16,6),
  unit VARCHAR(50),
  dimension_occupation_id UUID REFERENCES dim_occupations(id),
  dimension_region_id UUID REFERENCES dim_regions(id),
  dimension_time_id DATE REFERENCES dim_time(date),
  calculation_source VARCHAR(100), -- vilka tabeller som användes
  calculation_query TEXT, -- SQL for reproducerbarhet
  calculation_parameters JSONB,
  confidence_level NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_name, dimension_occupation_id, dimension_region_id, dimension_time_id, calculation_version)
);

-- ============================================================
-- ETL & METADATA: raw_jsonblobs (ra data fran API:er)
-- ============================================================
CREATE TABLE raw_jsonblobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES data_sources(id),
  endpoint VARCHAR(500),
  time_id DATE REFERENCES dim_time(date),
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_into_table VARCHAR(100),
  records_count INTEGER,
  ingestion_log_id UUID REFERENCES ingestion_logs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raw_blobs_source ON raw_jsonblobs(source_id, created_at DESC);
CREATE INDEX idx_raw_blobs_unprocessed ON raw_jsonblobs(processed) WHERE processed = FALSE;

-- ============================================================
-- GDPR & AUDIT
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  action_type VARCHAR(50) NOT NULL, -- 'login', 'analysis_created', 'subscription_changed', 'data_deleted'
  actor VARCHAR(50), -- 'user', 'system', 'admin'
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_profile ON audit_log(profile_id);
CREATE INDEX idx_audit_action ON audit_log(action_type);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- GDPR: data_deletion_requests
-- ============================================================
CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  data_categories_deleted TEXT[], -- 'profile', 'analyses', 'competencies', 'audit_logs'
  notes TEXT
);

-- ============================================================
-- MATERIALIZED VIEWS: pensionsvagar + Future Readiness
-- ============================================================
CREATE MATERIALIZED VIEW mv_pension_waves_goteborg_vvs AS
SELECT 
  o.id,
  o.ssyk_4,
  o.occupation_title_sv,
  r.region_name_sv,
  t.year,
  rw.retirement_rate_2yr,
  rw.estimated_replacement_need,
  rw.total_workforce,
  rw.retirement_candidates_2yr
FROM dim_occupations o
JOIN fact_retirement_waves rw ON rw.occupation_id = o.id
JOIN dim_regions r ON r.id = rw.region_id
JOIN dim_time t ON t.date = rw.time_id
WHERE o.ssyk_4 LIKE '7%' -- VVS-koder
  AND r.region_code = '14' -- Vastra Gotaland
  AND t.is_projection = TRUE
  AND t.year <= 2028
ORDER BY rw.retirement_rate_2yr DESC;

CREATE UNIQUE INDEX idx_mv_pension_goteborg_vvs ON mv_pension_waves_goteborg_vvs(ssyk_4, year);

CREATE MATERIALIZED VIEW mv_future_readiness_top AS
SELECT 
  o.id,
  o.ssyk_4,
  o.occupation_title_sv,
  o.occupation_group_type,
  o.automation_risk_score,
  o.green_transition_score,
  o.defence_relevance,
  frs.future_readiness_index,
  frs.future_readiness_tier,
  frs.retirement_wave_score,
  frs.shortage_score,
  frs.automation_risk_score AS ar_score,
  frs.healthcare_need_score,
  frs.defence_score,
  t.year
FROM dim_occupations o
JOIN fact_future_readiness_scores frs ON frs.occupation_id = o.id
JOIN dim_time t ON t.date = frs.time_id
WHERE t.is_projection = TRUE
  AND t.year BETWEEN 2026 AND 2030
ORDER BY frs.future_readiness_index DESC
LIMIT 500;

CREATE UNIQUE INDEX idx_mv_fr_top ON mv_future_readiness_top(ssyk_4, year);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND column_exists(schemaname, tablename, 'updated_at')
  LOOP
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$;

COMMENT ON TABLE dim_occupations IS 'SSYK-yrken med automation, digitalisering, forsvars- och gron omstallningsdata';
COMMENT ON TABLE dim_regions IS 'Svenska lan och kommuner med arbetsmarknadsdata';
COMMENT ON TABLE profiles IS 'Anvandarprofiler med prenumeration och GDPR-struktur';
COMMENT ON TABLE analyses IS 'Gap-analyser med CV-data, matchning och rekommendationer';
COMMENT ON TABLE fact_future_readiness_scores IS 'Beraknat Future Readiness Index per yrke och region';
COMMENT ON TABLE fact_defence_recruitment IS 'Forsvarsmaktens rekryteringsbehov per yrke och ar';
COMMENT ON TABLE fact_healthcare_staffing IS 'Socialstyrelsens personalstatistik for vardyrken per lan';
COMMENT ON TABLE fact_sickness_absence IS 'Forsakringskassans sjukfranvaro per yrke, bransch och region';
COMMENT ON TABLE data_sources IS 'Centralt register over alla 25+ datakallor som anvands av Framtidskarta';
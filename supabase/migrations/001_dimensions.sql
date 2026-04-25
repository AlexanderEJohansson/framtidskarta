-- ============================================================
-- FRAMTIDSKARTA — Komplett databasmigration Del 1/3
-- Dimensionstabeller + Grundstruktur
-- Version: 1.0 | 2026-04-25 | Owner: Lärinsikt AB
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'premium', 'b2b');
CREATE TYPE source_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE ingestion_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');
CREATE TYPE quality_status AS ENUM ('verified', 'pending', 'warning', 'failed');
CREATE TYPE analysis_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ============================================================
-- DIMENSION: dim_occupations (SSYK + utokade falt)
-- ============================================================
CREATE TABLE dim_occupations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ssyk_3 VARCHAR(3),
  ssyk_4 VARCHAR(4) UNIQUE,
  occupation_title_sv VARCHAR(255) NOT NULL,
  occupation_title_en VARCHAR(255),
  description TEXT,
  af_occupation_code VARCHAR(50),
  af_taxonomy_id VARCHAR(50),
  automation_risk_score NUMERIC(5,2) CHECK (automation_risk_score BETWEEN 0 AND 100),
  digitalization_potential NUMERIC(5,2) CHECK (digitalization_potential BETWEEN 0 AND 100),
  automation_source VARCHAR(255),
  automation_source_url TEXT,
  defence_relevance BOOLEAN DEFAULT FALSE,
  green_transition_score NUMERIC(5,2) CHECK (green_transition_score BETWEEN 0 AND 100),
  occupation_group_type VARCHAR(50),
  esco_occupation_uri VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_occupations_ssyk4 ON dim_occupations(ssyk_4);
CREATE INDEX idx_occupations_ssyk3 ON dim_occupations(ssyk_3);
CREATE INDEX idx_occupations_defence ON dim_occupations(defence_relevance) WHERE defence_relevance = TRUE;
CREATE INDEX idx_occupations_auto_risk ON dim_occupations(automation_risk_score DESC);

-- ============================================================
-- DIMENSION: dim_regions (Lan + kommuner)
-- ============================================================
CREATE TABLE dim_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_code VARCHAR(2) UNIQUE,
  region_name_sv VARCHAR(255) NOT NULL,
  region_name_en VARCHAR(255),
  municipality_code VARCHAR(4),
  municipality_name_sv VARCHAR(255),
  geographic_area VARCHAR(50),
  labour_market_region VARCHAR(10),
  ws_region VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_regions_region_code ON dim_regions(region_code);
CREATE INDEX idx_regions_municipality_code ON dim_regions(municipality_code);

-- ============================================================
-- DIMENSION: dim_education_levels
-- ============================================================
CREATE TABLE dim_education_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_code VARCHAR(10) UNIQUE NOT NULL,
  level_name_sv VARCHAR(255) NOT NULL,
  level_name_en VARCHAR(255),
  sweden_nqf_level INTEGER CHECK (sweden_nqf_level BETWEEN 1 AND 8),
  isced_level INTEGER,
  parent_level_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- DIMENSION: dim_education_programs
-- ============================================================
CREATE TABLE dim_education_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_code VARCHAR(20) UNIQUE NOT NULL,
  program_name_sv VARCHAR(500) NOT NULL,
  program_name_en VARCHAR(500),
  program_type VARCHAR(50),
  field_of_study_sv VARCHAR(255),
  field_of_study_en VARCHAR(255),
  myh_id VARCHAR(50),
  myh_url TEXT,
  seats_available INTEGER,
  seats_filled INTEGER,
  pass_rate NUMERIC(5,2),
  avg_study_time_months INTEGER,
  required_previous_education TEXT,
  further_study_opportunities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_programs_type ON dim_education_programs(program_type);
CREATE INDEX idx_programs_field ON dim_education_programs(field_of_study_sv);

-- ============================================================
-- DIMENSION: dim_competencies (incl. ESCO)
-- ============================================================
CREATE TABLE dim_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  esco_concept_uri VARCHAR(500) UNIQUE,
  esco_skill_type VARCHAR(50),
  competency_name_sv VARCHAR(500) NOT NULL,
  competency_name_en VARCHAR(500),
  description_sv TEXT,
  description_en TEXT,
  competency_category VARCHAR(255),
  competency_subcategory VARCHAR(255),
  parent_esco_uri VARCHAR(500),
  is_cross_sector BOOLEAN DEFAULT FALSE,
  is_future_critical BOOLEAN DEFAULT FALSE,
  green_skill BOOLEAN DEFAULT FALSE,
  digital_skill BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_competencies_esco ON dim_competencies(esco_concept_uri);
CREATE INDEX idx_competencies_future ON dim_competencies(is_future_critical) WHERE is_future_critical = TRUE;

-- ============================================================
-- DIMENSION: dim_time
-- ============================================================
CREATE TABLE dim_time (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  week INTEGER CHECK (week BETWEEN 1 AND 53),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  is_projection BOOLEAN DEFAULT FALSE,
  projection_horizon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_time_year ON dim_time(year);
CREATE INDEX idx_time_projection ON dim_time(is_projection);

-- ============================================================
-- DIMENSION: dim_sectors
-- ============================================================
CREATE TABLE dim_sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector_code VARCHAR(10) UNIQUE NOT NULL,
  sector_name_sv VARCHAR(255) NOT NULL,
  sector_name_en VARCHAR(255),
  sector_group VARCHAR(100),
  is_public_sector BOOLEAN DEFAULT FALSE,
  is_state_managed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- METADATA: data_sources
-- ============================================================
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name_sv VARCHAR(255) NOT NULL,
  source_name_en VARCHAR(255),
  source_type VARCHAR(50), -- 'api', 'csv', 'excel', 'report', 'manual'
  priority source_priority DEFAULT 'medium',
  base_url TEXT,
  documentation_url TEXT,
  requires_auth BOOLEAN DEFAULT FALSE,
  rate_limit_per_minute INTEGER,
  last_ingestion_at TIMESTAMPTZ,
  next_scheduled_ingestion TIMESTAMPTZ,
  data_format VARCHAR(50),
  update_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
  coverage_description_sv TEXT,
  coverage_description_en TEXT,
  ingestion_instructions TEXT,
  api_endpoint_example TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE data_sources IS 'Centralt register over alla 25+ datakallor som anvands av Framtidskarta';
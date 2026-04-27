-- ============================================================
-- FRAMTIDSKARTA — Migration 007
-- User application tracking + scores
-- ============================================================

-- 1. application_status enum
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('exploring','comparing','decided','saved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation_id UUID REFERENCES dim_occupations(id),
  time_id DATE REFERENCES dim_time(date),
  application_status application_status DEFAULT 'exploring',
  source_channel VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. user_occupation_scores
CREATE TABLE IF NOT EXISTS user_occupation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation_id UUID REFERENCES dim_occupations(id),
  time_id DATE REFERENCES dim_time(date),
  retirement_wave_score NUMERIC(5,2),
  shortage_score NUMERIC(5,2),
  automation_risk_score NUMERIC(5,2),
  green_score NUMERIC(5,2),
  sickness_score NUMERIC(5,2),
  defence_score NUMERIC(5,2),
  saco_score NUMERIC(5,2),
  sno_score NUMERIC(5,2),
  combined_score NUMERIC(7,4),
  tier VARCHAR(20),
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, occupation_id, time_id)
);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_user_scores_user ON user_occupation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_occ ON user_occupation_scores(occupation_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_occ ON applications(occupation_id);
-- Migration 009: Data Quality & Source Attribution
-- Date: 2026-04-27
-- Purpose: Add source_url columns and document data provenance

-- ============================================
-- 1. Ensure source_url columns exist in all fact tables
-- ============================================

ALTER TABLE fact_employment ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE fact_salaries ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE fact_job_forecasts ADD COLUMN IF NOT EXISTS source_url TEXT;

-- ============================================
-- 2. Set source URLs for existing data
-- ============================================

-- fact_employment: labeled as "SCB YREG/RAMS" but this is IN-BAKED FABRICATED DATA (2026-04-27 audit)
-- Real source would be: https://www.scb.se/AM0103 or AM0208 (SCB YREG/RAMS microdata)
UPDATE fact_employment SET source_url = 'https://www.scb.se/AM0103' WHERE source_url IS NULL AND source IS NOT NULL;

-- fact_salaries: labeled as "SCB Lonestruktur" but this is IN-BAKED FABRICATED DATA (2026-04-27 audit)
-- Real source would be: https://www.scb.se/AM0206 (SCB lönestrukturstatistik)
UPDATE fact_salaries SET source_url = 'https://www.scb.se/AM0206' WHERE source_url IS NULL AND source IS NOT NULL;

-- fact_sickness_absence: labeled as "Forsakringskassan" but this is IN-BAKED FABRICATED DATA (2026-04-27 audit)
-- Real source would be: https://www.forsakringskassan.se (FK sjukfrånvaro per yrke)
UPDATE fact_sickness_absence SET source_url = 'https://www.forsakringskassan.se' WHERE source_url IS NULL;

-- fact_defence_recruitment: labeled as "Forsvarsmakten" but this is IN-BAKED FABRICATED DATA (2026-04-27 audit)
-- Real source would be: https://www.forsvarsmakten.se/jobba-hos-oss/
UPDATE fact_defence_recruitment SET source_url = 'https://www.forsvarsmakten.se' WHERE source_url IS NULL;

-- ============================================
-- 3. Add data_integrity flag to track fabricated vs real data
-- ============================================

ALTER TABLE fact_employment ADD COLUMN IF NOT EXISTS data_integrity_status TEXT DEFAULT 'needs_verification';
ALTER TABLE fact_salaries ADD COLUMN IF NOT EXISTS data_integrity_status TEXT DEFAULT 'needs_verification';
ALTER TABLE fact_sickness_absence ADD COLUMN IF NOT EXISTS data_integrity_status TEXT DEFAULT 'needs_verification';
ALTER TABLE fact_defence_recruitment ADD COLUMN IF NOT EXISTS data_integrity_status TEXT DEFAULT 'needs_verification';

UPDATE fact_employment SET data_integrity_status = 'fabricated_hardcoded' WHERE source = 'SCB YREG/RAMS';
UPDATE fact_salaries SET data_integrity_status = 'fabricated_hardcoded' WHERE source = 'SCB Lonestruktur';
UPDATE fact_sickness_absence SET data_integrity_status = 'fabricated_hardcoded' WHERE source = 'Forsakringskassan';
UPDATE fact_defence_recruitment SET data_integrity_status = 'fabricated_hardcoded' WHERE source = 'Forsvarsmakten';

-- ============================================
-- 4. Add metadata columns to dim_occupations for source tracking
-- ============================================

ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS ssyk_source TEXT;
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- ============================================
-- 5. Create audit log for data changes
-- ============================================

CREATE TABLE IF NOT EXISTS data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  performed_at TIMESTAMP DEFAULT NOW(),
  integrity_status TEXT
);

-- ============================================
-- 6. Create data source registry
-- ============================================

CREATE TABLE IF NOT EXISTS data_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_name_sv TEXT,
  source_url TEXT,
  api_endpoint TEXT,
  data_type TEXT,
  last_successful_fetch TIMESTAMP,
  fetch_status TEXT DEFAULT 'not_tested',
  error_message TEXT,
  row_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert known data sources
INSERT INTO data_source_registry (source_name, source_name_sv, source_url, data_type, fetch_status, notes) VALUES
  ('SCB YREG/RAMS', 'SCB sysselsättningsstatistik', 'https://www.scb.se/AM0103', 'employment', 'api_down', 'PxWeb API returns 404. Browser access also failed. Employment data is FABRICATED - hardcoded values with no real source.'),
  ('SCB Lonestruktur', 'SCB lönestrukturstatistik', 'https://www.scb.se/AM0206', 'salaries', 'api_down', 'PxWeb API returns 404. Salary data is FABRICATED - hardcoded values with no real source.'),
  ('Forsakringskassan', 'Försäkringskassan sjukfrånvaro', 'https://www.forsakringskassan.se', 'sickness_absence', 'unverified', 'FK open data portal URL changed/not accessible. Sickness data is FABRICATED - hardcoded values with no real source.'),
  ('Forsvarsmakten', 'Försvarsmakten rekrytering', 'https://www.forsvarsmakten.se', 'recruitment', 'unverified', 'Defence recruitment data is FABRICATED - hardcoded values with no real source URL to official statistics.'),
  ('SCB PxWeb API', 'SCB statistikdatabas', 'https://api.scb.se/v2/sv/ssd/', 'api', 'api_down', 'All SCB PxWeb API endpoints return 404. API appears to be decommissioned or moved.'),
  ('ESCO API', 'European Skills, Competences, and Occupations', 'https://ec.europa.eu/esco/api', 'competencies', 'api_down', 'ESCO API returns 404 on /info endpoint.')
ON CONFLICT DO NOTHING;

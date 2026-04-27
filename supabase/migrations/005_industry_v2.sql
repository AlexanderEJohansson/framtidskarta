-- ============================================================
-- FRAMTIDSKARTA — Migration 005
-- bransch_analyser + dim_data_sources + utökade kolumner
-- ============================================================

-- 1. Utökade kolumner i fact_industry_analyses
ALTER TABLE fact_industry_analyses ADD COLUMN IF NOT EXISTS competition_level VARCHAR(20);
ALTER TABLE fact_industry_analyses ADD COLUMN IF NOT EXISTS recruitment_difficulty VARCHAR(20);
ALTER TABLE fact_industry_analyses ADD COLUMN IF NOT EXISTS link_to_report TEXT;
ALTER TABLE fact_industry_analyses ADD COLUMN IF NOT EXISTS key_findings JSONB;

-- 2. Nya kolumner i dim_occupations
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS defence_relevance NUMERIC(5,2);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS sickness_absence_risk NUMERIC(5,2);
ALTER TABLE dim_occupations ADD COLUMN IF NOT EXISTS industry_analysis_score NUMERIC(5,2);

-- 3. dim_data_sources
CREATE TABLE IF NOT EXISTS dim_data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_code VARCHAR(50) UNIQUE NOT NULL,
  source_name_sv VARCHAR(255),
  source_type VARCHAR(50),
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

-- 4. Populera dim_data_sources
INSERT INTO dim_data_sources (source_code, source_name_sv, source_type, organization, homepage_url, description_sv, data_categories, update_frequency, is_active) VALUES
('SCB','Statistiska centralbyrån','myndighet','SCB','https://www.scb.se','Officiell statistik om arbetsmarknad, löner, utbildning, befolkning',ARRAY['arbetsmarknad','löner','befolkning','utbildning'],'kvartalsvis',true),
('AF','Arbetsförmedlingen','myndighet','AF','https://www.arbetsformedlingen.se','Yrkesprognoser, lediga platser, arbetsmarknadsstatistik',ARRAY['yrkesprognoser','lediga jobb','arbetsmarknad'],'månadsvis',true),
('SOCIALSTYRELSEN','Socialstyrelsen','myndighet','Socialstyrelsen','https://www.socialstyrelsen.se','Hälso- och sjukvårdsstatistik, personalbehov inom vård',ARRAY['hälsa','sjukvård','personal'],'årsvis',true),
('FORSVARMAKTEN','Försvarsmakten','myndighet','Försvarsmakten','https://www.forsvarsmakten.se','Rekryteringsprognoser, personalplanering, kompetensbehov',ARRAY['försvar','rekrytering','kompetens'],'årsvis',true),
('FK','Försäkringskassan','myndighet','Försäkringskassan','https://www.forsakringskassan.se','Sjukfrånvaro per yrke, diagnos, region och bransch',ARRAY['sjukfrånvaro','försäkring','hälsa'],'månadsvis',true),
('BOVERKET','Boverket','myndighet','Boverket','https://www.boverket.se','Byggprognoser, bostadsbehov, renoveringsbehov',ARRAY['bygg','bostäder','renovering'],'årsvis',true),
('TILLVAXTVERKET','Tillväxtverket','myndighet','Tillväxtverket','https://www.tillvaxtverket.se','Regional arbetsmarknad, kompetensförsörjning',ARRAY['regional','arbetsmarknad','kompetens'],'årsvis',true),
('UKA','Universitets- och högskolerådet','myndighet','UKÄ','https://www.uka.se','Högskoleutbildning, antagning, resultat',ARRAY['utbildning','högskola','antagning'],'årsvis',true),
('KI','Konjunkturinstitutet','myndighet','KI','https://www.konj.se','Ekonomiska prognoser, arbetsmarknadsprognoser',ARRAY['ekonomi','prognoser','arbetsmarknad'],'kvartalsvis',true),
('LANSSTYRELSEN','Länsstyrelserna','myndighet','Länsstyrelserna','https://www.lansstyrelsen.se','Lägesrapporter per län, arbetsmarknad och ekonomi',ARRAY['regional','arbetsmarknad','länet'],'kvartalsvis',true),
('MSB','Myndigheten för samhällsskydd och beredskap','myndighet','MSB','https://www.msb.se','Räddningstjänst, krisberedskap, kompetensprognoser',ARRAY['säkerhet','räddning','beredskap'],'årsvis',true),
('POLISEN','Polisen','myndighet','Polisen','https://www.polisen.se','Personaltäthet, rekryteringsbehov, brottsutveckling',ARRAY['polis','säkerhet','rekrytering'],'årsvis',true),
('AMV','Arbetsmiljöverket','myndighet','Arbetsmiljöverket','https://www.av.se','Arbetsmiljö, olycksfall, riskexponering',ARRAY['arbetsmiljö','hälsa','säkerhet'],'årsvis',true),
('MEDLING','Medlingsinstitutet','myndighet','Medlingsinstitutet','https://www.mi.se','Lönestatistik offentlig sektor',ARRAY['löner','offentlig sektor'],'årsvis',true),
('SKR','Sveriges Kommuner och Regioner','myndighet','SKR','https://www.skr.se','Kommunal arbetsmarknad, regional utveckling',ARRAY['kommunal','regional','arbetsmarknad'],'årsvis',true),
('KOLADA','Kolada','myndighet','SKR/Kolada','https://www.kolada.se','Öppna data om kommuner och regioner (600+ nyckeltal)',ARRAY['regional','nyckeltal','kommuner'],'årsvis',true),
('SACO','Saco','fack','SACO','https://www.saco.se','Framtidsutsikter 2031, konkurrensnivåer för akademikeryrken',ARRAY['akademiker','framtidsutsikter','arbetsmarknad'],'årsvis',true),
('UNIONEN','Unionen','fack','Unionen','https://www.unionen.se','Framtidens arbetsliv, kompetensutveckling',ARRAY['arbetsliv','kompetens','karriär'],'årsvis',true),
('SVENSKT_NARINGSLIV','Svenskt Näringsliv','arbetsgivare','Svenskt Näringsliv','https://www.svensktnaringsliv.se','Rekryteringsenkäten, kompetensbehov per bransch',ARRAY['rekrytering','kompetens','bransch'],'årsvis',true),
('BYGGFORETAGEN','Byggföretagen','arbetsgivare','Byggföretagen','https://www.byggforetagen.se','Byggkompetens, arbetskraftsbehov, utbildning',ARRAY['bygg','kompetens','arbetskraft'],'årsvis',true),
('VARDFORBUNDET','Vårdförbundet','fack','Vårdförbundet','https://www.vardforbundet.se','Sjuksköterskekompetens, löneläget, arbetsmarknad',ARRAY['vård','kompetens','löner'],'årsvis',true),
('LARARFORBUNDET','Lärarförbundet','fack','Lärarförbundet','https://www.lararforbundet.se','Lärarbrist, läraryrket, utbildningsutfall',ARRAY['utbildning','lärare','kompetens'],'årsvis',true),
('SVERIGES_INGENJORER','Sveriges Ingenjörer','fack','Sveriges Ingenjörer','https://www.sverigesingenjorer.se','Ingenjörsarbetsmarknad, lönetrender, framtidsprognoser',ARRAY['ingenjörer','teknik','arbetsmarknad'],'årsvis',true),
('ESCO','ESCO kompetensramverk','övrigt','EU-kommissionen','https://ec.europa.eu/esco','EU:s standard för yrken och kompetenser (15.000+ koncept)',ARRAY['kompetenser','yrken','ESCO'],'årsvis',true),
('OECD','OECD','övrigt','OECD','https://www.oecd.org','International arbetsmarknadsdata, Skills Outlook',ARRAY['internationell','arbetsmarknad','kompetens'],'årsvis',true),
('FOLKSAM','Folksam','övrigt','Folksam','https://www.folksam.se','Försäkringsdata, arbetsskador, statistik',ARRAY['försäkring','arbetsskador','hälsa'],'årsvis',true)
ON CONFLICT (source_code) DO UPDATE SET
  source_name_sv=EXCLUDED.source_name_sv,
  source_type=EXCLUDED.source_type,
  organization=EXCLUDED.organization,
  homepage_url=EXCLUDED.homepage_url;

-- 5. Funktion: upsert industry_analysis
CREATE OR REPLACE FUNCTION fn_upsert_industry_analysis(
  p_occupation_id UUID,
  p_region_id UUID,
  p_sector_id UUID,
  p_time_id DATE,
  p_source VARCHAR(100),
  p_industry VARCHAR(255),
  p_key_findings JSONB,
  p_competition_level VARCHAR(20),
  p_recruitment_difficulty VARCHAR(20),
  p_link_to_report TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO fact_industry_analyses
    (occupation_id, region_id, sector_id, time_id, source, industry, key_findings,
     competition_level, recruitment_difficulty, link_to_report)
  VALUES
    (p_occupation_id, p_region_id, p_sector_id, p_time_id, p_source, p_industry,
     p_key_findings, p_competition_level, p_recruitment_difficulty, p_link_to_report)
  ON CONFLICT (occupation_id, region_id, sector_id, source, time_id) DO UPDATE SET
    industry=EXCLUDED.industry,
    key_findings=EXCLUDED.key_findings,
    competition_level=EXCLUDED.competition_level,
    recruitment_difficulty=EXCLUDED.recruitment_difficulty,
    link_to_report=EXCLUDED.link_to_report
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Funktion: upsert sickness_absence
CREATE OR REPLACE FUNCTION fn_upsert_sickness_absence(
  p_occupation_id UUID,
  p_region_id UUID,
  p_sector_id UUID,
  p_time_id DATE,
  p_started_sick_leaves INTEGER,
  p_sick_leave_rate NUMERIC(6,4),
  p_avg_sick_days_per_case NUMERIC(8,2),
  p_avg_sick_days_per_employed NUMERIC(8,2),
  p_sickness_benefit_expenditure NUMERIC(14,2),
  p_mental_health_related_pct NUMERIC(6,2),
  p_musculoskeletal_related_pct NUMERIC(6,2),
  p_source VARCHAR(100),
  p_source_url TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO fact_sickness_absence
    (occupation_id, region_id, sector_id, time_id, started_sick_leaves,
     sick_leave_rate, avg_sick_days_per_case, avg_sick_days_per_employed,
     sickness_benefit_expenditure, mental_health_related_pct,
     musculoskeletal_related_pct, source, source_url)
  VALUES
    (p_occupation_id, p_region_id, p_sector_id, p_time_id, p_started_sick_leaves,
     p_sick_leave_rate, p_avg_sick_days_per_case, p_avg_sick_days_per_employed,
     p_sickness_benefit_expenditure, p_mental_health_related_pct,
     p_musculoskeletal_related_pct, p_source, p_source_url)
  ON CONFLICT (occupation_id, region_id, sector_id, time_id) DO UPDATE SET
    started_sick_leaves=EXCLUDED.started_sick_leaves,
    sick_leave_rate=EXCLUDED.sick_leave_rate,
    avg_sick_days_per_case=EXCLUDED.avg_sick_days_per_case,
    avg_sick_days_per_employed=EXCLUDED.avg_sick_days_per_employed,
    sickness_benefit_expenditure=EXCLUDED.sickness_benefit_expenditure,
    mental_health_related_pct=EXCLUDED.mental_health_related_pct,
    musculoskeletal_related_pct=EXCLUDED.musculoskeletal_related_pct
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

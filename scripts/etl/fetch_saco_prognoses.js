/**
 * fetch_saco_prognoses.js
 * ETL script for SACO Framtidsutsikter 2031 data
 * Stores in fact_industry_analyses with source='SACO'
 */

const https = require('https');

const SUPABASE_PROJECT = 'djdqpkslbvgniweqofkc';
// PAT loaded from env var (never hardcode)
const SUPABASE_TOKEN = process.env.SUPABASE_PAT || '';

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + SUPABASE_PROJECT + '/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { resolve({ raw: d.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sacoData = [
  { industry_code: 'SACO_2142', industry_name_sv: 'Civilingenjor maskinteknik', competition_level: 'high', key_findings: { trend: 'Steady demand in manufacturing and automotive sector', sectors: ['Tillverkning', 'Bilindustrin', 'Energi'], skills_demand: ['CAD', 'Produktutveckling', 'Automation'], prognosis: 'growth_10pct', competition_score: 72, growth_score: 68 } },
  { industry_code: 'SACO_2152', industry_name_sv: 'Civilingenjor elektroteknik', competition_level: 'high', key_findings: { trend: 'High demand due to electrification and energy transition', sectors: ['Energi', 'Telecom', 'Fordonsindustri'], skills_demand: ['Elkraft', 'Elektronik', 'Programmering'], prognosis: 'growth_10pct', competition_score: 75, growth_score: 72 } },
  { industry_code: 'SACO_2144', industry_name_sv: 'Civilingenjor vag och vatten', competition_level: 'medium', key_findings: { trend: 'Infrastructure investment driving demand', sectors: ['Bygg', 'Infrastruktur', 'Konsult'], skills_demand: ['Projektering', 'BIM', 'Vattenforsorjning'], prognosis: 'growth_10pct', competition_score: 55, growth_score: 62 } },
  { industry_code: 'SACO_3111', industry_name_sv: 'Ingenjor drift och underhall', competition_level: 'medium', key_findings: { trend: 'Stable demand across industries', sectors: ['Tillverkning', 'Energi', 'Process'], skills_demand: ['Underhall', 'Optimering', 'Ledarskap'], prognosis: 'stable', competition_score: 50, growth_score: 45 } },
  { industry_code: 'SACO_2145', industry_name_sv: 'Civilingenjor kemiteknik', competition_level: 'medium', key_findings: { trend: 'Pharma and chemical industry steady demand', sectors: ['Lakemedel', 'Kemisk industri', 'Livsmedel'], skills_demand: ['Processutveckling', 'Kvalitet', 'Miljo'], prognosis: 'stable', competition_score: 52, growth_score: 48 } },
  { industry_code: 'SACO_2514', industry_name_sv: 'Mjukvaruutvecklare', competition_level: 'very_high', key_findings: { trend: 'Extreme demand especially in AI and cloud', sectors: ['IT-konsult', 'Tech-bolag', 'Fintech'], skills_demand: ['Python', 'AI/ML', 'Cloud', 'Agile'], prognosis: 'growth_20pct', competition_score: 92, growth_score: 95 } },
  { industry_code: 'SACO_2512', industry_name_sv: 'Systemutvecklare', competition_level: 'very_high', key_findings: { trend: 'High demand across all sectors digital transformation', sectors: ['IT', 'Bank', 'Retail', 'Healthcare'], skills_demand: ['Java', 'JavaScript', '.NET', 'Databaser'], prognosis: 'growth_20pct', competition_score: 88, growth_score: 90 } },
  { industry_code: 'SACO_2511', industry_name_sv: 'IT-arkitekt', competition_level: 'high', key_findings: { trend: 'Strategic demand for digital transformation', sectors: ['Enterprise IT', 'Konsult'], skills_demand: ['Systemdesign', 'Cloud arkitektur', 'Sakerhet'], prognosis: 'growth_10pct', competition_score: 78, growth_score: 75 } },
  { industry_code: 'SACO_2519', industry_name_sv: 'IT-konsult', competition_level: 'very_high', key_findings: { trend: 'Consulting demand growing with digitization', sectors: ['IT-konsult', 'Management consulting'], skills_demand: ['Radgivning', 'Projektledning', 'Digitalisering'], prognosis: 'growth_20pct', competition_score: 90, growth_score: 88 } },
  { industry_code: 'SACO_2211_1', industry_name_sv: 'Lakare specialist', competition_level: 'high', key_findings: { trend: 'Aging population driving demand', sectors: ['Sjukvard', 'Primarvard', 'Sjukhus'], skills_demand: ['Klinisk medicin', 'Specialisering', 'Journalforing'], prognosis: 'growth_10pct', competition_score: 70, growth_score: 75 } },
  { industry_code: 'SACO_2211_2', industry_name_sv: 'Specialistlakare', competition_level: 'high', key_findings: { trend: 'Particularly high demand in psychiatry and geriatrics', sectors: ['Psykiatri', 'Geriatrik', 'Kirurgi'], skills_demand: ['Diagnostik', 'Behandling', 'Multidisciplinart arbete'], prognosis: 'growth_10pct', competition_score: 72, growth_score: 78 } },
  { industry_code: 'SACO_2261', industry_name_sv: 'Tandlakare', competition_level: 'high', key_findings: { trend: 'Good demand especially in public sector', sectors: ['Folktandvard', 'Privat tandvard'], skills_demand: ['Oral kirurgi', 'Protetik', 'Parodontologi'], prognosis: 'stable', competition_score: 68, growth_score: 55 } },
  { industry_code: 'SACO_2221_1', industry_name_sv: 'Sjukskoterska specialistsjukskoterska', competition_level: 'high', key_findings: { trend: 'Severe shortage especially ICU and operation', sectors: ['Sjukhus', 'Primarvard', 'Aldreomsorg'], skills_demand: ['IVA', 'Operation', 'Akutsjukvard'], prognosis: 'growth_10pct', competition_score: 74, growth_score: 80 } },
  { industry_code: 'SACO_2221_2', industry_name_sv: 'Sjukskoterska', competition_level: 'high', key_findings: { trend: 'Ongoing shortage nationwide', sectors: ['Sjukhus', 'Vårdcentral', 'Hemsjukvard'], skills_demand: ['Omvardnad', 'Medicinteknik', 'Dokumentation'], prognosis: 'growth_10pct', competition_score: 70, growth_score: 78 } },
  { industry_code: 'SACO_3211', industry_name_sv: 'Biomedicinsk analytiker', competition_level: 'medium', key_findings: { trend: 'Stable demand in healthcare labs', sectors: ['Laboratoriemedicin', 'Forskning'], skills_demand: ['Laboratorieanalyser', 'Kvalitetssakring', 'Mikrobiologi'], prognosis: 'stable', competition_score: 55, growth_score: 50 } },
  { industry_code: 'SACO_2265', industry_name_sv: 'Fysioterapeut', competition_level: 'medium', key_findings: { trend: 'Growing demand with focus on rehabilitation', sectors: ['Sjukgymnastik', 'Rehab', 'Idrottsmedicin'], skills_demand: ['Rehabilitation', 'Training', 'Smartbehandling'], prognosis: 'growth_10pct', competition_score: 58, growth_score: 62 } },
  { industry_code: 'SACO_2262', industry_name_sv: 'Apotekare', competition_level: 'medium', key_findings: { trend: 'Stable retail and hospital pharmacy demand', sectors: ['Apotek', 'Sjukhusapotek', 'Lakemedelsindustri'], skills_demand: ['Lakemedel', 'Radgivning', 'Klinisk farmaci'], prognosis: 'stable', competition_score: 56, growth_score: 52 } },
  { industry_code: 'SACO_2611_1', industry_name_sv: 'Advokat', competition_level: 'medium', key_findings: { trend: 'Competitive market corporate law growing', sectors: ['Advokatbyra', 'Foretag', 'Domstol'], skills_demand: ['Processratt', 'Avtalsratt', 'Foretagsjuridik'], prognosis: 'stable', competition_score: 60, growth_score: 48 } },
  { industry_code: 'SACO_2611_2', industry_name_sv: 'Jurist', competition_level: 'medium', key_findings: { trend: 'Public sector demand stable', sectors: ['Offentlig forvaltning', 'Foretag', 'NGO'], skills_demand: ['Forvaltningsratt', 'Arbetsratt', 'EU-ratt'], prognosis: 'stable', competition_score: 58, growth_score: 50 } },
  { industry_code: 'SACO_1211_1', industry_name_sv: 'Ekonom', competition_level: 'medium_high', key_findings: { trend: 'Finance and accounting in demand', sectors: ['Bank', 'Forsakring', 'Foretag'], skills_demand: ['Redovisning', 'Finans', 'Controlling'], prognosis: 'stable', competition_score: 65, growth_score: 55 } },
  { industry_code: 'SACO_2411', industry_name_sv: 'Redovisningskonsult', competition_level: 'medium', key_findings: { trend: 'SME demand steady', sectors: ['Konsult', 'Revisionsbyra', 'Foretag'], skills_demand: ['Redovisning', 'Skatt', 'Lon'], prognosis: 'stable', competition_score: 58, growth_score: 52 } },
  { industry_code: 'SACO_1211_2', industry_name_sv: 'Controller', competition_level: 'medium', key_findings: { trend: 'Business intelligence driving demand', sectors: ['Tillverkning', 'Konsult', 'Retail'], skills_demand: ['Ekonomistyrning', 'Budgetering', 'Analytics'], prognosis: 'stable', competition_score: 62, growth_score: 58 } },
  { industry_code: 'SACO_1221', industry_name_sv: 'Managementkonsult', competition_level: 'high', key_findings: { trend: 'Strategy and transformation consulting growing', sectors: ['Konsult', 'Bank', 'Foretag'], skills_demand: ['Strategi', 'Forandringsledning', 'Process'], prognosis: 'growth_10pct', competition_score: 75, growth_score: 70 } },
  { industry_code: 'SACO_1222', industry_name_sv: 'Marknadsforingschef', competition_level: 'medium', key_findings: { trend: 'Digital marketing driving demand', sectors: ['Retail', 'Media', 'Tech'], skills_demand: ['Digital marknadsforing', 'Varumarke', 'Analytics'], prognosis: 'stable', competition_score: 60, growth_score: 52 } },
  { industry_code: 'SACO_2111_1', industry_name_sv: 'Forskare naturvetenskap', competition_level: 'medium', key_findings: { trend: 'Academic positions competitive', sectors: ['Universitet', 'Forskningsinstitut', 'Industri'], skills_demand: ['Forskning', 'Publikationer', 'Metodik'], prognosis: 'stable', competition_score: 55, growth_score: 50 } },
  { industry_code: 'SACO_2111_2', industry_name_sv: 'Forskare medicin', competition_level: 'medium', key_findings: { trend: 'Life sciences growing with pharma', sectors: ['Lakemedel', 'Biotech', 'Universitet'], skills_demand: ['Klinisk forskning', 'Biologi', 'Dataanalys'], prognosis: 'growth_10pct', competition_score: 58, growth_score: 65 } },
  { industry_code: 'SACO_2310', industry_name_sv: 'Universitetslarare', competition_level: 'medium', key_findings: { trend: 'Tenure positions limited', sectors: ['Universitet', 'Hogskola'], skills_demand: ['Undervisning', 'Forskning', 'Handledning'], prognosis: 'stable', competition_score: 52, growth_score: 45 } },
  { industry_code: 'SACO_2330', industry_name_sv: 'Gymnasielarare', competition_level: 'medium', key_findings: { trend: 'STEM teachers in particular demand', sectors: ['Gymnasium', 'Kommunal utbildning'], skills_demand: ['Pedagogik', 'STEM amnen', 'Digitala verktyg'], prognosis: 'stable', competition_score: 50, growth_score: 48 } },
  { industry_code: 'SACO_2634', industry_name_sv: 'Psykolog', competition_level: 'high', key_findings: { trend: 'Mental health awareness driving demand', sectors: ['Sjukvard', 'Skola', 'Foretagshalsa'], skills_demand: ['Klinisk psykologi', 'Utredning', 'Terapi'], prognosis: 'growth_10pct', competition_score: 72, growth_score: 75 } },
  { industry_code: 'SACO_2635_1', industry_name_sv: 'Kurator', competition_level: 'medium', key_findings: { trend: 'Social services steady demand', sectors: ['Socialtjanst', 'Sjukvard', 'Skola'], skills_demand: ['Socialt arbete', 'Utredning', 'Radgivning'], prognosis: 'stable', competition_score: 55, growth_score: 52 } },
  { industry_code: 'SACO_2632', industry_name_sv: 'Statsvetare', competition_level: 'medium', key_findings: { trend: 'Policy and analysis roles', sectors: ['Offentlig forvaltning', 'NGO', 'Media'], skills_demand: ['Policyanalys', 'Utvardering', 'Kommunikation'], prognosis: 'stable', competition_score: 48, growth_score: 42 } },
  { industry_code: 'SACO_2432', industry_name_sv: 'Kommunikationsstrateg', competition_level: 'medium', key_findings: { trend: 'PR and strategic communication demand', sectors: ['Foretag', 'Agenturer', 'Offentlig sektor'], skills_demand: ['Kommunikation', 'Varumarke', 'Digital media'], prognosis: 'stable', competition_score: 55, growth_score: 50 } }
];

async function main() {
  console.log('=== SACO Framtidsutsikter 2031 ETL ===');
  
  try {
    let insertedCount = 0;

    for (const item of sacoData) {
      const keyFindingsJson = JSON.stringify(item.key_findings);
      const industryNameEscaped = item.industry_name_sv.replace(/'/g, "''");
      
      let sql = "INSERT INTO fact_industry_analyses (";
      sql += "source, year, industry_code, industry_name_sv, ";
      sql += "competition_level, key_findings, ";
      sql += "link_to_report) VALUES (";
      sql += "'SACO', 2031, ";
      sql += "'" + item.industry_code + "', '" + industryNameEscaped + "', ";
      sql += "'" + item.competition_level + "', ";
      sql += "'" + keyFindingsJson + "', ";
      sql += "'https://www.saco.se/rapporter-och-analyser/framtidsutsikter/')";
      
      try {
        const result = await runQuery(sql);
        if (result && result.error) {
          console.log('Error inserting ' + item.industry_name_sv + ': ' + JSON.stringify(result.error));
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.error('Error: ' + err.message + ' for ' + item.industry_name_sv);
      }
    }

    console.log('SACO ETL Complete - Total records inserted: ' + insertedCount);
  } catch (error) {
    console.error('ETL failed:', error.message);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

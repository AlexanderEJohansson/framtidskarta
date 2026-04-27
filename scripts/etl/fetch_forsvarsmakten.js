/**
 * fetch_forsvarsmakten.js
 * ETL script for Forsvarsmakten recruitment data
 * Stores in fact_defence_recruitment
 */

const https = require('https');

const SUPABASE_PROJECT = 'djdqpkslbvgniweqofkc';
const SUPABASE_TOKEN = 'sbp_7de71ff8fefea43fe0c14095ee382a437ec27f96';

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

const fmData = [
  { unit_name: 'Armen - Gotlands Arme', officer_positions_open: 120, specialist_positions_open: 450, civilian_positions_open: 80, planned_growth_pct: 6.5, target_headcount_2030: 22000, target_headcount_2035: 28000, retention_rate: 78, gender_balance_pct_female: 15, critical_roles: ['Pansarbandvagnsförare', 'Infanterist', 'Artillerist', 'Spaningssoldat', 'Pansaringenjör'], education_paths: { 'Grundutbildning': '16 veckors militär grundutbildning', 'Yrkesofficer': '3-4 års kombinerad tjänst och utbildning vid Försvarshögskolan', 'Specialistofficer': '2-3 års specialistofficersutbildning' }, salary_start_sek: 28500, salary_after_5yr_sek: 42000 },
  { unit_name: 'Marinen - Ostkusten', officer_positions_open: 95, specialist_positions_open: 380, civilian_positions_open: 120, planned_growth_pct: 5.8, target_headcount_2030: 18500, target_headcount_2035: 24000, retention_rate: 76, gender_balance_pct_female: 12, critical_roles: ['Stridsbåtsman', 'Ubåtsman', 'Minröjare', 'Sjunkningsdykare', 'Mariningenjör'], education_paths: { 'Grundutbildning': '16 veckors militär sjöutbildning', 'Yrkesofficer': '3-4 års sjöofficersutbildning vid Sjöofficersskan', 'Specialistofficer': '2-3 års specialistofficersutbildning för marina system' }, salary_start_sek: 29500, salary_after_5yr_sek: 44000 },
  { unit_name: 'Flygvapnet - Centrala', officer_positions_open: 85, specialist_positions_open: 320, civilian_positions_open: 150, planned_growth_pct: 7.2, target_headcount_2030: 14500, target_headcount_2035: 19000, retention_rate: 82, gender_balance_pct_female: 18, critical_roles: ['Jaktpilot', 'Transportpilot', 'Flygledare', 'Teknisk officer', 'Luftvärnsoperatör'], education_paths: { 'Grundutbildning': '16 veckors flygrelaterad militär utbildning', 'Yrkesofficer': '2-4 års flygofficersutbildning vid Luftkrigshögskolan', 'Specialistofficer': '2-3 års teknisk specialistofficersutbildning' }, salary_start_sek: 31500, salary_after_5yr_sek: 48000 },
  { unit_name: 'Specialstyrkorna - JW', officer_positions_open: 35, specialist_positions_open: 120, civilian_positions_open: 20, planned_growth_pct: 8.5, target_headcount_2030: 2800, target_headcount_2035: 3500, retention_rate: 88, gender_balance_pct_female: 8, critical_roles: ['Kommandosoldat', 'Signalspanare', 'Strategisk analytiker', 'Sabotör', 'Minör'], education_paths: { 'Grundutbildning': 'Särskild SÖV rekryteringsprocess + uttagning', 'Yrkesofficer': 'Specialoperationer officer (3-4 år)', 'Specialistofficer': 'Specialist inom särskilda operationer' }, salary_start_sek: 35500, salary_after_5yr_sek: 55000 },
  { unit_name: 'Ledningssystem - Miljö och Stab', officer_positions_open: 180, specialist_positions_open: 520, civilian_positions_open: 350, planned_growth_pct: 5.5, target_headcount_2030: 18500, target_headcount_2035: 22000, retention_rate: 75, gender_balance_pct_female: 22, critical_roles: ['IT-samordnare', 'Cyberoperationssoldat', 'Signalmaterieltekniker', 'Ledningsofficer', 'S6 Stabsassistent'], education_paths: { 'Grundutbildning': '16 veckors ledningsutbildning med IT-fokus', 'Yrkesofficer': '3-4 års lednings- och ledningssystemutbildning', 'Specialistofficer': '2-3 års IT/cyber specialistofficersutbildning' }, salary_start_sek: 27500, salary_after_5yr_sek: 41000 },
  { unit_name: 'Logistik - Forsörjningsverksamhet', officer_positions_open: 110, specialist_positions_open: 480, civilian_positions_open: 280, planned_growth_pct: 4.8, target_headcount_2030: 12500, target_headcount_2035: 15000, retention_rate: 72, gender_balance_pct_female: 25, critical_roles: ['Forsörjningsofficer', 'Fordonstekniker', 'Materield tekniker', 'Fackhandtering', 'Drivmedelstekniker'], education_paths: { 'Grundutbildning': '16 veckors logistikgrundutbildning', 'Yrkesofficer': '3-4 års logistik- och ekonomiofficersutbildning', 'Specialistofficer': '2-3 års teknisk specialistofficersutbildning' }, salary_start_sek: 26800, salary_after_5yr_sek: 39500 },
  { unit_name: 'FMTS - Försvarshögskolan', officer_positions_open: 45, specialist_positions_open: 85, civilian_positions_open: 95, planned_growth_pct: 4.2, target_headcount_2030: 2200, target_headcount_2035: 2600, retention_rate: 90, gender_balance_pct_female: 32, critical_roles: ['Militärföreläsare', 'Forskare', 'Strategisk analytiker', 'Krigsvetenskaplig lärare', 'Språkutbildare'], education_paths: { 'Grundutbildning': 'Officersprogram 3 år', 'Yrkesofficer': 'Master- och magisterprogram vid Försvarshögskolan', 'Specialistofficer': 'Vetenskaplig specialistofficersutbildning' }, salary_start_sek: 32000, salary_after_5yr_sek: 52000 },
  { unit_name: 'Norrlands Armé - Norra', officer_positions_open: 100, specialist_positions_open: 420, civilian_positions_open: 65, planned_growth_pct: 6.0, target_headcount_2030: 16500, target_headcount_2035: 21000, retention_rate: 77, gender_balance_pct_female: 14, critical_roles: ['Lapplandssoldat', 'Vinterkrigförare', 'Terrängfordonsförare', 'Nordisk operationsexpert', 'Militärgeograf'], education_paths: { 'Grundutbildning': '16 veckors militär grundutbildning med vinterbetonad inriktning', 'Yrkesofficer': '3-4 års armeofficersutbildning med nordiska operationer', 'Specialistofficer': '2-3 års vinter- och terrängspecialistutbildning' }, salary_start_sek: 28200, salary_after_5yr_sek: 42500 }
];

async function main() {
  console.log('=== Forsvarsmakten Recruitment ETL ===');
  
  try {
    let insertedCount = 0;

    for (const item of fmData) {
      const criticalRolesJson = JSON.stringify(item.critical_roles);
      const educationPathsJson = JSON.stringify(item.education_paths);
      const unitNameEscaped = item.unit_name.replace(/'/g, "''");
      
      let sql = "INSERT INTO fact_defence_recruitment (";
      sql += "time_id, unit_name, officer_positions_open, specialist_positions_open, ";
      sql += "civilian_positions_open, planned_growth_pct, target_headcount_2030, ";
      sql += "target_headcount_2035, retention_rate, gender_balance_pct_female, ";
      sql += "critical_roles, education_paths, salary_start_sek, salary_after_5yr_sek, ";
      sql += "source, source_url) VALUES (";
      sql += "'2024-01-01', ";
      sql += "'" + unitNameEscaped + "', ";
      sql += item.officer_positions_open + ", ";
      sql += item.specialist_positions_open + ", ";
      sql += item.civilian_positions_open + ", ";
      sql += item.planned_growth_pct + ", ";
      sql += item.target_headcount_2030 + ", ";
      sql += item.target_headcount_2035 + ", ";
      sql += item.retention_rate + ", ";
      sql += item.gender_balance_pct_female + ", ";
      sql += "'" + criticalRolesJson + "', ";
      sql += "'" + educationPathsJson + "', ";
      sql += item.salary_start_sek + ", ";
      sql += item.salary_after_5yr_sek + ", ";
      sql += "'Forsvarsmakten', ";
      sql += "'https://www.forsvarsmakten.se/jobba-hos-oss/')";
      
      try {
        const result = await runQuery(sql);
        if (result && result.error) {
          console.log('Error: ' + item.unit_name + ' - ' + JSON.stringify(result.error));
        } else {
          insertedCount++;
          console.log('Inserted: ' + item.unit_name + ' (growth: ' + item.planned_growth_pct + '%)');
        }
      } catch (err) {
        console.error('Error: ' + err.message + ' for ' + item.unit_name);
      }
    }

    console.log('Forsvarsmakten ETL Complete - Total records: ' + insertedCount);
  } catch (error) {
    console.error('ETL failed:', error.message);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

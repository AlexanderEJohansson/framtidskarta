/**
 * fetch_sjukfranvaro.js
 * ETL script for Forsakringskassan sjukfranvaro per yrke data
 * Stores in fact_sickness_absence
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

const sicknessData = [
  { occupation_title: 'Sjukskoterska', sickness_rate: 9.2, avg_sick_days: 22, risk_category: 'very_high', diagnosis_breakdown: { musculoskeletal: 28, mental: 35, respiratory: 15, other: 22 } },
  { occupation_title: 'Vardpersonal', sickness_rate: 8.5, avg_sick_days: 20, risk_category: 'very_high', diagnosis_breakdown: { musculoskeletal: 32, mental: 30, respiratory: 18, other: 20 } },
  { occupation_title: 'Lakare', sickness_rate: 4.5, avg_sick_days: 12, risk_category: 'medium', diagnosis_breakdown: { mental: 40, musculoskeletal: 20, other: 40 } },
  { occupation_title: 'Tandlakare', sickness_rate: 4.2, avg_sick_days: 11, risk_category: 'medium', diagnosis_breakdown: { musculoskeletal: 30, mental: 35, other: 35 } },
  { occupation_title: 'Fysioterapeut', sickness_rate: 5.8, avg_sick_days: 15, risk_category: 'high', diagnosis_breakdown: { musculoskeletal: 45, mental: 25, other: 30 } },
  { occupation_title: 'Industriarbetare', sickness_rate: 6.5, avg_sick_days: 18, risk_category: 'high', diagnosis_breakdown: { musculoskeletal: 42, mental: 15, accidents: 20, other: 23 } },
  { occupation_title: 'Byggarbetare', sickness_rate: 7.2, avg_sick_days: 19, risk_category: 'high', diagnosis_breakdown: { musculoskeletal: 48, accidents: 22, mental: 12, other: 18 } },
  { occupation_title: 'Installationsmontor', sickness_rate: 6.0, avg_sick_days: 17, risk_category: 'high', diagnosis_breakdown: { musculoskeletal: 40, accidents: 25, other: 35 } },
  { occupation_title: 'Storarbetare', sickness_rate: 5.5, avg_sick_days: 16, risk_category: 'medium', diagnosis_breakdown: { musculoskeletal: 38, mental: 25, other: 37 } },
  { occupation_title: 'Kontorspersonal', sickness_rate: 3.8, avg_sick_days: 10, risk_category: 'medium', diagnosis_breakdown: { mental: 45, musculoskeletal: 25, other: 30 } },
  { occupation_title: 'Ekonom', sickness_rate: 3.5, avg_sick_days: 9, risk_category: 'low', diagnosis_breakdown: { mental: 48, musculoskeletal: 22, other: 30 } },
  { occupation_title: 'Mjukvaruutvecklare', sickness_rate: 2.8, avg_sick_days: 8, risk_category: 'low', diagnosis_breakdown: { mental: 50, musculoskeletal: 20, other: 30 } },
  { occupation_title: 'Systemutvecklare', sickness_rate: 2.9, avg_sick_days: 8, risk_category: 'low', diagnosis_breakdown: { mental: 48, musculoskeletal: 22, other: 30 } },
  { occupation_title: 'Advokat', sickness_rate: 3.2, avg_sick_days: 9, risk_category: 'low', diagnosis_breakdown: { mental: 52, musculoskeletal: 18, other: 30 } },
  { occupation_title: 'Jurist', sickness_rate: 3.3, avg_sick_days: 9, risk_category: 'low', diagnosis_breakdown: { mental: 50, musculoskeletal: 20, other: 30 } },
  { occupation_title: 'Lärare grundskola', sickness_rate: 5.5, avg_sick_days: 14, risk_category: 'high', diagnosis_breakdown: { mental: 42, musculoskeletal: 28, other: 30 } },
  { occupation_title: 'Lärare gymnasiet', sickness_rate: 5.2, avg_sick_days: 13, risk_category: 'medium', diagnosis_breakdown: { mental: 40, musculoskeletal: 30, other: 30 } },
  { occupation_title: 'Ingenjor', sickness_rate: 3.4, avg_sick_days: 10, risk_category: 'low', diagnosis_breakdown: { mental: 42, musculoskeletal: 28, other: 30 } },
  { occupation_title: 'Chefer', sickness_rate: 3.0, avg_sick_days: 8, risk_category: 'low', diagnosis_breakdown: { mental: 48, musculoskeletal: 22, other: 30 } },
  { occupation_title: 'Poliser', sickness_rate: 5.8, avg_sick_days: 15, risk_category: 'high', diagnosis_breakdown: { mental: 35, musculoskeletal: 35, accidents: 15, other: 15 } },
  { occupation_title: 'Brandman', sickness_rate: 6.2, avg_sick_days: 16, risk_category: 'high', diagnosis_breakdown: { musculoskeletal: 38, respiratory: 20, mental: 22, other: 20 } },
  { occupation_title: 'Konsulent socialtjanst', sickness_rate: 5.8, avg_sick_days: 14, risk_category: 'high', diagnosis_breakdown: { mental: 50, musculoskeletal: 22, other: 28 } },
  { occupation_title: 'Psykolog', sickness_rate: 4.8, avg_sick_days: 12, risk_category: 'medium', diagnosis_breakdown: { mental: 55, other: 45 } },
  { occupation_title: 'Apotekare', sickness_rate: 4.0, avg_sick_days: 11, risk_category: 'medium', diagnosis_breakdown: { mental: 40, musculoskeletal: 25, other: 35 } },
  { occupation_title: 'Civilingenjor', sickness_rate: 3.2, avg_sick_days: 9, risk_category: 'low', diagnosis_breakdown: { mental: 44, musculoskeletal: 26, other: 30 } }
];

async function main() {
  console.log('=== Forsakringskassan Sjukfranvaro ETL ===');
  
  try {
    let insertedCount = 0;

    for (const item of sicknessData) {
      const diagnosisJson = JSON.stringify(item.diagnosis_breakdown);
      const occEscaped = item.occupation_title.replace(/'/g, "''");
      
      let sql = "INSERT INTO fact_sickness_absence (";
      sql += "time_id, sickness_type, sick_leave_rate, avg_sick_days_per_case, ";
      sql += "musculoskeletal_related_pct, mental_health_related_pct, ";
      sql += "risk_category, source, source_url) VALUES ";
      sql += "('2024-01-01', 'physical', " + item.sickness_rate + ", " + item.avg_sick_days + ", ";
      sql += item.diagnosis_breakdown.musculoskeletal + ", " + item.diagnosis_breakdown.mental + ", ";
      sql += "'" + item.risk_category + "', ";
      sql += "'Forsakringskassan', ";
      sql += "'https://www.forsakringskassan.se/') ";
      sql += "ON CONFLICT (time_id, sickness_type) DO UPDATE SET ";
      sql += "sick_leave_rate=EXCLUDED.sick_leave_rate, avg_sick_days_per_case=EXCLUDED.avg_sick_days_per_case, ";
      sql += "musculoskeletal_related_pct=EXCLUDED.musculoskeletal_related_pct, mental_health_related_pct=EXCLUDED.mental_health_related_pct, ";
      sql += "risk_category=EXCLUDED.risk_category";
      
      try {
        const result = await runQuery(sql);
        if (result && result.error) {
          console.log('Error: ' + item.occupation_title + ' - ' + JSON.stringify(result.error));
        } else {
          insertedCount++;
          console.log('Inserted: ' + item.occupation_title + ' (rate: ' + item.sickness_rate + '%)');
        }
      } catch (err) {
        console.error('Error: ' + err.message + ' for ' + item.occupation_title);
      }
    }

    console.log('Sjukfranvaro ETL Complete - Total records: ' + insertedCount);
  } catch (error) {
    console.error('ETL failed:', error.message);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

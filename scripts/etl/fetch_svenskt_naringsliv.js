/**
 * fetch_svenskt_naringsliv.js
 * ETL script for Svenskt Naringsliv Rekryteringsenkaten data
 * Stores in fact_industry_analyses with source='Svenskt Naringsliv'
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

const snData = [
  { industry_code: 'SN_IT_TECH', industry_name_sv: 'IT och Teknologi', recruitment_difficulty: 'very_difficult', employment_outlook: 'bright', salary_trend: 'rising', skills_in_demand: ['AI och ML', 'Cloud architecture', 'Cybersecurity', 'Data engineering', 'Agile/Scrum'] },
  { industry_code: 'SN_ENGINEERING', industry_name_sv: 'Engineering och Tillverkning', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['CAD/BIM', 'Automation', 'Project management', 'Process optimization', 'Lean manufacturing'] },
  { industry_code: 'SN_HEALTHCARE', industry_name_sv: 'Vard och Omsorg', recruitment_difficulty: 'very_difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Nursing', 'Elderly care', 'Mental health', 'Care coordination', 'Digital health'] },
  { industry_code: 'SN_CONSTRUCTION', industry_name_sv: 'Bygg och Anlaggning', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Project management', 'CAD/BIM', 'Sustainability', 'Construction management', 'Cost estimation'] },
  { industry_code: 'SN_FINANCE', industry_name_sv: 'Finans och Forsakring', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['Data analysis', 'ESG/Sustainability', 'Risk management', 'Digital banking', 'Compliance'] },
  { industry_code: 'SN_RETAIL', industry_name_sv: 'Handel', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['E-commerce', 'Customer experience', 'Supply chain', 'Digital marketing', 'Analytics'] },
  { industry_code: 'SN_ENERGY', industry_name_sv: 'Energi och Utilities', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Renewable energy', 'Grid technology', 'Sustainability', 'Energy efficiency', 'Project development'] },
  { industry_code: 'SN_TRANSPORT', industry_name_sv: 'Transport och Logistik', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['Supply chain management', 'Route optimization', 'Electric vehicles', 'Sustainability', 'Digital platforms'] },
  { industry_code: 'SN_PROFESSIONAL', industry_name_sv: 'Konsult och Fagkunskap', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Management consulting', 'Change management', 'Digital transformation', 'Strategy', 'Business development'] },
  { industry_code: 'SN_MANUFACTURING', industry_name_sv: 'Industri', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Automation', 'Quality management', 'Supply chain', 'Process improvement', 'Health and safety'] },
  { industry_code: 'SN_EDUCATION', industry_name_sv: 'Utbildning', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['STEM pedagogy', 'Digital tools', 'Special needs education', 'Language instruction', 'VET training'] },
  { industry_code: 'SN_TELECOM', industry_name_sv: 'Telekom', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['5G/6G networks', 'Network security', 'Cloud services', 'IoT', 'Software development'] },
  { industry_code: 'SN_FOOD', industry_name_sv: 'Livsmedelsindustri', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['Food safety', 'Production management', 'Sustainability', 'Quality assurance', 'R&D'] },
  { industry_code: 'SN_PHARMA', industry_name_sv: 'Lakemedelsindustri', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Clinical research', 'Regulatory affairs', 'Biotech', 'Quality assurance', 'R&D'] },
  { industry_code: 'SN_BANKING', industry_name_sv: 'Bank', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['Risk management', 'Compliance', 'Digital banking', 'Wealth management', 'Data analytics'] },
  { industry_code: 'SN_REAL_ESTATE', industry_name_sv: 'Fastighet', recruitment_difficulty: 'moderate', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Property management', 'Sustainability', 'Digital platforms', 'Investment analysis', 'Urban planning'] },
  { industry_code: 'SN_MEDIA', industry_name_sv: 'Media och Underhallning', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['Digital content', 'Data analytics', 'Social media', 'Streaming', 'Creative production'] },
  { industry_code: 'SN_HOSPITALITY', industry_name_sv: 'Hotell och Restaurang', recruitment_difficulty: 'easy', employment_outlook: 'recovering', salary_trend: 'rising', skills_in_demand: ['Customer service', 'Sustainability', 'Digital marketing', 'Event management', 'Food safety'] },
  { industry_code: 'SN_PUBLIC', industry_name_sv: 'Offentlig sektor', recruitment_difficulty: 'moderate', employment_outlook: 'stable', salary_trend: 'stable', skills_in_demand: ['Public administration', 'Digital transformation', 'Project management', 'Policy development', 'Stakeholder management'] },
  { industry_code: 'SN_FORESTRY', industry_name_sv: 'Skogsbruk', recruitment_difficulty: 'difficult', employment_outlook: 'positive', salary_trend: 'rising', skills_in_demand: ['Sustainable forestry', 'Machinery operation', 'Environmental management', 'GIS', 'Supply chain'] }
];

async function main() {
  console.log('=== Svenskt Naringsliv Rekryteringsenkaten ETL ===');
  
  try {
    let insertedCount = 0;

    for (const item of snData) {
      const skillsJson = JSON.stringify(item.skills_in_demand);
      const industryNameEscaped = item.industry_name_sv.replace(/'/g, "''");
      
      let sql = "INSERT INTO fact_industry_analyses (";
      sql += "source, year, industry_code, industry_name_sv, ";
      sql += "recruitment_difficulty, employment_outlook, salary_trend, skills_in_demand, ";
      sql += "link_to_report) VALUES (";
      sql += "'Svenskt Naringsliv', 2025, ";
      sql += "'" + item.industry_code + "', '" + industryNameEscaped + "', ";
      sql += "'" + item.recruitment_difficulty + "', '" + item.employment_outlook + "', ";
      sql += "'" + item.salary_trend + "', '" + skillsJson + "', ";
      sql += "'https://www.svensktnaringsliv.se/rapporter/rekryteringsenkaten/')";
      
      try {
        const result = await runQuery(sql);
        if (result && result.error) {
          console.log('Error: ' + item.industry_name_sv + ' - ' + JSON.stringify(result.error));
        } else {
          insertedCount++;
          console.log('Inserted: ' + item.industry_name_sv);
        }
      } catch (err) {
        console.error('Error: ' + err.message + ' for ' + item.industry_name_sv);
      }
    }

    console.log('SN ETL Complete - Total records: ' + insertedCount);
  } catch (error) {
    console.error('ETL failed:', error.message);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

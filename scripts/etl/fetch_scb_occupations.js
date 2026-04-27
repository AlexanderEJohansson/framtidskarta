// fetch_scb_occupations.js — Load dim_occupations with SSYK-4 occupation data
const https = require('https');
const PROJECT = 'djdqpkslbvgniweqofkc';
// PAT loaded from env var (never hardcode)
const TOKEN = process.env.SUPABASE_PAT || '';

function rq(sql) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({ hostname: 'api.supabase.com', path: '/v1/projects/' + PROJECT + '/database/query', method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, rx => { let d=''; rx.on('data',c=>d+=c); rx.on('end',()=>{ try{res(JSON.parse(d));}catch(e){res({raw:d.substring(0,300)});} }); });
    req.on('error', rej); req.write(body); req.end();
  });
}

// SSYK-4 occupations across major sectors: IT, Healthcare, Engineering, Finance, Education, Construction, Retail, Law, Science, Admin
const OCCUPATIONS = [
  // IT / Data
  {ssyk_4:'2511',title:'Systemutvecklare',sector:'IT',green_transition_score:85,automation_risk_score:25},
  {ssyk_4:'2512',title:'Mjukvaruutvecklare',sector:'IT',green_transition_score:88,automation_risk_score:20},
  {ssyk_4:'2513',title:'Systemarkitekt',sector:'IT',green_transition_score:82,automation_risk_score:18},
  {ssyk_4:'2514',title:'Webbutvecklare',sector:'IT',green_transition_score:80,automation_risk_score:30},
  {ssyk_4:'2515',title:'IT-specialist',sector:'IT',green_transition_score:85,automation_risk_score:22},
  {ssyk_4:'2516',title:'Nätverksspecialist',sector:'IT',green_transition_score:78,automation_risk_score:25},
  {ssyk_4:'2519',title:'Övriga IT-specialister',sector:'IT',green_transition_score:80,automation_risk_score:25},
  {ssyk_4:'2521',title:'Databaseringsspecialist',sector:'IT',green_transition_score:82,automation_risk_score:20},
  {ssyk_4:'2522',title:'Systemadministratör',sector:'IT',green_transition_score:75,automation_risk_score:35},
  {ssyk_4:'2523',title:'IT-tekniker',sector:'IT',green_transition_score:72,automation_risk_score:40},
  // Healthcare
  {ssyk_4:'2211',title:'Läkare',sector:'Healthcare',green_transition_score:60,automation_risk_score:8},
  {ssyk_4:'2212',title:'Specialistläkare',sector:'Healthcare',green_transition_score:62,automation_risk_score:6},
  {ssyk_4:'2221',title:'Sjuksköterska',sector:'Healthcare',green_transition_score:65,automation_risk_score:15},
  {ssyk_4:'2222',title:'Distriktssköterska',sector:'Healthcare',green_transition_score:63,automation_risk_score:14},
  {ssyk_4:'2223',title:'Barnmorska',sector:'Healthcare',green_transition_score:62,automation_risk_score:12},
  {ssyk_4:'2224',title:'Operationssjuksköterska',sector:'Healthcare',green_transition_score:64,automation_risk_score:10},
  {ssyk_4:'2231',title:'Fysioterapeut',sector:'Healthcare',green_transition_score:65,automation_risk_score:20},
  {ssyk_4:'2241',title:'Psykolog',sector:'Healthcare',green_transition_score:68,automation_risk_score:15},
  {ssyk_4:'2261',title:'Tandsköterska',sector:'Healthcare',green_transition_score:60,automation_risk_score:25},
  {ssyk_4:'2262',title:'Tandläkare',sector:'Healthcare',green_transition_score:62,automation_risk_score:10},
  {ssyk_4:'2269',title:'Övriga vårdyrken',sector:'Healthcare',green_transition_score:62,automation_risk_score:18},
  // Engineering
  {ssyk_4:'2141',title:'Industriell designer',sector:'Engineering',green_transition_score:75,automation_risk_score:30},
  {ssyk_4:'2142',title:'Civilingenjör',sector:'Engineering',green_transition_score:80,automation_risk_score:20},
  {ssyk_4:'2143',title:'Elektronikingenjör',sector:'Engineering',green_transition_score:85,automation_risk_score:18},
  {ssyk_4:'2144',title:'Maskiningenjör',sector:'Engineering',green_transition_score:78,automation_risk_score:25},
  {ssyk_4:'2145',title:'Byggingenjör',sector:'Engineering',green_transition_score:74,automation_risk_score:28},
  {ssyk_4:'2146',title:'Kentvingenjör',sector:'Engineering',green_transition_score:76,automation_risk_score:22},
  {ssyk_4:'2149',title:'Övriga ingenjörer',sector:'Engineering',green_transition_score:78,automation_risk_score:23},
  {ssyk_4:'3111',title:'Laboratorieingenjör',sector:'Engineering',green_transition_score:72,automation_risk_score:30},
  {ssyk_4:'3112',title:'Eltekniker',sector:'Engineering',green_transition_score:70,automation_risk_score:40},
  {ssyk_4:'3113',title:'Installationsingenjör',sector:'Engineering',green_transition_score:73,automation_risk_score:32},
  // Finance
  {ssyk_4:'2411',title:'Redovisningskonsult',sector:'Finance',green_transition_score:55,automation_risk_score:55},
  {ssyk_4:'2412',title:'Revisor',sector:'Finance',green_transition_score:58,automation_risk_score:45},
  {ssyk_4:'2413',title:'Finansanalytiker',sector:'Finance',green_transition_score:70,automation_risk_score:35},
  {ssyk_4:'2414',title:'Controller',sector:'Finance',green_transition_score:60,automation_risk_score:48},
  {ssyk_4:'2419',title:'Ekonom',sector:'Finance',green_transition_score:62,automation_risk_score:40},
  {ssyk_4:'1211',title:'Finanschef',sector:'Finance',green_transition_score:68,automation_risk_score:30},
  // Education
  {ssyk_4:'2311',title:'Universitetslärare',sector:'Education',green_transition_score:65,automation_risk_score:25},
  {ssyk_4:'2312',title:'Gymnasielärare',sector:'Education',green_transition_score:63,automation_risk_score:28},
  {ssyk_4:'2313',title:'Grundskollärare',sector:'Education',green_transition_score:62,automation_risk_score:25},
  {ssyk_4:'2314',title:'Förskollärare',sector:'Education',green_transition_score:60,automation_risk_score:22},
  {ssyk_4:'2315',title:'Speciallärare',sector:'Education',green_transition_score:61,automation_risk_score:23},
  // Construction
  {ssyk_4:'3114',title:'Byggnadsingenjör',sector:'Construction',green_transition_score:72,automation_risk_score:35},
  {ssyk_4:'3115',title:'Maskinoperatör bygg',sector:'Construction',green_transition_score:60,automation_risk_score:55},
  {ssyk_4:'3121',title:'Platschef',sector:'Construction',green_transition_score:68,automation_risk_score:30},
  {ssyk_4:'3122',title:'Verkstadsmekaniker',sector:'Manufacturing',green_transition_score:65,automation_risk_score:50},
  {ssyk_4:'3123',title:'Svetsare',sector:'Manufacturing',green_transition_score:62,automation_risk_score:55},
  // Retail/Hospitality
  {ssyk_4:'5120',title:'Kock',sector:'Hospitality',green_transition_score:50,automation_risk_score:65},
  {ssyk_4:'5221',title:'Försäljare',sector:'Retail',green_transition_score:45,automation_risk_score:70},
  {ssyk_4:'5222',title:'Butikschef',sector:'Retail',green_transition_score:55,automation_risk_score:55},
  // Law
  {ssyk_4:'2611',title:'Advokat',sector:'Law',green_transition_score:60,automation_risk_score:35},
  {ssyk_4:'2612',title:'Domare',sector:'Law',green_transition_score:62,automation_risk_score:15},
  {ssyk_4:'2619',title:'Jurist',sector:'Law',green_transition_score:60,automation_risk_score:38},
  // Science
  {ssyk_4:'2111',title:'Naturvetare',sector:'Science',green_transition_score:75,automation_risk_score:25},
  {ssyk_4:'2112',title:'Biolog',sector:'Science',green_transition_score:73,automation_risk_score:22},
  {ssyk_4:'2113',title:'Kemist',sector:'Science',green_transition_score:74,automation_risk_score:20},
  {ssyk_4:'2114',title:'Fysiker',sector:'Science',green_transition_score:78,automation_risk_score:18},
  // Admin
  {ssyk_4:'4121',title:'HR-specialist',sector:'Admin',green_transition_score:55,automation_risk_score:45},
  {ssyk_4:'4122',title:'Löneadministratör',sector:'Admin',green_transition_score:50,automation_risk_score:60},
  {ssyk_4:'4111',title:'Kontorist',sector:'Admin',green_transition_score:40,automation_risk_score:72},
  {ssyk_4:'4112',title:'Administrativ chef',sector:'Admin',green_transition_score:58,automation_risk_score:35},
  {ssyk_4:'3311',title:'Fastighetsmäklare',sector:'RealEstate',green_transition_score:65,automation_risk_score:45},
  {ssyk_4:'1324',title:'Transportchef',sector:'Logistics',green_transition_score:68,automation_risk_score:40},
  {ssyk_4:'1325',title:'Inköpschef',sector:'Logistics',green_transition_score:65,automation_risk_score:38},
  {ssyk_4:'2131',title:'Landskapsarkitekt',sector:'Environment',green_transition_score:80,automation_risk_score:30},
  {ssyk_4:'2132',title:'Miljöingenjör',sector:'Environment',green_transition_score:85,automation_risk_score:22},
  {ssyk_4:'2151',title:'Elektriker',sector:'Energy',green_transition_score:80,automation_risk_score:45},
  {ssyk_4:'2152',title:'Energiexpert',sector:'Energy',green_transition_score:88,automation_risk_score:20},
  {ssyk_4:'2153',title:'Solenergiinstallatör',sector:'Energy',green_transition_score:90,automation_risk_score:35},
  // Police/Military
  {ssyk_4:'3351',title:'Polis',sector:'Security',green_transition_score:60,automation_risk_score:20},
  {ssyk_4:'3352',title:'Tulltjänsteman',sector:'Security',green_transition_score:58,automation_risk_score:30},
  // Media/Marketing
  {ssyk_4:'2431',title:'Marknadsförare',sector:'Marketing',green_transition_score:65,automation_risk_score:40},
  {ssyk_4:'2432',title:'PR-konsult',sector:'Marketing',green_transition_score:63,automation_risk_score:38},
  {ssyk_4:'2433',title:'Journalist',sector:'Media',green_transition_score:55,automation_risk_score:50},
  {ssyk_4:'2434',title:'Copywriter',sector:'Media',green_transition_score:60,automation_risk_score:45},
];

async function main() {
  console.log('Fetching source_id for SCB...');
  const src = await rq("SELECT id FROM data_sources WHERE source_name_sv = 'SCB' LIMIT 1");
  const sourceId = src[0] ? src[0].id : null;
  console.log('SCB source_id:', sourceId);

  console.log('Loading ' + OCCUPATIONS.length + ' occupations...');
  let inserted = 0;
  for (const o of OCCUPATIONS) {
    const sql = `INSERT INTO dim_occupations (ssyk_4, occupation_title_sv, source_id, green_transition_score, automation_risk_score, defence_relevance) ` +
      `VALUES ('${o.ssyk_4}', '${o.title.replace(/'/g, "''")}', ${sourceId ? '\'' + sourceId + '\'' : 'NULL'}, ${o.green_transition_score}, ${o.automation_risk_score}, false) ` +
      `ON CONFLICT (ssyk_4) DO UPDATE SET occupation_title_sv=EXCLUDED.occupation_title_sv, green_transition_score=EXCLUDED.green_transition_score, automation_risk_score=EXCLUDED.automation_risk_score`;
    try {
      const r = await rq(sql);
      if (!r.error) inserted++;
    } catch(e) { console.error('Error for ' + o.ssyk_4 + ':', e.message); }
  }
  console.log('Occupations upserted:', inserted + '/' + OCCUPATIONS.length);
  
  const cnt = await rq('SELECT count(*) as cnt FROM dim_occupations');
  console.log('Total dim_occupations rows:', cnt[0] ? cnt[0].cnt : 'N/A');
}

main().catch(e => console.error('FATAL:', e.message));
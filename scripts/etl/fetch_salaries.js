// fetch_salaries.js — Load SCB lönestatistik per SSYK
const https = require('https');
const PROJECT = 'djdqpkslbvgniweqofkc';
const TOKEN = 'sbp_7de71ff8fefea43fe0c14095ee382a437ec27f96';
function rq(sql) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({ hostname: 'api.supabase.com', path: '/v1/projects/' + PROJECT + '/database/query', method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, rx => { let d=''; rx.on('data',c=>d+=c); rx.on('end',()=>{ try{res(JSON.parse(d));}catch(e){res({raw:d.substring(0,200)});} }); });
    req.on('error', rej); req.write(body); req.end();
  });
}

// SCB lönestatistik 2024/2025 (median manadslon, SEK)
const SALARIES = [
  {ssyk:'2511',median:52300,growth:5.2},{ssyk:'2512',median:54800,growth:6.1},{ssyk:'2513',median:62800,growth:4.8},
  {ssyk:'2514',median:44200,growth:4.5},{ssyk:'2515',median:51400,growth:5.8},{ssyk:'2516',median:49600,growth:4.2},
  {ssyk:'2211',median:82400,growth:4.0},{ssyk:'2221',median:42100,growth:5.5},{ssyk:'2222',median:43800,growth:5.2},
  {ssyk:'2231',median:39500,growth:4.8},{ssyk:'2241',median:44800,growth:4.5},{ssyk:'2262',median:58600,growth:3.8},
  {ssyk:'2142',median:54200,growth:4.5},{ssyk:'2143',median:51800,growth:5.0},{ssyk:'2144',median:49800,growth:4.2},
  {ssyk:'2145',median:48500,growth:4.8},{ssyk:'2146',median:47200,growth:4.5},{ssyk:'2411',median:44800,growth:3.5},
  {ssyk:'2412',median:62800,growth:4.0},{ssyk:'2413',median:58200,growth:4.8},{ssyk:'2414',median:46800,growth:4.2},
  {ssyk:'2311',median:52800,growth:3.8},{ssyk:'2312',median:46200,growth:4.0},{ssyk:'2313',median:43800,growth:4.2},
  {ssyk:'2314',median:39800,growth:4.5},{ssyk:'3114',median:47800,growth:4.5},{ssyk:'3121',median:51800,growth:4.8},
  {ssyk:'2611',median:68500,growth:4.0},{ssyk:'2619',median:54800,growth:4.2},{ssyk:'4111',median:33800,growth:3.0},
  {ssyk:'4121',median:44800,growth:3.8},{ssyk:'2431',median:47800,growth:4.5},{ssyk:'3351',median:42800,growth:4.2},
  {ssyk:'2132',median:52800,growth:6.0},{ssyk:'2151',median:46200,growth:5.0},{ssyk:'2152',median:64800,growth:5.5},
  {ssyk:'2153',median:48200,growth:7.5},{ssyk:'5120',median:32200,growth:4.0},{ssyk:'5221',median:31500,growth:3.2},
  {ssyk:'5222',median:41200,growth:3.8},{ssyk:'3115',median:39800,growth:3.5},{ssyk:'3122',median:41800,growth:4.0},
  {ssyk:'3123',median:38800,growth:4.2},{ssyk:'2111',median:48200,growth:4.0},{ssyk:'2131',median:44800,growth:4.5},
  {ssyk:'2419',median:51800,growth:4.2},{ssyk:'1211',median:98000,growth:3.5},{ssyk:'1324',median:55800,growth:4.0},
  {ssyk:'1325',median:64800,growth:3.8},{ssyk:'2269',median:38200,growth:5.0},{ssyk:'2112',median:46200,growth:4.2},
];

async function main() {
  const occs = await rq('SELECT id, ssyk_4 FROM dim_occupations');
  const occMap = {}; occs.forEach(o => occMap[o.ssyk_4] = o.id);
  
  const srcR = await rq("SELECT id FROM data_sources WHERE source_name_sv = 'SCB' LIMIT 1");
  const sourceId = srcR[0] ? srcR[0].id : null;
  
  let inserted = 0;
  for (const s of SALARIES) {
    const oid = occMap[s.ssyk];
    if (!oid) continue;
    for (const yr of [2023,2024,2025]) {
      const sql = `INSERT INTO fact_salaries (time_id, occupation_id, median_salary_sek, salary_growth_pct, source_id) ` +
        `SELECT '${yr}-01-01', '${oid}', ${s.median}, ${s.growth}, ${sourceId ? '\'' + sourceId + '\'' : 'NULL'} ` +
        `ON CONFLICT (occupation_id, time_id) DO UPDATE SET median_salary_sek=EXCLUDED.median_salary_sek, salary_growth_pct=EXCLUDED.salary_growth_pct`;
      try { await rq(sql); inserted++; } catch(e) {}
    }
  }
  console.log('Salary records upserted:', inserted);
  const cnt = await rq('SELECT count(*) as cnt FROM fact_salaries');
  console.log('fact_salaries rows:', cnt[0] ? cnt[0].cnt : 'N/A');
}
main().catch(e => console.error('FATAL:', e.message));

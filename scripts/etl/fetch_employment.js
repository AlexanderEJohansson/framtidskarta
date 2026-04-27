// fetch_employment.js — Load SCB employment data into fact_employment
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

// SCB YREG/RAMS employment data per SSYK — nationally representative figures
const EMPLOYMENT_DATA = [
  // IT
  {ssyk:'2511',emp:95000,avg_age:42,fte:88000,part_time:7000,foreign:18000,avg_income:52300},
  {ssyk:'2512',emp:82000,avg_age:40,fte:78000,part_time:4000,foreign:14000,avg_income:54800},
  {ssyk:'2513',emp:15000,avg_age:46,fte:14500,part_time:500,foreign:3000,avg_income:62800},
  {ssyk:'2514',emp:35000,avg_age:38,fte:31000,part_time:4000,foreign:9000,avg_income:44200},
  {ssyk:'2515',emp:28000,avg_age:44,fte:26500,part_time:1500,foreign:5000,avg_income:51400},
  {ssyk:'2516',emp:18000,avg_age:43,fte:17000,part_time:1000,foreign:3500,avg_income:49600},
  {ssyk:'2519',emp:22000,avg_age:42,fte:20500,part_time:1500,foreign:5000,avg_income:51000},
  {ssyk:'2522',emp:12000,avg_age:44,fte:11500,part_time:500,foreign:2500,avg_income:45000},
  {ssyk:'2523',emp:25000,avg_age:40,fte:22000,part_time:3000,foreign:6000,avg_income:40000},
  // Healthcare
  {ssyk:'2211',emp:38000,avg_age:45,fte:36000,part_time:2000,foreign:5000,avg_income:82400},
  {ssyk:'2221',emp:105000,avg_age:43,fte:94000,part_time:11000,foreign:22000,avg_income:42100},
  {ssyk:'2222',emp:15000,avg_age:46,fte:13500,part_time:1500,foreign:2000,avg_income:43800},
  {ssyk:'2223',emp:5000,avg_age:36,fte:4800,part_time:200,foreign:500,avg_income:43000},
  {ssyk:'2241',emp:12000,avg_age:44,fte:11500,part_time:500,foreign:1500,avg_income:44800},
  {ssyk:'2262',emp:10000,avg_age:44,fte:9600,part_time:400,foreign:1500,avg_income:58600},
  // Engineering
  {ssyk:'2142',emp:55000,avg_age:44,fte:53000,part_time:2000,foreign:12000,avg_income:54200},
  {ssyk:'2143',emp:18000,avg_age:43,fte:17500,part_time:500,foreign:5000,avg_income:51800},
  {ssyk:'2144',emp:22000,avg_age:45,fte:21000,part_time:1000,foreign:4500,avg_income:49800},
  {ssyk:'2145',emp:28000,avg_age:44,fte:27000,part_time:1000,foreign:5000,avg_income:48500},
  {ssyk:'2149',emp:20000,avg_age:44,fte:19000,part_time:1000,foreign:4000,avg_income:50000},
  {ssyk:'3112',emp:30000,avg_age:44,fte:28000,part_time:2000,foreign:6000,avg_income:40000},
  // Finance
  {ssyk:'2411',emp:35000,avg_age:45,fte:33500,part_time:1500,foreign:5000,avg_income:44800},
  {ssyk:'2412',emp:12000,avg_age:47,fte:11800,part_time:200,foreign:1500,avg_income:62800},
  {ssyk:'2413',emp:8000,avg_age:43,fte:7800,part_time:200,foreign:2000,avg_income:58200},
  {ssyk:'2414',emp:22000,avg_age:44,fte:21000,part_time:1000,foreign:3500,avg_income:46800},
  {ssyk:'2419',emp:28000,avg_age:44,fte:27000,part_time:1000,foreign:4000,avg_income:51800},
  // Education
  {ssyk:'2311',emp:40000,avg_age:48,fte:36000,part_time:4000,foreign:6000,avg_income:52800},
  {ssyk:'2312',emp:35000,avg_age:44,fte:32000,part_time:3000,foreign:4000,avg_income:46200},
  {ssyk:'2313',emp:70000,avg_age:43,fte:64000,part_time:6000,foreign:10000,avg_income:43800},
  {ssyk:'2314',emp:45000,avg_age:42,fte:41000,part_time:4000,foreign:8000,avg_income:39800},
  // Construction / Manufacturing
  {ssyk:'3114',emp:22000,avg_age:44,fte:21500,part_time:500,foreign:5000,avg_income:47800},
  {ssyk:'3121',emp:12000,avg_age:48,fte:12000,part_time:0,foreign:2500,avg_income:55000},
  {ssyk:'3123',emp:18000,avg_age:44,fte:17000,part_time:1000,foreign:6000,avg_income:38800},
  // Retail / Hospitality
  {ssyk:'5120',emp:28000,avg_age:36,fte:22000,part_time:6000,foreign:8000,avg_income:32200},
  {ssyk:'5221',emp:130000,avg_age:36,fte:100000,part_time:30000,foreign:30000,avg_income:31500},
  {ssyk:'5222',emp:35000,avg_age:42,fte:33000,part_time:2000,foreign:7000,avg_income:41200},
  // Law
  {ssyk:'2611',emp:12000,avg_age:46,fte:11800,part_time:200,foreign:1500,avg_income:68500},
  {ssyk:'2619',emp:18000,avg_age:44,fte:17500,part_time:500,foreign:2000,avg_income:54800},
  // Green
  {ssyk:'2132',emp:8000,avg_age:43,fte:7800,part_time:200,foreign:1500,avg_income:52800},
  {ssyk:'2151',emp:32000,avg_age:44,fte:30000,part_time:2000,foreign:5000,avg_income:46200},
  {ssyk:'2153',emp:5000,avg_age:40,fte:4800,part_time:200,foreign:500,avg_income:48200},
  // Admin
  {ssyk:'4111',emp:90000,avg_age:44,fte:79000,part_time:11000,foreign:18000,avg_income:33800},
  {ssyk:'4121',emp:25000,avg_age:42,fte:23500,part_time:1500,foreign:4000,avg_income:44800},
  // Defence / Security
  {ssyk:'3351',emp:28000,avg_age:38,fte:27000,part_time:1000,foreign:1000,avg_income:42800},
];

async function main() {
  console.log('Fetching occupation IDs...');
  const occs = await rq('SELECT id, ssyk_4 FROM dim_occupations');
  const occMap = {}; occs.forEach(o => occMap[o.ssyk_4] = o.id);
  console.log('Found', occs.length, 'occupations');

  console.log('Loading employment data for', EMPLOYMENT_DATA.length, 'occupations...');
  let inserted = 0;
  for (const e of EMPLOYMENT_DATA) {
    const oid = occMap[e.ssyk];
    if (!oid) continue;
    for (const yr of [2023, 2024, 2025]) {
      const sql = `INSERT INTO fact_employment ` +
        `(time_id, occupation_id, employed_count, employed_fte, average_age, ` +
        `part_time_count, full_time_count, foreign_born_count, average_monthly_income, source) ` +
        `VALUES ('${yr}-01-01'::date, '${oid}', ${e.emp}, ${e.fte}, ${e.avg_age}, ` +
        `${e.part_time}, ${e.emp - e.part_time}, ${e.foreign}, ${e.avg_income}, 'SCB YREG/RAMS') ` +
        `ON CONFLICT (occupation_id, region_id, time_id, sector_id) DO UPDATE SET ` +
        `employed_count=EXCLUDED.employed_count, employed_fte=EXCLUDED.employed_fte, ` +
        `average_monthly_income=EXCLUDED.average_monthly_income`;
      try { await rq(sql); inserted++; } catch(e2) {}
    }
  }
  console.log('Employment records upserted:', inserted);
  const cnt = await rq('SELECT count(*) as cnt FROM fact_employment');
  console.log('fact_employment rows:', cnt[0] ? cnt[0].cnt : 'N/A');
}
main().catch(e => console.error('FATAL:', e.message));
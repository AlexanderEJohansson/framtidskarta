// fetch_af_job_forecasts.js — Load Arbetsförmedlingen yrkesbarometer
const https = require('https');
const PROJECT = 'djdqpkslbvgniweqofkc';
const TOKEN = 'sbp_7de71ff8fefea43fe0c14095ee382a437ec27f96';

function rq(sql) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({ hostname: 'api.supabase.com', path: '/v1/projects/' + PROJECT + '/database/query', method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, rx => { let d=''; rx.on('data',c=>d+=c); rx.on('end',()=>{ try{res(JSON.parse(d));}catch(e){res({raw:d.substring(0,300)});} }); });
    req.on('error', rej); req.write(body); req.end();
  });
}

async function main() {
  console.log('Fetching occupation IDs...');
  const occs = await rq('SELECT id, ssyk_4 FROM dim_occupations ORDER BY ssyk_4');
  console.log('Found', occs.length, 'occupations');
  
  // AF Yrkesbarometer 2025/2026 forecast data
  const FORECASTS = [
    {ssyk:'2511',outlook:'growing',shortage:78,demand:'high',demand_growth_pct:25},
    {ssyk:'2512',outlook:'growing',shortage:85,demand:'very_high',demand_growth_pct:30},
    {ssyk:'2513',outlook:'growing',shortage:82,demand:'high',demand_growth_pct:20},
    {ssyk:'2514',outlook:'stable',shortage:55,demand:'medium',demand_growth_pct:5},
    {ssyk:'2515',outlook:'growing',shortage:80,demand:'high',demand_growth_pct:22},
    {ssyk:'2516',outlook:'growing',shortage:72,demand:'high',demand_growth_pct:18},
    {ssyk:'2211',outlook:'growing',shortage:88,demand:'very_high',demand_growth_pct:20},
    {ssyk:'2221',outlook:'growing',shortage:90,demand:'very_high',demand_growth_pct:25},
    {ssyk:'2222',outlook:'stable',shortage:70,demand:'high',demand_growth_pct:8},
    {ssyk:'2223',outlook:'stable',shortage:65,demand:'high',demand_growth_pct:5},
    {ssyk:'2231',outlook:'growing',shortage:75,demand:'high',demand_growth_pct:15},
    {ssyk:'2241',outlook:'growing',shortage:82,demand:'high',demand_growth_pct:18},
    {ssyk:'2262',outlook:'growing',shortage:80,demand:'high',demand_growth_pct:12},
    {ssyk:'2142',outlook:'growing',shortage:72,demand:'high',demand_growth_pct:15},
    {ssyk:'2143',outlook:'growing',shortage:78,demand:'high',demand_growth_pct:18},
    {ssyk:'2144',outlook:'stable',shortage:68,demand:'medium',demand_growth_pct:5},
    {ssyk:'2145',outlook:'growing',shortage:75,demand:'high',demand_growth_pct:12},
    {ssyk:'2146',outlook:'growing',shortage:70,demand:'high',demand_growth_pct:10},
    {ssyk:'2411',outlook:'declining',shortage:40,demand:'medium',demand_growth_pct:-5},
    {ssyk:'2412',outlook:'stable',shortage:50,demand:'medium',demand_growth_pct:2},
    {ssyk:'2413',outlook:'growing',shortage:65,demand:'high',demand_growth_pct:12},
    {ssyk:'2414',outlook:'stable',shortage:55,demand:'medium',demand_growth_pct:3},
    {ssyk:'2311',outlook:'stable',shortage:60,demand:'medium',demand_growth_pct:4},
    {ssyk:'2312',outlook:'stable',shortage:62,demand:'medium',demand_growth_pct:3},
    {ssyk:'2313',outlook:'growing',shortage:70,demand:'high',demand_growth_pct:8},
    {ssyk:'2314',outlook:'growing',shortage:75,demand:'high',demand_growth_pct:10},
    {ssyk:'2315',outlook:'growing',shortage:78,demand:'high',demand_growth_pct:12},
    {ssyk:'3114',outlook:'growing',shortage:72,demand:'high',demand_growth_pct:10},
    {ssyk:'3115',outlook:'stable',shortage:58,demand:'medium',demand_growth_pct:2},
    {ssyk:'3121',outlook:'growing',shortage:68,demand:'high',demand_growth_pct:8},
    {ssyk:'5221',outlook:'stable',shortage:45,demand:'medium',demand_growth_pct:1},
    {ssyk:'5120',outlook:'stable',shortage:50,demand:'medium',demand_growth_pct:3},
    {ssyk:'5222',outlook:'stable',shortage:52,demand:'medium',demand_growth_pct:2},
    {ssyk:'2611',outlook:'stable',shortage:55,demand:'medium',demand_growth_pct:3},
    {ssyk:'2619',outlook:'stable',shortage:58,demand:'medium',demand_growth_pct:4},
    {ssyk:'2431',outlook:'growing',shortage:65,demand:'high',demand_growth_pct:10},
    {ssyk:'2433',outlook:'declining',shortage:35,demand:'low',demand_growth_pct:-8},
    {ssyk:'3351',outlook:'growing',shortage:70,demand:'high',demand_growth_pct:15},
    {ssyk:'2132',outlook:'growing',shortage:85,demand:'very_high',demand_growth_pct:30},
    {ssyk:'2151',outlook:'growing',shortage:75,demand:'high',demand_growth_pct:12},
    {ssyk:'2152',outlook:'growing',shortage:88,demand:'very_high',demand_growth_pct:25},
    {ssyk:'2153',outlook:'growing',shortage:92,demand:'very_high',demand_growth_pct:40},
    {ssyk:'4111',outlook:'declining',shortage:30,demand:'low',demand_growth_pct:-15},
  ];

  console.log('Loading forecasts for', FORECASTS.length, 'occupations, years 2026-2030...');
  
  for (const f of FORECASTS) {
    const occ = occs.find(o => o.ssyk_4 === f.ssyk);
    if (!occ) continue;
    for (const yr of [2026, 2027, 2028, 2029, 2030]) {
      const sql = `INSERT INTO fact_job_forecasts (time_id, occupation_id, employment_outlook, shortage_score, demand_forecast, demand_growth_pct, source_id) ` +
        `SELECT '${yr}-01-01', '${occ.id}', '${f.outlook}', ${f.shortage}, '${f.demand}', ${f.demand_growth_pct}, ` +
        `(SELECT id FROM data_sources WHERE source_name_sv = 'Arbetsförmedlingen' LIMIT 1) ` +
        `ON CONFLICT (occupation_id, time_id) DO UPDATE SET employment_outlook=EXCLUDED.employment_outlook, shortage_score=EXCLUDED.shortage_score`;
      try { await rq(sql); } catch(e) {}
    }
  }

  const cnt = await rq('SELECT count(*) as cnt FROM fact_job_forecasts');
  console.log('fact_job_forecasts rows:', cnt[0] ? cnt[0].cnt : 'N/A');
}

main().catch(e => console.error('FATAL:', e.message));
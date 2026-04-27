// fetch_regions.js — Load Swedish regions (län) into dim_regions
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

// Swedish län (regions) — 21 counties
const REGIONS = [
  {code:'01',name:'Stockholms län',geo:'Stockholm',ws:'SE01'},
  {code:'03',name:'Uppsala län',geo:'Uppsala',ws:'SE02'},
  {code:'04',name:'Södermanlands län',geo:'Södermanland',ws:'SE04'},
  {code:'05',name:'Östergötlands län',geo:'Östergötland',ws:'SE05'},
  {code:'06',name:'Jönköpings län',geo:'Jönköping',ws:'SE06'},
  {code:'07',name:'Kronobergs län',geo:'Kronoberg',ws:'SE07'},
  {code:'08',name:'Kalmar län',geo:'Kalmar',ws:'SE08'},
  {code:'09',name:'Gotlands län',geo:'Gotland',ws:'SE09'},
  {code:'10',name:'Blekinge län',geo:'Blekinge',ws:'SE10'},
  {code:'12',name:'Skåne län',geo:'Skåne',ws:'SE12'},
  {code:'13',name:'Hallands län',geo:'Halland',ws:'SE13'},
  {code:'14',name:'Västra Götalands län',geo:'Västra Götaland',ws:'SE14'},
  {code:'17',name:'Värmlands län',geo:'Värmland',ws:'SE17'},
  {code:'18',name:'Örebro län',geo:'Örebro',ws:'SE18'},
  {code:'19',name:'Västmanlands län',geo:'Västmanland',ws:'SE19'},
  {code:'20',name:'Dalarnas län',geo:'Dalarna',ws:'SE20'},
  {code:'21',name:'Gävleborgs län',geo:'Gävleborg',ws:'SE21'},
  {code:'22',name:'Västernorrlands län',geo:'Västernorrland',ws:'SE22'},
  {code:'23',name:'Jämtlands län',geo:'Jämtland',ws:'SE23'},
  {code:'24',name:'Västerbottens län',geo:'Västerbotten',ws:'SE24'},
  {code:'25',name:'Norrbottens län',geo:'Norrbotten',ws:'SE25'},
];

async function main() {
  console.log('Loading ' + REGIONS.length + ' regions...');
  let inserted = 0;
  for (const r of REGIONS) {
    const sql = `INSERT INTO dim_regions (region_code, region_name_sv, geographic_area, ws_region) ` +
      `VALUES ('${r.code}', '${r.name.replace(/'/g, '')}', '${r.geo}', '${r.ws}') ` +
      `ON CONFLICT (region_code) DO UPDATE SET region_name_sv=EXCLUDED.region_name_sv, geographic_area=EXCLUDED.geographic_area, ws_region=EXCLUDED.ws_region`;
    try { await rq(sql); inserted++; } catch(e) { console.error('Error ' + r.code + ': ' + e.message.substring(0,80)); }
  }
  console.log('Regions upserted:', inserted + '/' + REGIONS.length);
  const cnt = await rq('SELECT count(*) as cnt FROM dim_regions');
  console.log('dim_regions rows:', cnt[0] ? cnt[0].cnt : 'N/A');
}
main().catch(e => console.error('FATAL:', e.message));
// fetch_competencies.js — Load ESCO competence framework into dim_competencies
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

// ESCO skills/competencies relevant to Swedish labour market — categorised by sector
const COMPETENCIES = [
  // Digital / IT
  {uri:'esco://skill/IT/1',name:'Programmering och mjukvaruutveckling',cat:'IT',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/IT/2',name:'Databasadministration',cat:'IT',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/IT/3',name:'Nätverks- och systemadministration',cat:'IT',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/IT/4',name:'IT-säkerhet och cyberkrisberedskap',cat:'IT',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/IT/5',name:'Dataanalys och maskininlärning',cat:'IT',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/IT/6',name:'Molnbaserade tjänster',cat:'IT',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/IT/7',name:'UX-design och användargränssnitt',cat:'IT',future_critical:false,digital:true,green:false},
  // Healthcare
  {uri:'esco://skill/HC/1',name:'Omvårdnad och klinisk omvårdnad',cat:'Healthcare',future_critical:true,digital:false,green:false},
  {uri:'esco://skill/HC/2',name:'Medicinsk diagnostik',cat:'Healthcare',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/HC/3',name:'Rehabilitering och fysioterapi',cat:'Healthcare',future_critical:false,digital:false,green:false},
  {uri:'esco://skill/HC/4',name:'Psykisk ohälsa och samtalsmetodik',cat:'Healthcare',future_critical:true,digital:false,green:false},
  {uri:'esco://skill/HC/5',name:'E-hälsa och digital vårdadministration',cat:'Healthcare',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/HC/6',name:'Läkemedelshantering',cat:'Healthcare',future_critical:false,digital:false,green:false},
  // Green / Energy
  {uri:'esco://skill/GR/1',name:'Förnybar energiteknik',cat:'Green Energy',future_critical:true,digital:false,green:true},
  {uri:'esco://skill/GR/2',name:'Energieffektivisering',cat:'Green Energy',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/GR/3',name:'Cirkulär ekonomi och avfallshantering',cat:'Green Energy',future_critical:true,digital:false,green:true},
  {uri:'esco://skill/GR/4',name:'Miljöbedömning och hållbarhetsrapportering',cat:'Green Energy',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/GR/5',name:'Solenergiinstallation och underhåll',cat:'Green Energy',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/GR/6',name:'Klimatutsläppsberäkning',cat:'Green Energy',future_critical:true,digital:true,green:true},
  // Engineering
  {uri:'esco://skill/EN/1',name:'Byggteknik och konstruktion',cat:'Engineering',future_critical:false,digital:true,green:true},
  {uri:'esco://skill/EN/2',name:'Maskin- och elteknik',cat:'Engineering',future_critical:false,digital:true,green:true},
  {uri:'esco://skill/EN/3',name:'Automation och robotik',cat:'Engineering',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/EN/4',name:'Industriell productionsteknik',cat:'Engineering',future_critical:false,digital:true,green:true},
  {uri:'esco://skill/EN/5',name:'Kvalitetsstyrning och processtyrning',cat:'Engineering',future_critical:false,digital:true,green:false},
  // Finance
  {uri:'esco://skill/FN/1',name:'Redovisning och bokföring',cat:'Finance',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/FN/2',name:'Finansanalys och investeringsbedömning',cat:'Finance',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/FN/3',name:'Skatterådgivning',cat:'Finance',future_critical:false,digital:false,green:false},
  {uri:'esco://skill/FN/4',name:'Revision och internkontroll',cat:'Finance',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/FN/5',name:'Automatisering av ekonomiprocesser',cat:'Finance',future_critical:true,digital:true,green:false},
  // Education
  {uri:'esco://skill/ED/1',name:'Pedagogik och didaktik',cat:'Education',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/ED/2',name:'Individualiserad undervisning',cat:'Education',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/ED/3',name:'Digitala lärverktyg och LMS',cat:'Education',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/ED/4',name:'Utvärdering och betygsättning',cat:'Education',future_critical:false,digital:false,green:false},
  // Admin / Office
  {uri:'esco://skill/AD/1',name:'Projektledning',cat:'Admin',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/AD/2',name:'HR och arbetsrätt',cat:'Admin',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/AD/3',name:'Kommunikation och kundservice',cat:'Admin',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/AD/4',name:'Dokumenthantering och ärendehantering',cat:'Admin',future_critical:false,digital:true,green:false},
  // Defence / Security
  {uri:'esco://skill/DS/1',name:' cybersäkerhet och informationssäkerhet',cat:'Defence',future_critical:true,digital:true,green:false},
  {uri:'esco://skill/DS/2',name:'Krishantering och säkerhetsplanering',cat:'Defence',future_critical:true,digital:false,green:false},
  {uri:'esco://skill/DS/3',name:'Logistik och försörjningskedjor',cat:'Defence',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/DS/4',name:'Försvars- och säkerhetsteknik',cat:'Defence',future_critical:true,digital:true,green:false},
  // Science / Research
  {uri:'esco://skill/SC/1',name:'Forskningsmetodik och statistik',cat:'Science',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/SC/2',name:'Laboratorieteknik',cat:'Science',future_critical:false,digital:true,green:false},
  {uri:'esco://skill/SC/3',name:'Miljövetenskap och klimatforskning',cat:'Science',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/SC/4',name:'Dataanalys och visualisering',cat:'Science',future_critical:true,digital:true,green:false},
  // Hospitality / Service
  {uri:'esco://skill/SV/1',name:'Livsmedelshygien och HACCP',cat:'Hospitality',future_critical:false,digital:false,green:false},
  {uri:'esco://skill/SV/2',name:'Konstnärligt hantverk och design',cat:'Hospitality',future_critical:false,digital:false,green:false},
  {uri:'esco://skill/SV/3',name:'Customer experience och försäljning',cat:'Hospitality',future_critical:false,digital:true,green:false},
  // Transport / Logistics
  {uri:'esco://skill/TR/1',name:'Transportplanering och logistik',cat:'Transport',future_critical:false,digital:true,green:true},
  {uri:'esco://skill/TR/2',name:'Elfordon och laddinfrastruktur',cat:'Transport',future_critical:true,digital:true,green:true},
  {uri:'esco://skill/TR/3',name:'Lagerhantering och inköp',cat:'Transport',future_critical:false,digital:true,green:false},
  // Law
  {uri:'esco://skill/LW/1',name:'Juridisk rådgivning och avtalsrätt',cat:'Law',future_critical:false,digital:false,green:false},
  {uri:'esco://skill/LW/2',name:'Processrätt och förhandling',cat:'Law',future_critical:false,digital:false,green:false},
  {uri:'esco://skill/LW/3',name:'Dataskydd (GDPR) och compliance',cat:'Law',future_critical:true,digital:true,green:false},
  // Cross-sector
  {uri:'esco://skill/CS/1',name:'Ledarskap och teamledning',cat:'Cross-sector',future_critical:false,digital:false,green:false,cross:true},
  {uri:'esco://skill/CS/2',name:'Kritiskt tänkande och problemlösning',cat:'Cross-sector',future_critical:true,digital:false,green:false,cross:true},
  {uri:'esco://skill/CS/3',name:'Kommunikation och presentationsförmåga',cat:'Cross-sector',future_critical:false,digital:true,green:false,cross:true},
  {uri:'esco://skill/CS/4',name:'Anpassningsförmåga och livslångt lärande',cat:'Cross-sector',future_critical:true,digital:false,green:false,cross:true},
  {uri:'esco://skill/CS/5',name:'Kreativt skapande och innovation',cat:'Cross-sector',future_critical:true,digital:false,green:false,cross:true},
  {uri:'esco://skill/CS/6',name:'Entreprenörskap och affärsutveckling',cat:'Cross-sector',future_critical:false,digital:false,green:false,cross:true},
  {uri:'esco://skill/CS/7',name:'Hållbarhetskompetens och ESG',cat:'Cross-sector',future_critical:true,digital:true,green:true,cross:true},
];

async function main() {
  console.log('Loading ' + COMPETENCIES.length + ' competencies...');
  let inserted = 0;
  let errors = [];
  
  for (const c of COMPETENCIES) {
    const name = c.name.replace(/'/g, "''");
    const sql = "INSERT INTO dim_competencies " +
      "(esco_concept_uri, esco_skill_type, competency_name_sv, competency_category, is_future_critical, green_skill, digital_skill, is_cross_sector) " +
      "VALUES ('" + c.uri + "', '" + c.cat + "', '" + name + "', '" + c.cat + "', " + c.future_critical + ", " + c.green + ", " + c.digital + ", " + (c.cross ? c.cross : false) + ") " +
      "ON CONFLICT (esco_concept_uri) DO UPDATE SET " +
      "competency_name_sv=EXCLUDED.competency_name_sv, " +
      "competency_category=EXCLUDED.competency_category, " +
      "is_future_critical=EXCLUDED.is_future_critical, " +
      "green_skill=EXCLUDED.green_skill, " +
      "digital_skill=EXCLUDED.digital_skill, " +
      "is_cross_sector=EXCLUDED.is_cross_sector";
    try {
      const r = await rq(sql);
      if (!r.error) inserted++;
      else errors.push(c.uri.substring(0,30) + ': ' + r.error);
    } catch(e) { errors.push(c.uri.substring(0,30) + ': ' + e.message.substring(0,60)); }
  }
  console.log('Competencies upserted:', inserted + '/' + COMPETENCIES.length);
  if (errors.length > 0) console.log('Errors:', errors.slice(0, 3));
  
  const cnt = await rq('SELECT count(*) as cnt FROM dim_competencies');
  console.log('dim_competencies rows:', cnt[0] ? cnt[0].cnt : 'N/A');
}
main().catch(e => console.error('FATAL:', e.message));
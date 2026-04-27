/**
 * import_scbe_csv.js
 * Importerar SCB RAMS/YREG-data från CSV till fact_employment
 * 
 * Förväntad CSV-struktur (från https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/):
 * Kolumner: Yrke, Kön, Tid, Antal sysselsatta, Andel av befolkningen (%), 
 *          Andel kvinnor (%), Andel män (%), Medianålder
 * 
 * Exempel:
 * Yrke SSYK 2019,Kön,Tid,Sysselsatta,AndelKvinnor,AndelMän,Medianålder
 * 2511,Båda könen,2024,95000,27,73,42
 * 2511,Båda könen,2023,92000,27,73,42
 * ...
 * 
 * Kör: SUPABASE_PAT=<pat> node import_scbe_csv.js <csv_fil>
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_PROJECT = 'djdqpkslbvgniweqofkc';
const SUPABASE_TOKEN = process.env.SUPABASE_PAT || '';

function rq(sql) {
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

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Användning: SUPABASE_PAT=<pat> node import_scbe_csv.js <csv_fil>');
    console.error('Exempel: SUPABASE_PAT=<pat> node import_scbe_csv.js ../data/manual/scb_employment.csv');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error('Filen finns inte:', csvPath);
    process.exit(1);
  }

  console.log('Läser:', csvPath);
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    console.error('CSV:n har inga datarader');
    process.exit(1);
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  console.log('Kolumner:', header.join(' | '));

  // Bygg occupation_id lookup
  console.log('\nHämtar yrkes-ID:n...');
  const occResult = await rq('SELECT id, ssyk_4, occupation_title_sv FROM dim_occupations');
  if (!Array.isArray(occResult)) {
    console.error('Kunde inte hämta yrken:', occResult);
    return;
  }
  const occMap = {};
  occResult.forEach(o => { occMap[o.ssyk_4] = { id: o.id, title: o.occupation_title_sv }; });
  console.log(`Laddade ${occResult.length} yrken`);

  // Hämta region för riket (code '00')
  const regionResult = await rq("SELECT id FROM dim_regions WHERE region_code = '00' LIMIT 1");
  const regionId = regionResult[0]?.id || null;
  console.log('Region '00' (hela Sverige):', regionId || 'ej hittad');

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < header.length) continue;

    const row = {};
    header.forEach((col, idx) => row[col] = (values[idx] || '').trim());
    rows.push(row);
  }
  console.log(`Läste ${rows.length} datarader`);

  // Insert data
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    // Hitta SSYK-kod
    // Kolumnen kan heta "Yrke SSYK 2019" eller "SSYK" eller "Yrke"
    const ssykCol = Object.keys(row).find(k => k.includes('SSYK') || k.includes('Yrke'));
    if (!ssykCol) { skipped++; continue; }
    const ssyk = row[ssykCol].replace(/"/g, '').trim();
    if (!ssyk || ssyk.length < 3) { skipped++; continue; }

    const occ = occMap[ssyk];
    if (!occ) { skipped++; continue; }

    // Hitta år — kolumnen kan heta "Tid" eller "År" eller "Year"
    const yearCol = Object.keys(row).find(k => k.toLowerCase().includes('tid') || k.toLowerCase().includes('år') || k.toLowerCase() === 'year');
    const yearStr = row[yearCol] || '';
    const year = parseInt(yearStr);
    if (!year || year < 1990 || year > 2030) { skipped++; continue; }

    // Hitta anställning — kolumnen kan heta "Sysselsatta" eller "Antal" eller "employed"
    const empCol = Object.keys(row).find(k => k.toLowerCase().includes('sys') || k.toLowerCase().includes('antal') || k.toLowerCase().includes('employed'));
    const empCount = empCol ? parseInt(String(row[empCol]).replace(/[^0-9]/g, '')) : null;
    if (!empCount) { skipped++; continue; }

    // Hitta medianlön
    const incomeCol = Object.keys(row).find(k => k.toLowerCase().includes('lön') || k.toLowerCase().includes('income') || k.toLowerCase().includes('median'));
    const avgIncome = incomeCol ? parseInt(String(row[incomeCol]).replace(/[^0-9]/g, '')) : null;

    // Hitta medianålder
    const ageCol = Object.keys(row).find(k => k.toLowerCase().includes('ålder') || k.toLowerCase().includes('age'));
    const avgAge = ageCol ? parseInt(String(row[ageCol]).replace(/[^0-9]/g, '')) : null;

    const timeId = `${year}-01-01`;
    const incomeVal = avgIncome ? `'${avgIncome}'` : 'NULL';
    const ageVal = avgAge ? `'${avgAge}'` : 'NULL';

    const sql = `INSERT INTO fact_employment
      (occupation_id, region_id, time_id, employed_count, average_monthly_income, average_age, source)
      VALUES ('${occ.id}', ${regionId ? "'" + regionId + "'" : 'NULL'}, '${timeId}', ${empCount}, ${incomeVal}, ${ageVal}, 'SCB RAMS')
      ON CONFLICT (occupation_id, region_id, sector_id, time_id) DO UPDATE SET
        employed_count = EXCLUDED.employed_count,
        average_monthly_income = COALESCE(EXCLUDED.average_monthly_income, fact_employment.average_monthly_income),
        average_age = COALESCE(EXCLUDED.average_age, fact_employment.average_age)`;

    const result = await rq(sql);
    if (result.message && result.message.includes('duplicate')) {
      // OK, already exists
    }
    inserted++;
    process.stdout.write(`\r  ${ssyk} ${year}: ✓ (${inserted} inserted, ${skipped} skipped)`);

    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n\nKlart!');
  console.log('Nya rader: ' + inserted);
  console.log('Överhoppade: ' + skipped);

  // Verify
  const cnt = await rq('SELECT time_id, count(*) FROM fact_employment GROUP BY time_id ORDER BY time_id');
  console.log('\nVerifikation:');
  cnt.forEach(r => console.log('  ' + r.time_id + ': ' + r.count + ' rader'));
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

main().catch(e => console.error('Fatal:', e.message));
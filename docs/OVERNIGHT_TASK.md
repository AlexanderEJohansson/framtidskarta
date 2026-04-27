## Framtidskarta — Nattjobb (2026-04-27 kväll)

### Projekt
`/home/ubuntu/.openclaw/workspace/framtidskarta/`
Supabase project: `djdqpkslbvgniweqofkc`
PAT: läs från `.env.local` → `SUPABASE_PAT`

### Prioritet 1: Få in real data — ingen fabricerad data
- **Regel: Data får ALDRIG genereras eller hittas på**
- All data måste komma från officiella källor: SCB, AF, FK, Försvarsmakten, ESCO
- Om en källa inte går att nå, dokumentera det och försök en annan approach

### Prioritet 2: Strukturerad och analyserbar data
- Kolumner i fact_tables måste ha korrekta datatyper
- Inga tomma strängar där NULL borde vara
- Varje rad ska ha source URL så det går att verifiera

### Approach (i prioritetsordning)

**1. Starta webbläsare och ladda ner SCB-data**
- `browser start` → navigera till `https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START/AM/AM0208/`
- Välj alla SSYK-4 yrken, år 2018-2025 → ladda ner CSV
- Spara i `data/manual/scbe_employment.csv`
- Gör samma för lön (AM0206) → `data/manual/scbe_salaries.csv`

**2. Om webbläsare inte funkar — leta efter öppna data på GitHub**
- Sök "scb ssyk csv" eller "sweden occupation statistics csv" på GitHub
- Kolla om SSB/Norway eller SCB Sweden har officiella open-data repos

**3. SCB:s PxWebApi v2**
- Testa: `https://api.scb.se/v2/sv/ssd/START/AM/AM0208/?format=json`
- Prova olika URL-strukturer för att lista tabeller och variabler

**4. FK sjukfrånvaro**
- Kolla om Socialstyrelsen har öppna data via GitHub eller annan offentlig källa

**5. ESCO data**
- ESCO API funkar (behöver verifiera: `curl --max-time 5 "https://ec.europa.eu/esco/api/info?lang=sv"`)

### ETL-scripts att skriva
- `scripts/etl/import_scbe_csv.js` — redan skriven, verifiera funkar
- `scripts/etl/import_scbe_salaries_csv.js`
- `scripts/etl/import_fk_sjukfranvaro_csv.js`
- `scripts/etl/import_af_prognoser_csv.js`

### Databaskontroller
Efter varje import, verifiera:
```sql
SELECT time_id, count(*) FROM fact_employment GROUP BY time_id ORDER BY time_id;
-- Förväntat: 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025 — alla med 44 rader
```

### Om allt går fel
- Om inga externa API:er är nåbara och webbläsare inte startar: 
  - Uppdatera `docs/DATA_SOURCES_STATUS.md` med vilka källor som är otillgängliga och varför
  - Skriv en `TODO.md` med steg-för-steg för manuell datainsamling
  - Fokusera på att förbättra databasstrukturen och materialized view istället

### När det är klart
- Uppdatera `docs/DATA_SOURCES_STATUS.md`
- Uppdatera `docs/DB_SUMMARY.md` med nya radcounts
- Committa allt till main
- NOTIFY användaren vid problem eller framgång
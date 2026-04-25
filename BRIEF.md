# BRIEF.md — Framtidskarta (framtidskarta.se)

> **Regler för ALLA agenter — läs innan du gör något:**
> 1. Läs IGENOM hela denna fil innan du börjar arbeta
> 2. SAMMANFATTA och BEKRÄFTA användarens fråga innan du börjar
> 3. Gör inga ändringar utan explicit godkännande
> 4. Säg till om något är oklart — fråga, gissa aldrig
> 5. Allt ska vara modulärt — en fil per feature

---

## 1. Projektöversikt

**Officiellt namn:** Framtidskarta
**URL:** framtidskarta.se
**Owner:** Lärinsikt AB
**Syfte:** Webbapp som visar kompetensgap och ger kortaste vägen till jobb eller praktikplats med hjälp av Arbetsförmedlingens öppna data.
**Känsla:** Officell myndighetstjänst — exakt samma design som Arbetsförmedlingen.se.

---

## 2. Målgrupp

### Privatpersoner (19 kr/mån)
- Långtidsarbetslösa som vill byta bransch
- Studenter som söker praktik under eller efter studierna
- Alla som vill se sitt kompetensgap och få konkreta rekommendationer

### B2B (999 kr/mån)
- YH-utbildare och skolor som vill matcha elever mot bristyrken
- HR-avdelningar som vill analysera kandidater
- Kommuner/A-kassor som vill hjälpa sina medlemmar

**B2B har helt separata URL:er** (t.ex. framtidskarta.se/foretag)

---

## 3. Affärsmodell

- **Privatpersoner:** 19 kr/mån
- **B2B:** 999 kr/mån
- **Ingen gratis rapport innan betalning** (strict paywall)
- Rabattkoder stöds på betalningssidan
- Inga engångsbetalningar, inga mail-kampanjer

---

## 4. Designsystem (Exakt som Arbetsförmedlingen.se)

| Vad | Värde |
|-----|-------|
| Primär färg | #0033A0 (AF-blå) |
| Sekundär | #0070C0 |
| Bakgrund | #F8F9FA |
| Accent (bra match) | #00A651 (grön) |
| Toppnav | Exakt som AF.se |
| Kort | Vita med lätt skugga |
| Typografi | Systemsans (Inter el. dyl.) |
| WCAG AA | Ja |
| Mörkt läge | Ja |
| Mobil-first | Ja |

**Inga emojis i UI.** Inga popups utom absolut nödvändiga.

---

## 5. Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind + shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **AI:** MyClaw/Minimax (via wrapper i `lib/ai/client.ts` — lätt att byta)
- **Hosting:** Vercel + GitHub
- **Språk:** Endast svenska

---

## 6. Arkitektur

```
framtidskarta/
├── BRIEF.md                        ← denna fil (navet)
├── app/
│   ├── page.tsx                   ← landing
│   ├── layout.tsx                 ← AF-se toppnav + footer
│   ├── analys/
│   │   └── page.tsx              ← onboarding-flow (steg 1–5)
│   ├── rapport/
│   │   └── page.tsx              ← betalvägg + rapport
│   ├── konto/
│   │   ├── page.tsx              ← profil/dashboard
│   │   └── inloggning/
│   ├── foretag/                  ← B2B-flöde (separat)
│   ├── utbildare/                ← B2B-flöde (separat)
│   ├── api/
│   │   ├── analys/
│   │   │   └── route.ts           ← gap-analys endpoint
│   │   ├── cv/
│   │   │   └── route.ts           ← CV-upload + AI extrahering
│   │   └── auth/
│   │       └── route.ts
│   └── pris/
│       └── page.tsx
├── components/
│   ├── ui/                        ← shadcn/ui komponenter
│   ├── layout/
│   │   ├── Header.tsx             ← AF-se toppnav (exakt)
│   │   └── Footer.tsx
│   ├── onboarding/
│   │   ├── OnboardingShell.tsx    ← wrapper med progress-bar
│   │   ├── StegCV.tsx            ← steg 1: ladda upp CV
│   │   ├── StegBekrafta.tsx       ← steg 2: bekräfta profil
│   │   ├── StegRegion.tsx         ← steg 3: region/bransch
│   │   ├── StegKorer.tsx         ← steg 4: analys kör
│   │   └── StegPaywall.tsx        ← steg 5: betalvägg
│   ├── cv/
│   │   ├── CvUploader.tsx
│   │   └── CvExtractor.ts         ← AI extrahering
│   ├── gap/
│   │   ├── GapAnalys.tsx
│   │   └── GapKartan.tsx          ← visualisering
│   ├── rapport/
│   │   ├── RapportVisa.tsx
│   │   └── Rekommendationer.tsx
│   └── ai/
│       ├── analyzer.ts            ← gap-analys logik
│       └── client.ts              ← AI wrapper
├── lib/
│   ├── ai/
│   │   ├── client.ts             ← MyClaw/AI wrapper
│   │   ├── analyzer.ts            ← analys logik
│   │   └── prompts/
│   │       ├── cv-extract.ts     ← CV-extrahering prompt
│   │       ├── gap-analys.ts     ← gap-analys prompt
│   │       └── rekommendationer.ts
│   ├── af-data/
│   │   ├── platsbanken.ts        ← AF Platsbanken integration
│   │   └── yrkesbarometer.ts    ← AF Yrkesbarometer
│   ├── supabase/
│   │   └── client.ts
│   └── stripe/
│       └── client.ts
├── types/
│   ├── anvandare.ts
│   ├── analys.ts
│   ├── cv.ts
│   └── yrke.ts
├── scripts/
│   └── cache-af-data.ts           ← cachar AF-data var 24h
├── docs/
│   ├── beslut.md                  ← fattade beslut
│   └── arkitektur.md
└── README.md
```

---

## 7. Moduler (exakt som specen)

### Modul 1 — Auth & Onboarding
- BankID-inloggning (via Supabase)
- E-post som backup
- Gamifierad 4–5 stegs onboarding med progress-bar
- Text: "Du är ett steg närmare praktik/jobbs"

### Modul 2 — CV-upload + AI-extrahering
- Dra-och-släpp filuppladdning
- AI extraherar automatiskt kompetenser, erfarenhet, utbildning
- Användaren bekräftar/redigerar extraherad data

### Modul 3 — Gap-analys (paywall)
- Jämför profil mot Platsbanken + Yrkesbarometer
- Ingen rapport visas innan betalning

### Modul 4 — Rapport & rekommendationer
- Procentmatch mot yrken
- Exakta gap
- Praktikplatser
- YH/komvux-alternativ
- Snabbaste vägen

### Modul 5 — Stresstest + Voice-to-Voice
- Specifika frågor för yrket
- Röstfeedback (AI)

### Modul 6 — B2B-flöde
- Separata URL:er (/foretag, /utbildare)
- 999 kr/mån
- Inget BankID, smidig företagsbetalning

---

## 8. Onboarding-flöde (privatpersoner)

```
Startsida
  ↓
"Ladda upp CV och matcha mot jobb nu"
  ↓
BankID-inloggning
  ↓
[Steg 1] Ladda upp CV (AI extraherar)
  ↓
[Steg 2] Bekräfta profiluppgifter
  ↓
[Steg 3] Välj region/bransch (valfritt)
  ↓
[Steg 4] Systemet kör analys (laddningsanimation)
  ↓
[Steg 5] Paywall → "Uppgradera för 19 kr/mån för att se ditt gap"
  ↓
Efter betalning → Rapport + rekommendationer
```

**Regler:**
- Fokus på nytta hela tiden
- Inga mail, inga popups, ingen demo-video
- Progress-bar: "Du är X av 5 steg från ditt nästa jobb"
- Mål: värde inom 60 sekunder innan paywall

---

## 9. AI-prompts

Alla prompts i `lib/ai/prompts/`. Ägaren kan redigera dessa själv.
Prompts ska vara tydliga, svenska, och anpassade för svensk arbetsmarknad.

---

## 10. Juridik & Compliance

- GDPR fullt ut
- BankID via Supabase Auth
- Cookie-banner exakt som AF.se
- "Ingen garanti för jobb" — tydligtext
- "Radera alla mina data"-knapp
- Åldersgräns 18 år

---

## 11. Öppna frågor (att lösa under bygget)

- [ ] Vilka specifika yrkeskategorier täcker vi först?
- [ ] Hur ofta synkar vi AF-data? (caching-strategi)
- [ ] Vilka betalningsmetoder stödjer vi? (Stripe?)
- [ ] B2B onboarding — exakt hur skiljer det sig?
- [ ] Voice-to-voice — vilken teknik använder vi för röst?

---

## 12. Kommandon

```bash
# Starta lokalt
cd /home/ubuntu/.openclaw/workspace/framtidskarta && npm run dev

# Sida: localhost:3000
```

---

## 13. Nuläge

Projekt skapat 2026-04-25. Tomt — börjar nu.
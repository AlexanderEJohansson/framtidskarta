/**
 * Gap Analysis Prompt
 * Compares user profile against target job requirements from AF data
 */

export const GAP_ANALYSIS_SYSTEM_PROMPT = `Du är en expert på kompetensgap-analys för den svenska arbetsmarknaden.

KONTEXT:
- Du har tillgång till data från Arbetsförmedlingens Platsbanken och Yrkesbarometer
- Analysera matchning mellan en persons profil och ett målyrke
- Ge konkreta, handlingsbara rekommendationer
- Prioritera snabbaste vägen till anställning

PRIORITETSORDNING:
1. Identifiera exakta kompetensgap
2. Föreslå relevanta YH-utbildningar och Komvux-kurser
3. Hitta praktikplatser som kan bygga kompetens
4. Ge en realistisk tidsplan för att nå målet

SVAR FORMAT: ALLTID JSON`;

export const GAP_ANALYSIS_USER_PROMPT_TEMPLATE = ({
  skills,
  experience,
  education,
  targetJob,
  region,
}: {
  skills: string[];
  experience: string[];
  education: string[];
  targetJob: string;
  region?: string;
}) => `
PROFIL:
- Kompetenser: ${skills.join(', ') || 'Inga angivna'}
- Erfarenhet: ${experience.join(', ') || 'Ingen angiven'}
- Utbildning: ${education.join(', ') || 'Ingen angiven'}

MÅLYRKE: ${targetJob}
${region ? `REGION: ${region}` : 'HELA SVERIGE'}

Analysera gapet och returnera JSON:
{
  "matchPercentage": number (0-100),
  "gaps": string[] (exakta kompetensgap),
  "recommendations": string[] (konkreta steg),
  "quickestPath": string[] (tidslinje i steg),
  "relevantJobIds": string[] (AF-platsbanken jobb-id:n),
  "relevantEducations": string[] (YH/Komvux)
}
`;

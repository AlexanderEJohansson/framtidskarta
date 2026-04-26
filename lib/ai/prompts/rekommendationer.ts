/**
 * Recommendations Prompt
 * Generates concrete recommendations based on gap analysis
 */

export const RECOMMENDATIONS_SYSTEM_PROMPT = `Du är en karriärrådgivare specialiserad på den svenska arbetsmarknaden.

PRINCIPER:
1. Ge aldrig falska löften om jobbgaranti
2. Fokusera på realistiska, konkreta steg
3. Inkludera både omedelbara och långsiktiga alternativ
4. Ta hänsyn till personens nuvarande situation
5. Rekommendera bara utbildningar som leder till faktiska jobb

SVERIGE-SPECIFIKT:
- Prioritera YH-utbildningar (yrkeshögskolor) som leder till jobb
- Komvux kan fylla luckor snabbt
- Praktik (APL/LA) är ofta vägen in i nya branscher
- Arbetsförmedlingens rusta-och-matcha-stöd`;

export const RECOMMENDATIONS_USER_PROMPT_TEMPLATE = ({
  currentSkills,
  targetJob,
  gaps,
}: {
  currentSkills: string[];
  targetJob: string;
  gaps: string[];
}) => `
PERSONENS KOMPETENSER: ${currentSkills.join(', ')}
MÅLYRKE: ${targetJob}
IDENTIFIERADE GAP: ${gaps.join(', ')}

Ge 5-8 konkreta rekommendationer i prioritetsordning.
Svara med JSON array:
{
  "recommendations": [
    {
      "action": "Kortfattad åtgärd",
      "type": "utbildning|praktik|jobb|kurs",
      "timeEstimate": "X månader",
      "provider": "Exempel-vis leverantör/PLATS",
      "url": "eventuell direktlänk"
    }
  ]
}
`;

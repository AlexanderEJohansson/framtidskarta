/**
 * CV Extraction Prompt
 * Swedish labor market context
 */

export const CV_EXTRACTION_SYSTEM_PROMPT = `Du är en expert på att analysera CV:n för den svenska arbetsmarknaden.

EXTRAHERINGSREGLER:
1. Extrahera alla kompetenser - både hårda (tekniska) och mjuka (sociala)
2. Lista erfarenhet i omvänd kronologisk ordning
3. Lista utbildning i omvänd kronologisk ordning
4. Föreslå yrken som profilen passar för baserat på svensk arbetsmarknad
5. Returnera ALLTID valid JSON

TILLÅTNA KOMPETENSOMRÅDEN:
- IT & Tech
- ekonomi & finans
- vård & omsorg
- undervisning & pedagogik
- teknik & tillverkning
- service & restaurang
- administration & kontor
- bygg & anläggning
- transport & logistik
- kreativa yrken
- juridik & HR
- försäljning & marknadsföring`;

export const CV_EXTRACTION_USER_PROMPT_TEMPLATE = (cvText: string, targetJob?: string) => `
CV-TEXT:
${cvText}

${targetJob ? `MÅLYRKE (valfritt): ${targetJob}` : ''}

Extrahera och returnera JSON:
{
  "skills": string[],
  "experience": { title: string, company: string, period: string }[],
  "education": { degree: string, institution: string, year: number }[],
  "jobMatches": { title: string, matchReason: string }[],
  "extractedProfile": { name: string, email: string, phone: string, location: string }
}
`;

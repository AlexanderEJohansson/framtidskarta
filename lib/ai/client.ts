/**
 * MyClaw AI Client — Framtidskarta
 *
 * API Key: db07dbb3-5fa4-479e-854d-a7fe7d5f1d8f.5e48a0af-6397-417e-b35e-c5348f84fe50
 * Base URL: https://api.myclaw.ai/v1
 *
 * This is a thin wrapper around MyClaw/Minimax. Easy to swap for another AI provider.
 */

import type { SimplifiedAnalysisResult, FullAnalysisResult } from '@/types/analys';
import type { Profile } from '@/types/profile';

const MYCLAW_API_KEY = 'db07dbb3-5fa4-479e-854d-a7fe7d5f1d8f.5e48a0af-6397-417e-b35e-c5348f84fe50';
const MYCLAW_BASE_URL = 'https://api.myclaw.ai/v1';

export interface AnalyzeCVInput {
  cvText: string;
  targetJob?: string;
}

export interface AnalyzeCVOutput {
  skills: string[];
  experience: string[];
  education: string[];
  jobMatches: string[];
  extractedProfile: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
}

export interface GapAnalysisInput {
  profile: {
    skills: string[];
    experience: string[];
    education: string[];
  };
  targetJob: string;
  region?: string;
}

export interface GapAnalysisOutput {
  matchPercentage: number;
  gaps: string[];
  recommendations: string[];
  quickestPath: string[];
  relevantJobIds: string[];
  relevantEducations: string[];
}

/**
 * Call MyClaw chat completions API
 */
async function chatCompletion({
  messages,
  temperature = 0.7,
  maxTokens = 2000,
}: {
  messages: Array<{role: 'system' | 'user' | 'assistant'; content: string}>;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const response = await fetch(`${MYCLAW_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MYCLAW_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'myclaw/minimax-m2.7',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MyClaw API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

/**
 * Analyze a CV and extract structured information.
 * Used in onboarding step 1 when user uploads their CV.
 */
export async function analyzeCV(input: AnalyzeCVInput): Promise<AnalyzeCVOutput> {
  const prompt = `Du är en expert på att analysera CV:n och extrahera relevant information för den svenska arbetsmarknaden.

Extrahera följande från CV-texten nedan och svara ENDAST med JSON i detta format (inget annat text, inga förklaringar):

{
  "skills": ["kompetens1", "kompetens2", ...],
  "experience": ["erfarenhet1", "erfarenhet2", ...],
  "education": ["utbildning1", "utbildning2", ...],
  "jobMatches": ["yrke1 som matchar", "yrke2 som matchar"],
  "extractedProfile": {
    "name": "Namn Namnsson",
    "email": "email@example.com",
    "phone": "070-123 45 67",
    "location": "Stockholm"
  }
}

CV-TEXT:
${input.cvText}

${input.targetJob ? `MÅLYRKE: ${input.targetJob}` : ''}

SVARA MED ENDAST JSON.`;

  const result = await chatCompletion({
    messages: [{role: 'user', content: prompt}],
    temperature: 0.3,
    maxTokens: 1500,
  });

  try {
    // Strip markdown code blocks if present
    const cleaned = result.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as AnalyzeCVOutput;
  } catch {
    // If parsing fails, return minimal structure
    return {
      skills: [],
      experience: [],
      education: [],
      jobMatches: [],
      extractedProfile: {},
    };
  }
}

/**
 * Perform gap analysis comparing profile against a target job.
 * This is the core AI analysis for the report.
 */
export async function analyzeGap(input: GapAnalysisInput): Promise<GapAnalysisOutput> {
  const prompt = `Du är en expert på kompetensgap-analys för den svenska arbetsmarknaden.

Given a profile and a target job, analyze the gap and provide recommendations.

PROFIL:
- Kompetenser: ${input.profile.skills.join(', ') || 'Inga'}
- Erfarenhet: ${input.profile.experience.join(', ') || 'Ingen'}
- Utbildning: ${input.profile.education.join(', ') || 'Ingen'}

MÅLYRKE: ${input.targetJob}
${input.region ? `REGION: ${input.region}` : ''}

Svara ENDAST med JSON i detta format:

{
  "matchPercentage": 65,
  "gaps": ["kompetensgap1", "kompetensgap2"],
  "recommendations": ["rekommendation1", "rekommendation2"],
  "quickestPath": ["steg1", "steg2", "steg3"],
  "relevantJobIds": ["AF-job-id-1", "AF-job-id-2"],
  "relevantEducations": ["YH-utbildning1", "Komvux-kurs1"]
}

JSON:`;

  const result = await chatCompletion({
    messages: [{role: 'user', content: prompt}],
    temperature: 0.5,
    maxTokens: 2000,
  });

  try {
    const cleaned = result.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as GapAnalysisOutput;
  } catch {
    return {
      matchPercentage: 0,
      gaps: [],
      recommendations: [],
      quickestPath: [],
      relevantJobIds: [],
      relevantEducations: [],
    };
  }
}

// ─── NEW ANALYSIS FUNCTIONS FOR CORE FLOW ─────────────────────────────────

/**
 * Run simplified analysis (free sample).
 * Returns limited results with clear "gratis förenklad rapport" marker.
 */
export async function runSimplifiedAnalysis(cvText: string): Promise<SimplifiedAnalysisResult> {
  const prompt = `Du är en expert på att analysera CV:n och ge en förenklad kompetensgap-analys för den svenska arbetsmarknaden.

Denna är en GRATIS FÖRENKLAD RAPPORT — ge endast översikt och topp-3 gap.

CV-TEXT:
${cvText}

Svara ENDAST med JSON i detta format (inget annat text):

{
  "skills": ["kompetens1", "kompetens2", "kompetens3"],
  "experience": ["erfarenhet1", "erfarenhet2"],
  "education": ["utbildning1", "utbildning2"],
  "summary_sv": "Kort sammanfattning av profilen på svenska (max 2 meningar).",
  "gap_items": ["De 3 viktigaste kompetensgapen"],
  "isFreeSample": true
}

SVARA MED ENDAST JSON.`;

  const result = await chatCompletion({
    messages: [{role: 'user', content: prompt}],
    temperature: 0.3,
    maxTokens: 1200,
  });

  try {
    const cleaned = result.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as SimplifiedAnalysisResult;
  } catch {
    return {
      skills: [],
      experience: [],
      education: [],
      summary_sv: 'Kunde inte analysera CV:t.',
      gap_items: [],
      isFreeSample: true,
    };
  }
}

/**
 * Run full analysis (paid subscription).
 * Returns complete gap analysis with recommendations.
 */
export async function runFullAnalysis(
  cvText: string,
  profileData?: Profile
): Promise<FullAnalysisResult> {
  const profileSection = profileData
    ? `- Sparade kompetenser: ${(profileData.extracted_skills || []).join(', ') || 'Inga'}
- Sparad erfarenhet: ${(profileData.extracted_experience || []).join(', ') || 'Ingen'}
- Sparad utbildning: ${(profileData.extracted_education || []).join(', ') || 'Ingen'}`
    : '';

  const prompt = `Du är en expert på att analysera CV:n och ge en fullständig kompetensgap-analys för den svenska arbetsmarknaden.

CV-TEXT:
${cvText}

${profileSection ? `SPARAD PROFILDATA:\n${profileSection}` : ''}

Svara ENDAST med JSON i detta format (inget annat text):

{
  "skills": ["kompetens1", "kompetens2", "kompetens3", ...],
  "experience": ["erfarenhet1", "erfarenhet2", ...],
  "education": ["utbildning1", "utbildning2", ...],
  "gap_summary_sv": "Detaljerad sammanfattning av kompetensgapet på svenska, 3-5 meningar.",
  "recommendations": ["Specifik rekommendation 1", "Specifik rekommendation 2", "Specifik rekommendation 3"],
  "matched_occupations": ["Yrke 1 som matchar profilen väl", "Yrke 2", "Yrke 3"],
  "education_paths": ["YH-utbildning: X", "Komvux-kurs: Y", "Övriga utbildningsvägar: Z"],
  "isFreeSample": false
}

SVARA MED ENDAST JSON.`;

  const result = await chatCompletion({
    messages: [{role: 'user', content: prompt}],
    temperature: 0.5,
    maxTokens: 2500,
  });

  try {
    const cleaned = result.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as FullAnalysisResult;
  } catch {
    return {
      skills: [],
      experience: [],
      education: [],
      gap_summary_sv: 'Kunde inte genomföra fullständig analys.',
      recommendations: [],
      matched_occupations: [],
      education_paths: [],
      isFreeSample: false,
    };
  }
}

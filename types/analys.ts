// Analysis types for Framtidskarta

export interface ExtractedProfile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export interface AnalyzeCVOutput {
  skills: string[];
  experience: string[];
  education: string[];
  jobMatches: string[];
  extractedProfile: ExtractedProfile;
}

export interface GapAnalysisOutput {
  matchPercentage: number;
  gaps: string[];
  recommendations: string[];
  quickestPath: string[];
  relevantJobIds: string[];
  relevantEducations: string[];
}

// Simplified analysis (free sample)
export interface SimplifiedAnalysisResult {
  skills: string[];
  experience: string[];
  education: string[];
  summary_sv: string;
  gap_items: string[]; // Top 3 only
  isFreeSample: true;
}

// Full analysis (paid)
export interface FullAnalysisResult {
  skills: string[];
  experience: string[];
  education: string[];
  gap_summary_sv: string;
  recommendations: string[];
  matched_occupations: string[];
  education_paths: string[];
  isFreeSample: false;
}

export interface AnalysisRequest {
  cvText: string;
  profileId: string;
  isFreeSample: boolean;
}

export interface AnalysisResponse {
  skills: string[];
  experience: string[];
  education: string[];
  gapSummary: string;
  recommendations: string[];
  matchedOccupations: string[];
  educationPaths: string[];
  isFreeSample: boolean;
}

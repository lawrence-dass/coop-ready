// Keyword Analysis Types for ATS Scoring
// Story 5.1: Implement Keyword Analysis

export enum KeywordCategory {
  SKILLS = 'skills',
  TECHNOLOGIES = 'technologies',
  QUALIFICATIONS = 'qualifications',
  EXPERIENCE = 'experience',
  SOFT_SKILLS = 'soft_skills',
  CERTIFICATIONS = 'certifications'
}

export interface ExtractedKeyword {
  keyword: string;
  category: KeywordCategory;
  importance: 'high' | 'medium' | 'low'; // How critical for the job
}

export interface ExtractedKeywords {
  keywords: ExtractedKeyword[];
  totalCount: number;
}

export interface MatchedKeyword {
  keyword: string;
  category: KeywordCategory;
  found: boolean;
  context?: string; // Where in resume it was found
  matchType: 'exact' | 'fuzzy' | 'semantic'; // How it matched
}

export interface KeywordAnalysisResult {
  matched: MatchedKeyword[]; // Keywords found in resume
  missing: ExtractedKeyword[]; // Keywords not in resume (gaps)
  matchRate: number; // Percentage (0-100)
  analyzedAt: string; // ISO timestamp
}

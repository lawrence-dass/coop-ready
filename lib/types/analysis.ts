/**
 * ATS Analysis Type Definitions
 *
 * @see Story 4.2: ATS Score Calculation
 * @see Story 4.3: Missing Keywords Detection
 */

/**
 * Score breakdown by analysis category
 * Total percentages: Keywords (40%) + Skills (30%) + Experience (20%) + Format (10%) = 100%
 */
export interface ScoreBreakdown {
  keywords: number // 0-100 score for keyword density and match
  skills: number // 0-100 score for skills alignment
  experience: number // 0-100 score for experience relevance
  format: number // 0-100 score for ATS-parseable formatting
}

/**
 * Keyword found in resume
 */
export interface Keyword {
  keyword: string // The keyword text
  frequency: number // How many times it appears in job description
  variant?: string // If matched via variant (e.g., "JS" matched "JavaScript")
}

/**
 * Keyword missing from resume
 */
export interface MissingKeyword {
  keyword: string // The missing keyword text
  frequency: number // How many times it appears in job description
  priority: 'high' | 'medium' | 'low' // Importance level
}

/**
 * Result from keyword extraction
 */
export interface KeywordExtractionResult {
  keywordsFound: Keyword[] // Keywords present in resume
  keywordsMissing: MissingKeyword[] // Keywords missing from resume
  majorKeywordsCoverage: number // Percentage of high-priority keywords found (0-100)
}

/**
 * Combined keyword analysis data
 */
export interface KeywordAnalysis extends KeywordExtractionResult {
  allMajorKeywordsPresent: boolean // True if majorKeywordsCoverage >= 90
}

/**
 * Result from ATS analysis
 */
export interface AnalysisResult {
  overallScore: number // 0-100 overall ATS compatibility score
  scoreBreakdown: ScoreBreakdown
  justification: string // Brief explanation of the score
  strengths: string[] // What's working well (max 5 items)
  weaknesses: string[] // Areas to improve (max 5 items)
  keywords?: KeywordAnalysis // Keyword extraction results (added in Story 4.3)
  sectionScores?: SectionScores // Section-level scores (added in Story 4.4)
}

/**
 * Input for runAnalysis Server Action
 */
export interface AnalysisInput {
  scanId: string // UUID of the scan to analyze
}

/**
 * Complete scan record from database
 * Transformed from snake_case DB columns to camelCase
 */
export interface ScanRecord {
  id: string
  userId: string
  resumeId: string | null
  jobDescription: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  atsScore: number | null
  scoreJustification: string | null
  keywordsFound: Keyword[] | null // Added in Story 4.3
  keywordsMissing: MissingKeyword[] | null // Added in Story 4.3
  sectionScores: SectionScores | null // Added in Story 4.4
  createdAt: string
  updatedAt: string
}

/**
 * User profile data for context-aware analysis
 */
export interface UserProfile {
  experienceLevel: 'student' | 'career_changer' | 'experienced'
  targetRole: string
}

/**
 * Analysis context combining resume, JD, and user profile
 */
export interface AnalysisContext {
  resumeText: string
  jobDescription: string
  userProfile: UserProfile
}

/**
 * Resume section names that can be scored
 * Story: 4.4 - Section-Level Score Breakdown
 */
export type ScoredSection = 'experience' | 'education' | 'skills' | 'projects' | 'summary'

/**
 * Section-level score with explanation
 * Story: 4.4 - Section-Level Score Breakdown
 */
export interface SectionScore {
  score: number // 0-100 score for this section
  explanation: string // 2-3 sentence explanation
  strengths: string[] // What's working well in this section
  weaknesses: string[] // Specific issues to address
}

/**
 * Section scores object - only includes sections that exist in resume
 * Story: 4.4 - Section-Level Score Breakdown
 */
export interface SectionScores {
  experience?: SectionScore
  education?: SectionScore
  skills?: SectionScore
  projects?: SectionScore
  summary?: SectionScore
}

/**
 * Result from section scores parsing
 * Story: 4.4 - Section-Level Score Breakdown
 */
export interface SectionScoresResult {
  sectionScores: SectionScores
}

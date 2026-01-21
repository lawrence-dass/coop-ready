/**
 * ATS Analysis Type Definitions
 *
 * @see Story 4.2: ATS Score Calculation
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
 * Result from ATS analysis
 */
export interface AnalysisResult {
  overallScore: number // 0-100 overall ATS compatibility score
  scoreBreakdown: ScoreBreakdown
  justification: string // Brief explanation of the score
  strengths: string[] // What's working well (max 5 items)
  weaknesses: string[] // Areas to improve (max 5 items)
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

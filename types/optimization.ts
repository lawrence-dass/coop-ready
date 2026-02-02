/**
 * Domain Types for Resume Optimization
 *
 * These types represent the core data structures used throughout the application.
 * All types use camelCase to match TypeScript conventions (DB uses snake_case).
 */

import type { KeywordAnalysisResult, ATSScore } from './analysis';
import type { ATSScoreV21 } from '@/lib/scoring/types';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from './suggestions';

// ============================================================================
// RESUME TYPES
// ============================================================================

/**
 * Parsed resume content structure
 *
 * This represents the extracted and structured resume data after parsing.
 * The raw text is stored as-is; section parsing happens in Epic 3.5.
 */
export interface Resume {
  /** Full raw text extracted from PDF/DOCX */
  rawText: string;

  /** Professional summary/objective section (optional) */
  summary?: string;

  /** Skills section content */
  skills?: string;

  /** Work experience section */
  experience?: string;

  /** Education section */
  education?: string;

  /** Original filename for reference */
  filename?: string;

  /** File size in bytes */
  fileSize?: number;

  /** When the resume was uploaded */
  uploadedAt?: Date;
}

// ============================================================================
// JOB DESCRIPTION TYPES
// ============================================================================

/**
 * Job description input structure
 *
 * Represents the job posting the user wants to optimize their resume for.
 */
export interface JobDescription {
  /** Full text of the job description */
  content: string;

  /** Job title (extracted from content or user-provided) */
  title?: string;

  /** Company name (optional) */
  company?: string;

  /** When the JD was added */
  addedAt?: Date;
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

/**
 * Keyword analysis result structure
 *
 * Represents the output of ATS keyword matching analysis (Epic 5).
 */
export interface AnalysisResult {
  /** Keywords found in both resume and JD */
  matchedKeywords: string[];

  /** Important keywords in JD but missing from resume */
  missingKeywords: string[];

  /** Overall ATS compatibility score (0-100) */
  score: number;

  /** Breakdown of score by category */
  breakdown: {
    keywordMatch: number;    // 0-40 points
    skillsMatch: number;      // 0-30 points
    experienceMatch: number;  // 0-30 points
  };

  /** Gap analysis details */
  gaps: Array<{
    category: 'skills' | 'experience' | 'keywords';
    severity: 'high' | 'medium' | 'low';
    description: string;
    missingItems: string[];
  }>;

  /** When the analysis was performed */
  analyzedAt: Date;
}

// ============================================================================
// SUGGESTION TYPES
// ============================================================================

/**
 * Single optimization suggestion structure
 *
 * Represents one LLM-generated suggestion for improving the resume.
 */
export interface Suggestion {
  /** Unique identifier for this suggestion */
  id: string;

  /** Which resume section this applies to */
  section: 'summary' | 'skills' | 'experience' | 'education';

  /** Original text from resume (if replacing existing content) */
  originalText?: string;

  /** Suggested replacement or addition */
  suggestedText: string;

  /** Explanation of why this suggestion helps */
  reason: string;

  /** Impact score (0-100) - how much this improves ATS score */
  pointValue: number;

  /** User feedback on this suggestion (if provided) */
  feedback?: 'helpful' | 'not-helpful';

  /** When this suggestion was generated */
  createdAt: Date;
}

/**
 * Collection of suggestions grouped by section
 */
export interface SuggestionSet {
  summary: Suggestion[];
  skills: Suggestion[];
  experience: Suggestion[];
  education: Suggestion[];
}

// ============================================================================
// SESSION TYPES
// ============================================================================

// ============================================================================
// FEEDBACK TYPES (Story 7.4)
// ============================================================================

/**
 * Feedback for a single suggestion
 *
 * Tracks user satisfaction with individual suggestions for future analytics.
 * Stored as a JSONB array in the sessions table.
 */
export interface SuggestionFeedback {
  /** Unique identifier for the suggestion (section + index based) */
  suggestionId: string;

  /** Which resume section this suggestion belongs to */
  sectionType: 'summary' | 'skills' | 'experience' | 'education';

  /** true = helpful (thumbs up), false = not helpful (thumbs down) */
  helpful: boolean;

  /** When the feedback was recorded (ISO timestamp) */
  recordedAt: string;

  /** Session ID for analytics (links to session) */
  sessionId: string;
}

/**
 * Complete optimization session structure
 *
 * Represents all data for a single resume optimization session.
 * This maps to the `sessions` table in Supabase.
 *
 * **Database Transform Note:**
 * When reading from DB, convert snake_case → camelCase:
 * - `resume_content` → resumeContent
 * - `jd_content` → jobDescription
 * - `analysis` → analysisResult
 * - `suggestions` → suggestions
 * - `feedback` → feedback
 */
export interface OptimizationSession {
  /** Unique session ID (UUID from database) */
  id: string;

  /** Anonymous user identifier (UUID) */
  anonymousId: string;

  /** Authenticated user ID (null for anonymous sessions) */
  userId?: string | null;

  /** Parsed resume content */
  resumeContent?: Resume | null;

  /** Job description content (Epic 4 uses string) */
  jobDescription?: string | null;

  /** Keyword analysis results */
  analysisResult?: AnalysisResult | null;

  /** Keyword analysis results (Story 5.1 - new structured format) */
  keywordAnalysis?: KeywordAnalysisResult | null;

  /** ATS compatibility score (Story 5.2) */
  atsScore?: ATSScore | null;

  /** ATS score from re-uploaded resume after applying suggestions (Story 17.1) */
  /** Note: Comparison always uses V2.1 scoring, but stored as ATSScore for DB compatibility */
  comparedAtsScore?: ATSScore | ATSScoreV21 | null;

  /** Summary section optimization suggestion (Story 6.2) */
  summarySuggestion?: SummarySuggestion | null;

  /** Skills section optimization suggestion (Story 6.3) */
  skillsSuggestion?: SkillsSuggestion | null;

  /** Experience section optimization suggestion (Story 6.4) */
  experienceSuggestion?: ExperienceSuggestion | null;

  /** Education section optimization suggestion */
  educationSuggestion?: import('./suggestions').EducationSuggestion | null;

  /** Generated optimization suggestions */
  suggestions?: SuggestionSet | null;

  /** User feedback on suggestions (Story 7.4) */
  feedback?: SuggestionFeedback[];

  /** When the session was created */
  createdAt: Date;

  /** When the session was last updated */
  updatedAt: Date;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Loading step indicators for multi-step processes
 */
export type LoadingStep =
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'generating-suggestions'
  | null;

/**
 * Resume section identifier
 */
export type ResumeSection = 'summary' | 'skills' | 'experience' | 'education';

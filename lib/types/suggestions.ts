/**
 * Suggestion Type Definitions
 *
 * Defines all types related to AI-generated suggestions for resume optimization.
 * Includes both old and new structures for backward compatibility.
 *
 * @see Story 5.1-5.5: Suggestion Generation
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

import { type SuggestionMode, type ExperienceLevel } from '@/lib/utils/suggestionCalibrator'

/**
 * Valid suggestion types
 */
export type SuggestionType =
  | 'bullet_rewrite'
  | 'skill_mapping'
  | 'action_verb'
  | 'quantification'
  | 'skill_expansion'
  | 'format'
  | 'removal'

/**
 * Valid suggestion urgency levels
 */
export type SuggestionUrgency = 'low' | 'medium' | 'high' | 'critical'

/**
 * Valid resume sections
 */
export type ResumeSection = 'experience' | 'education' | 'projects' | 'skills' | 'format'

/**
 * Inference signals used to calibrate suggestions
 * Part of Story 9.2
 */
export interface InferenceSignals {
  atsScore: number
  experienceLevel: ExperienceLevel
  missingKeywordsCount: number
  quantificationDensity: number
}

/**
 * Base suggestion with core fields
 * Compatible with all suggestion types
 */
export interface BaseSuggestion {
  id?: string // Database ID (optional for new suggestions)
  type: SuggestionType
  section: ResumeSection
  originalText: string
  suggestedText: string | null // null for removal suggestions
  reasoning: string
  urgency: SuggestionUrgency
}

/**
 * Suggestion with calibration metadata (V2)
 * Includes inference context for analyzing suggestion quality
 *
 * Story 9.2: Inference-Based Suggestion Calibration
 */
export interface CalibrationSuggestion extends BaseSuggestion {
  // Calibration context - why this suggestion was generated
  suggestionMode: SuggestionMode
  inferenceSignals: InferenceSignals
}

/**
 * Suggestion without calibration metadata (V1 - legacy)
 * Used for backward compatibility with existing suggestions
 */
export type LegacySuggestion = BaseSuggestion

/**
 * Union type for any suggestion (V1 or V2)
 */
export type Suggestion = LegacySuggestion | CalibrationSuggestion

/**
 * Type guard: Check if suggestion has calibration metadata (V2)
 */
export function isCalibrationSuggestion(
  suggestion: BaseSuggestion
): suggestion is CalibrationSuggestion {
  const s = suggestion as any
  return (
    s.suggestionMode !== undefined &&
    s.inferenceSignals !== undefined &&
    ['Transformation', 'Improvement', 'Optimization', 'Validation'].includes(s.suggestionMode)
  )
}

/**
 * Type guard: Check if suggestion is legacy (V1)
 */
export function isLegacySuggestion(suggestion: BaseSuggestion): suggestion is LegacySuggestion {
  return !isCalibrationSuggestion(suggestion)
}

/**
 * Suggestions response with calibration metadata
 */
export interface SuggestionsResponse {
  suggestions: Suggestion[]
  calibration?: {
    mode: SuggestionMode
    targetCount: number
    focusAreas: string[]
  }
  totalCount: number
  acceptedCount: number
  rejectedCount: number
  pendingCount: number
}

/**
 * Input for saving suggestions to database
 */
export interface SaveSuggestionInput {
  section: ResumeSection
  itemIndex: number
  originalText: string
  suggestedText: string | null
  suggestionType: SuggestionType
  reasoning?: string
  urgency?: SuggestionUrgency
  // Optional calibration fields (Story 9.2)
  suggestionMode?: SuggestionMode
  inferenceSignals?: InferenceSignals
}

/**
 * Database suggestion record (snake_case format)
 */
export interface DatabaseSuggestion {
  id: string
  scan_id: string
  section: ResumeSection
  item_index: number
  original_text: string
  suggested_text: string | null
  suggestion_type: SuggestionType
  reasoning: string | null
  urgency: SuggestionUrgency
  status: 'pending' | 'accepted' | 'rejected'
  // Optional calibration fields (Story 9.2)
  suggestion_mode?: SuggestionMode
  inference_signals?: InferenceSignals // JSONB in database
  created_at: string
  updated_at: string
}

/**
 * Suggestion summary (aggregated counts by status)
 */
export interface SuggestionSummary {
  total: number
  pending: number
  accepted: number
  rejected: number
}

/**
 * Grouped suggestions for display (by section)
 */
export interface SuggestionsGrouped {
  [section: string]: Suggestion[]
}

/**
 * Validation for suggestion urgency boost
 * Used in calibration to adjust urgency based on signals
 */
export interface UrgencyBoost {
  keyword: number // -2 to +2
  quantification: number // -2 to +2
  experience: number // -1 to +1
}

/**
 * Context for generating suggestions
 * Combines user profile, analysis results, and calibration
 */
export interface SuggestionContext {
  scanId: string
  resumeText: string
  jobDescription: string
  userExperienceLevel: ExperienceLevel
  targetRole?: string
  atsScore: number
  missingKeywordsCount: number
  quantificationDensity: number
  calibrationMode?: SuggestionMode
}

/**
 * Validation schema for suggestion urgency
 */
export const validUrgencies = ['low', 'medium', 'high', 'critical'] as const

/**
 * Validation function for urgency
 */
export function isValidUrgency(value: unknown): value is SuggestionUrgency {
  return typeof value === 'string' && validUrgencies.includes(value as SuggestionUrgency)
}

/**
 * Validation schema for suggestion types
 */
export const validSuggestionTypes = [
  'bullet_rewrite',
  'skill_mapping',
  'action_verb',
  'quantification',
  'skill_expansion',
  'format',
  'removal',
] as const

/**
 * Validation function for suggestion type
 */
export function isValidSuggestionType(value: unknown): value is SuggestionType {
  return typeof value === 'string' && validSuggestionTypes.includes(value as SuggestionType)
}

/**
 * Validation schema for resume sections
 */
export const validResumeSections = [
  'experience',
  'education',
  'projects',
  'skills',
  'format',
] as const

/**
 * Validation function for resume section
 */
export function isValidResumeSection(value: unknown): value is ResumeSection {
  return typeof value === 'string' && validResumeSections.includes(value as ResumeSection)
}

/**
 * Suggestion Calibrator
 *
 * Infers calibration for AI-generated suggestions based on available signals:
 * - ATS Score (determines suggestion mode/intensity)
 * - User Experience Level (shapes suggestion types and focus areas)
 * - Missing Keywords Count (prioritizes keyword suggestions)
 * - Quantification Density (adjusts quantification prompt frequency)
 *
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

export type SuggestionMode = 'Transformation' | 'Improvement' | 'Optimization' | 'Validation'
export type ExperienceLevel = 'student' | 'career_changer' | 'experienced'

/**
 * Signals used to calibrate suggestions
 */
export interface CalibrationSignals {
  atsScore: number // 0-100
  experienceLevel: ExperienceLevel
  missingKeywordsCount: number // 0+
  quantificationDensity: number // 0-100
  totalBullets: number // For context
}

/**
 * Result of calibration
 */
export interface CalibrationResult {
  mode: SuggestionMode
  suggestionsTargetCount: number // How many suggestions to aim for
  priorityBoosts: {
    keyword: number // +/- urgency boost for keyword suggestions
    quantification: number
    experience: number
  }
  focusAreas: string[] // ['keywords', 'quantification', 'leadership', etc]
  reasoning: string // Explanation for calibration chosen
}

/**
 * Determine suggestion mode based on ATS score
 *
 * Ranges:
 * - 0-30: Transformation (poor, needs major changes)
 * - 30-50: Improvement (fair, has gaps)
 * - 50-70: Optimization (good, needs polish)
 * - 70+: Validation (excellent, minimal feedback)
 */
export function getSuggestionMode(atsScore: number): SuggestionMode {
  if (atsScore < 30) return 'Transformation'
  if (atsScore < 50) return 'Improvement'
  if (atsScore < 70) return 'Optimization'
  return 'Validation'
}

/**
 * Get target suggestion count based on mode
 *
 * Transformation: 8-12 suggestions
 * Improvement: 5-8 suggestions
 * Optimization: 3-5 suggestions
 * Validation: 1-2 suggestions
 */
export function getTargetSuggestionCount(mode: SuggestionMode): { min: number; max: number } {
  switch (mode) {
    case 'Transformation':
      return { min: 8, max: 12 }
    case 'Improvement':
      return { min: 5, max: 8 }
    case 'Optimization':
      return { min: 3, max: 5 }
    case 'Validation':
      return { min: 1, max: 2 }
  }
}

/**
 * Determine focus areas based on experience level
 * Focus areas guide which suggestion types to prioritize
 */
export function getFocusAreasByExperience(level: ExperienceLevel): string[] {
  switch (level) {
    case 'student':
      return ['quantification_projects', 'academic_framing', 'gpa_guidance', 'skill_expansion']
    case 'career_changer':
      return ['skill_mapping', 'transferable_language', 'bridge_statements', 'section_reordering']
    case 'experienced':
      return ['leadership_language', 'scope_amplification', 'metric_enhancement', 'format_polish']
  }
}

/**
 * Calculate urgency boost for keyword suggestions based on missing count
 *
 * 5+ keywords missing: +2 urgency boost (high priority)
 * 2-4 keywords missing: +1 urgency boost (medium priority)
 * 0-1 keywords missing: 0 urgency boost (focus shifts to other areas)
 */
export function getKeywordUrgencyBoost(missingKeywordsCount: number): number {
  if (missingKeywordsCount >= 5) return 2
  if (missingKeywordsCount >= 2) return 1
  return 0
}

/**
 * Calculate urgency boost for quantification suggestions based on density
 *
 * < 30%: +2 boost (critical)
 * 30-50%: +1 boost (high)
 * 50-80%: 0 boost (normal)
 * 80+%: -1 boost (lower priority, already strong)
 */
export function getQuantificationUrgencyBoost(density: number): number {
  if (density < 30) return 2
  if (density < 50) return 1
  if (density < 80) return 0
  return -1 // Deprioritize if already strong
}

/**
 * Calibrate suggestions based on all available signals
 *
 * Returns calibration configuration to guide suggestion generation
 */
export function calibrateSuggestions(signals: CalibrationSignals): CalibrationResult {
  const mode = getSuggestionMode(signals.atsScore)
  const targetCountRange = getTargetSuggestionCount(mode)
  const avgTargetCount = Math.floor((targetCountRange.min + targetCountRange.max) / 2)

  const focusAreas = getFocusAreasByExperience(signals.experienceLevel)
  const keywordBoost = getKeywordUrgencyBoost(signals.missingKeywordsCount)
  const quantificationBoost = getQuantificationUrgencyBoost(signals.quantificationDensity)

  // Experience boost is always based on mode
  const experienceBoost = mode === 'Transformation' ? 1 : mode === 'Improvement' ? 0 : -1

  // Build reasoning
  const reasoningParts = [
    `ATS Score ${signals.atsScore} → ${mode} mode`,
    `${signals.missingKeywordsCount} missing keywords ${keywordBoost > 0 ? `(+${keywordBoost} urgency)` : '(focus shift)'}`,
    `${signals.quantificationDensity}% quantification ${quantificationBoost > 0 ? `(+${quantificationBoost} urgency)` : quantificationBoost < 0 ? '(-depriorize)' : '(balanced)'}`,
  ]

  return {
    mode,
    suggestionsTargetCount: avgTargetCount,
    priorityBoosts: {
      keyword: keywordBoost,
      quantification: quantificationBoost,
      experience: experienceBoost,
    },
    focusAreas,
    reasoning: reasoningParts.join(' | '),
  }
}

/**
 * Get human-readable description of a suggestion mode
 */
export function getSuggestionModeDescription(mode: SuggestionMode): string {
  switch (mode) {
    case 'Transformation':
      return 'Your resume needs significant improvements to be competitive. Focus on major changes.'
    case 'Improvement':
      return 'Your resume has a solid foundation. Let\'s address the key gaps.'
    case 'Optimization':
      return 'Your resume is strong. Let\'s refine it for maximum impact.'
    case 'Validation':
      return 'Your resume is excellent. Here are a few refinements to consider.'
  }
}

/**
 * Get human-readable description of focus areas
 */
export function getFocusAreasDescription(areas: string[]): string {
  const descriptions: Record<string, string> = {
    quantification_projects: 'Adding metrics to project work',
    academic_framing: 'Framing academic work professionally',
    gpa_guidance: 'Strategically using GPA',
    skill_expansion: 'Expanding technical skills',
    skill_mapping: 'Mapping skills to target role',
    transferable_language: 'Using transferable skill language',
    bridge_statements: 'Creating career transition bridges',
    section_reordering: 'Reorganizing resume sections',
    leadership_language: 'Emphasizing leadership and scope',
    scope_amplification: 'Highlighting impact and scope',
    metric_enhancement: 'Strengthening metrics and numbers',
    format_polish: 'Refining presentation and conciseness',
  }

  return areas.map((area) => descriptions[area] || area).join(', ')
}

/**
 * Validate calibration signals
 * Returns array of validation errors (empty if valid)
 */
export function validateCalibrationSignals(signals: CalibrationSignals): string[] {
  const errors: string[] = []

  if (signals.atsScore < 0 || signals.atsScore > 100) {
    errors.push('ATS score must be between 0-100')
  }

  if (!['student', 'career_changer', 'experienced'].includes(signals.experienceLevel)) {
    errors.push(
      `Invalid experience level: ${signals.experienceLevel}. Must be student, career_changer, or experienced`
    )
  }

  if (signals.missingKeywordsCount < 0) {
    errors.push('Missing keywords count cannot be negative')
  }

  if (signals.quantificationDensity < 0 || signals.quantificationDensity > 100) {
    errors.push('Quantification density must be between 0-100')
  }

  if (signals.totalBullets <= 0) {
    errors.push('Total bullets must be greater than 0')
  }

  return errors
}

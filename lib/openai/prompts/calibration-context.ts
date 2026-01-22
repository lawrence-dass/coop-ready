/**
 * Calibration Context for AI Prompts
 *
 * Shared types for passing calibration metadata to suggestion generation prompts.
 * Story 9.2: Inference-Based Suggestion Calibration
 */

import type { SuggestionMode, ExperienceLevel } from '@/lib/utils/suggestionCalibrator'

/**
 * Calibration context passed to all prompt generators
 * Informs AI about the user's calibration mode and focus areas
 */
export interface CalibrationContext {
  /**
   * Suggestion mode based on ATS score
   * - Transformation: 0-30 ATS (needs major changes)
   * - Improvement: 30-50 ATS (has gaps)
   * - Optimization: 50-70 ATS (needs polish)
   * - Validation: 70+ ATS (minimal feedback)
   */
  mode: SuggestionMode

  /**
   * User's experience level
   * - student: Academic focus, projects, GPA
   * - career_changer: Skill mapping, transferable language
   * - experienced: Leadership, scope, metrics
   */
  experienceLevel: ExperienceLevel

  /**
   * Focus areas specific to this user
   * e.g., ['quantification_projects', 'academic_framing', 'skill_expansion']
   */
  focusAreas: string[]

  /**
   * Urgency boosts for different suggestion types
   * Positive values = more urgent, negative = less urgent
   */
  urgencyBoosts?: {
    keyword: number // +2 to -1
    quantification: number // +2 to -1
    experience: number // +1 to -1
  }
}

/**
 * Get mode-specific instruction text for prompts
 */
export function getModeInstructions(mode: SuggestionMode): string {
  switch (mode) {
    case 'Transformation':
      return `CALIBRATION MODE: Transformation (ATS score 0-30)

The resume needs significant improvements. Be more aggressive with suggestions:
- Suggest comprehensive rewrites for weak bullets
- Prioritize adding quantification and metrics
- Focus on impact-driven language
- Suggest replacing vague descriptions with concrete achievements
- Higher urgency for keyword alignment
- More suggestions overall (aim for 8-12 total)`

    case 'Improvement':
      return `CALIBRATION MODE: Improvement (ATS score 30-50)

The resume has a solid foundation but has gaps. Provide balanced suggestions:
- Mix of comprehensive and minor improvements
- Address missing keywords strategically
- Enhance existing metrics where applicable
- Moderate urgency distribution
- Target 5-8 suggestions focusing on key gaps`

    case 'Optimization':
      return `CALIBRATION MODE: Optimization (ATS score 50-70)

The resume is strong. Focus on polish and refinement:
- Suggest minor improvements and refinements
- Fine-tune language for maximum impact
- Polish metrics presentation
- Lower urgency, emphasize optional improvements
- Target 3-5 high-value suggestions`

    case 'Validation':
      return `CALIBRATION MODE: Validation (ATS score 70+)

The resume is excellent. Provide minimal, strength-focused feedback:
- Acknowledge what's working well
- Suggest only 1-2 optional refinements if any
- Emphasize strengths in reasoning
- Very low urgency
- Focus on validating strong performance`
  }
}

/**
 * Get experience-level-specific instruction text
 */
export function getExperienceLevelInstructions(level: ExperienceLevel): string {
  switch (level) {
    case 'student':
      return `EXPERIENCE LEVEL: Student

Focus on:
- Translating academic work into professional language
- Quantifying project work (lines of code, team size, complexity)
- Framing coursework as practical experience
- GPA guidance (include if >= 3.5, omit if lower)
- Emphasizing technical skills and tools learned
- Academic achievements that demonstrate technical capability`

    case 'career_changer':
      return `EXPERIENCE LEVEL: Career Changer

Focus on:
- Mapping non-tech skills to tech-industry terminology
- Highlighting transferable skills (problem-solving, systems thinking, team leadership)
- Creating bridge statements connecting previous role to target role
- Emphasizing any technical training or projects
- Reframing operational/business experience as technical capability
- Building confidence in career transition narrative`

    case 'experienced':
      return `EXPERIENCE LEVEL: Experienced Professional

Focus on:
- Leadership and scope of influence
- Emphasizing metrics and business impact
- Architectural and strategic decision-making
- Scale and complexity of systems/teams managed
- Conciseness and high-level impact statements
- Format polish and professional presentation`
  }
}

/**
 * Build calibration instructions for prompt
 */
export function buildCalibrationInstructions(context: CalibrationContext): string {
  const modeInstructions = getModeInstructions(context.mode)
  const levelInstructions = getExperienceLevelInstructions(context.experienceLevel)

  let instructions = `${modeInstructions}

${levelInstructions}`

  if (context.focusAreas.length > 0) {
    instructions += `

PRIORITY FOCUS AREAS for this user:
${context.focusAreas.map((area) => `- ${area.replace(/_/g, ' ')}`).join('\n')}`
  }

  if (context.urgencyBoosts) {
    const boosts = context.urgencyBoosts
    if (boosts.keyword > 0) {
      instructions += `\n\nKEYWORD PRIORITY: HIGH (${boosts.keyword >= 2 ? 'Critical' : 'Important'}) - User has significant keyword gaps`
    }
    if (boosts.quantification > 0) {
      instructions += `\n\nQUANTIFICATION PRIORITY: HIGH (${boosts.quantification >= 2 ? 'Critical' : 'Important'}) - Resume lacks metrics`
    }
  }

  return instructions
}

/**
 * Candidate Type Detection
 *
 * Story: 18.1 - Candidate Type Detection & Classification
 *
 * Determines candidate type (coop, fulltime, career_changer) using a 6-priority
 * detection chain. This is a pure, deterministic function with no side effects.
 *
 * Priority Chain:
 * 1. User explicit selection (userJobType === 'coop') → coop (1.0 confidence)
 * 2. Fulltime + switching careers → career_changer (0.95 confidence)
 * 3. Fulltime + education + <3 roles → career_changer (0.7 confidence)
 * 4. Auto-detect: <2 roles + education → coop (0.8 confidence)
 * 5. Auto-detect: 3+ roles + 3+ years → fulltime (0.85 confidence)
 * 6. Default fallback → fulltime (0.5 confidence)
 */

import type {
  CandidateTypeInput,
  CandidateTypeResult,
} from './types';

/** Clamp a number to a minimum of 0 */
function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value;
}

/**
 * Detects candidate type based on user preferences and resume data
 *
 * @param input - User preferences and resume analysis data
 * @returns Candidate type with confidence score and detection source
 *
 * @example
 * ```typescript
 * const result = detectCandidateType({
 *   userJobType: 'coop',
 *   resumeRoleCount: 0,
 *   hasActiveEducation: true
 * });
 * // { candidateType: 'coop', confidence: 1.0, detectedFrom: 'user_selection' }
 * ```
 */
export function detectCandidateType(
  input: CandidateTypeInput
): CandidateTypeResult {
  const {
    userJobType,
    careerGoal,
    resumeRoleCount: rawRoleCount = 0,
    hasActiveEducation = false,
    totalExperienceYears: rawExperienceYears = 0,
  } = input;

  const resumeRoleCount = clampNonNegative(rawRoleCount);
  const totalExperienceYears = clampNonNegative(rawExperienceYears);

  // Priority 1: User explicitly selected co-op (highest confidence)
  if (userJobType === 'coop') {
    return {
      candidateType: 'coop',
      confidence: 1.0,
      detectedFrom: 'user_selection',
    };
  }

  // Priority 2: User selected fulltime + switching careers (from onboarding)
  if (userJobType === 'fulltime' && careerGoal === 'switching-careers') {
    return {
      candidateType: 'career_changer',
      confidence: 0.95,
      detectedFrom: 'onboarding',
    };
  }

  // Priority 3: Fulltime + active education + few roles = career changer
  // (e.g., going back to school, bootcamp grad entering tech)
  if (
    userJobType === 'fulltime' &&
    hasActiveEducation &&
    resumeRoleCount < 3
  ) {
    return {
      candidateType: 'career_changer',
      confidence: 0.7,
      detectedFrom: 'resume_analysis',
    };
  }

  // Priority 3.5: User explicitly selected fulltime (no career-changer signals matched above)
  if (userJobType === 'fulltime') {
    return {
      candidateType: 'fulltime',
      confidence: 0.9,
      detectedFrom: 'user_selection',
    };
  }

  // Priority 4: Auto-detect co-op candidate (no user selection)
  // Student with minimal/no experience
  if (!userJobType && resumeRoleCount < 2 && hasActiveEducation) {
    return {
      candidateType: 'coop',
      confidence: 0.8,
      detectedFrom: 'resume_analysis',
    };
  }

  // Priority 5: Auto-detect experienced fulltime candidate
  // Multiple roles + significant experience
  if (
    !userJobType &&
    resumeRoleCount >= 3 &&
    totalExperienceYears >= 3
  ) {
    return {
      candidateType: 'fulltime',
      confidence: 0.85,
      detectedFrom: 'resume_analysis',
    };
  }

  // Priority 6: Default fallback (lowest confidence)
  return {
    candidateType: 'fulltime',
    confidence: 0.5,
    detectedFrom: 'default',
  };
}

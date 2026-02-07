/**
 * Section Ordering Engine (Story 18.3)
 *
 * Validates resume section ordering against recommended structures per candidate type.
 * Provides deterministic validation with no LLM or database calls.
 */

import type { CandidateType } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section ordering violation detected during validation
 */
export interface SectionOrderViolation {
  /** Section name that violates ordering */
  section: string;
  /** Expected position (0-indexed) */
  expectedPosition: number;
  /** Actual position (0-indexed) */
  actualPosition: number;
  /** Human-readable description of the violation */
  description: string;
}

/**
 * Result of section order validation
 */
export interface SectionOrderValidation {
  /** Whether the section order matches the recommendation */
  isCorrectOrder: boolean;
  /** List of ordering violations (empty if correct) */
  violations: SectionOrderViolation[];
  /** Recommended section order for the candidate type */
  recommendedOrder: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Recommended section ordering per candidate type.
 * Based on KB Sections 3, 4, and the Career Changer Hybrid Structure.
 * Note: 'header' is NOT included - it's always first and not a parsed section.
 */
export const RECOMMENDED_ORDER: Record<CandidateType, string[]> = {
  coop: ['skills', 'education', 'projects', 'experience', 'certifications'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience', 'certifications'],
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Validates that resume sections are ordered according to the recommended structure
 * for the given candidate type.
 *
 * @param presentSections - Array of section names in the order they appear in the resume
 * @param candidateType - Detected candidate type (coop, fulltime, career_changer)
 * @returns Validation result with violations and recommendations
 *
 * @example
 * ```typescript
 * const result = validateSectionOrder(
 *   ['experience', 'education', 'skills'],
 *   'coop'
 * );
 * // result.isCorrectOrder === false
 * // result.violations.length > 0
 * // result.recommendedOrder === ['skills', 'education', 'projects', 'experience', 'certifications']
 * ```
 */
export function validateSectionOrder(
  presentSections: string[],
  candidateType: CandidateType
): SectionOrderValidation {
  const recommendedOrder = RECOMMENDED_ORDER[candidateType];
  const violations: SectionOrderViolation[] = [];

  // Handle edge case: empty sections array
  if (presentSections.length === 0) {
    return {
      isCorrectOrder: true, // Vacuously true - no sections to violate
      violations: [],
      recommendedOrder,
    };
  }

  // Handle edge case: single section present
  if (presentSections.length === 1) {
    return {
      isCorrectOrder: true, // Single section can't violate ordering
      violations: [],
      recommendedOrder,
    };
  }

  // Filter recommended order to only include sections that are actually present
  const relevantRecommendedOrder = recommendedOrder.filter((section) =>
    presentSections.includes(section)
  );

  // Build expected position map from filtered recommended order
  const expectedPositionMap: Record<string, number> = {};
  relevantRecommendedOrder.forEach((section, index) => {
    expectedPositionMap[section] = index;
  });

  // Filter to only known sections to avoid false violations from custom/unknown sections
  const knownPresentSections = presentSections.filter(
    (section) => section in expectedPositionMap
  );

  // Check each known section against expected ordering
  knownPresentSections.forEach((section, actualIndex) => {
    const expectedIndex = expectedPositionMap[section];

    // Detect ordering violations
    if (actualIndex !== expectedIndex) {
      violations.push({
        section,
        expectedPosition: expectedIndex,
        actualPosition: actualIndex,
        description: `"${section}" appears at position ${actualIndex + 1} but should be at position ${expectedIndex + 1} for ${candidateType} candidates`,
      });
    }
  });

  return {
    isCorrectOrder: violations.length === 0,
    violations,
    recommendedOrder,
  };
}

/**
 * Detect the order of sections in a raw resume by finding heading patterns
 *
 * Scans resume text for section headings and returns them in order of appearance.
 * Uses regex patterns to match common section heading variations.
 *
 * @param resumeText - Raw resume content
 * @returns Array of section names in the order they appear
 *
 * Story: 18.9 Task 2 - Section order detection helper
 *
 * @example
 * ```typescript
 * const order = detectSectionOrder(resumeText);
 * // ['summary', 'skills', 'experience', 'education', 'projects']
 * ```
 */
export function detectSectionOrder(resumeText: string): string[] {
  // Section heading patterns - match common variations
  const HEADING_PATTERNS: Record<string, RegExp> = {
    summary: /\b(summary|objective|profile|about|professional summary)\b/i,
    skills: /\b(skills|technologies|technical skills|core competencies|technical competencies)\b/i,
    experience: /\b(experience|employment|work history|professional experience|work experience)\b/i,
    education: /\b(education|academic|qualifications|academic background)\b/i,
    projects: /\b(projects|project experience|technical projects|portfolio)\b/i,
    certifications: /\b(certifications|awards|licenses|honors|achievements)\b/i,
  };

  // Find first occurrence index for each section
  const sectionIndices: Array<{ section: string; index: number }> = [];

  for (const [sectionName, pattern] of Object.entries(HEADING_PATTERNS)) {
    const match = resumeText.match(pattern);
    if (match && match.index !== undefined) {
      sectionIndices.push({
        section: sectionName,
        index: match.index,
      });
    }
  }

  // Sort by index (order of appearance) and return section names
  sectionIndices.sort((a, b) => a.index - b.index);
  return sectionIndices.map((item) => item.section);
}

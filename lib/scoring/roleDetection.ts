/**
 * Role Detection for ATS V2
 *
 * Detects role type and seniority from job description
 * to apply role-specific weight adjustments.
 */

import type { RoleType, SeniorityLevel, RoleDetectionResult } from './types';
import { ROLE_KEYWORDS, SENIORITY_KEYWORDS, COMPONENT_WEIGHTS } from './constants';

/**
 * Detect role type from job description
 *
 * Uses keyword matching to identify the role category
 */
function detectRoleType(jdContent: string): {
  roleType: RoleType;
  confidence: number;
} {
  const lowerJD = jdContent.toLowerCase();
  let bestMatch: RoleType = 'general';
  let bestScore = 0;

  for (const [roleType, keywords] of Object.entries(ROLE_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (lowerJD.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Calculate score as percentage of keywords matched
    const score = keywords.length > 0 ? matchCount / keywords.length : 0;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = roleType as RoleType;
    }
  }

  return {
    roleType: bestMatch,
    confidence: bestScore,
  };
}

/**
 * Detect seniority level from job description
 *
 * Uses keyword matching to identify experience level
 */
function detectSeniorityLevel(jdContent: string): {
  seniorityLevel: SeniorityLevel;
  confidence: number;
} {
  const lowerJD = jdContent.toLowerCase();
  let bestMatch: SeniorityLevel = 'mid'; // Default to mid-level
  let bestScore = 0;

  for (const [level, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (lowerJD.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Calculate score as percentage of keywords matched
    const score = keywords.length > 0 ? matchCount / keywords.length : 0;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = level as SeniorityLevel;
    }
  }

  return {
    seniorityLevel: bestMatch,
    confidence: bestScore,
  };
}

/**
 * Get role-specific weight adjustments
 *
 * Different roles may prioritize different aspects of a resume.
 * For example:
 * - Technical roles: Higher keyword weight (technical skills matter more)
 * - Leadership roles: Higher experience weight (achievements matter more)
 * - Creative roles: Lower keyword weight (portfolio matters more)
 */
function getRoleWeights(
  roleType: RoleType,
  seniorityLevel: SeniorityLevel
): {
  keywords: number;
  experience: number;
  sections: number;
  format: number;
} {
  // Start with default weights (spread to mutable object)
  const weights: {
    keywords: number;
    experience: number;
    sections: number;
    format: number;
  } = {
    keywords: COMPONENT_WEIGHTS.keywords,
    experience: COMPONENT_WEIGHTS.experience,
    sections: COMPONENT_WEIGHTS.sections,
    format: COMPONENT_WEIGHTS.format,
  };

  // Adjust based on role type
  switch (roleType) {
    case 'software_engineer':
    case 'data_scientist':
      // Technical roles: Slightly higher keyword weight
      weights.keywords = 0.52;
      weights.experience = 0.18;
      weights.sections = 0.15;
      weights.format = 0.15;
      break;

    case 'product_manager':
      // PM roles: Balance keywords and experience
      weights.keywords = 0.45;
      weights.experience = 0.25;
      weights.sections = 0.15;
      weights.format = 0.15;
      break;

    case 'sales':
    case 'marketing':
      // Results-driven roles: Higher experience weight
      weights.keywords = 0.45;
      weights.experience = 0.25;
      weights.sections = 0.15;
      weights.format = 0.15;
      break;

    case 'designer':
      // Creative roles: Lower keyword emphasis
      weights.keywords = 0.45;
      weights.experience = 0.20;
      weights.sections = 0.20;
      weights.format = 0.15;
      break;

    default:
      // Keep default weights for other roles
      break;
  }

  // Adjust based on seniority level
  if (seniorityLevel === 'lead' || seniorityLevel === 'executive') {
    // Leadership roles: Higher experience weight
    weights.experience += 0.05;
    weights.keywords -= 0.05;
  } else if (seniorityLevel === 'entry') {
    // Entry level: Higher format/section weight (basics matter)
    weights.sections += 0.03;
    weights.format += 0.02;
    weights.keywords -= 0.05;
  }

  // Normalize weights to sum to 1.0
  const sum = weights.keywords + weights.experience + weights.sections + weights.format;
  weights.keywords = weights.keywords / sum;
  weights.experience = weights.experience / sum;
  weights.sections = weights.sections / sum;
  weights.format = weights.format / sum;

  return weights;
}

/**
 * Detect role and seniority from job description
 *
 * Returns role context with appropriate weight adjustments.
 *
 * @param jdContent - Job description text
 * @returns RoleDetectionResult with role, seniority, and adjusted weights
 */
export function detectRole(jdContent: string): RoleDetectionResult {
  // Detect role type
  const { roleType, confidence: roleConfidence } = detectRoleType(jdContent);

  // Detect seniority level
  const { seniorityLevel, confidence: seniorityConfidence } =
    detectSeniorityLevel(jdContent);

  // Calculate overall confidence (average of both)
  const confidence = (roleConfidence + seniorityConfidence) / 2;

  // Get role-specific weights
  const weights = getRoleWeights(roleType, seniorityLevel);

  return {
    roleType,
    seniorityLevel,
    confidence,
    weights,
  };
}

/**
 * Extract role title from job description
 *
 * Attempts to find the job title from the JD content
 * (useful for action items)
 */
export function extractRoleTitle(jdContent: string): string | null {
  // Look for common patterns
  const patterns = [
    // "Job Title: Senior Software Engineer"
    /(?:job\s+title|position|role)\s*:\s*([^\n]+)/i,
    // First line that looks like a title
    /^([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Specialist))/m,
  ];

  for (const pattern of patterns) {
    const match = jdContent.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

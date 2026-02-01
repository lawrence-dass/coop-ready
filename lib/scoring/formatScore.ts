/**
 * Format Scoring for ATS V2 and V2.1
 *
 * V2 Evaluates ATS parseability signals:
 * - Contact information (email, phone)
 * - Date patterns (work history timeline)
 * - Section headers (clear organization)
 * - Bullet structure (scannable content)
 *
 * V2.1 Adds:
 * - Outdated format penalties (Objective, References)
 * - Modern format bonuses (LinkedIn, GitHub)
 * - Length appropriateness check
 */

import type { FormatScoreResult, FormatScoreResultV21 } from './types';
import {
  EMAIL_PATTERN,
  PHONE_PATTERNS,
  DATE_PATTERNS,
  SECTION_HEADER_PATTERNS,
  BULLET_PATTERNS,
  OUTDATED_FORMATS,
  MODERN_FORMAT_SIGNALS,
} from './constants';

/**
 * Check if resume contains a valid email
 */
function hasEmail(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

/**
 * Check if resume contains a phone number
 */
function hasPhone(text: string): boolean {
  return PHONE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if resume contains date patterns
 *
 * Looks for work history timeline indicators
 */
function hasDatePatterns(text: string): boolean {
  let dateCount = 0;

  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      dateCount += matches.length;
    }
  }

  // Need at least 2 dates for a proper work history
  return dateCount >= 2;
}

/**
 * Check if resume has clear section headers
 *
 * Looks for common resume section headers
 */
function hasSectionHeaders(text: string): boolean {
  let headerCount = 0;

  for (const pattern of SECTION_HEADER_PATTERNS) {
    if (pattern.test(text)) {
      headerCount++;
    }
  }

  // Need at least 2 clear section headers
  return headerCount >= 2;
}

/**
 * Check if resume has bullet point structure
 */
function hasBulletStructure(text: string): boolean {
  let bulletCount = 0;

  for (const pattern of BULLET_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      bulletCount += matches.length;
    }
  }

  // Need at least 4 bullet points for structured content
  return bulletCount >= 4;
}

/**
 * Calculate contact information score
 *
 * - Email present: 60 points
 * - Phone present: 40 points
 * - Both: 100 points
 */
function calculateContactScore(text: string): {
  score: number;
  hasEmail: boolean;
  hasPhone: boolean;
} {
  const emailPresent = hasEmail(text);
  const phonePresent = hasPhone(text);

  let score = 0;
  if (emailPresent) score += 60;
  if (phonePresent) score += 40;

  return {
    score,
    hasEmail: emailPresent,
    hasPhone: phonePresent,
  };
}

/**
 * Calculate structure score
 *
 * - Date patterns: 30 points
 * - Section headers: 35 points
 * - Bullet structure: 35 points
 */
function calculateStructureScore(text: string): {
  score: number;
  hasDatePatterns: boolean;
  hasSectionHeaders: boolean;
  hasBulletStructure: boolean;
} {
  const datePatterns = hasDatePatterns(text);
  const sectionHeaders = hasSectionHeaders(text);
  const bulletStructure = hasBulletStructure(text);

  let score = 0;
  if (datePatterns) score += 30;
  if (sectionHeaders) score += 35;
  if (bulletStructure) score += 35;

  return {
    score,
    hasDatePatterns: datePatterns,
    hasSectionHeaders: sectionHeaders,
    hasBulletStructure: bulletStructure,
  };
}

/**
 * Calculate format score for ATS V2
 *
 * Evaluates two main areas:
 * - Contact information (50% weight): email and phone
 * - Document structure (50% weight): dates, headers, bullets
 *
 * @param resumeText - Raw resume text
 * @returns FormatScoreResult with score and breakdown
 */
export function calculateFormatScore(resumeText: string): FormatScoreResult {
  // Calculate component scores
  const contactResult = calculateContactScore(resumeText);
  const structureResult = calculateStructureScore(resumeText);

  // Calculate overall score (50/50 weight)
  const overallScore = (contactResult.score + structureResult.score) / 2;

  return {
    score: Math.round(overallScore),
    hasEmail: contactResult.hasEmail,
    hasPhone: contactResult.hasPhone,
    hasDatePatterns: structureResult.hasDatePatterns,
    hasSectionHeaders: structureResult.hasSectionHeaders,
    hasBulletStructure: structureResult.hasBulletStructure,
    contactScore: contactResult.score,
    structureScore: structureResult.score,
  };
}

/**
 * Generate action items for format improvements
 *
 * @param result - Format score result
 * @returns Array of actionable suggestions
 */
export function generateFormatActionItems(result: FormatScoreResult): string[] {
  const actionItems: string[] = [];

  // Contact information issues
  if (!result.hasEmail) {
    actionItems.push('Add a professional email address to your contact information');
  }
  if (!result.hasPhone) {
    actionItems.push('Add a phone number to your contact information');
  }

  // Structure issues
  if (!result.hasDatePatterns) {
    actionItems.push('Add dates to your work experience (e.g., "Jan 2020 - Present")');
  }
  if (!result.hasSectionHeaders) {
    actionItems.push('Add clear section headers (Summary, Skills, Experience, Education)');
  }
  if (!result.hasBulletStructure) {
    actionItems.push('Use bullet points to organize your experience and achievements');
  }

  return actionItems;
}

// ============================================================================
// V2.1 FORMAT SCORING
// ============================================================================

/**
 * V2.1 Format score input
 */
export interface FormatScoreInputV21 {
  resumeText: string;
  hasExperience: boolean;
  hasSummary: boolean;
}

/**
 * Calculate format score for ATS V2.1
 *
 * Evaluates:
 * - Contact info (20%): email, phone
 * - Date recognition (15%)
 * - Section headers (15%)
 * - Bullet structure (10%)
 * - Length (10%)
 * - Outdated format penalties (20%)
 * - Modern format bonuses (10%)
 */
export function calculateFormatScoreV21(
  input: FormatScoreInputV21
): FormatScoreResultV21 {
  const { resumeText, hasExperience, hasSummary } = input;

  let score = 1.0;
  const issues: string[] = [];
  const warnings: string[] = [];

  // === CONTACT INFORMATION (20%) ===
  const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/;
  const hasEmail = emailPattern.test(resumeText);
  if (!hasEmail) {
    score -= 0.1;
    issues.push('No email address detected');
  }

  const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const hasPhone = phonePattern.test(resumeText);
  if (!hasPhone) {
    score -= 0.05;
    warnings.push('No phone number detected');
  }

  // LinkedIn (bonus for having, no penalty for missing)
  const hasLinkedIn = MODERN_FORMAT_SIGNALS.linkedin.test(resumeText);
  if (hasLinkedIn) {
    score += 0.03;
  }

  // GitHub (bonus for tech roles)
  const hasGitHub = MODERN_FORMAT_SIGNALS.github.test(resumeText);
  if (hasGitHub) {
    score += 0.02;
  }

  // === DATE FORMAT RECOGNITION (15%) ===
  const datePatterns = [
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{4}\b/g,
    /\b\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current|Now)\b/gi,
  ];

  const dateMatches = datePatterns.flatMap((p) => resumeText.match(p) || []);
  const hasParseableDates = dateMatches.length >= 2;

  if (!hasParseableDates && hasExperience) {
    score -= 0.1;
    issues.push('Few or no parseable date formats found');
  }

  // === SECTION HEADERS (15%) ===
  const sectionHeaderPatterns = [
    /\b(?:experience|work\s*experience|employment|professional\s*experience)\b/i,
    /\b(?:education|academic)\b/i,
    /\b(?:skills|technical\s*skills|core\s*competencies)\b/i,
    /\b(?:summary|profile|professional\s*summary)\b/i,
  ];

  let headersFound = 0;
  for (const pattern of sectionHeaderPatterns) {
    if (pattern.test(resumeText)) headersFound++;
  }

  const hasSectionHeaders = headersFound >= 3;
  if (headersFound < 3) {
    score -= 0.08;
    warnings.push(`Only ${headersFound} standard section headers detected`);
  }

  // === BULLET STRUCTURE (10%) ===
  const bulletPatternsCheck = [
    /^[\u2022\u2023\u25E6\u2043\u2219•]\s/m,
    /^[-*]\s/m,
    /^\d+\.\s/m,
  ];

  const hasBulletStructure = bulletPatternsCheck.some((p) => p.test(resumeText));
  if (!hasBulletStructure && hasExperience) {
    score -= 0.07;
    warnings.push('No clear bullet point structure detected');
  }

  // === LENGTH CHECK (10%) ===
  const wordCount = resumeText.split(/\s+/).filter((w) => w.length > 0).length;
  let appropriateLength = true;

  if (wordCount < 200) {
    score -= 0.12;
    appropriateLength = false;
    issues.push(`Resume too sparse (${wordCount} words, recommend 300+)`);
  } else if (wordCount > 1000) {
    score -= 0.05;
    appropriateLength = false;
    warnings.push(`Resume may be too long (${wordCount} words, recommend under 800)`);
  }

  // === OUTDATED FORMAT PENALTIES (20%) ===
  let noOutdatedFormats = true;

  if (OUTDATED_FORMATS.objective.test(resumeText) && !hasSummary) {
    score -= 0.1;
    noOutdatedFormats = false;
    issues.push('"Objective" section is outdated - use "Professional Summary" instead');
  }

  if (OUTDATED_FORMATS.references.test(resumeText)) {
    score -= 0.05;
    noOutdatedFormats = false;
    warnings.push('"References available upon request" is outdated - remove this line');
  }

  // === COMPLEX FORMATTING CHECK (5%) ===
  const hasComplexFormatting = /\t{2,}|\|.*\|.*\|/.test(resumeText);
  if (hasComplexFormatting) {
    score -= 0.05;
    warnings.push('Complex formatting detected (tables/columns may cause parsing issues)');
  }

  return {
    score: Math.round(Math.max(0, Math.min(1, score)) * 100),
    breakdown: {
      hasEmail,
      hasPhone,
      hasLinkedIn,
      hasGitHub,
      hasParseableDates,
      hasSectionHeaders,
      hasBulletStructure,
      appropriateLength,
      noOutdatedFormats,
    },
    issues,
    warnings,
  };
}

/**
 * Generate action items for V2.1 format improvements
 */
export function generateFormatActionItemsV21(
  result: FormatScoreResultV21
): { priority: 'high' | 'medium' | 'low'; message: string }[] {
  const actionItems: { priority: 'high' | 'medium' | 'low'; message: string }[] = [];

  // Issues are high priority
  for (const issue of result.issues) {
    actionItems.push({ priority: 'high', message: issue });
  }

  // Warnings are low priority
  for (const warning of result.warnings) {
    actionItems.push({ priority: 'low', message: warning });
  }

  return actionItems;
}

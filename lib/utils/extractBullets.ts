/**
 * Extract bullet points from parsed resume
 * Story 9.1: ATS Scoring Recalibration
 *
 * Extracts all bullet points from experience and projects sections
 * for quantification density analysis.
 */

import type { ParsedResume } from '@/lib/parsers/types';

/**
 * Extract all bullets from resume for quantification analysis
 *
 * @param resume - Parsed resume with sections
 * @returns Array of bullet point strings
 */
export function extractBullets(resume: ParsedResume): string[] {
  const bullets: string[] = [];

  // Extract from experience section
  if (resume.experience && Array.isArray(resume.experience)) {
    for (const exp of resume.experience) {
      if (exp.bulletPoints && Array.isArray(exp.bulletPoints)) {
        bullets.push(...exp.bulletPoints);
      }
    }
  }

  // Extract from projects section
  if (resume.projects && Array.isArray(resume.projects)) {
    for (const project of resume.projects) {
      if (project.bulletPoints && Array.isArray(project.bulletPoints)) {
        bullets.push(...project.bulletPoints);
      }
    }
  }

  return bullets;
}

/**
 * Check if text is a skill listing (e.g., "Languages: Python, JavaScript, Java")
 * These should not be treated as experience bullets for action verb suggestions.
 *
 * @param text - Text to check
 * @returns true if this is a skill listing, false otherwise
 */
function isSkillListing(text: string): boolean {
  // Common skill category labels
  const skillCategoryPatterns = [
    /^(languages?|programming\s*languages?)\s*:/i,
    /^(frameworks?|libraries?)\s*:/i,
    /^(tools?|technologies?|tech\s*stack)\s*:/i,
    /^(databases?|data\s*stores?)\s*:/i,
    /^(platforms?|cloud\s*platforms?)\s*:/i,
    /^(software|applications?)\s*:/i,
    /^(skills?|technical\s*skills?|core\s*skills?)\s*:/i,
    /^(certifications?|certificates?)\s*:/i,
    /^(methodologies?|practices?)\s*:/i,
    /^(operating\s*systems?|os)\s*:/i,
    /^(ides?|editors?)\s*:/i,
    /^(version\s*control|vcs)\s*:/i,
  ];

  // Check if starts with a skill category label
  if (skillCategoryPatterns.some(pattern => pattern.test(text))) {
    return true;
  }

  // Check for comma-separated list pattern without action verb
  // Skill listings are typically "Category: item1, item2, item3"
  // vs experience bullets "Developed X using Y and Z"
  const hasColonWithList = /^[A-Za-z\s]+:\s*[A-Za-z0-9#\+\-\.\/]+(\s*,\s*[A-Za-z0-9#\+\-\.\/]+){2,}/.test(text);
  if (hasColonWithList) {
    return true;
  }

  return false;
}

/**
 * Extract bullets from raw resume text as fallback
 * Looks for lines starting with bullet markers (-, *, •, ●) or numbered lists
 * Filters out skill listings which should not receive action verb suggestions.
 *
 * @param resumeText - Raw resume text
 * @returns Array of bullet point strings (experience/project bullets only)
 */
export function extractBulletsFromText(resumeText: string): string[] {
  const lines = resumeText.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with bullet markers or numbered lists
    // Story 10.1: Extended to match more bullet formats and numbered lists
    const isBullet = /^[-*•►▪●○◆]/.test(trimmed);
    const isNumberedList = /^\d+[.)]\s/.test(trimmed);

    if (isBullet || isNumberedList) {
      // Remove the bullet marker or number and trim
      let bulletText = trimmed;
      if (isBullet) {
        bulletText = trimmed.replace(/^[-*•►▪●○◆]\s*/, '').trim();
      } else if (isNumberedList) {
        bulletText = trimmed.replace(/^\d+[.)]\s*/, '').trim();
      }

      // Include bullets with at least some content (lowered threshold)
      // Story 10.1: Filter out skill listings - they don't need action verb suggestions
      if (bulletText.length > 5 && !isSkillListing(bulletText)) {
        bullets.push(bulletText);
      }
    }
  }

  return bullets;
}

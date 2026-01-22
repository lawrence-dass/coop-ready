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
 * Extract bullets from raw resume text as fallback
 * Looks for lines starting with bullet markers (-, *, •)
 *
 * @param resumeText - Raw resume text
 * @returns Array of bullet point strings
 */
export function extractBulletsFromText(resumeText: string): string[] {
  const lines = resumeText.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with -, *, •, or similar bullet markers
    if (/^[-*•►▪]/.test(trimmed)) {
      // Remove the bullet marker and trim
      const bulletText = trimmed.replace(/^[-*•►▪]\s*/, '').trim();
      if (bulletText.length > 10) {
        // Only include substantial bullets
        bullets.push(bulletText);
      }
    }
  }

  return bullets;
}

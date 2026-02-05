/**
 * Qualification Fit Scoring for ATS V2.1
 *
 * Evaluates how well the resume matches JD qualification requirements:
 * - Degree (40%): Level and field match
 * - Experience Years (40%): Meets minimum requirement
 * - Certifications (20%): Required certifications present
 */

import type {
  DegreeLevel,
  JDQualifications,
  ResumeQualifications,
  QualificationFitResult,
} from './types';
import { DEGREE_LEVELS, DEGREE_FIELD_MATCHES } from './constants';

/**
 * Extract total years of experience from experience section text
 *
 * Parses date ranges like "Jan 2020 - Present" and calculates total months
 */
export function extractExperienceYears(experienceSection: string): number {
  if (!experienceSection || experienceSection.trim().length === 0) {
    return 0;
  }

  // Pattern: "Month Year - Month Year" or "Year - Year" or "Year - Present"
  const dateRangePattern =
    /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(\d{4})\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(\d{4}|Present|Current|Now)/gi;

  let totalMonths = 0;
  let match;
  const currentYear = new Date().getFullYear();

  while ((match = dateRangePattern.exec(experienceSection)) !== null) {
    const startYear = parseInt(match[1]);
    const endYearStr = match[2].toLowerCase();
    const endYear =
      endYearStr === 'present' ||
      endYearStr === 'current' ||
      endYearStr === 'now'
        ? currentYear
        : parseInt(match[2]);

    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      // Assume mid-year average for partial year calculation
      totalMonths += (endYear - startYear) * 12 + 6;
    }
  }

  // Return years with 1 decimal precision
  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Check if resume field matches required fields
 *
 * @returns 'exact' if direct match, 'related' if in related category, 'none' if no match
 */
export function checkFieldMatch(
  resumeField: string,
  requiredFields: string[]
): 'exact' | 'related' | 'none' {
  if (!resumeField || requiredFields.length === 0) {
    return 'none';
  }

  const fieldLower = resumeField.toLowerCase();

  // Check for exact match against any category
  for (const [category, aliases] of Object.entries(DEGREE_FIELD_MATCHES)) {
    if (aliases.some((alias) => fieldLower.includes(alias))) {
      // Check if any required field matches this category
      if (
        requiredFields.some(
          (req) =>
            req.toLowerCase().includes(category.replace('_', ' ')) ||
            aliases.some((alias) => req.toLowerCase().includes(alias))
        )
      ) {
        return 'exact';
      }
    }
  }

  // Check for "related field" allowance
  if (requiredFields.some((req) => req.toLowerCase().includes('related'))) {
    // Check if resume field is in any technical category
    for (const aliases of Object.values(DEGREE_FIELD_MATCHES)) {
      if (aliases.some((alias) => fieldLower.includes(alias))) {
        return 'related';
      }
    }
  }

  return 'none';
}

/**
 * Calculate qualification fit score
 *
 * Weights:
 * - Degree: 40%
 * - Experience: 40%
 * - Certifications: 20%
 */
export function calculateQualificationFit(
  jdQuals: JDQualifications,
  resumeQuals: ResumeQualifications
): QualificationFitResult {
  // === DEGREE FIT (40% of qualification score) ===
  let degreeScore = 100; // Default if not required
  let degreeMet = true;
  let degreeNote: string | undefined;

  if (jdQuals.degreeRequired) {
    const requiredLevel = DEGREE_LEVELS[jdQuals.degreeRequired.level];
    const hasLevel = resumeQuals.degree
      ? DEGREE_LEVELS[resumeQuals.degree.level]
      : 0;

    if (hasLevel >= requiredLevel) {
      // Check field match
      const fieldMatch = checkFieldMatch(
        resumeQuals.degree?.field || '',
        jdQuals.degreeRequired.fields || []
      );

      if (fieldMatch === 'exact') {
        degreeScore = 100;
        degreeNote = 'Degree fully matches requirements';
      } else if (fieldMatch === 'related') {
        degreeScore = 85;
        degreeNote = 'Degree in related field';
      } else {
        degreeScore = 70;
        degreeNote = 'Degree level met but field differs';
      }
    } else if (hasLevel === requiredLevel - 1) {
      // One level below (e.g., Bachelor's when Master's required)
      degreeScore = jdQuals.degreeRequired.required ? 50 : 75;
      degreeMet = false;
      degreeNote = 'Degree level below requirement';
    } else {
      // Significantly below or missing
      degreeScore = jdQuals.degreeRequired.required ? 20 : 50;
      degreeMet = false;
      degreeNote = resumeQuals.degree
        ? 'Degree level significantly below requirement'
        : 'No degree listed';
    }
  }

  // === EXPERIENCE FIT (40% of qualification score) ===
  let experienceScore = 100;
  let experienceMet = true;
  let experienceNote: string | undefined;

  if (jdQuals.experienceRequired) {
    const required = jdQuals.experienceRequired.minYears;
    const has = resumeQuals.totalExperienceYears;

    if (has >= required) {
      experienceScore = 100;
      experienceNote = `${has} years meets ${required}+ requirement`;
    } else if (has >= required * 0.75) {
      // Within 75% of requirement
      experienceScore = 75;
      experienceMet = false;
      experienceNote = `${has} years slightly below ${required}+ requirement`;
    } else if (has >= required * 0.5) {
      // Within 50% of requirement
      experienceScore = jdQuals.experienceRequired.required ? 40 : 60;
      experienceMet = false;
      experienceNote = `${has} years below ${required}+ requirement`;
    } else {
      // Significantly below
      experienceScore = jdQuals.experienceRequired.required ? 15 : 40;
      experienceMet = false;
      experienceNote = `${has} years significantly below ${required}+ requirement`;
    }
  }

  // === CERTIFICATION FIT (20% of qualification score) ===
  let certificationScore = 100;
  const certificationsMet: string[] = [];
  const certificationsMissing: string[] = [];

  if (
    jdQuals.certificationsRequired?.certifications &&
    jdQuals.certificationsRequired.certifications.length > 0
  ) {
    const required = jdQuals.certificationsRequired.certifications;
    const has = resumeQuals.certifications.map((c) => c.toLowerCase());

    for (const reqCert of required) {
      const found = has.some(
        (c) =>
          c.includes(reqCert.toLowerCase()) ||
          reqCert.toLowerCase().includes(c)
      );
      if (found) {
        certificationsMet.push(reqCert);
      } else {
        certificationsMissing.push(reqCert);
      }
    }

    certificationScore =
      required.length > 0
        ? Math.round((certificationsMet.length / required.length) * 100)
        : 100;
  }

  // === COMBINED SCORE ===
  const score = Math.round(
    degreeScore * 0.4 + experienceScore * 0.4 + certificationScore * 0.2
  );

  return {
    score,
    breakdown: {
      degreeScore,
      experienceScore,
      certificationScore,
    },
    details: {
      degreeMet,
      degreeNote,
      experienceMet,
      experienceNote,
      certificationsMet,
      certificationsMissing,
    },
  };
}

/**
 * Generate action items for qualification improvements
 */
export function generateQualificationActionItems(
  result: QualificationFitResult
): string[] {
  const actionItems: string[] = [];

  if (!result.details.experienceMet && result.details.experienceNote) {
    actionItems.push(result.details.experienceNote);
  }

  if (!result.details.degreeMet && result.details.degreeNote) {
    actionItems.push(result.details.degreeNote);
  }

  if (result.details.certificationsMissing.length > 0) {
    const missing = result.details.certificationsMissing.slice(0, 2).join(', ');
    actionItems.push(`Missing certifications: ${missing}`);
  }

  return actionItems;
}

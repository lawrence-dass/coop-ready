/**
 * Section Scoring for ATS V2 and V2.1
 *
 * V2 Evaluates section coverage and density:
 * - Summary: Minimum 30 words for full credit
 * - Skills: Minimum 6 items for full credit
 * - Experience: Minimum 4 bullets per role
 *
 * V2.1 Adds:
 * - Education quality evaluation for co-op
 * - Job-type-aware thresholds
 * - Projects section for co-op
 */

import type {
  SectionScoreResult,
  SectionScoreResultV21,
  EducationQualityResult,
  JobType,
} from './types';
import { SECTION_THRESHOLDS, SECTION_CONFIG_V21 } from './constants';

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Count skill items in skills section
 *
 * Skills can be:
 * - Comma-separated: "Python, JavaScript, React"
 * - Bullet-separated: "• Python • JavaScript"
 * - Newline-separated
 * - Colon-grouped: "Languages: Python, JavaScript"
 */
function countSkillItems(skillsText: string): number {
  if (!skillsText || skillsText.trim().length === 0) return 0;

  // Remove common headers
  let text = skillsText
    .replace(/^(technical\s+)?skills?\s*:?\s*/im, '')
    .replace(/^(core\s+)?competencies?\s*:?\s*/im, '');

  // Split by various delimiters
  const items = text
    .split(/[,•●○◦\n|]/)
    .map(item => item.trim())
    .filter(item => {
      // Filter out empty items and headers
      if (item.length < 2) return false;
      if (item.match(/^(languages?|frameworks?|tools?|technologies?|databases?)\s*:?\s*$/i)) {
        return false;
      }
      return true;
    });

  return items.length;
}

/**
 * Count experience bullets
 *
 * Counts bullet points in the experience section
 */
function countExperienceBullets(experienceText: string): number {
  if (!experienceText || experienceText.trim().length === 0) return 0;

  // Count lines that look like bullet points
  const bulletPatterns = [
    /^[\s]*[-•*▪▸►○◦◇]\s+.+$/gm,
    /^[\s]*\d+\.\s+.+$/gm,
  ];

  let bulletCount = 0;
  const seen = new Set<string>();

  for (const pattern of bulletPatterns) {
    const matches = experienceText.matchAll(pattern);
    for (const match of matches) {
      const normalized = match[0].trim().toLowerCase();
      if (!seen.has(normalized) && match[0].length > 15) {
        seen.add(normalized);
        bulletCount++;
      }
    }
  }

  // Fallback: count lines that start with verbs
  if (bulletCount < 4) {
    const lines = experienceText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Lines that start with a capital letter and are accomplishment-length
      if (trimmed.length > 30 &&
          trimmed.match(/^[A-Z][a-z]+ed?\s/) &&
          !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        bulletCount++;
      }
    }
  }

  return bulletCount;
}

/**
 * Calculate summary section score
 *
 * Full score (100) at 30+ words
 * Linear scale below that
 */
function calculateSummaryScore(summaryText: string | undefined): {
  score: number;
  wordCount: number;
} {
  const wordCount = summaryText ? countWords(summaryText) : 0;

  if (wordCount === 0) {
    return { score: 0, wordCount: 0 };
  }

  const target = SECTION_THRESHOLDS.summaryMinWords;
  const score = Math.min(100, (wordCount / target) * 100);

  return {
    score: Math.round(score),
    wordCount,
  };
}

/**
 * Calculate skills section score
 *
 * Full score (100) at 6+ skill items
 * Linear scale below that
 */
function calculateSkillsScore(skillsText: string | undefined): {
  score: number;
  itemCount: number;
} {
  const itemCount = skillsText ? countSkillItems(skillsText) : 0;

  if (itemCount === 0) {
    return { score: 0, itemCount: 0 };
  }

  const target = SECTION_THRESHOLDS.skillsMinItems;
  const score = Math.min(100, (itemCount / target) * 100);

  return {
    score: Math.round(score),
    itemCount,
  };
}

/**
 * Calculate experience section score
 *
 * Full score (100) at 8+ bullets total
 * Linear scale below that
 */
function calculateExperienceSectionScore(experienceText: string | undefined): {
  score: number;
  bulletCount: number;
} {
  const bulletCount = experienceText ? countExperienceBullets(experienceText) : 0;

  if (bulletCount === 0) {
    return { score: 0, bulletCount: 0 };
  }

  const target = SECTION_THRESHOLDS.experienceMinTotalBullets;
  const score = Math.min(100, (bulletCount / target) * 100);

  return {
    score: Math.round(score),
    bulletCount,
  };
}

/**
 * Calculate section score for ATS V2
 *
 * Evaluates presence and density of key resume sections.
 * Each section contributes equally (33.3% each).
 *
 * @param parsedResume - Parsed resume with section content
 * @returns SectionScoreResult with score and breakdown
 */
export function calculateSectionScore(parsedResume: {
  summary?: string;
  skills?: string;
  experience?: string;
}): SectionScoreResult {
  // Calculate individual section scores
  const { score: summaryScore, wordCount: summaryWordCount } =
    calculateSummaryScore(parsedResume.summary);

  const { score: skillsScore, itemCount: skillsItemCount } =
    calculateSkillsScore(parsedResume.skills);

  const { score: experienceScore, bulletCount: experienceBulletCount } =
    calculateExperienceSectionScore(parsedResume.experience);

  // Calculate overall score (equal weight for each section)
  const overallScore = (summaryScore + skillsScore + experienceScore) / 3;

  return {
    score: Math.round(overallScore),
    summaryScore,
    skillsScore,
    experienceScore,
    summaryWordCount,
    skillsItemCount,
    experienceBulletCount,
  };
}

/**
 * Generate action items for section improvements
 *
 * @param result - Section score result
 * @returns Array of actionable suggestions
 */
export function generateSectionActionItems(result: SectionScoreResult): string[] {
  const actionItems: string[] = [];

  // Summary needs improvement
  if (result.summaryScore < 100) {
    if (result.summaryWordCount === 0) {
      actionItems.push('Add a professional summary (30+ words recommended)');
    } else {
      const needed = SECTION_THRESHOLDS.summaryMinWords - result.summaryWordCount;
      actionItems.push(`Expand your summary by ${needed} more words`);
    }
  }

  // Skills needs improvement
  if (result.skillsScore < 100) {
    if (result.skillsItemCount === 0) {
      actionItems.push('Add a skills section with 6+ relevant skills');
    } else {
      const needed = SECTION_THRESHOLDS.skillsMinItems - result.skillsItemCount;
      actionItems.push(`Add ${needed} more skills to your skills section`);
    }
  }

  // Experience needs improvement
  if (result.experienceScore < 100) {
    if (result.experienceBulletCount === 0) {
      actionItems.push('Add bullet points to your experience section');
    } else {
      const needed = SECTION_THRESHOLDS.experienceMinTotalBullets - result.experienceBulletCount;
      actionItems.push(`Add ${needed} more bullet points to your experience`);
    }
  }

  return actionItems;
}

// ============================================================================
// V2.1 SECTION SCORING
// ============================================================================

/**
 * Evaluate education quality (important for co-op)
 */
export function evaluateEducationQuality(
  educationText: string,
  jdKeywords: string[],
  jobType: JobType
): EducationQualityResult {
  if (!educationText || educationText.trim().length === 0) {
    return {
      score: 0,
      breakdown: {
        hasRelevantCoursework: false,
        courseworkMatchScore: 0,
        hasGPA: false,
        gpaStrong: false,
        hasProjects: false,
        hasHonors: false,
        hasLocation: false,
        hasProperDateFormat: false,
      },
      suggestions: ['Add education section'],
    };
  }

  const textLower = educationText.toLowerCase();

  // Check for relevant coursework
  const courseworkPattern = /(?:relevant\s+)?coursework[:\s]+([^.]+)/i;
  const courseworkMatch = educationText.match(courseworkPattern);
  const hasRelevantCoursework = !!courseworkMatch;

  // Match coursework against JD keywords
  let courseworkMatchScore = 0;
  if (courseworkMatch) {
    const courseworkText = courseworkMatch[1].toLowerCase();
    const matchedKeywords = jdKeywords.filter((kw) =>
      courseworkText.includes(kw.toLowerCase())
    );
    courseworkMatchScore =
      jdKeywords.length > 0
        ? matchedKeywords.length / Math.min(jdKeywords.length, 10)
        : 0;
  }

  // Check for GPA
  const gpaPattern = /gpa[:\s]*(\d+\.?\d*)/i;
  const gpaMatch = educationText.match(gpaPattern);
  const hasGPA = !!gpaMatch;
  const gpaStrong = hasGPA && parseFloat(gpaMatch![1]) >= 3.5;

  // Check for projects/capstone
  const hasProjects = /(?:capstone|project|thesis|research)/i.test(textLower);

  // Check for honors
  const hasHonors =
    /(?:dean'?s?\s*list|honors?|cum\s*laude|magna|summa|distinction)/i.test(
      textLower
    );

  // Check for location
  const hasLocation = /[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(educationText);

  // Check for proper date format
  const hasProperDateFormat =
    /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|Expected|Graduated/i.test(
      educationText
    );

  // Calculate score (weights depend on job type)
  let score: number;
  const suggestions: string[] = [];

  if (jobType === 'coop') {
    // For co-op, education is critical
    score =
      (hasRelevantCoursework ? 0.3 : 0) +
      courseworkMatchScore * 0.25 +
      (hasGPA ? (gpaStrong ? 0.15 : 0.08) : 0) +
      (hasProjects ? 0.15 : 0) +
      (hasHonors ? 0.1 : 0) +
      (hasProperDateFormat ? 0.05 : 0);

    if (!hasRelevantCoursework)
      suggestions.push('Add relevant coursework matching JD requirements');
    if (!hasGPA)
      suggestions.push('Add GPA if 3.0+ (critical for co-op applications)');
    if (!hasProjects) suggestions.push('Add capstone project or academic projects');
    if (!hasHonors && gpaStrong)
      suggestions.push("Add Dean's List or honors if applicable");
  } else {
    // For full-time, education is less critical
    score =
      (hasRelevantCoursework ? 0.2 : 0) +
      courseworkMatchScore * 0.15 +
      (hasGPA && gpaStrong ? 0.15 : 0) +
      (hasProjects ? 0.15 : 0) +
      (hasHonors ? 0.1 : 0) +
      (hasProperDateFormat ? 0.1 : 0) +
      0.15; // Base credit for having education section
  }

  return {
    score: Math.round(Math.min(1, score) * 100),
    breakdown: {
      hasRelevantCoursework,
      courseworkMatchScore: Math.round(courseworkMatchScore * 100) / 100,
      hasGPA,
      gpaStrong,
      hasProjects,
      hasHonors,
      hasLocation,
      hasProperDateFormat,
    },
    suggestions,
  };
}

/**
 * V2.1 Section score input
 */
export interface SectionScoreInputV21 {
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];
    education?: string;
    projects?: string[];
    certifications?: string[];
  };
  jobType: JobType;
  jdKeywords: string[];
}

/**
 * Calculate section score for ATS V2.1
 *
 * Evaluates sections with job-type-aware thresholds and education quality.
 */
export function calculateSectionScoreV21(
  input: SectionScoreInputV21
): SectionScoreResultV21 {
  const { sections, jobType, jdKeywords } = input;
  const config = SECTION_CONFIG_V21[jobType];

  let achievedPoints = 0;
  let possiblePoints = 0;
  const breakdown: SectionScoreResultV21['breakdown'] = {};

  // === SUMMARY ===
  const summaryConfig = config.summary;
  possiblePoints += summaryConfig.maxPoints;
  const summaryLength = sections.summary?.trim().length ?? 0;

  if (summaryLength >= summaryConfig.minLength) {
    achievedPoints += summaryConfig.maxPoints;
    breakdown.summary = {
      present: true,
      meetsThreshold: true,
      points: summaryConfig.maxPoints,
      maxPoints: summaryConfig.maxPoints,
    };
  } else if (summaryLength > 0) {
    const partial =
      summaryConfig.maxPoints *
      Math.min(1, summaryLength / summaryConfig.minLength);
    achievedPoints += partial;
    breakdown.summary = {
      present: true,
      meetsThreshold: false,
      points: Math.round(partial * 10) / 10,
      maxPoints: summaryConfig.maxPoints,
      issues: [`Summary too short (${summaryLength}/${summaryConfig.minLength} chars)`],
    };
  } else {
    breakdown.summary = {
      present: false,
      meetsThreshold: false,
      points: 0,
      maxPoints: summaryConfig.maxPoints,
      issues: ['No professional summary section'],
    };
  }

  // === SKILLS ===
  const skillsConfig = config.skills;
  possiblePoints += skillsConfig.maxPoints;
  const skillCount = sections.skills?.length ?? 0;

  if (skillCount >= skillsConfig.minItems) {
    achievedPoints += skillsConfig.maxPoints;
    breakdown.skills = {
      present: true,
      meetsThreshold: true,
      points: skillsConfig.maxPoints,
      maxPoints: skillsConfig.maxPoints,
    };
  } else if (skillCount > 0) {
    const partial = skillsConfig.maxPoints * (skillCount / skillsConfig.minItems);
    achievedPoints += partial;
    breakdown.skills = {
      present: true,
      meetsThreshold: false,
      points: Math.round(partial * 10) / 10,
      maxPoints: skillsConfig.maxPoints,
      issues: [`Only ${skillCount} skills listed (recommend ${skillsConfig.minItems}+)`],
    };
  } else {
    breakdown.skills = {
      present: false,
      meetsThreshold: false,
      points: 0,
      maxPoints: skillsConfig.maxPoints,
      issues: ['No skills section'],
    };
  }

  // === EXPERIENCE ===
  const expConfig = config.experience;
  if (expConfig.required || (sections.experience && sections.experience.length > 0)) {
    possiblePoints += expConfig.maxPoints;
    const bulletCount = sections.experience?.length ?? 0;

    if (bulletCount >= expConfig.minBullets) {
      achievedPoints += expConfig.maxPoints;
      breakdown.experience = {
        present: true,
        meetsThreshold: true,
        points: expConfig.maxPoints,
        maxPoints: expConfig.maxPoints,
      };
    } else if (bulletCount > 0) {
      const partial = expConfig.maxPoints * (bulletCount / expConfig.minBullets);
      achievedPoints += partial;
      breakdown.experience = {
        present: true,
        meetsThreshold: false,
        points: Math.round(partial * 10) / 10,
        maxPoints: expConfig.maxPoints,
        issues: [
          `Only ${bulletCount} experience bullets (recommend ${expConfig.minBullets}+)`,
        ],
      };
    } else {
      breakdown.experience = {
        present: false,
        meetsThreshold: false,
        points: 0,
        maxPoints: expConfig.maxPoints,
        issues: ['No experience section'],
      };
    }
  }

  // === EDUCATION (with quality evaluation) ===
  const eduConfig = config.education;
  possiblePoints += eduConfig.maxPoints;

  let educationQuality: EducationQualityResult | undefined;

  if (sections.education && sections.education.length >= eduConfig.minLength) {
    educationQuality = evaluateEducationQuality(
      sections.education,
      jdKeywords,
      jobType
    );

    // Score is combination of presence and quality
    const presenceScore = 0.4;
    const qualityBonus = (educationQuality.score / 100) * 0.6;
    const eduScore = presenceScore + qualityBonus;

    const points = eduConfig.maxPoints * eduScore;
    achievedPoints += points;

    breakdown.education = {
      present: true,
      meetsThreshold: educationQuality.score >= 50,
      points: Math.round(points * 10) / 10,
      maxPoints: eduConfig.maxPoints,
      qualityScore: educationQuality.score,
      issues: educationQuality.suggestions,
    };
  } else if (sections.education) {
    const partial = eduConfig.maxPoints * 0.3; // Minimal credit for sparse education
    achievedPoints += partial;
    breakdown.education = {
      present: true,
      meetsThreshold: false,
      points: Math.round(partial * 10) / 10,
      maxPoints: eduConfig.maxPoints,
      issues: ['Education section is sparse - add coursework, GPA, or projects'],
    };
  } else {
    breakdown.education = {
      present: false,
      meetsThreshold: false,
      points: 0,
      maxPoints: eduConfig.maxPoints,
      issues: ['No education section'],
    };
  }

  // === PROJECTS ===
  const projConfig = config.projects;
  if (projConfig.required || (sections.projects && sections.projects.length > 0)) {
    possiblePoints += projConfig.maxPoints;
    const projCount = sections.projects?.length ?? 0;

    if (projCount >= projConfig.minBullets) {
      achievedPoints += projConfig.maxPoints;
      breakdown.projects = {
        present: true,
        meetsThreshold: true,
        points: projConfig.maxPoints,
        maxPoints: projConfig.maxPoints,
      };
    } else if (projCount > 0) {
      const partial = projConfig.maxPoints * (projCount / projConfig.minBullets);
      achievedPoints += partial;
      breakdown.projects = {
        present: true,
        meetsThreshold: false,
        points: Math.round(partial * 10) / 10,
        maxPoints: projConfig.maxPoints,
        issues: [
          `Only ${projCount} project entries (recommend ${projConfig.minBullets}+)`,
        ],
      };
    } else if (projConfig.required) {
      breakdown.projects = {
        present: false,
        meetsThreshold: false,
        points: 0,
        maxPoints: projConfig.maxPoints,
        issues: ['No projects section (important for co-op)'],
      };
    }
  }

  // === CERTIFICATIONS (bonus) ===
  const certConfig = config.certifications;
  const certCount = sections.certifications?.length ?? 0;

  if (certCount >= certConfig.minItems) {
    possiblePoints += certConfig.maxPoints;
    achievedPoints += certConfig.maxPoints;
    breakdown.certifications = {
      present: true,
      meetsThreshold: true,
      points: certConfig.maxPoints,
      maxPoints: certConfig.maxPoints,
    };
  }
  // Don't penalize for missing certifications (optional section)

  const score =
    possiblePoints > 0 ? Math.round((achievedPoints / possiblePoints) * 100) : 0;

  return {
    score,
    breakdown,
    educationQuality,
  };
}

/**
 * Generate action items for V2.1 section improvements
 */
export function generateSectionActionItemsV21(
  result: SectionScoreResultV21
): { priority: 'high' | 'medium' | 'low'; message: string }[] {
  const actionItems: { priority: 'high' | 'medium' | 'low'; message: string }[] = [];

  for (const [section, data] of Object.entries(result.breakdown)) {
    if (data.issues && data.issues.length > 0 && !data.meetsThreshold) {
      actionItems.push({
        priority: data.present ? 'medium' : 'high',
        message: data.issues[0],
      });
    }
  }

  return actionItems;
}

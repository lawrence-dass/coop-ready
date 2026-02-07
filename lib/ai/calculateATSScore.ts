// Story 5.2: ATS Score Calculation
// Updated: Deterministic V2 and V2.1 scoring with LLM fallback removed

import { ActionResponse } from '@/types';
import type { ATSScore, KeywordAnalysisResult, MatchedKeyword, ExtractedKeyword } from '@/types/analysis';
import type { ATSScoreV2 } from '@/lib/scoring';
import type { Resume } from '@/types/optimization';
import { calculateATSScoreV2, calculateATSScoreV21 } from '@/lib/scoring';
import type {
  ATSScoreV21,
  KeywordMatchV21,
  JDQualifications,
  ResumeQualifications,
  JobType,
  CandidateType,
} from '@/lib/scoring/types';

/**
 * Calculate ATS compatibility score for a resume-JD pair
 *
 * **V2 Algorithm (Deterministic):**
 * - Keywords (50%): Weighted by importance and match type
 * - Experience (20%): Quantification, action verbs, keyword density
 * - Section (15%): Density-based section evaluation
 * - Format (15%): ATS parseability signals
 *
 * This replaces the previous LLM-based content quality scoring
 * with a fully deterministic calculation for consistent results.
 *
 * @param keywordAnalysis - Results from keyword matching
 * @param parsedResume - Parsed resume structure
 * @param jdContent - Job description text
 * @returns ActionResponse with ATSScore (V1 compatible) or error
 */
export async function calculateATSScore(
  keywordAnalysis: KeywordAnalysisResult,
  parsedResume: Resume,
  jdContent: string
): Promise<ActionResponse<ATSScore>> {
  try {
    // Validation
    if (!keywordAnalysis) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Keyword analysis is required'
        }
      };
    }

    if (!parsedResume || !parsedResume.rawText) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parsed resume is required'
        }
      };
    }

    if (!jdContent || jdContent.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Job description is required'
        }
      };
    }

    console.log('[SS:score] Calculating ATS score (V2 deterministic)...');

    // Calculate V2 score (fully deterministic, no LLM calls)
    // V2 = Keywords 50%, Experience 20%, Sections 15%, Format 15%
    // V2.1 requires qualification extraction - will be added in future epic
    const v2Score = calculateATSScoreV2({
      keywordAnalysis,
      resumeText: parsedResume.rawText,
      parsedResume: {
        summary: parsedResume.summary,
        skills: parsedResume.skills,
        experience: parsedResume.experience,
        education: parsedResume.education,
      },
      jdContent,
    });

    console.log(
      '[SS:score] V2 Score:', v2Score.overall,
      '| Tier:', v2Score.tier,
      '| Keywords:', v2Score.breakdownV2.keywords.score,
      '| Experience:', v2Score.breakdownV2.experience.score,
      '| Sections:', v2Score.breakdownV2.sections.score,
      '| Format:', v2Score.breakdownV2.format.score,
      `| (${v2Score.metadata.processingTimeMs}ms)`
    );

    // Return V1-compatible result (V2 fields included for consumers that want them)
    return {
      data: v2Score as ATSScore,
      error: null
    };

  } catch (error) {
    console.error('[calculateATSScore] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'SCORE_CALCULATION_ERROR',
        message: 'Failed to calculate ATS score. Please try again.'
      }
    };
  }
}

/**
 * Calculate ATS score with full V2 response
 *
 * Use this when you need the full V2 breakdown including
 * action items and detailed component scores.
 *
 * @param keywordAnalysis - Results from keyword matching
 * @param parsedResume - Parsed resume structure
 * @param jdContent - Job description text
 * @returns ActionResponse with ATSScoreV2 or error
 */
export async function calculateATSScoreV2Full(
  keywordAnalysis: KeywordAnalysisResult,
  parsedResume: Resume,
  jdContent: string
): Promise<ActionResponse<ATSScoreV2>> {
  try {
    // Validation
    if (!keywordAnalysis) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Keyword analysis is required'
        }
      };
    }

    if (!parsedResume || !parsedResume.rawText) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parsed resume is required'
        }
      };
    }

    if (!jdContent || jdContent.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Job description is required'
        }
      };
    }

    const v2Score = calculateATSScoreV2({
      keywordAnalysis,
      resumeText: parsedResume.rawText,
      parsedResume: {
        summary: parsedResume.summary,
        skills: parsedResume.skills,
        experience: parsedResume.experience,
        education: parsedResume.education,
      },
      jdContent,
    });

    return {
      data: v2Score,
      error: null
    };

  } catch (error) {
    console.error('[calculateATSScoreV2Full] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'SCORE_CALCULATION_ERROR',
        message: 'Failed to calculate ATS score. Please try again.'
      }
    };
  }
}

// ============================================================================
// V2.1 ATS SCORE CALCULATION
// ============================================================================

/**
 * Input for V2.1 score calculation
 */
export interface CalculateATSScoreV21Input {
  /** Keywords with requirement and placement from LLM extraction/matching */
  keywordMatches: MatchedKeyword[];

  /** Original extracted keywords with requirement field */
  extractedKeywords: ExtractedKeyword[];

  /** JD qualifications (degree, years, certs) - from LLM or manual */
  jdQualifications: JDQualifications;

  /** Resume qualifications - from LLM or manual */
  resumeQualifications: ResumeQualifications;

  /** Parsed resume */
  parsedResume: Resume;

  /** Job description text */
  jdContent: string;

  /** Job type (co-op vs fulltime) */
  jobType: JobType;

  /** Candidate type (Story 18.9) - for applying type-specific scoring weights */
  candidateType?: CandidateType;
}

/**
 * Convert MatchedKeyword + ExtractedKeyword to KeywordMatchV21
 */
function convertToKeywordMatchV21(
  matches: MatchedKeyword[],
  extracted: ExtractedKeyword[]
): KeywordMatchV21[] {
  const extractedMap = new Map(extracted.map(k => [k.keyword.toLowerCase(), k]));

  // Include matched keywords
  const result: KeywordMatchV21[] = matches.map(m => {
    const ext = extractedMap.get(m.keyword.toLowerCase());
    return {
      keyword: m.keyword,
      category: m.category,
      importance: ext?.importance || 'medium',
      requirement: ext?.requirement || 'preferred',
      found: m.found,
      matchType: m.matchType,
      placement: m.placement,
      context: m.context,
    };
  });

  // Include missing keywords not in matches
  for (const ext of extracted) {
    const inMatches = matches.some(m => m.keyword.toLowerCase() === ext.keyword.toLowerCase());
    if (!inMatches) {
      result.push({
        keyword: ext.keyword,
        category: ext.category,
        importance: ext.importance,
        requirement: ext.requirement || 'preferred',
        found: false,
      });
    }
  }

  return result;
}

/**
 * Extract bullets from experience and education sections
 * Note: Resume type doesn't have a projects field - projects are typically in experience
 */
function extractAllBullets(parsedResume: Resume): {
  bullets: string[];
  sources: { experience: number; projects: number; education: number };
} {
  const bullets: string[] = [];
  const sources = { experience: 0, projects: 0, education: 0 };

  // Extract from experience (includes project bullets in most resumes)
  if (parsedResume.experience) {
    const experienceBullets = parsedResume.experience
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.match(/^[-•*]|^\d+[.)]/) || line.length > 30) // Include long lines too
      .map(line => line.replace(/^[-•*\d.)]+\s*/, '').trim())
      .filter(line => line.length > 10);

    bullets.push(...experienceBullets);
    sources.experience = experienceBullets.length;
  }

  // Extract from education
  if (parsedResume.education) {
    const educationBullets = parsedResume.education
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.match(/^[-•*]|^\d+[.)]/))
      .map(line => line.replace(/^[-•*\d.)]+\s*/, '').trim())
      .filter(line => line.length > 10);

    bullets.push(...educationBullets);
    sources.education = educationBullets.length;
  }

  return { bullets, sources };
}

/**
 * Calculate ATS score using V2.1 algorithm
 *
 * **V2.1 Algorithm (5 components):**
 * - Keywords (40%): Required vs preferred, placement weighting
 * - Qualification Fit (15%): Degree, experience years, certifications
 * - Content Quality (20%): Quantification tiers, action verbs, keyword density
 * - Sections (15%): Section coverage with education quality for co-op
 * - Format (10%): ATS parseability with modern/outdated format detection
 *
 * @param input - CalculateATSScoreV21Input with all required data
 * @returns ActionResponse with ATSScoreV21 or error
 */
export async function calculateATSScoreV21Full(
  input: CalculateATSScoreV21Input
): Promise<ActionResponse<ATSScoreV21>> {
  try {
    const {
      keywordMatches,
      extractedKeywords,
      jdQualifications,
      resumeQualifications,
      parsedResume,
      jdContent,
      jobType,
      candidateType,
    } = input;

    // Validation
    if (!parsedResume || !parsedResume.rawText) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parsed resume is required'
        }
      };
    }

    if (!jdContent || jdContent.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Job description is required'
        }
      };
    }

    console.log('[SS:score] Calculating ATS score (V2.1 deterministic)...');

    // Convert keywords to V2.1 format
    const keywordsV21 = convertToKeywordMatchV21(keywordMatches, extractedKeywords);

    // Extract all bullets
    const { bullets: allBullets, sources: bulletSources } = extractAllBullets(parsedResume);

    // Parse skills to array
    const skillsArray = parsedResume.skills
      ? parsedResume.skills.split(/[,;|•]/).map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // Projects are typically included in the experience section
    // Resume type doesn't have a separate projects field
    const projectsArray: string[] = [];

    // Calculate V2.1 score
    const v21Score = calculateATSScoreV21({
      keywords: keywordsV21,
      jdQualifications,
      resumeQualifications,
      allBullets,
      bulletSources,
      sections: {
        summary: parsedResume.summary,
        skills: skillsArray,
        experience: parsedResume.experience
          ? [parsedResume.experience]
          : undefined,
        education: parsedResume.education,
        projects: projectsArray,
      },
      resumeText: parsedResume.rawText,
      jdText: jdContent,
      jobType,
      candidateType,
    });

    console.log(
      '[SS:score] V2.1 Score:', v21Score.overall,
      '| Tier:', v21Score.tier,
      '| Keywords:', v21Score.breakdownV21.keywords.score,
      '| QualFit:', v21Score.breakdownV21.qualificationFit.score,
      '| Content:', v21Score.breakdownV21.contentQuality.score,
      '| Sections:', v21Score.breakdownV21.sections.score,
      '| Format:', v21Score.breakdownV21.format.score,
      `| (${v21Score.metadata.processingTimeMs}ms)`
    );

    return {
      data: v21Score,
      error: null
    };

  } catch (error) {
    console.error('[calculateATSScoreV21Full] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'SCORE_CALCULATION_ERROR',
        message: 'Failed to calculate ATS score. Please try again.'
      }
    };
  }
}

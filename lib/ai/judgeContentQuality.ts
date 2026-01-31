// Story 5.2: LLM Quality Judge for Content Evaluation
import { ActionResponse } from '@/types';
import type { Resume } from '@/types/optimization';
import { getHaikuModel } from './models';

const QUALITY_TIMEOUT_MS = 15000; // 15 seconds budget for quality scoring

/**
 * Quality evaluation response from LLM
 */
interface QualityScores {
  relevance: number;  // 0-100
  clarity: number;    // 0-100
  impact: number;     // 0-100
}

/**
 * Helper to wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout: ${errorMessage}`)), ms)
    )
  ]);
}

/**
 * Evaluate a single resume section's content quality using LLM judge
 *
 * Uses Claude Haiku for cost efficiency (~$0.00075 per section)
 *
 * @param sectionType - Type of section (summary, skills, experience)
 * @param sectionContent - Text content of the section
 * @param jdContent - Job description for relevance evaluation
 * @returns ActionResponse with quality score 0-100 or error
 */
async function evaluateSectionQuality(
  sectionType: string,
  sectionContent: string,
  jdContent: string
): Promise<ActionResponse<number>> {
  try {
    // Skip empty sections
    if (!sectionContent || sectionContent.trim().length === 0) {
      return {
        data: 0,
        error: null
      };
    }

    // Get shared Haiku model (cost-efficient)
    const model = getHaikuModel({ temperature: 0, maxTokens: 500 });

    // Prompt with XML-wrapped user content (prompt injection defense)
    const prompt = `You are a resume quality evaluator. Rate this resume section's quality.

<resume_section type="${sectionType}">
${sectionContent}
</resume_section>

<job_description>
${jdContent}
</job_description>

Rate this section 0-100 on:
- Relevance: How well does it match the job requirements?
- Clarity: Is it clear, concise, and professional?
- Impact: Does it demonstrate value and achievements?

Return ONLY a JSON object with three numeric scores (no markdown, no explanations):
{
  "relevance": 85,
  "clarity": 90,
  "impact": 75
}`;

    // Invoke LLM with timeout enforcement
    const response = await withTimeout(
      model.invoke(prompt),
      QUALITY_TIMEOUT_MS,
      'Quality evaluation timed out'
    );

    const responseText = response.content.toString().trim();
    console.log(`[SS:quality] Section ${sectionType} LLM responded, length:`, responseText.length);

    // Parse JSON response
    let scores: QualityScores;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      scores = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[evaluateSectionQuality] JSON parse error:', parseError);
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse quality scores'
        }
      };
    }

    // Validate scores
    if (
      typeof scores.relevance !== 'number' ||
      typeof scores.clarity !== 'number' ||
      typeof scores.impact !== 'number' ||
      scores.relevance < 0 || scores.relevance > 100 ||
      scores.clarity < 0 || scores.clarity > 100 ||
      scores.impact < 0 || scores.impact > 100
    ) {
      console.error('[evaluateSectionQuality] Invalid scores:', scores);
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid quality scores returned'
        }
      };
    }

    // Average the three scores
    const averageScore = Math.round((scores.relevance + scores.clarity + scores.impact) / 3);

    return {
      data: averageScore,
      error: null
    };

  } catch (error) {
    console.error('[evaluateSectionQuality] Error:', error);

    // Check if timeout error
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Quality evaluation timed out'
        }
      };
    }

    // Generic LLM error
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to evaluate content quality'
      }
    };
  }
}

/**
 * Judge overall resume content quality using LLM evaluation
 *
 * Evaluates three sections (summary, skills, experience) and averages scores.
 * Each section is rated 0-100 on relevance, clarity, and impact.
 *
 * **Cost:** ~$0.003 total (3 sections × $0.001 each)
 * **Timeout:** 15s max per section
 *
 * @param parsedResume - Resume with section fields
 * @param jdContent - Job description for relevance context
 * @returns ActionResponse with overall quality score 0-100 or error
 */
export async function judgeContentQuality(
  parsedResume: Resume,
  jdContent: string
): Promise<ActionResponse<number>> {
  try {
    // Define sections to evaluate
    const sectionTypes: Array<keyof Pick<Resume, 'summary' | 'skills' | 'experience'>> =
      ['summary', 'skills', 'experience'];

    // Filter to sections that exist and have content
    const sectionsToEvaluate = sectionTypes.filter(
      type => parsedResume[type]?.trim()
    );

    console.log('[SS:quality] Judging content quality for sections:', sectionsToEvaluate.join(', '));

    // If no valid sections, return 0
    if (sectionsToEvaluate.length === 0) {
      return {
        data: 0,
        error: null
      };
    }

    // Run all section evaluations in parallel (Phase 1 optimization: ~3s saved)
    console.log(`[SS:quality] Evaluating ${sectionsToEvaluate.length} sections in parallel...`);
    const evaluationPromises = sectionsToEvaluate.map(sectionType => {
      const sectionContent = parsedResume[sectionType]!;
      console.log(`[SS:quality] Starting ${sectionType} evaluation (${sectionContent.length} chars)`);
      return evaluateSectionQuality(sectionType, sectionContent, jdContent);
    });

    const results = await Promise.allSettled(evaluationPromises);

    // Process results, collect scores and handle errors gracefully
    const sectionScores: number[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      const sectionType = sectionsToEvaluate[index];

      if (result.status === 'rejected') {
        console.error(`[SS:quality] ${sectionType} evaluation rejected:`, result.reason);
        errors.push(`${sectionType}: ${result.reason}`);
        return;
      }

      const actionResult = result.value;
      if (actionResult.error) {
        console.error(`[SS:quality] ${sectionType} evaluation failed:`, actionResult.error.code);
        errors.push(`${sectionType}: ${actionResult.error.code}`);
        return;
      }

      if (actionResult.data && actionResult.data > 0) {
        console.log(`[SS:quality] ${sectionType} score:`, actionResult.data);
        sectionScores.push(actionResult.data);
      }
    });

    // If all evaluations failed, return error
    if (sectionScores.length === 0 && errors.length > 0) {
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: `All quality evaluations failed: ${errors.join('; ')}`
        }
      };
    }

    // If no valid scores (all sections were empty or scored 0), return 0
    if (sectionScores.length === 0) {
      return {
        data: 0,
        error: null
      };
    }

    // Average scores across successful sections
    const averageQualityScore = Math.round(
      sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length
    );
    console.log('[SS:quality] Quality scores:', sectionScores, '→ average:', averageQualityScore);

    return {
      data: averageQualityScore,
      error: null
    };

  } catch (error) {
    console.error('[judgeContentQuality] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to judge content quality'
      }
    };
  }
}

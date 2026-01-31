// Story 5.2: LLM Quality Judge for Content Evaluation
// Phase 2: LCEL migration with RunnableParallel
import { ActionResponse } from '@/types';
import type { Resume } from '@/types/optimization';
import { getHaikuModel } from './models';
import {
  ChatPromptTemplate,
  RunnableLambda,
  RunnableParallel,
  createJsonParser,
  invokeWithActionResponse
} from './chains';

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
 * Input for section quality evaluation
 */
interface SectionEvalInput {
  sectionType: string;
  sectionContent: string;
  jdContent: string;
}

/**
 * Prompt template for quality evaluation
 * Uses XML-wrapped user content for prompt injection defense
 */
const qualityPrompt = ChatPromptTemplate.fromTemplate(`You are a resume quality evaluator. Rate this resume section's quality.

<resume_section type="{sectionType}">
{sectionContent}
</resume_section>

<job_description>
{jdContent}
</job_description>

Rate this section 0-100 on:
- Relevance: How well does it match the job requirements?
- Clarity: Is it clear, concise, and professional?
- Impact: Does it demonstrate value and achievements?

Return ONLY a JSON object with three numeric scores (no markdown, no explanations):
{{
  "relevance": 85,
  "clarity": 90,
  "impact": 75
}}`);

/**
 * Create the LCEL chain for single section quality evaluation
 * Chain: prompt → model → jsonParser → scoreCalculator
 */
function createSectionEvalChain() {
  const model = getHaikuModel({ temperature: 0, maxTokens: 500 });
  const jsonParser = createJsonParser<QualityScores>();

  // Calculate average score from the three dimensions
  const scoreCalculator = RunnableLambda.from(async (scores: QualityScores): Promise<number> => {
    // Validate scores
    if (
      typeof scores.relevance !== 'number' ||
      typeof scores.clarity !== 'number' ||
      typeof scores.impact !== 'number' ||
      scores.relevance < 0 || scores.relevance > 100 ||
      scores.clarity < 0 || scores.clarity > 100 ||
      scores.impact < 0 || scores.impact > 100
    ) {
      throw new Error('Invalid quality scores returned');
    }

    return Math.round((scores.relevance + scores.clarity + scores.impact) / 3);
  });

  return qualityPrompt.pipe(model).pipe(jsonParser).pipe(scoreCalculator);
}

/**
 * Evaluate a single section using LCEL chain
 */
async function evaluateSectionWithChain(
  sectionType: string,
  sectionContent: string,
  jdContent: string
): Promise<ActionResponse<number>> {
  // Skip empty sections
  if (!sectionContent || sectionContent.trim().length === 0) {
    return { data: 0, error: null };
  }

  console.log(`[SS:quality] Starting ${sectionType} evaluation (${sectionContent.length} chars)`);

  const chain = createSectionEvalChain();

  return invokeWithActionResponse(
    async () => {
      const score = await chain.invoke({ sectionType, sectionContent, jdContent });
      console.log(`[SS:quality] ${sectionType} score:`, score);
      return score;
    },
    { timeoutMs: QUALITY_TIMEOUT_MS }
  );
}

/**
 * Judge overall resume content quality using LLM evaluation
 *
 * Evaluates three sections (summary, skills, experience) in parallel using RunnableParallel.
 * Each section is rated 0-100 on relevance, clarity, and impact.
 *
 * Uses LCEL chain composition for better observability and composability.
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
      return { data: 0, error: null };
    }

    // Build parallel evaluations dynamically based on available sections
    console.log(`[SS:quality] Evaluating ${sectionsToEvaluate.length} sections in parallel (LCEL)...`);

    // Create a record of section evaluators for RunnableParallel
    const evaluators: Record<string, RunnableLambda<string, ActionResponse<number>>> = {};

    for (const sectionType of sectionsToEvaluate) {
      evaluators[sectionType] = RunnableLambda.from(async (jd: string) =>
        evaluateSectionWithChain(sectionType, parsedResume[sectionType]!, jd)
      );
    }

    // Run all evaluations in parallel using RunnableParallel
    const parallelRunner = RunnableParallel.from(evaluators);
    const results = await parallelRunner.invoke(jdContent);

    // Process results, collect scores and handle errors gracefully
    const sectionScores: number[] = [];
    const errors: string[] = [];

    for (const sectionType of sectionsToEvaluate) {
      const result = results[sectionType];

      if (result.error) {
        console.error(`[SS:quality] ${sectionType} evaluation failed:`, result.error.code);
        errors.push(`${sectionType}: ${result.error.code}`);
        continue;
      }

      if (result.data && result.data > 0) {
        sectionScores.push(result.data);
      }
    }

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
      return { data: 0, error: null };
    }

    // Average scores across successful sections
    const averageQualityScore = Math.round(
      sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length
    );
    console.log('[SS:quality] Quality scores:', sectionScores, '→ average:', averageQualityScore);

    return { data: averageQualityScore, error: null };

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

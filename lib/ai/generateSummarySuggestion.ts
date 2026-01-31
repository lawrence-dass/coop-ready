/**
 * Summary Suggestion Generation
 * Story 6.2: Generate optimized professional summary suggestions
 * Phase 2: LCEL migration
 *
 * Uses Claude LLM to reframe user's resume summary by:
 * 1. Incorporating relevant keywords from job description
 * 2. Maintaining authenticity (no fabrication)
 * 3. Detecting and rewriting AI-tell phrases
 * 4. Returning structured suggestions
 */

import { ActionResponse, OptimizationPreferences, UserContext } from '@/types';
import { SummarySuggestion } from '@/types/suggestions';
import { detectAITellPhrases } from './detectAITellPhrases';
import { buildPreferencePrompt, getJobTypeVerbGuidance, getJobTypeFramingGuidance } from './preferences';
import { getHaikuModel } from './models';
import { ChatPromptTemplate, createJsonParser, invokeWithActionResponse } from './chains';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_SUMMARY_LENGTH = 1000;
const MAX_JD_LENGTH = 3000;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Prompt template for summary suggestion
 * Uses XML-wrapped user content for prompt injection defense
 */
const summaryPrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert specializing in professional summaries.

Your task is to optimize a professional summary by incorporating relevant keywords from a job description.

<user_content>
{summary}
</user_content>

<job_description>
{jobDescription}
</job_description>

{educationSection}
{keywordsSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Analyze the job description and identify 2-3 most relevant keywords that align with the summary
2. Reframe the summary to naturally incorporate these keywords
3. ONLY reframe existing experience - NEVER fabricate skills, experiences, or qualifications
4. Make the language sound natural and professional (avoid AI-tell phrases)
5. Keep the summary concise (2-4 sentences, 50-150 words)
6. Maintain the user's voice and authenticity
7. Estimate the point value this summary optimization would add to the ATS score
8. Include a 1-2 sentence explanation of why this summary change improves ATS alignment (reference specific JD keywords or requirements)

**Point Value Calculation:**
Consider:
- Keyword relevance to JD (high relevance = higher points)
- Summary is a high-impact section (baseline: 5-12 points)
- Magnitude of change (small keyword addition = 5-7 points, major reframe with multiple keywords = 10-12 points)
- Realistic ATS impact (be conservative, not overly optimistic)

Assign point value as integer 1-12 for summary changes.

**Critical Rules:**
- Do NOT add skills or experiences not present in the original
- Do NOT use phrases like "I have the pleasure", "leverage my expertise", "synergize"
- Make it sound like a human wrote it, not an AI
- Point values must be realistic for actual ATS systems
- Explanation must reference specific JD keywords (not generic phrases like "improves score")
- Keep explanation concise (1-2 sentences, max 300 chars)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "suggested": "Your optimized summary text here",
  "keywords_added": ["keyword1", "keyword2", "keyword3"],
  "point_value": 8,
  "explanation": "Adding AWS highlights your infrastructure experience directly mentioned in JD's 'AWS expertise required' requirement."
}}`);

// ============================================================================
// TYPES
// ============================================================================

interface SummaryLLMResponse {
  suggested: string;
  keywords_added: string[];
  point_value?: number;
  explanation?: string;
}

// ============================================================================
// CHAIN
// ============================================================================

/**
 * Create the LCEL chain for summary suggestion
 * Chain: prompt → model → jsonParser
 */
function createSummarySuggestionChain() {
  const model = getHaikuModel({ temperature: 0.3, maxTokens: 2000 });
  const jsonParser = createJsonParser<SummaryLLMResponse>();

  return summaryPrompt.pipe(model).pipe(jsonParser);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate optimized summary suggestion using Claude LLM
 *
 * **Features:**
 * - Incorporates 2-3 relevant keywords from JD
 * - Reframes existing experience (no fabrication)
 * - Detects AI-tell phrases in original and suggested
 * - Applies user optimization preferences
 * - Returns structured ActionResponse
 *
 * Uses LCEL chain composition for better observability and composability.
 *
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeSummary - User's current professional summary
 * @param jobDescription - Job description text
 * @param keywords - Extracted keywords from JD (optional for context)
 * @param preferences - User's optimization preferences (optional, uses defaults if not provided)
 * @param userContext - User context from onboarding (optional, for LLM personalization)
 * @param resumeEducation - User's education section (optional, for co-op/internship context)
 * @returns ActionResponse with suggestion or error
 */
export async function generateSummarySuggestion(
  resumeSummary: string,
  jobDescription: string,
  keywords?: string[],
  preferences?: OptimizationPreferences | null,
  userContext?: UserContext,
  resumeEducation?: string
): Promise<ActionResponse<SummarySuggestion>> {
  // Validation
  if (!resumeSummary || resumeSummary.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume summary is required',
      },
    };
  }

  if (!jobDescription || jobDescription.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      },
    };
  }

  console.log('[SS:genSummary] Generating summary suggestion (' + resumeSummary?.length + ' chars summary, ' + jobDescription?.length + ' chars JD)');

  // Truncate very long inputs to avoid timeout
  const processedSummary =
    resumeSummary.length > MAX_SUMMARY_LENGTH
      ? resumeSummary.substring(0, MAX_SUMMARY_LENGTH)
      : resumeSummary;

  const processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  // Detect AI-tell phrases in original summary
  const originalAITellPhrases = detectAITellPhrases(processedSummary);

  // Build conditional prompt sections
  const educationSection = resumeEducation && resumeEducation.trim().length > 0
    ? `<education_context>\n${resumeEducation}\n</education_context>\n`
    : '';

  const keywordsSection = keywords && keywords.length > 0
    ? `<extracted_keywords>\n${keywords.join(', ')}\n</extracted_keywords>`
    : '';

  // Build job-type-specific guidance (injected before general preferences for prominence)
  const hasEducation = !!resumeEducation && resumeEducation.trim().length > 0;
  const jobTypeGuidance = preferences
    ? `${getJobTypeVerbGuidance(preferences.jobType)}\n\n${getJobTypeFramingGuidance(preferences.jobType, 'summary', hasEducation)}\n\n`
    : '';

  const preferenceSection = preferences ? `\n${buildPreferencePrompt(preferences, userContext)}\n` : '';

  // Create and invoke LCEL chain
  const chain = createSummarySuggestionChain();

  const result = await invokeWithActionResponse(
    async () => {
      const parsed = await chain.invoke({
        summary: processedSummary,
        jobDescription: processedJD,
        educationSection,
        keywordsSection,
        jobTypeGuidance,
        preferenceSection,
      });

      // Validate structure
      if (!parsed.suggested || typeof parsed.suggested !== 'string') {
        throw new Error('Invalid suggestion structure from LLM');
      }

      if (!parsed.keywords_added || !Array.isArray(parsed.keywords_added)) {
        throw new Error('Invalid keywords structure from LLM');
      }

      // Validate point_value if present
      let pointValue = parsed.point_value;
      if (pointValue !== undefined && (typeof pointValue !== 'number' || pointValue < 0 || pointValue > 100)) {
        console.warn('[SS:genSummary] Invalid point_value from LLM, ignoring:', pointValue);
        pointValue = undefined;
      }

      // Handle explanation field (graceful fallback)
      let explanation: string | undefined = undefined;
      if (parsed.explanation !== undefined && parsed.explanation !== null) {
        if (typeof parsed.explanation === 'string') {
          // Truncate if too long (max 500 chars)
          explanation = parsed.explanation.length > 500
            ? parsed.explanation.substring(0, 497) + '...'
            : parsed.explanation;

          // Validate explanation quality (log warning if generic)
          const genericPhrases = ['improves score', 'helps ats', 'better ranking', 'increases match'];
          const isGeneric = genericPhrases.some(phrase => explanation!.toLowerCase().includes(phrase));
          if (isGeneric && !explanation.match(/[A-Z][a-z]+ (expert|experience|required|skill)/i)) {
            console.warn('[SS:genSummary] Generic explanation detected (missing specific JD keywords):', explanation);
          }
        }
      }

      // Detect AI-tell phrases in suggested summary
      const suggestedAITellPhrases = detectAITellPhrases(parsed.suggested);

      console.log('[SS:genSummary] Summary generated, keywords added:', parsed.keywords_added, ', point_value:', pointValue, ', explanation:', explanation ? 'present' : 'missing');

      return {
        original: resumeSummary, // Return full original, not truncated
        suggested: parsed.suggested,
        ats_keywords_added: parsed.keywords_added,
        ai_tell_phrases_rewritten: [
          ...originalAITellPhrases,
          ...suggestedAITellPhrases,
        ],
        point_value: pointValue,
        explanation: explanation,
      };
    },
    { errorMessage: 'Failed to generate summary suggestion' }
  );

  return result;
}

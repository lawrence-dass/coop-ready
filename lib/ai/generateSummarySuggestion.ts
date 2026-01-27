/**
 * Summary Suggestion Generation
 * Story 6.2: Generate optimized professional summary suggestions
 *
 * Uses Claude LLM to reframe user's resume summary by:
 * 1. Incorporating relevant keywords from job description
 * 2. Maintaining authenticity (no fabrication)
 * 3. Detecting and rewriting AI-tell phrases
 * 4. Returning structured suggestions
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ActionResponse, OptimizationPreferences } from '@/types';
import { SummarySuggestion } from '@/types/suggestions';
import { detectAITellPhrases } from './detectAITellPhrases';
import { buildPreferencePrompt } from './preferences';

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
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeSummary - User's current professional summary
 * @param jobDescription - Job description text
 * @param keywords - Extracted keywords from JD (optional for context)
 * @param preferences - User's optimization preferences (optional, uses defaults if not provided)
 * @returns ActionResponse with suggestion or error
 */
export async function generateSummarySuggestion(
  resumeSummary: string,
  jobDescription: string,
  keywords?: string[],
  preferences?: OptimizationPreferences | null
): Promise<ActionResponse<SummarySuggestion>> {
  try {
    console.log('[SS:genSummary] Generating summary suggestion (' + resumeSummary?.length + ' chars summary, ' + jobDescription?.length + ' chars JD)');
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

    // Truncate very long inputs to avoid timeout
    const MAX_SUMMARY_LENGTH = 1000;
    const MAX_JD_LENGTH = 3000;

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

    // Initialize LLM
    const model = new ChatAnthropic({
      modelName: 'claude-3-5-haiku-20241022',
      temperature: 0.3, // Slightly creative for natural rewrites
      maxTokens: 2000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build prompt with XML-wrapped user content (prompt injection defense)
    const preferenceSection = preferences ? `\n${buildPreferencePrompt(preferences)}\n` : '';

    const prompt = `You are a resume optimization expert specializing in professional summaries.

Your task is to optimize a professional summary by incorporating relevant keywords from a job description.

<user_content>
${processedSummary}
</user_content>

<job_description>
${processedJD}
</job_description>

${keywords && keywords.length > 0 ? `<extracted_keywords>\n${keywords.join(', ')}\n</extracted_keywords>` : ''}
${preferenceSection}
**Instructions:**
1. Analyze the job description and identify 2-3 most relevant keywords that align with the summary
2. Reframe the summary to naturally incorporate these keywords
3. ONLY reframe existing experience - NEVER fabricate skills, experiences, or qualifications
4. Make the language sound natural and professional (avoid AI-tell phrases)
5. Keep the summary concise (2-4 sentences, 50-150 words)
6. Maintain the user's voice and authenticity
7. Estimate the point value this summary optimization would add to the ATS score

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

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "suggested": "Your optimized summary text here",
  "keywords_added": ["keyword1", "keyword2", "keyword3"],
  "point_value": 8
}`;

    // Invoke LLM (timeout enforced at the route level)
    const response = await model.invoke(prompt);
    const content = response.content as string;

    // Parse JSON response
    let parsed: { suggested: string; keywords_added: string[]; point_value?: number };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse LLM response',
        },
      };
    }

    // Validate structure
    if (!parsed.suggested || typeof parsed.suggested !== 'string') {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid suggestion structure from LLM',
        },
      };
    }

    if (!parsed.keywords_added || !Array.isArray(parsed.keywords_added)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid keywords structure from LLM',
        },
      };
    }

    // Validate point_value if present (optional field for backwards compatibility)
    if (parsed.point_value !== undefined && (typeof parsed.point_value !== 'number' || parsed.point_value < 0 || parsed.point_value > 100)) {
      console.warn('[SS:genSummary] Invalid point_value from LLM, ignoring:', parsed.point_value);
      parsed.point_value = undefined;
    }

    // Detect AI-tell phrases in suggested summary
    const suggestedAITellPhrases = detectAITellPhrases(parsed.suggested);

    // Return suggestion
    console.log('[SS:genSummary] Summary generated, keywords added:', parsed.keywords_added, ', point_value:', parsed.point_value);
    return {
      data: {
        original: resumeSummary, // Return full original, not truncated
        suggested: parsed.suggested,
        ats_keywords_added: parsed.keywords_added,
        ai_tell_phrases_rewritten: [
          ...originalAITellPhrases,
          ...suggestedAITellPhrases,
        ],
        point_value: parsed.point_value,
      },
      error: null,
    };
  } catch (error: unknown) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Summary generation timed out. Please try again.',
        },
      };
    }

    // Handle rate limiting
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('rate limit')
    ) {
      return {
        data: null,
        error: {
          code: 'RATE_LIMITED',
          message: 'API rate limit exceeded. Please wait and try again.',
        },
      };
    }

    // Generic LLM error
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate summary suggestion',
      },
    };
  }
}

// Story 5.1: LLM Keyword Matching in Resume
import { ChatAnthropic } from '@langchain/anthropic';
import { ActionResponse } from '@/types';
import { ExtractedKeyword, MatchedKeyword, KeywordAnalysisResult } from '@/types/analysis';

const MATCHING_TIMEOUT_MS = 20000; // 20 seconds budget for matching

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
 * Match extracted keywords against resume content using semantic LLM matching.
 * Supports exact, fuzzy, and semantic matches.
 *
 * @param resumeContent - Parsed resume text
 * @param extractedKeywords - Keywords from job description
 * @returns ActionResponse with matched/missing keywords or error
 */
export async function matchKeywords(
  resumeContent: string,
  extractedKeywords: ExtractedKeyword[]
): Promise<ActionResponse<KeywordAnalysisResult>> {
  try {
    // Validation
    if (!resumeContent || resumeContent.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Resume content is required'
        }
      };
    }

    if (!extractedKeywords || extractedKeywords.length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No keywords to match'
        }
      };
    }

    // Initialize LLM
    const model = new ChatAnthropic({
      modelName: 'claude-sonnet-4-20250514',
      temperature: 0,
      maxTokens: 4000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });

    // Prompt with XML-wrapped user content (prompt injection defense)
    const matchingPrompt = `You are a resume optimization expert analyzing keyword matches.

Find which of these keywords appear in the resume. Use semantic matching (e.g., "JavaScript" matches "JS", "React.js" matches "React", "team leadership" matches "led teams").

<keywords>
${JSON.stringify(extractedKeywords)}
</keywords>

<resume_content>
${resumeContent}
</resume_content>

For each keyword:
- found: true/false
- context: exact phrase from resume where found (if found, max 100 chars)
- matchType: "exact" (exact string match), "fuzzy" (abbreviation/variation), or "semantic" (similar meaning)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "matches": [
    {
      "keyword": "Python",
      "category": "technologies",
      "found": true,
      "context": "Developed data pipelines using Python and pandas",
      "matchType": "exact"
    },
    {
      "keyword": "Docker",
      "category": "technologies",
      "found": false,
      "matchType": "exact"
    }
  ]
}`;

    // Invoke LLM with timeout enforcement
    const response = await withTimeout(
      model.invoke(matchingPrompt),
      MATCHING_TIMEOUT_MS,
      'Keyword matching timed out'
    );
    const content = response.content as string;

    // Parse JSON response
    let parsed: { matches: MatchedKeyword[] };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse LLM response'
        }
      };
    }

    // Validate structure
    if (!parsed.matches || !Array.isArray(parsed.matches)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid match structure from LLM'
        }
      };
    }

    // Split into matched and missing
    const matched = parsed.matches.filter(m => m.found);
    const missing = parsed.matches
      .filter(m => !m.found)
      .map(m => {
        // Find original keyword for importance
        const original = extractedKeywords.find(k => k.keyword === m.keyword);
        return {
          keyword: m.keyword,
          category: m.category,
          importance: original?.importance || 'medium'
        } as ExtractedKeyword;
      });

    // Calculate match rate
    const totalKeywords = extractedKeywords.length;
    const matchedCount = matched.length;
    const matchRate = totalKeywords > 0
      ? Math.round((matchedCount / totalKeywords) * 100)
      : 0;

    // Return results
    return {
      data: {
        matched,
        missing,
        matchRate,
        analyzedAt: new Date().toISOString()
      },
      error: null
    };

  } catch (error: unknown) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Keyword matching timed out. Please try again.'
        }
      };
    }

    // Handle rate limiting
    if (error instanceof Error && error.message.toLowerCase().includes('rate limit')) {
      return {
        data: null,
        error: {
          code: 'RATE_LIMITED',
          message: 'API rate limit exceeded. Please wait and try again.'
        }
      };
    }

    // Generic LLM error
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to match keywords'
      }
    };
  }
}

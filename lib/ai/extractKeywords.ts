// Story 5.1: LLM Keyword Extraction from Job Description
import { ChatAnthropic } from '@langchain/anthropic';
import { ActionResponse } from '@/types';
import { ExtractedKeywords, ExtractedKeyword } from '@/types/analysis';

const EXTRACTION_TIMEOUT_MS = 20000; // 20 seconds budget for extraction

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
 * Extract important keywords from a job description using LLM.
 * Server-side only - never expose API keys to client.
 *
 * @param jobDescription - Raw job description text from user
 * @returns ActionResponse with categorized keywords or error
 */
export async function extractKeywords(
  jobDescription: string
): Promise<ActionResponse<ExtractedKeywords>> {
  try {
    // Validation
    if (!jobDescription || jobDescription.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Job description is required'
        }
      };
    }

    // Truncate very long JDs to avoid timeout
    const MAX_JD_LENGTH = 5000;
    const processedJD = jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

    // Initialize LLM
    const model = new ChatAnthropic({
      modelName: 'claude-haiku-4-20250514',
      temperature: 0,
      maxTokens: 2000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });

    // Prompt with XML-wrapped user content (prompt injection defense)
    const extractionPrompt = `You are a resume optimization expert analyzing job descriptions.

Extract the most important keywords from this job description that would be critical for ATS (Applicant Tracking Systems) and recruiters.

<job_description>
${processedJD}
</job_description>

Categorize keywords into:
- skills (e.g., "project management", "data analysis")
- technologies (e.g., "Python", "AWS", "React")
- qualifications (e.g., "Bachelor's degree", "5+ years experience")
- experience (e.g., "led teams", "managed budgets")
- soft_skills (e.g., "communication", "leadership")
- certifications (e.g., "PMP", "AWS Certified")

For each keyword, rate importance: high, medium, or low.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "keywords": [
    { "keyword": "Python", "category": "technologies", "importance": "high" },
    { "keyword": "Project Management", "category": "skills", "importance": "high" }
  ]
}`;

    // Invoke LLM with timeout enforcement
    const response = await withTimeout(
      model.invoke(extractionPrompt),
      EXTRACTION_TIMEOUT_MS,
      'Keyword extraction timed out'
    );
    const content = response.content as string;

    // Parse JSON response
    let parsed: { keywords: ExtractedKeyword[] };
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
    if (!parsed.keywords || !Array.isArray(parsed.keywords)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid keyword structure from LLM'
        }
      };
    }

    // Return results
    return {
      data: {
        keywords: parsed.keywords,
        totalCount: parsed.keywords.length
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
          message: 'Keyword extraction timed out. Please try again.'
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
        message: error instanceof Error ? error.message : 'Failed to extract keywords'
      }
    };
  }
}

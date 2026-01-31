// Story 5.1: LLM Keyword Extraction from Job Description
// Phase 2: LCEL migration
import { ActionResponse } from '@/types';
import { ExtractedKeywords, ExtractedKeyword } from '@/types/analysis';
import { getHaikuModel } from './models';
import { ChatPromptTemplate, createJsonParser, invokeWithActionResponse } from './chains';

const EXTRACTION_TIMEOUT_MS = 20000; // 20 seconds budget for extraction
const MAX_JD_LENGTH = 5000;

/**
 * Prompt template for keyword extraction
 * Uses XML-wrapped user content for prompt injection defense
 */
const extractionPrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert analyzing job descriptions.

Extract the most important keywords from this job description that would be critical for ATS (Applicant Tracking Systems) and recruiters.

<job_description>
{jobDescription}
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
{{
  "keywords": [
    {{ "keyword": "Python", "category": "technologies", "importance": "high" }},
    {{ "keyword": "Project Management", "category": "skills", "importance": "high" }}
  ]
}}`);

/**
 * Response type from LLM
 */
interface KeywordExtractionResponse {
  keywords: ExtractedKeyword[];
}

/**
 * Create the LCEL chain for keyword extraction
 * Chain: prompt → model → jsonParser
 */
function createKeywordExtractionChain() {
  const model = getHaikuModel({ temperature: 0, maxTokens: 2000 });
  const jsonParser = createJsonParser<KeywordExtractionResponse>();

  return extractionPrompt.pipe(model).pipe(jsonParser);
}

/**
 * Extract important keywords from a job description using LLM.
 * Server-side only - never expose API keys to client.
 *
 * Uses LCEL chain composition for better observability and composability.
 *
 * @param jobDescription - Raw job description text from user
 * @returns ActionResponse with categorized keywords or error
 */
export async function extractKeywords(
  jobDescription: string
): Promise<ActionResponse<ExtractedKeywords>> {
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

  console.log('[SS:keywords] Extracting keywords from JD (' + jobDescription.length + ' chars)');

  // Truncate very long JDs to avoid timeout
  const processedJD = jobDescription.length > MAX_JD_LENGTH
    ? jobDescription.substring(0, MAX_JD_LENGTH)
    : jobDescription;

  // Create and invoke LCEL chain
  const chain = createKeywordExtractionChain();

  console.log('[SS:keywords] Invoking LCEL chain (claude-haiku)...');

  const result = await invokeWithActionResponse(
    async () => {
      const response = await chain.invoke({ jobDescription: processedJD });

      // Validate structure
      if (!response.keywords || !Array.isArray(response.keywords)) {
        throw new Error('Invalid keyword structure from LLM');
      }

      console.log('[SS:keywords] Extracted', response.keywords.length, 'keywords');

      return {
        keywords: response.keywords,
        totalCount: response.keywords.length
      };
    },
    { timeoutMs: EXTRACTION_TIMEOUT_MS }
  );

  return result;
}

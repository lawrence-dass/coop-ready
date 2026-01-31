// Story 5.1: LLM Keyword Matching in Resume
// Phase 2: LCEL migration
import { ActionResponse } from '@/types';
import { ExtractedKeyword, MatchedKeyword, KeywordAnalysisResult } from '@/types/analysis';
import { getHaikuModel } from './models';
import { ChatPromptTemplate, createJsonParser, invokeWithActionResponse } from './chains';

const MATCHING_TIMEOUT_MS = 20000; // 20 seconds budget for matching

/**
 * Prompt template for keyword matching
 * Uses XML-wrapped user content for prompt injection defense
 */
const matchingPrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert analyzing keyword matches.

Find which of these keywords appear in the resume. Use semantic matching (e.g., "JavaScript" matches "JS", "React.js" matches "React", "team leadership" matches "led teams").

<keywords>
{keywords}
</keywords>

<resume_content>
{resumeContent}
</resume_content>

For each keyword:
- found: true/false
- context: exact phrase from resume where found (if found, max 100 chars)
- matchType: "exact" (exact string match), "fuzzy" (abbreviation/variation), or "semantic" (similar meaning)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "matches": [
    {{
      "keyword": "Python",
      "category": "technologies",
      "found": true,
      "context": "Developed data pipelines using Python and pandas",
      "matchType": "exact"
    }},
    {{
      "keyword": "Docker",
      "category": "technologies",
      "found": false,
      "matchType": "exact"
    }}
  ]
}}`);

/**
 * Response type from LLM
 */
interface MatchingResponse {
  matches: MatchedKeyword[];
}

/**
 * Create the LCEL chain for keyword matching
 * Chain: prompt → model → jsonParser
 */
function createKeywordMatchingChain() {
  const model = getHaikuModel({ temperature: 0, maxTokens: 4000 });
  const jsonParser = createJsonParser<MatchingResponse>();

  return matchingPrompt.pipe(model).pipe(jsonParser);
}

/**
 * Match extracted keywords against resume content using semantic LLM matching.
 * Supports exact, fuzzy, and semantic matches.
 *
 * Uses LCEL chain composition for better observability and composability.
 *
 * @param resumeContent - Parsed resume text
 * @param extractedKeywords - Keywords from job description
 * @returns ActionResponse with matched/missing keywords or error
 */
export async function matchKeywords(
  resumeContent: string,
  extractedKeywords: ExtractedKeyword[]
): Promise<ActionResponse<KeywordAnalysisResult>> {
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

  console.log('[SS:match] Matching', extractedKeywords.length, 'keywords against resume (' + resumeContent.length + ' chars)');

  // Create and invoke LCEL chain
  const chain = createKeywordMatchingChain();

  console.log('[SS:match] Invoking LCEL chain (claude-haiku)...');

  const result = await invokeWithActionResponse(
    async () => {
      const response = await chain.invoke({
        keywords: JSON.stringify(extractedKeywords),
        resumeContent
      });

      // Validate structure
      if (!response.matches || !Array.isArray(response.matches)) {
        throw new Error('Invalid match structure from LLM');
      }

      // Split into matched and missing
      const matched = response.matches.filter(m => m.found);
      const missing = response.matches
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

      console.log('[SS:match] Match complete:', matched.length, 'matched,', missing.length, 'missing, rate:', matchRate + '%');

      return {
        matched,
        missing,
        matchRate,
        analyzedAt: new Date().toISOString()
      };
    },
    { timeoutMs: MATCHING_TIMEOUT_MS }
  );

  return result;
}

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
import {
  buildPreferencePrompt,
  getJobTypeVerbGuidance,
  getJobTypeFramingGuidance,
  getCandidateTypeGuidance,
  deriveEffectiveCandidateType,
} from './preferences';
import { getSonnetModel } from './models';
import {
  ChatPromptTemplate,
  createJsonParser,
  invokeWithActionResponse,
} from './chains';
import { redactPII, restorePII } from './redactPII';
import type { SectionATSContext } from './buildSectionATSContext';
import type { CandidateType } from '@/lib/scoring/types';

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
 * Generates both compact (same-length) and full (comprehensive) versions
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
{atsContextSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Analyze the job description and identify 2-3 most relevant keywords that align with the summary
2. Create TWO versions of the optimized summary (see below)
3. ONLY reframe existing experience - NEVER fabricate skills, experiences, or qualifications
4. Make the language sound natural and professional (avoid AI-tell phrases)
5. Maintain the user's voice and authenticity
6. Estimate the point value this summary optimization would add to the ATS score
7. Include a 1-2 sentence explanation of why this summary change improves ATS alignment (reference specific JD keywords or requirements)

**Two-Version Output:**
Generate BOTH versions in your response:

1. **suggested_compact**: A quick-edit version that stays within {minCompactWords}-{maxCompactWords} words (matching the original length of {originalWordCount} words). Focus on the 2-3 highest-impact keyword substitutions only. This is for users who need a drop-in replacement without reformatting their resume.

2. **suggested_full**: A comprehensive rewrite (50-150 words) maximizing ATS optimization with all relevant keywords.

Both versions should incorporate keywords from the job description while maintaining authenticity.

**Impact Tier Assignment:**
Assign an impact tier based on magnitude of change:
- "critical" = Major reframe with multiple high-priority keywords from JD
- "high" = Significant keyword incorporation with some reframing
- "moderate" = Minor keyword additions or small enhancements

Also assign a point_value for section-level calculations:
- critical = 10-12 points
- high = 7-9 points
- moderate = 5-7 points

**Critical Rules:**
- Do NOT add skills or experiences not present in the original
- Do NOT use phrases like "I have the pleasure", "leverage my expertise", "synergize"
- Make it sound like a human wrote it, not an AI
- Point values must be realistic for actual ATS systems
- Explanation must reference specific JD keywords (not generic phrases like "improves score")
- Keep explanation concise (1-2 sentences, max 300 chars)
- The compact version MUST stay within the specified word count range

**⚠️ MANDATORY - ATS Context Priority (If Provided):**
- You MUST incorporate ALL 🔴 REQUIRED keywords from the ATS context into your suggested summary
- REQUIRED keywords have 3-6x more point impact than PREFERRED keywords
- Missing REQUIRED keywords CAP the user's score - they cannot achieve a high score without them
- Your keywords_added array MUST include REQUIRED keywords first
- VERIFICATION: Before returning, confirm every 🔴 REQUIRED keyword from ATS context is addressed in the suggestion

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "suggested_compact": "Your quick-edit version here (same length as original)",
  "suggested_full": "Your comprehensive optimized summary here (50-150 words)",
  "keywords_added": ["keyword1", "keyword2", "keyword3"],
  "impact": "high",
  "point_value": 8,
  "explanation": "Adding AWS highlights your infrastructure experience directly mentioned in JD's 'AWS expertise required' requirement."
}}`);

// ============================================================================
// TYPES
// ============================================================================

interface SummaryLLMResponse {
  // New dual-version fields
  suggested_compact?: string;
  suggested_full?: string;
  // Legacy field (for backward compat with old prompts)
  suggested?: string;
  keywords_added: string[];
  impact?: string;
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
  const model = getSonnetModel({ temperature: 0.3, maxTokens: 2000 });
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
 * - Uses ATS context for consistency with analysis (if provided)
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
 * @param atsContext - ATS analysis context for consistency (optional, for gap-aware suggestions)
 * @param candidateType - Detected candidate type (optional, for candidate-type-specific framing)
 * @returns ActionResponse with suggestion or error
 */
export async function generateSummarySuggestion(
  resumeSummary: string,
  jobDescription: string,
  keywords?: string[],
  preferences?: OptimizationPreferences | null,
  userContext?: UserContext,
  resumeEducation?: string,
  atsContext?: SectionATSContext,
  candidateType?: CandidateType
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

  // Derive effective candidate type (fallback from preferences.jobType)
  const effectiveCandidateType = deriveEffectiveCandidateType(candidateType, preferences);

  // Calculate word counts for dual-length suggestions
  const originalWordCount = resumeSummary.trim().split(/\s+/).filter(w => w.length > 0).length;
  const minCompactWords = Math.max(10, Math.floor(originalWordCount * 0.75));
  const maxCompactWords = Math.ceil(originalWordCount * 1.25);

  console.log(
    '[SS:genSummary] Generating summary suggestion (' +
      resumeSummary?.length +
      ' chars summary, ' +
      jobDescription?.length +
      ' chars JD, ' +
      originalWordCount +
      ' words, compact target: ' +
      minCompactWords +
      '-' +
      maxCompactWords +
      ')'
  );

  // Truncate very long inputs to avoid timeout
  let processedSummary =
    resumeSummary.length > MAX_SUMMARY_LENGTH
      ? resumeSummary.substring(0, MAX_SUMMARY_LENGTH)
      : resumeSummary;

  let processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  // Redact PII before sending to LLM
  const summaryRedaction = redactPII(processedSummary);
  const jdRedaction = redactPII(processedJD);
  const eduRedaction = resumeEducation
    ? redactPII(resumeEducation)
    : { redactedText: '', redactionMap: new Map(), stats: { emails: 0, phones: 0, urls: 0, addresses: 0 } };

  processedSummary = summaryRedaction.redactedText;
  processedJD = jdRedaction.redactedText;
  const redactedEducation = eduRedaction.redactedText;

  console.log('[SS:genSummary] PII redacted:', {
    summary: summaryRedaction.stats,
    jd: jdRedaction.stats,
    education: eduRedaction.stats,
  });

  // Detect AI-tell phrases in original summary
  const originalAITellPhrases = detectAITellPhrases(processedSummary);

  // Build conditional prompt sections
  const educationSection =
    resumeEducation && resumeEducation.trim().length > 0
      ? `<education_context>\n${redactedEducation}\n</education_context>\n`
      : '';

  const keywordsSection =
    keywords && keywords.length > 0
      ? `<extracted_keywords>\n${keywords.join(', ')}\n</extracted_keywords>`
      : '';

  // Build job-type-specific guidance (injected before general preferences for prominence)
  const hasEducation = !!resumeEducation && resumeEducation.trim().length > 0;
  const candidateTypeGuidance = `${getCandidateTypeGuidance(effectiveCandidateType, 'summary')}\n\n`;

  // Add special framing for co-op with existing summary or career changer
  let specialFraming = '';
  if (effectiveCandidateType === 'coop' && resumeSummary.trim().length > 0) {
    specialFraming = `**IMPORTANT - Co-op Candidate Has Summary:**
This co-op candidate has a summary section. According to best practices, co-op candidates should NOT include a summary (wastes space on 1-page resume).
- If summary is generic: Recommend REMOVING it entirely.
- If summary contains important keywords: Suggest CONDENSING to 1 line maximum.
- Include this recommendation in your explanation field.

`;
  } else if (effectiveCandidateType === 'career_changer') {
    specialFraming = `**CRITICAL - Career Changer Summary:**
The summary is the MOST IMPORTANT section for career changers. It must bridge the old career to the new career with explicit transition narrative.
- Lead with transition statement: "Transitioning from [old field] to [new field]"
- Include exact job title from JD
- Add 2-3 new-career technical keywords
- Include one quantified transferable achievement from previous career
- Must be 2-3 sentences that clearly articulate career change viability.

`;
  }

  const jobTypeGuidance = preferences
    ? `${specialFraming}${candidateTypeGuidance}${getJobTypeVerbGuidance(effectiveCandidateType)}\n\n${getJobTypeFramingGuidance(effectiveCandidateType, 'summary', hasEducation)}\n\n`
    : `${specialFraming}${candidateTypeGuidance}`;

  const preferenceSection = preferences
    ? `\n${buildPreferencePrompt(preferences, userContext)}\n`
    : '';

  // Build ATS context section if provided
  const atsContextSection = atsContext
    ? `<ats_analysis_context>\n${atsContext.promptContext}\n</ats_analysis_context>\n\n`
    : '';

  if (atsContext) {
    console.log('[SS:genSummary] ATS context provided:', {
      terminologyFixes: atsContext.terminologyFixes.length,
      potentialAdditions: atsContext.potentialAdditions.length,
      opportunities: atsContext.opportunities.length,
    });
  }

  // Create and invoke LCEL chain
  const chain = createSummarySuggestionChain();

  const result = await invokeWithActionResponse(async () => {
    const parsed = await chain.invoke({
      summary: processedSummary,
      jobDescription: processedJD,
      educationSection,
      keywordsSection,
      atsContextSection,
      jobTypeGuidance,
      preferenceSection,
      originalWordCount: originalWordCount.toString(),
      minCompactWords: minCompactWords.toString(),
      maxCompactWords: maxCompactWords.toString(),
    });

      // Helper to count words
      const countWords = (text: string): number =>
        text.trim().split(/\s+/).filter(w => w.length > 0).length;

      // Handle dual-version or legacy single-version response
      const suggestedCompact = parsed.suggested_compact;
      const suggestedFull = parsed.suggested_full || parsed.suggested;

      // Validate structure - require at least full version
      if (!suggestedFull || typeof suggestedFull !== 'string') {
        throw new Error('Invalid suggestion structure from LLM');
      }

      if (!parsed.keywords_added || !Array.isArray(parsed.keywords_added)) {
        throw new Error('Invalid keywords structure from LLM');
      }

      // Validate compact version if present
      let validCompact = suggestedCompact;
      if (suggestedCompact && typeof suggestedCompact === 'string') {
        const compactWordCount = countWords(suggestedCompact);
        if (compactWordCount < minCompactWords || compactWordCount > maxCompactWords) {
          console.warn(
            `[SS:genSummary] Compact length ${compactWordCount} outside target ${minCompactWords}-${maxCompactWords}, but keeping it`
          );
        }
      } else {
        validCompact = undefined;
      }

      // Validate point_value if present
      let pointValue = parsed.point_value;
      if (pointValue !== undefined && (typeof pointValue !== 'number' || pointValue < 0 || pointValue > 100)) {
        console.warn('[SS:genSummary] Invalid point_value from LLM, ignoring:', pointValue);
        pointValue = undefined;
      }

      // Validate impact tier if present
      const validImpactTiers = ['critical', 'high', 'moderate'];
      const validImpact = parsed.impact && validImpactTiers.includes(parsed.impact)
        ? parsed.impact as 'critical' | 'high' | 'moderate'
        : undefined;

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

      // Restore PII in suggested summaries and explanation
      const restoredFull = restorePII(suggestedFull, summaryRedaction.redactionMap);
      const restoredCompact = validCompact
        ? restorePII(validCompact, summaryRedaction.redactionMap)
        : undefined;
      const restoredExplanation = explanation
        ? restorePII(explanation, jdRedaction.redactionMap)
        : explanation;

      // Detect AI-tell phrases in suggested summary (use full version)
      const suggestedAITellPhrases = detectAITellPhrases(restoredFull);

      // Calculate final word counts
      const compactWordCount = restoredCompact ? countWords(restoredCompact) : undefined;
      const fullWordCount = countWords(restoredFull);

      console.log(
        '[SS:genSummary] Summary generated, keywords added:',
        parsed.keywords_added,
        ', impact:',
        validImpact,
        ', point_value:',
        pointValue,
        ', explanation:',
        explanation ? 'present' : 'missing',
        ', original words:',
        originalWordCount,
        ', compact words:',
        compactWordCount ?? 'N/A',
        ', full words:',
        fullWordCount
      );

      return {
        original: resumeSummary, // Return full original, not truncated
        suggested: restoredFull, // Backward compat - alias to full
        suggested_compact: restoredCompact,
        suggested_full: restoredFull,
        original_word_count: originalWordCount,
        compact_word_count: compactWordCount,
        full_word_count: fullWordCount,
        ats_keywords_added: parsed.keywords_added,
        ai_tell_phrases_rewritten: [
          ...originalAITellPhrases,
          ...suggestedAITellPhrases,
        ],
        impact: validImpact,
        point_value: pointValue,
        explanation: restoredExplanation,
      };
    },
    { errorMessage: 'Failed to generate summary suggestion' }
  );

  return result;
}

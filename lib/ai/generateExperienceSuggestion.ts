/**
 * Experience Suggestion Generation
 * Story 6.4: Generate optimized experience section suggestions
 * Phase 2: LCEL migration
 *
 * Uses Claude LLM to optimize user's experience section by:
 * 1. Extracting experience entries from resume
 * 2. Reframing bullets with relevant keywords from JD
 * 3. Adding quantification where possible
 * 4. Maintaining authenticity (no fabrication)
 * 5. Returning structured suggestions
 */

import { ActionResponse, OptimizationPreferences, UserContext } from '@/types';
import { ExperienceSuggestion } from '@/types/suggestions';
import {
  buildPreferencePrompt,
  getJobTypeVerbGuidance,
  getJobTypeFramingGuidance,
} from './preferences';
import { getSonnetModel } from './models';
import {
  ChatPromptTemplate,
  createJsonParser,
  invokeWithActionResponse,
} from './chains';
import { redactPII, restorePII } from './redactPII';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_EXPERIENCE_LENGTH = 6000;
const MAX_JD_LENGTH = 3000;
const MAX_RESUME_LENGTH = 4000;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Prompt template for experience suggestion
 * Uses XML-wrapped user content for prompt injection defense
 */
const experiencePrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert specializing in experience section enhancement.

Your task is to optimize professional experience bullets by incorporating relevant keywords from a job description and adding quantification where possible.

<user_content>
{experience}
</user_content>

<job_description>
{jobDescription}
</job_description>

<user_content>
{resumeContent}
</user_content>
{educationSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Extract each work experience entry with company, role, dates, and bullets
2. For each bullet, reframe to incorporate relevant keywords from the JD naturally
3. Identify where metrics or quantification can be added (inferred from context, not fabricated)
4. Maintain authenticity - ONLY enhance existing achievements, NEVER fabricate
5. Prioritize impact, results, and quantifiable outcomes
6. Start each bullet with an appropriate action verb (see verb guidance above)
7. Focus on achievements, not just tasks
8. Assign an impact tier to each bullet optimization (critical/high/moderate)
9. For each bullet, include 1-2 sentence explanation of how it aligns with JD requirements (reference specific keywords)

**Impact Tier Assignment:**
For each bullet optimization, assign an impact tier:
- "critical" = Major reframe with multiple keywords + metrics, directly addresses core JD requirements
- "high" = Keyword incorporation with some metrics, strongly relevant to JD
- "moderate" = Simple keyword addition or minor enhancement

Also assign a point_value for section-level calculations:
- critical = 6-10 points
- high = 4-6 points
- moderate = 2-4 points

Total point value = sum of all bullet optimizations. Realistic range: 20-40 points for experience section.

**Critical Rules:**
- Do NOT add specific metrics you cannot reasonably infer from the context
- Do NOT fabricate achievements, technologies, or team sizes
- Make bullet improvements sound natural and human-written
- If no metrics can be reasonably inferred, focus on keyword incorporation
- Maintain chronological context and job progression
- Point values must be realistic and reflect actual ATS impact
- Each bullet explanation must reference specific JD keywords (not generic)
- Keep explanations concise (1-2 sentences, max 200 chars each)

**Authenticity Examples:**
✓ "Managed project" → "Led cross-functional team to deliver project, reducing deployment time by 30%" (if context suggests efficiency gains)
✓ "Built features" → "Developed key features using React and Node.js" (if technologies are mentioned elsewhere)
✗ "Wrote code" → "Reduced bugs by 95%" (too specific without evidence)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "experience_entries": [
    {{
      "company": "Company Name",
      "role": "Job Title",
      "dates": "2020 - 2023",
      "original_bullets": ["Original bullet 1", "Original bullet 2"],
      "suggested_bullets": [
        {{
          "original": "Managed project",
          "suggested": "Led cross-functional team to deliver 3-month project, incorporating [keyword], reducing deployment time by 30%",
          "metrics_added": ["3-month", "30%"],
          "keywords_incorporated": ["keyword", "cross-functional"],
          "impact": "critical",
          "point_value": 8,
          "explanation": "Adding 'cross-functional team leadership' directly addresses JD's requirement for collaboration skills."
        }}
      ]
    }}
  ],
  "total_point_value": 35,
  "summary": "Reframed 8 bullets across 3 roles, added metrics to 5, incorporated 6 keywords."
}}`);

// ============================================================================
// TYPES
// ============================================================================

interface ExperienceLLMResponse {
  experience_entries: Array<{
    company: string;
    role: string;
    dates: string;
    original_bullets: string[];
    suggested_bullets: Array<{
      original: string;
      suggested: string;
      metrics_added: string[];
      keywords_incorporated: string[];
      impact?: string;
      point_value?: number;
      explanation?: string;
    }>;
  }>;
  total_point_value?: number;
  summary: string;
}

// ============================================================================
// CHAIN
// ============================================================================

/**
 * Create the LCEL chain for experience suggestion
 * Chain: prompt → model → jsonParser
 */
function createExperienceSuggestionChain() {
  const model = getSonnetModel({ temperature: 0.4, maxTokens: 4000 });
  const jsonParser = createJsonParser<ExperienceLLMResponse>();

  return experiencePrompt.pipe(model).pipe(jsonParser);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate optimized experience suggestion using Claude LLM
 *
 * **Features:**
 * - Extracts experience entries with company, role, dates, bullets
 * - Reframes each bullet to incorporate relevant keywords from JD
 * - Identifies where quantification can be added (inferred, not fabricated)
 * - Maintains authenticity (reframe only, no fabrication)
 * - Handles multiple job entries gracefully
 * - Applies user optimization preferences
 * - Returns structured ActionResponse
 *
 * Uses LCEL chain composition for better observability and composability.
 *
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeExperience - User's current experience section
 * @param jobDescription - Job description text
 * @param resumeContent - Full resume content for context
 * @param preferences - User's optimization preferences (optional, uses defaults if not provided)
 * @param userContext - User context from onboarding (optional, for LLM personalization)
 * @param resumeEducation - User's education section (optional, for co-op/internship context)
 * @returns ActionResponse with suggestion or error
 */
export async function generateExperienceSuggestion(
  resumeExperience: string,
  jobDescription: string,
  resumeContent: string,
  preferences?: OptimizationPreferences | null,
  userContext?: UserContext,
  resumeEducation?: string
): Promise<ActionResponse<ExperienceSuggestion>> {
  // Validation
  if (!resumeExperience || resumeExperience.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume experience section is required',
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

  if (!resumeContent || resumeContent.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume content is required',
      },
    };
  }

  console.log(
    '[SS:genExp] Generating experience suggestion (' +
      resumeExperience?.length +
      ' chars exp, ' +
      jobDescription?.length +
      ' chars JD)'
  );

  // Truncate very long inputs to avoid timeout
  let processedExperience =
    resumeExperience.length > MAX_EXPERIENCE_LENGTH
      ? resumeExperience.substring(0, MAX_EXPERIENCE_LENGTH)
      : resumeExperience;

  let processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  let processedResume =
    resumeContent.length > MAX_RESUME_LENGTH
      ? resumeContent.substring(0, MAX_RESUME_LENGTH)
      : resumeContent;

  // Redact PII before sending to LLM
  const experienceRedaction = redactPII(processedExperience);
  const jdRedaction = redactPII(processedJD);
  const resumeRedaction = redactPII(processedResume);
  const eduRedaction = resumeEducation
    ? redactPII(resumeEducation)
    : {
        redactedText: '',
        redactionMap: new Map(),
        stats: { emails: 0, phones: 0, urls: 0, addresses: 0 },
      };

  processedExperience = experienceRedaction.redactedText;
  processedJD = jdRedaction.redactedText;
  processedResume = resumeRedaction.redactedText;
  const redactedEducation = eduRedaction.redactedText;

  console.log('[SS:genExp] PII redacted:', {
    experience: experienceRedaction.stats,
    jd: jdRedaction.stats,
    resume: resumeRedaction.stats,
    education: eduRedaction.stats,
  });

  // Build conditional prompt sections
  const educationSection =
    resumeEducation && resumeEducation.trim().length > 0
      ? `<education_context>\nUse this to understand academic background and connect experience to coursework:\n${redactedEducation}\n</education_context>\n`
      : '';

  // Build job-type-specific guidance (injected before general preferences for prominence)
  const hasEducation = !!resumeEducation && resumeEducation.trim().length > 0;
  const jobTypeGuidance = preferences
    ? `${getJobTypeVerbGuidance(preferences.jobType)}\n\n${getJobTypeFramingGuidance(preferences.jobType, 'experience', hasEducation)}\n\n`
    : '';

  const preferenceSection = preferences
    ? `\n${buildPreferencePrompt(preferences, userContext)}\n`
    : '';

  // Create and invoke LCEL chain
  const chain = createExperienceSuggestionChain();

  const result = await invokeWithActionResponse(async () => {
    const parsed = await chain.invoke({
      experience: processedExperience,
      jobDescription: processedJD,
      resumeContent: processedResume,
      educationSection,
      jobTypeGuidance,
      preferenceSection,
    });

      // Validate structure
      if (!parsed.experience_entries || !Array.isArray(parsed.experience_entries)) {
        throw new Error('Invalid experience_entries structure from LLM');
      }

      if (!parsed.summary || typeof parsed.summary !== 'string') {
        throw new Error('Invalid summary structure from LLM');
      }

      // Validate each entry has required fields
      for (const entry of parsed.experience_entries) {
        if (!entry.company || !entry.role || !entry.dates) {
          throw new Error('Invalid experience entry structure from LLM');
        }

        if (!Array.isArray(entry.original_bullets) || !Array.isArray(entry.suggested_bullets)) {
          throw new Error('Invalid bullets structure from LLM');
        }
      }

      // Normalize suggested_bullets to ensure all fields exist
      const validImpactTiers = ['critical', 'high', 'moderate'];
      const normalizedEntries = parsed.experience_entries.map((entry) => ({
        ...entry,
        // Restore PII in company/role/dates
        company: restorePII(entry.company, experienceRedaction.redactionMap),
        role: restorePII(entry.role, experienceRedaction.redactionMap),
        dates: restorePII(entry.dates, experienceRedaction.redactionMap),
        original_bullets: entry.original_bullets || [],
        suggested_bullets: (entry.suggested_bullets || []).map((bullet) => {
          const pointValue = bullet.point_value;
          // Validate point_value if present
          const validPointValue =
            typeof pointValue === 'number' && pointValue >= 0 && pointValue <= 100
              ? pointValue
              : undefined;

          // Validate impact tier if present
          const validImpact =
            bullet.impact && validImpactTiers.includes(bullet.impact)
              ? (bullet.impact as 'critical' | 'high' | 'moderate')
              : undefined;

          // Handle explanation field (graceful fallback)
          let explanation: string | undefined = undefined;
          if (bullet.explanation !== undefined && bullet.explanation !== null) {
            if (typeof bullet.explanation === 'string') {
              // Truncate if too long (max 500 chars)
              explanation =
                bullet.explanation.length > 500
                  ? bullet.explanation.substring(0, 497) + '...'
                  : bullet.explanation;

              // Validate explanation quality (log warning if generic)
              const genericPhrases = [
                'improves score',
                'helps ats',
                'better ranking',
                'increases match',
              ];
              const isGeneric = genericPhrases.some((phrase) =>
                explanation!.toLowerCase().includes(phrase)
              );
              if (
                isGeneric &&
                !explanation.match(
                  /[A-Z][a-z]+ (expert|experience|required|skill|requirement)/i
                )
              ) {
                console.warn(
                  '[SS:genExp] Generic explanation detected (missing specific JD keywords):',
                  explanation
                );
              }

              // Restore PII in explanation
              explanation = restorePII(explanation, jdRedaction.redactionMap);
            }
          }

          return {
            original: restorePII(
              String(bullet.original || ''),
              experienceRedaction.redactionMap
            ),
            suggested: restorePII(
              String(bullet.suggested || ''),
              experienceRedaction.redactionMap
            ),
            metrics_added: Array.isArray(bullet.metrics_added)
              ? bullet.metrics_added
              : [],
            keywords_incorporated: Array.isArray(bullet.keywords_incorporated)
              ? bullet.keywords_incorporated
              : [],
            impact: validImpact,
            point_value: validPointValue,
            explanation: explanation,
          };
        }),
      }));

      // Validate total_point_value if present
      const totalPointValue =
        typeof parsed.total_point_value === 'number' &&
        parsed.total_point_value >= 0
          ? parsed.total_point_value
          : undefined;

      if (parsed.total_point_value !== undefined && totalPointValue === undefined) {
        console.warn('[SS:genExp] Invalid total_point_value from LLM, ignoring:', parsed.total_point_value);
      }

      const bulletWithExplanationCount = normalizedEntries.reduce(
        (count, entry) =>
          count + entry.suggested_bullets.filter((b) => b.explanation).length,
        0
      );
      console.log(
        '[SS:genExp] Experience generated:',
        normalizedEntries.length,
        'entries, total_point_value:',
        totalPointValue,
        ', bullets_with_explanation:',
        bulletWithExplanationCount
      );

      // Restore PII in summary
      const restoredSummary = restorePII(
        parsed.summary,
        experienceRedaction.redactionMap
      );

      return {
        original: resumeExperience, // Return full original, not truncated
        experience_entries: normalizedEntries,
        total_point_value: totalPointValue,
        summary: restoredSummary,
      };
    },
    { errorMessage: 'Failed to generate experience suggestion' }
  );

  return result;
}

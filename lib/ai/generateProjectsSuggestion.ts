/**
 * Projects Suggestion Generation
 * Story 18.5: Generate optimized projects section suggestions
 *
 * Uses Claude LLM to optimize user's projects section by:
 * 1. Extracting project entries from resume
 * 2. Optimizing bullets with relevant keywords from JD
 * 3. Adding quantification where possible
 * 4. Maintaining authenticity (no fabrication)
 * 5. Tailoring to candidate type (co-op, full-time, career changer)
 * 6. Returning structured suggestions
 */

import { ActionResponse, OptimizationPreferences, UserContext } from '@/types';
import { ProjectsSuggestion } from '@/types/suggestions';
import type { CandidateType } from '@/lib/scoring/types';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PROJECTS_LENGTH = 4000;
const MAX_JD_LENGTH = 3000;
const MAX_RESUME_LENGTH = 4000;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Prompt template for projects suggestion
 * Uses XML-wrapped user content for prompt injection defense
 * Generates both compact (same-length) and full (comprehensive) versions for each bullet
 */
const projectsPrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert specializing in projects section enhancement.

Your task is to optimize project description bullets by incorporating relevant keywords from a job description and adding quantification where possible.

<user_content>
{projects}
</user_content>

<job_description>
{jobDescription}
</job_description>

<user_content>
{resumeContent}
</user_content>
{educationSection}
{candidateTypeGuidance}
{atsContextSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Extract each project entry with title, technologies, dates (if present), and bullets
2. For each bullet, create TWO versions (see Two-Version Output below)
3. Identify where metrics or quantification can be added (inferred from context, not fabricated)
4. Maintain authenticity - ONLY enhance existing achievements, NEVER fabricate
5. Prioritize impact, results, and quantifiable outcomes
6. Start each bullet with an appropriate action verb (see verb guidance above)
7. Focus on achievements and technical skills demonstrated
8. Assign an impact tier to each bullet optimization (critical/high/moderate)
9. For each bullet, include 1-2 sentence explanation of how it aligns with JD requirements (reference specific keywords)

**Two-Version Output:**
For EACH bullet, generate BOTH versions:

1. **suggested_compact**: A quick-edit version that stays within ±25% of the original bullet's word count.
   - **CRITICAL: PRESERVE ALL EXISTING METRICS** - If the original has "1000 users", "3 month project", "4 team members", etc., these MUST appear in the compact version
   - Focus on 1-2 highest-impact keyword substitutions while keeping the metrics intact
   - This is for users who need a drop-in replacement without losing their quantified achievements

2. **suggested_full**: A comprehensive rewrite maximizing ATS optimization with keywords and enhanced metrics.

Both versions should incorporate keywords from the job description while maintaining authenticity.
**The compact version must NEVER remove metrics that exist in the original bullet.**

**Impact Tier Assignment:**
For each bullet optimization, assign an impact tier:
- "critical" = Major reframe with multiple keywords + metrics, directly addresses core JD requirements
- "high" = Keyword incorporation with some metrics, strongly relevant to JD
- "moderate" = Simple keyword addition or minor enhancement

Also assign a point_value for section-level calculations:
- critical = 6-10 points
- high = 4-6 points
- moderate = 2-4 points

Total point value = sum of all bullet optimizations. Realistic range: 15-30 points for projects section.

**Critical Rules:**
- Do NOT add specific metrics you cannot reasonably infer from the context
- Do NOT fabricate project titles, technologies, outcomes, or team sizes
- Do NOT invent projects that don't exist in the original text
- Make bullet improvements sound natural and human-written
- If no metrics can be reasonably inferred, focus on keyword incorporation
- Point values must be realistic and reflect actual ATS impact
- Each bullet explanation must reference specific JD keywords (not generic)
- Keep explanations concise (1-2 sentences, max 200 chars each)
- The compact version MUST stay close to the original word count
- **NEVER remove existing metrics from compact version**

**⚠️ MANDATORY - ATS Context Priority (If Provided):**
- You MUST incorporate ALL 🔴 REQUIRED keywords from the ATS context into your bullet improvements
- REQUIRED keywords have 3-6x more point impact than PREFERRED keywords
- Missing REQUIRED keywords CAP the user's score - they cannot achieve a high score without them
- Your keywords_incorporated arrays MUST include REQUIRED keywords
- VERIFICATION: Before returning, confirm every 🔴 REQUIRED keyword from ATS context is incorporated into at least one bullet

**Heading Suggestion (Co-op Only):**
If the candidate is a co-op/internship student, include "heading_suggestion": "Project Experience" in the response. This helps ATS systems weight projects as primary experience.

**Authenticity Examples:**
✓ "Built web app" → "Developed full-stack web application using React and Node.js, serving 500+ users" (if context suggests scale)
✓ "Analyzed data" → "Performed data analysis using Python and pandas" (if technologies are mentioned)
✗ "Created dashboard" → "Improved decision-making by 90%" (too specific without evidence)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "project_entries": [
    {{
      "title": "E-commerce Platform",
      "technologies": ["React", "Node.js", "PostgreSQL"],
      "dates": "Spring 2024",
      "original_bullets": ["Built features for shopping cart and payment"],
      "suggested_bullets": [
        {{
          "original": "Built features for shopping cart and payment",
          "suggested_compact": "Developed shopping cart and payment features using React and Stripe API",
          "suggested_full": "Engineered full-stack shopping cart and secure payment processing features using React frontend and Stripe API integration, handling 1000+ test transactions",
          "metrics_added": ["1000+"],
          "keywords_incorporated": ["React", "API integration", "payment processing"],
          "impact": "high",
          "point_value": 6,
          "explanation": "Incorporates React and API keywords from JD while highlighting payment processing skills."
        }}
      ]
    }}
  ],
  "total_point_value": 20,
  "summary": "Optimized 5 bullets across 2 projects, incorporated 8 relevant keywords.",
  "heading_suggestion": "Project Experience"
}}`);

// ============================================================================
// TYPES
// ============================================================================

interface ProjectsLLMResponse {
  project_entries: Array<{
    title: string;
    technologies: string[];
    dates?: string;
    original_bullets: string[];
    suggested_bullets: Array<{
      original: string;
      suggested_compact?: string;
      suggested_full?: string;
      suggested?: string; // Legacy backward compat
      metrics_added: string[];
      keywords_incorporated: string[];
      impact?: string;
      point_value?: number;
      explanation?: string;
    }>;
  }>;
  total_point_value?: number;
  summary: string;
  heading_suggestion?: string;
}

// ============================================================================
// CHAIN
// ============================================================================

/**
 * Create the LCEL chain for projects suggestion
 * Chain: prompt → model → jsonParser
 */
function createProjectsSuggestionChain() {
  const model = getSonnetModel({ temperature: 0.4, maxTokens: 3500 });
  const jsonParser = createJsonParser<ProjectsLLMResponse>();

  return projectsPrompt.pipe(model).pipe(jsonParser);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate optimized projects suggestion using Claude LLM
 *
 * **Features:**
 * - Extracts project entries with title, technologies, dates, bullets
 * - Optimizes each bullet to incorporate relevant keywords from JD
 * - Identifies where quantification can be added (inferred, not fabricated)
 * - Maintains authenticity (reframe only, no fabrication)
 * - Tailors framing to candidate type (co-op, full-time, career changer)
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
 * @param resumeProjects - User's current projects section
 * @param jobDescription - Job description text
 * @param resumeContent - Full resume content for context
 * @param preferences - User's optimization preferences (optional, uses defaults if not provided)
 * @param userContext - User context from onboarding (optional, for LLM personalization)
 * @param resumeEducation - User's education section (optional, for context)
 * @param atsContext - ATS analysis context for consistency (optional, for gap-aware suggestions)
 * @param candidateType - Explicit candidate type (optional, derived from preferences.jobType if not provided)
 * @returns ActionResponse with suggestion or error
 */
export async function generateProjectsSuggestion(
  resumeProjects: string,
  jobDescription: string,
  resumeContent?: string,
  preferences?: OptimizationPreferences | null,
  userContext?: UserContext,
  resumeEducation?: string,
  atsContext?: SectionATSContext,
  candidateType?: CandidateType
): Promise<ActionResponse<ProjectsSuggestion>> {
  // Validation
  if (!resumeProjects || resumeProjects.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume projects section is required',
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

  // Derive candidateType from preferences if not explicitly provided
  const effectiveCandidateType = deriveEffectiveCandidateType(candidateType, preferences);

  console.log(
    '[SS:genProjects] Generating projects suggestion (' +
      resumeProjects?.length +
      ' chars projects, ' +
      jobDescription?.length +
      ' chars JD, candidateType: ' +
      effectiveCandidateType +
      ')'
  );

  // Truncate very long inputs to avoid timeout
  let processedProjects =
    resumeProjects.length > MAX_PROJECTS_LENGTH
      ? resumeProjects.substring(0, MAX_PROJECTS_LENGTH)
      : resumeProjects;

  let processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  let processedResume = resumeContent
    ? resumeContent.length > MAX_RESUME_LENGTH
      ? resumeContent.substring(0, MAX_RESUME_LENGTH)
      : resumeContent
    : '';

  // Redact PII before sending to LLM
  const projectsRedaction = redactPII(processedProjects);
  const jdRedaction = redactPII(processedJD);
  const resumeRedaction = resumeContent
    ? redactPII(processedResume)
    : {
        redactedText: '',
        redactionMap: new Map(),
        stats: { emails: 0, phones: 0, urls: 0, addresses: 0 },
      };
  const eduRedaction = resumeEducation
    ? redactPII(resumeEducation)
    : {
        redactedText: '',
        redactionMap: new Map(),
        stats: { emails: 0, phones: 0, urls: 0, addresses: 0 },
      };

  processedProjects = projectsRedaction.redactedText;
  processedJD = jdRedaction.redactedText;
  processedResume = resumeRedaction.redactedText;
  const redactedEducation = eduRedaction.redactedText;

  console.log('[SS:genProjects] PII redacted:', {
    projects: projectsRedaction.stats,
    jd: jdRedaction.stats,
    resume: resumeRedaction.stats,
    education: eduRedaction.stats,
  });

  // Build conditional prompt sections
  const educationSection =
    resumeEducation && resumeEducation.trim().length > 0
      ? `<education_context>\nUse this to understand academic background and connect projects to coursework:\n${redactedEducation}\n</education_context>\n`
      : '';

  // Build candidate-type-specific guidance using shared function
  const candidateTypeGuidance = `\n${getCandidateTypeGuidance(effectiveCandidateType, 'projects')}\n\n`;

  // Build job-type-specific guidance (injected before general preferences for prominence)
  const hasEducation = !!resumeEducation && resumeEducation.trim().length > 0;
  const jobTypeGuidance = preferences
    ? `${getJobTypeVerbGuidance(effectiveCandidateType)}\n\n${getJobTypeFramingGuidance(effectiveCandidateType, 'projects', hasEducation)}\n\n`
    : '';

  const preferenceSection = preferences
    ? `\n${buildPreferencePrompt(preferences, userContext)}\n`
    : '';

  // Build ATS context section if provided
  const atsContextSection = atsContext
    ? `<ats_analysis_context>\n${atsContext.promptContext}\n</ats_analysis_context>\n\n`
    : '';

  if (atsContext) {
    console.log('[SS:genProjects] ATS context provided:', {
      terminologyFixes: atsContext.terminologyFixes.length,
      potentialAdditions: atsContext.potentialAdditions.length,
      quantificationNeeded: atsContext.flags.quantificationNeeded,
      actionVerbsWeak: atsContext.flags.actionVerbsWeak,
    });
  }

  // Create and invoke LCEL chain
  const chain = createProjectsSuggestionChain();

  const result = await invokeWithActionResponse(async () => {
    const parsed = await chain.invoke({
      projects: processedProjects,
      jobDescription: processedJD,
      resumeContent: processedResume,
      educationSection,
      candidateTypeGuidance,
      atsContextSection,
      jobTypeGuidance,
      preferenceSection,
    });

    // Validate structure
    if (!parsed.project_entries || !Array.isArray(parsed.project_entries)) {
      throw new Error('Invalid project_entries structure from LLM');
    }

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid summary structure from LLM');
    }

    // Validate each entry has required fields
    for (const entry of parsed.project_entries) {
      if (!entry.title || !Array.isArray(entry.suggested_bullets)) {
        throw new Error('Invalid project entry structure from LLM');
      }
    }

    // Helper to count words
    const countWords = (text: string): number =>
      text.trim().split(/\s+/).filter((w) => w.length > 0).length;

    // Normalize suggested_bullets to ensure all fields exist
    const validImpactTiers = ['critical', 'high', 'moderate'];
    const normalizedEntries = parsed.project_entries.map((entry) => ({
      ...entry,
      // Restore PII in title
      title: restorePII(entry.title, projectsRedaction.redactionMap),
      // Restore PII in dates if present
      dates: entry.dates
        ? restorePII(entry.dates, projectsRedaction.redactionMap)
        : undefined,
      // Restore PII in bullets
      original_bullets: entry.original_bullets.map((b) =>
        restorePII(b, projectsRedaction.redactionMap)
      ),
      suggested_bullets: entry.suggested_bullets.map((bullet) => {
        // Restore PII in all bullet text fields
        const originalRestored = restorePII(
          bullet.original,
          projectsRedaction.redactionMap
        );

        // Handle dual-version format
        const compactRestored = bullet.suggested_compact
          ? restorePII(bullet.suggested_compact, projectsRedaction.redactionMap)
          : undefined;
        const fullRestored = bullet.suggested_full
          ? restorePII(bullet.suggested_full, projectsRedaction.redactionMap)
          : undefined;

        // Legacy field restoration
        const suggestedRestored = bullet.suggested
          ? restorePII(bullet.suggested, projectsRedaction.redactionMap)
          : undefined;

        // Explanation restoration
        const explanationRestored = bullet.explanation
          ? restorePII(bullet.explanation, projectsRedaction.redactionMap)
          : undefined;

        // Validate and normalize impact tier
        const normalizedImpact =
          bullet.impact && validImpactTiers.includes(bullet.impact)
            ? bullet.impact
            : 'moderate';

        // Validate point_value (0-100)
        const normalizedPointValue = bullet.point_value
          ? Math.max(0, Math.min(100, bullet.point_value))
          : undefined;

        // Truncate explanation to 500 chars
        const truncatedExplanation =
          explanationRestored && explanationRestored.length > 500
            ? explanationRestored.substring(0, 500) + '...'
            : explanationRestored;

        // Word counts for UI display
        const originalWordCount = countWords(originalRestored);
        const compactWordCount = compactRestored ? countWords(compactRestored) : undefined;
        const fullWordCount = fullRestored ? countWords(fullRestored) : undefined;

        return {
          original: originalRestored,
          // Prioritize dual-version fields, fallback to legacy
          suggested: fullRestored ?? suggestedRestored ?? compactRestored ?? originalRestored,
          suggested_compact: compactRestored,
          suggested_full: fullRestored,
          original_word_count: originalWordCount,
          compact_word_count: compactWordCount,
          full_word_count: fullWordCount,
          metrics_added: bullet.metrics_added || [],
          keywords_incorporated: bullet.keywords_incorporated || [],
          impact: normalizedImpact,
          point_value: normalizedPointValue,
          explanation: truncatedExplanation,
        };
      }),
    }));

    // Add heading suggestion for co-op candidates
    const headingSuggestion =
      effectiveCandidateType === 'coop' ? 'Project Experience' : parsed.heading_suggestion;

    // Return normalized structure
    return {
      original: resumeProjects,
      project_entries: normalizedEntries,
      total_point_value: parsed.total_point_value,
      explanation: parsed.summary, // Map summary to explanation for consistency
      heading_suggestion: headingSuggestion,
      summary: parsed.summary,
    } as ProjectsSuggestion;
  }); // No options needed - using defaults

  return result;
}

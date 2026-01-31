/**
 * Skills Suggestion Generation
 * Story 6.3: Generate optimized skills section suggestions
 * Phase 2: LCEL migration
 *
 * Uses Claude LLM to optimize user's skills section by:
 * 1. Extracting skills from resume and job description
 * 2. Identifying matching keywords
 * 3. Finding missing but relevant skills
 * 4. Suggesting skills to add or remove
 * 5. Returning structured suggestions
 */

import { ActionResponse, OptimizationPreferences, UserContext } from '@/types';
import { SkillsSuggestion } from '@/types/suggestions';
import { buildPreferencePrompt, getJobTypeFramingGuidance } from './preferences';
import { getSonnetModel } from './models';
import { ChatPromptTemplate, createJsonParser, invokeWithActionResponse } from './chains';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_SKILLS_LENGTH = 1000;
const MAX_JD_LENGTH = 3000;
const MAX_RESUME_LENGTH = 4000;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Prompt template for skills suggestion
 * Uses XML-wrapped user content for prompt injection defense
 */
const skillsPrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert specializing in skills sections.

Your task is to analyze a skills section and optimize it for a specific job description.

<user_content>
{skills}
</user_content>

<job_description>
{jobDescription}
</job_description>

{resumeSection}
{educationSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Extract all skills from the current skills section
2. Identify skills from the job description that match existing skills
3. Find skills from the JD that are missing but relevant based on the user's experience
4. Suggest specific skills to add (only if user has experience with them based on resume)
5. Identify skills that might be less relevant for this role (if any)
6. Assign an impact tier to each missing skill (critical/high/moderate)
7. Provide a brief summary with total point value
8. Include a 1-2 sentence explanation of why these skills matter for this role (reference specific JD keywords)

**Impact Tier Assignment:**
For each missing skill, assign an impact tier:
- "critical" = Explicitly required in job description (e.g., listed as "Required" or "Must have")
- "high" = Strongly desired or mentioned multiple times in JD
- "moderate" = Nice-to-have or tangentially related to the role

Also assign a point_value for section-level calculations:
- critical = 5-7 points
- high = 3-4 points
- moderate = 1-2 points

Total point value = sum of all skill additions. Realistic range: 10-25 points for skills section.

**Critical Rules:**
- ONLY suggest adding skills the user likely has based on their resume content
- Do NOT fabricate skills or experience
- Do NOT suggest skills unrelated to the job description
- Skills can be technical (languages, frameworks), tools (AWS, Docker), or soft skills (Leadership)
- Be specific with skill names (e.g., "React.js" not just "front-end")
- Impact tiers must accurately reflect JD emphasis
- Explanation must connect suggestion to specific JD keywords (not generic phrases)
- Keep explanation concise (1-2 sentences, max 300 chars)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "existing_skills": ["skill1", "skill2"],
  "matched_keywords": ["matched_skill1", "matched_skill2"],
  "missing_but_relevant": [
    {{ "skill": "Docker", "reason": "Job requires containerization; you have DevOps experience", "impact": "critical", "point_value": 6 }}
  ],
  "skill_additions": ["Docker", "Kubernetes"],
  "skill_removals": [
    {{ "skill": "SkillName", "reason": "Lower priority for this role" }}
  ],
  "total_point_value": 12,
  "summary": "You have 8/12 key skills. Consider adding Docker and Kubernetes based on your DevOps background.",
  "explanation": "Docker and Kubernetes are explicitly listed in the JD's 'Required Skills' section and align with your DevOps background."
}}`);

// ============================================================================
// TYPES
// ============================================================================

interface SkillsLLMResponse {
  existing_skills: string[];
  matched_keywords: string[];
  missing_but_relevant: Array<{ skill: string; reason: string; impact?: string; point_value?: number }>;
  skill_additions: string[];
  skill_removals: Array<{ skill: string; reason: string }>;
  total_point_value?: number;
  summary: string;
  explanation?: string;
}

// ============================================================================
// CHAIN
// ============================================================================

/**
 * Create the LCEL chain for skills suggestion
 * Chain: prompt → model → jsonParser
 */
function createSkillsSuggestionChain() {
  const model = getSonnetModel({ temperature: 0.3, maxTokens: 2500 });
  const jsonParser = createJsonParser<SkillsLLMResponse>();

  return skillsPrompt.pipe(model).pipe(jsonParser);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate optimized skills suggestion using Claude LLM
 *
 * **Features:**
 * - Extracts skills from resume and JD
 * - Identifies matched and missing skills
 * - Suggests additions based on user's experience
 * - Recommends removals for less relevant skills
 * - Applies user optimization preferences
 * - Returns structured ActionResponse
 *
 * Uses LCEL chain composition for better observability and composability.
 *
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeSkills - User's current skills section
 * @param jobDescription - Job description text
 * @param resumeContent - Full resume content for context
 * @param preferences - User's optimization preferences (optional, uses defaults if not provided)
 * @param userContext - User context from onboarding (optional, for LLM personalization)
 * @param resumeEducation - User's education section (optional, for co-op/internship context)
 * @returns ActionResponse with suggestion or error
 */
export async function generateSkillsSuggestion(
  resumeSkills: string,
  jobDescription: string,
  resumeContent?: string,
  preferences?: OptimizationPreferences | null,
  userContext?: UserContext,
  resumeEducation?: string
): Promise<ActionResponse<SkillsSuggestion>> {
  // Validation
  if (!resumeSkills || resumeSkills.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume skills section is required',
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

  console.log('[SS:genSkills] Generating skills suggestion (' + resumeSkills?.length + ' chars skills, ' + jobDescription?.length + ' chars JD)');

  // Truncate very long inputs to avoid timeout
  const processedSkills =
    resumeSkills.length > MAX_SKILLS_LENGTH
      ? resumeSkills.substring(0, MAX_SKILLS_LENGTH)
      : resumeSkills;

  const processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  const processedResume = resumeContent
    ? resumeContent.length > MAX_RESUME_LENGTH
      ? resumeContent.substring(0, MAX_RESUME_LENGTH)
      : resumeContent
    : '';

  // Build conditional prompt sections
  const resumeSection = processedResume
    ? `<user_content>\n${processedResume}\n</user_content>`
    : '';

  const educationSection = resumeEducation && resumeEducation.trim().length > 0
    ? `<education_context>\nConsider coursework and academic projects when suggesting skills:\n${resumeEducation}\n</education_context>\n`
    : '';

  // Build job-type-specific guidance (injected before general preferences for prominence)
  const hasEducation = !!resumeEducation && resumeEducation.trim().length > 0;
  const jobTypeGuidance = preferences
    ? `${getJobTypeFramingGuidance(preferences.jobType, 'skills', hasEducation)}\n\n`
    : '';

  const preferenceSection = preferences ? `\n${buildPreferencePrompt(preferences, userContext)}\n` : '';

  // Create and invoke LCEL chain
  const chain = createSkillsSuggestionChain();

  const result = await invokeWithActionResponse(
    async () => {
      const parsed = await chain.invoke({
        skills: processedSkills,
        jobDescription: processedJD,
        resumeSection,
        educationSection,
        jobTypeGuidance,
        preferenceSection,
      });

      // Validate structure
      if (!parsed.existing_skills || !Array.isArray(parsed.existing_skills)) {
        throw new Error('Invalid existing_skills structure from LLM');
      }

      if (!parsed.matched_keywords || !Array.isArray(parsed.matched_keywords)) {
        throw new Error('Invalid matched_keywords structure from LLM');
      }

      if (!parsed.skill_additions || !Array.isArray(parsed.skill_additions)) {
        throw new Error('Invalid skill_additions structure from LLM');
      }

      if (!parsed.summary || typeof parsed.summary !== 'string') {
        throw new Error('Invalid summary structure from LLM');
      }

      // Normalize missing_but_relevant items to ensure { skill, reason, impact, point_value } structure
      const validImpactTiers = ['critical', 'high', 'moderate'];
      const normalizedMissing = Array.isArray(parsed.missing_but_relevant)
        ? parsed.missing_but_relevant.map((item) => {
            if (typeof item === 'string') {
              return { skill: item, reason: '', impact: undefined, point_value: undefined };
            }
            const pointValue = item.point_value;
            // Validate point_value if present
            const validPointValue =
              typeof pointValue === 'number' && pointValue >= 0 && pointValue <= 100
                ? pointValue
                : undefined;
            // Validate impact tier if present
            const validImpact = item.impact && validImpactTiers.includes(item.impact)
              ? item.impact as 'critical' | 'high' | 'moderate'
              : undefined;
            return {
              skill: String(item.skill || ''),
              reason: String(item.reason || ''),
              impact: validImpact,
              point_value: validPointValue
            };
          })
        : [];

      // Normalize skill_removals items to ensure { skill, reason } structure
      const normalizedRemovals = Array.isArray(parsed.skill_removals)
        ? parsed.skill_removals.map((item) =>
            typeof item === 'string'
              ? { skill: item, reason: '' }
              : { skill: String(item.skill || ''), reason: String(item.reason || '') }
          )
        : [];

      // Validate total_point_value if present
      const totalPointValue =
        typeof parsed.total_point_value === 'number' &&
        parsed.total_point_value >= 0
          ? parsed.total_point_value
          : undefined;

      if (parsed.total_point_value !== undefined && totalPointValue === undefined) {
        console.warn('[SS:genSkills] Invalid total_point_value from LLM, ignoring:', parsed.total_point_value);
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
            console.warn('[SS:genSkills] Generic explanation detected (missing specific JD keywords):', explanation);
          }
        }
      }

      console.log('[SS:genSkills] Skills generated:', parsed.matched_keywords.length, 'matched,', parsed.skill_additions.length, 'additions, total_point_value:', totalPointValue, ', explanation:', explanation ? 'present' : 'missing');

      return {
        original: resumeSkills, // Return full original, not truncated
        existing_skills: parsed.existing_skills,
        matched_keywords: parsed.matched_keywords,
        missing_but_relevant: normalizedMissing,
        skill_additions: parsed.skill_additions,
        skill_removals: normalizedRemovals,
        total_point_value: totalPointValue,
        summary: parsed.summary,
        explanation: explanation,
      };
    },
    { errorMessage: 'Failed to generate skills suggestion' }
  );

  return result;
}

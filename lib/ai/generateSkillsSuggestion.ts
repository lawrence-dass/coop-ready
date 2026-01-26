/**
 * Skills Suggestion Generation
 * Story 6.3: Generate optimized skills section suggestions
 *
 * Uses Claude LLM to optimize user's skills section by:
 * 1. Extracting skills from resume and job description
 * 2. Identifying matching keywords
 * 3. Finding missing but relevant skills
 * 4. Suggesting skills to add or remove
 * 5. Returning structured suggestions
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ActionResponse } from '@/types';
import { SkillsSuggestion } from '@/types/suggestions';

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
 * - Returns structured ActionResponse
 *
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeSkills - User's current skills section
 * @param jobDescription - Job description text
 * @param resumeContent - Full resume content for context
 * @returns ActionResponse with suggestion or error
 */
export async function generateSkillsSuggestion(
  resumeSkills: string,
  jobDescription: string,
  resumeContent?: string
): Promise<ActionResponse<SkillsSuggestion>> {
  try {
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

    // Truncate very long inputs to avoid timeout
    const MAX_SKILLS_LENGTH = 1000;
    const MAX_JD_LENGTH = 3000;
    const MAX_RESUME_LENGTH = 4000;

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

    // Initialize LLM
    const model = new ChatAnthropic({
      modelName: 'claude-haiku-4-20250514',
      temperature: 0.3, // Slightly creative for finding relevant skills
      maxTokens: 2500,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build prompt with XML-wrapped user content (prompt injection defense)
    const prompt = `You are a resume optimization expert specializing in skills sections.

Your task is to analyze a skills section and optimize it for a specific job description.

<user_content>
${processedSkills}
</user_content>

<job_description>
${processedJD}
</job_description>

${processedResume ? `<user_content>\n${processedResume}\n</user_content>` : ''}

**Instructions:**
1. Extract all skills from the current skills section
2. Identify skills from the job description that match existing skills
3. Find skills from the JD that are missing but relevant based on the user's experience
4. Suggest specific skills to add (only if user has experience with them based on resume)
5. Identify skills that might be less relevant for this role (if any)
6. Provide a brief summary

**Critical Rules:**
- ONLY suggest adding skills the user likely has based on their resume content
- Do NOT fabricate skills or experience
- Do NOT suggest skills unrelated to the job description
- Skills can be technical (languages, frameworks), tools (AWS, Docker), or soft skills (Leadership)
- Be specific with skill names (e.g., "React.js" not just "front-end")

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "existing_skills": ["skill1", "skill2"],
  "matched_keywords": ["matched_skill1", "matched_skill2"],
  "missing_but_relevant": [
    { "skill": "Docker", "reason": "Job requires containerization; you have DevOps experience" }
  ],
  "skill_additions": ["Docker", "Kubernetes"],
  "skill_removals": [
    { "skill": "SkillName", "reason": "Lower priority for this role" }
  ],
  "summary": "You have 8/12 key skills. Consider adding Docker and Kubernetes based on your DevOps background."
}`;

    // Invoke LLM (timeout enforced at the route level)
    const response = await model.invoke(prompt);
    const content = response.content as string;

    // Parse JSON response
    let parsed: {
      existing_skills: string[];
      matched_keywords: string[];
      missing_but_relevant: Array<{ skill: string; reason: string }>;
      skill_additions: string[];
      skill_removals: Array<{ skill: string; reason: string }>;
      summary: string;
    };

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
    if (!parsed.existing_skills || !Array.isArray(parsed.existing_skills)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid existing_skills structure from LLM',
        },
      };
    }

    if (!parsed.matched_keywords || !Array.isArray(parsed.matched_keywords)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid matched_keywords structure from LLM',
        },
      };
    }

    if (!parsed.skill_additions || !Array.isArray(parsed.skill_additions)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid skill_additions structure from LLM',
        },
      };
    }

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid summary structure from LLM',
        },
      };
    }

    // Normalize missing_but_relevant items to ensure { skill, reason } structure
    const normalizedMissing = Array.isArray(parsed.missing_but_relevant)
      ? parsed.missing_but_relevant.map((item) =>
          typeof item === 'string'
            ? { skill: item, reason: '' }
            : { skill: String(item.skill || ''), reason: String(item.reason || '') }
        )
      : [];

    // Normalize skill_removals items to ensure { skill, reason } structure
    const normalizedRemovals = Array.isArray(parsed.skill_removals)
      ? parsed.skill_removals.map((item) =>
          typeof item === 'string'
            ? { skill: item, reason: '' }
            : { skill: String(item.skill || ''), reason: String(item.reason || '') }
        )
      : [];

    // Return suggestion
    return {
      data: {
        original: resumeSkills, // Return full original, not truncated
        existing_skills: parsed.existing_skills,
        matched_keywords: parsed.matched_keywords,
        missing_but_relevant: normalizedMissing,
        skill_additions: parsed.skill_additions,
        skill_removals: normalizedRemovals,
        summary: parsed.summary,
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
          message: 'Skills suggestion generation timed out. Please try again.',
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
            : 'Failed to generate skills suggestion',
      },
    };
  }
}

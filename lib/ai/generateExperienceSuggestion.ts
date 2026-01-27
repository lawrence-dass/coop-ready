/**
 * Experience Suggestion Generation
 * Story 6.4: Generate optimized experience section suggestions
 *
 * Uses Claude LLM to optimize user's experience section by:
 * 1. Extracting experience entries from resume
 * 2. Reframing bullets with relevant keywords from JD
 * 3. Adding quantification where possible
 * 4. Maintaining authenticity (no fabrication)
 * 5. Returning structured suggestions
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ActionResponse, OptimizationPreferences } from '@/types';
import { ExperienceSuggestion } from '@/types/suggestions';
import { buildPreferencePrompt } from './preferences';

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
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeExperience - User's current experience section
 * @param jobDescription - Job description text
 * @param resumeContent - Full resume content for context
 * @param preferences - User's optimization preferences (optional, uses defaults if not provided)
 * @returns ActionResponse with suggestion or error
 */
export async function generateExperienceSuggestion(
  resumeExperience: string,
  jobDescription: string,
  resumeContent: string,
  preferences?: OptimizationPreferences | null
): Promise<ActionResponse<ExperienceSuggestion>> {
  try {
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

    console.log('[SS:genExp] Generating experience suggestion (' + resumeExperience?.length + ' chars exp, ' + jobDescription?.length + ' chars JD)');
    // Truncate very long inputs to avoid timeout
    // Experience sections are longer than Skills/Summary due to multiple jobs
    const MAX_EXPERIENCE_LENGTH = 6000;
    const MAX_JD_LENGTH = 3000;
    const MAX_RESUME_LENGTH = 4000;

    const processedExperience =
      resumeExperience.length > MAX_EXPERIENCE_LENGTH
        ? resumeExperience.substring(0, MAX_EXPERIENCE_LENGTH)
        : resumeExperience;

    const processedJD =
      jobDescription.length > MAX_JD_LENGTH
        ? jobDescription.substring(0, MAX_JD_LENGTH)
        : jobDescription;

    const processedResume =
      resumeContent.length > MAX_RESUME_LENGTH
        ? resumeContent.substring(0, MAX_RESUME_LENGTH)
        : resumeContent;

    // Initialize LLM
    const model = new ChatAnthropic({
      modelName: 'claude-3-5-haiku-20241022',
      temperature: 0.4, // Slightly creative for natural bullet rewrites
      maxTokens: 4000, // More tokens for multiple entries
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build prompt with XML-wrapped user content (prompt injection defense)
    const preferenceSection = preferences ? `\n${buildPreferencePrompt(preferences)}\n` : '';

    const prompt = `You are a resume optimization expert specializing in experience section enhancement.

Your task is to optimize professional experience bullets by incorporating relevant keywords from a job description and adding quantification where possible.

<user_content>
${processedExperience}
</user_content>

<job_description>
${processedJD}
</job_description>

<user_content>
${processedResume}
</user_content>
${preferenceSection}
**Instructions:**
1. Extract each work experience entry with company, role, dates, and bullets
2. For each bullet, reframe to incorporate relevant keywords from the JD naturally
3. Identify where metrics or quantification can be added (inferred from context, not fabricated)
4. Maintain authenticity - ONLY enhance existing achievements, NEVER fabricate
5. Prioritize impact, results, and quantifiable outcomes
6. Start each bullet with a strong action verb (Led, Developed, Improved, etc.)
7. Focus on achievements, not just tasks
8. Calculate point value for each bullet optimization

**Point Value Calculation:**
For each bullet suggestion, estimate point impact:
- Major reframe with multiple keywords + metrics = 6-10 points
- Keyword incorporation with minor metrics = 4-6 points
- Simple keyword addition without metrics = 2-4 points
- Experience bullets have HIGH impact (most important section for ATS)

Total point value = sum of all bullet optimizations. Realistic range: 20-40 points for experience section.

**Critical Rules:**
- Do NOT add specific metrics you cannot reasonably infer from the context
- Do NOT fabricate achievements, technologies, or team sizes
- Make bullet improvements sound natural and human-written
- If no metrics can be reasonably inferred, focus on keyword incorporation
- Maintain chronological context and job progression
- Point values must be realistic and reflect actual ATS impact

**Authenticity Examples:**
✓ "Managed project" → "Led cross-functional team to deliver project, reducing deployment time by 30%" (if context suggests efficiency gains)
✓ "Built features" → "Developed key features using React and Node.js" (if technologies are mentioned elsewhere)
✗ "Wrote code" → "Reduced bugs by 95%" (too specific without evidence)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "experience_entries": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "2020 - 2023",
      "original_bullets": ["Original bullet 1", "Original bullet 2"],
      "suggested_bullets": [
        {
          "original": "Managed project",
          "suggested": "Led cross-functional team to deliver 3-month project, incorporating [keyword], reducing deployment time by 30%",
          "metrics_added": ["3-month", "30%"],
          "keywords_incorporated": ["keyword", "cross-functional"],
          "point_value": 8
        }
      ]
    }
  ],
  "total_point_value": 35,
  "summary": "Reframed 8 bullets across 3 roles, added metrics to 5, incorporated 6 keywords. Total improvement: +35 points."
}`;

    // Invoke LLM (timeout enforced at the route level)
    const response = await model.invoke(prompt);
    const content =
      typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content
              .filter((block): block is { type: 'text'; text: string } => typeof block === 'object' && block !== null && 'type' in block && block.type === 'text')
              .map((block) => block.text)
              .join('')
          : String(response.content);

    // Parse JSON response
    let parsed: {
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
          point_value?: number;
        }>;
      }>;
      total_point_value?: number;
      summary: string;
    };

    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse LLM response',
        },
      };
    }

    // Validate structure
    if (!parsed.experience_entries || !Array.isArray(parsed.experience_entries)) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid experience_entries structure from LLM',
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

    // Validate each entry has required fields
    for (const entry of parsed.experience_entries) {
      if (!entry.company || !entry.role || !entry.dates) {
        return {
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: 'Invalid experience entry structure from LLM',
          },
        };
      }

      if (!Array.isArray(entry.original_bullets) || !Array.isArray(entry.suggested_bullets)) {
        return {
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: 'Invalid bullets structure from LLM',
          },
        };
      }
    }

    // Normalize suggested_bullets to ensure all fields exist
    const normalizedEntries = parsed.experience_entries.map((entry) => ({
      ...entry,
      original_bullets: entry.original_bullets || [],
      suggested_bullets: (entry.suggested_bullets || []).map((bullet) => {
        const pointValue = bullet.point_value;
        // Validate point_value if present
        const validPointValue =
          typeof pointValue === 'number' && pointValue >= 0 && pointValue <= 100
            ? pointValue
            : undefined;
        return {
          original: String(bullet.original || ''),
          suggested: String(bullet.suggested || ''),
          metrics_added: Array.isArray(bullet.metrics_added) ? bullet.metrics_added : [],
          keywords_incorporated: Array.isArray(bullet.keywords_incorporated) ? bullet.keywords_incorporated : [],
          point_value: validPointValue,
        };
      }),
    }));

    // Validate total_point_value if present
    // Note: total can exceed 100 since it sums individual bullet values (each 0-100)
    const totalPointValue =
      typeof parsed.total_point_value === 'number' &&
      parsed.total_point_value >= 0
        ? parsed.total_point_value
        : undefined;

    if (parsed.total_point_value !== undefined && totalPointValue === undefined) {
      console.warn('[SS:genExp] Invalid total_point_value from LLM, ignoring:', parsed.total_point_value);
    }

    // Return suggestion
    console.log('[SS:genExp] Experience generated:', normalizedEntries.length, 'entries, total_point_value:', totalPointValue);
    return {
      data: {
        original: resumeExperience, // Return full original, not truncated
        experience_entries: normalizedEntries,
        total_point_value: totalPointValue,
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
          message: 'Experience generation timed out. Please try again.',
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
            : 'Failed to generate experience suggestion',
      },
    };
  }
}

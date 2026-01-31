/**
 * Generate All Suggestions Server Action
 * Story 6.9: Wire Analysis-to-Suggestion Pipeline
 *
 * Orchestrates parallel generation of all 4 suggestion sections (summary, skills, experience, education).
 * Uses Promise.allSettled() so individual section failures don't block others.
 *
 * **ActionResponse Pattern:**
 * - Never throws errors
 * - Always returns { data: T; error: null } | { data: null; error: ErrorObject }
 */

'use server';

import type { ActionResponse, OptimizationPreferences } from '@/types';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  EducationSuggestion,
} from '@/types/suggestions';
import { generateSummarySuggestion } from '@/lib/ai/generateSummarySuggestion';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import { generateEducationSuggestion } from '@/lib/ai/generateEducationSuggestion';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/supabase/user-context';

// ============================================================================
// TYPES
// ============================================================================

interface GenerateAllRequest {
  /** Session ID for persistence */
  sessionId: string;
  /** Resume summary section content */
  resumeSummary: string;
  /** Resume skills section content */
  resumeSkills: string;
  /** Resume experience section content */
  resumeExperience: string;
  /** Resume education section content (for co-op/internship context) */
  resumeEducation?: string;
  /** Full resume raw text for context */
  resumeContent: string;
  /** Job description text */
  jobDescription: string;
  /** Pre-extracted keywords for summary context */
  keywords?: string[];
  /** User optimization preferences (Story 11.2) */
  preferences?: OptimizationPreferences | null;
}

export interface GenerateAllResult {
  summary: SummarySuggestion | null;
  skills: SkillsSuggestion | null;
  experience: ExperienceSuggestion | null;
  education: EducationSuggestion | null;
  /** Errors for individual sections that failed */
  sectionErrors: {
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateRequest(
  request: Partial<GenerateAllRequest>
): ActionResponse<GenerateAllRequest> {
  if (!request.sessionId || request.sessionId.trim().length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
    };
  }

  if (!request.jobDescription || request.jobDescription.trim().length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Job description is required' },
    };
  }

  if (!request.resumeContent || request.resumeContent.trim().length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Resume content is required' },
    };
  }

  return {
    data: request as GenerateAllRequest,
    error: null,
  };
}

// ============================================================================
// MAIN ACTION
// ============================================================================

/**
 * Generate suggestions for all 3 sections in parallel
 *
 * Uses Promise.allSettled() so partial success is possible —
 * if skills fails, summary and experience still return.
 *
 * @param request - Generation request with resume data and JD
 * @returns ActionResponse with per-section results (partial success allowed)
 */
export async function generateAllSuggestions(
  request: Partial<GenerateAllRequest>
): Promise<ActionResponse<GenerateAllResult>> {
  try {
    const validation = validateRequest(request);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    const {
      sessionId,
      resumeSummary,
      resumeSkills,
      resumeExperience,
      resumeEducation,
      resumeContent,
      jobDescription,
      keywords,
      preferences,
    } = validation.data;

    // Fallback to full resume text if individual sections weren't parsed
    // This handles cases where the resume format wasn't recognized during parsing
    const effectiveSummary = (resumeSummary && resumeSummary.trim().length > 0) ? resumeSummary : resumeContent;
    const effectiveSkills = (resumeSkills && resumeSkills.trim().length > 0) ? resumeSkills : resumeContent;
    const effectiveExperience = (resumeExperience && resumeExperience.trim().length > 0) ? resumeExperience : resumeContent;

    // Education: Try to extract from resumeContent if not explicitly provided
    // This is critical for co-op/internship candidates where education is primary credential
    let effectiveEducation: string | null = null;
    if (resumeEducation && resumeEducation.trim().length > 0) {
      effectiveEducation = resumeEducation;
      console.log('[SS:generateAll] Education section provided:', resumeEducation.length, 'chars, preview:', resumeEducation.substring(0, 100));
    } else {
      // Try to extract education from full resume content
      const educationMatch = resumeContent.match(/(?:EDUCATION|Education|ACADEMIC|Academic)[\s\S]*?(?=(?:EXPERIENCE|Experience|SKILLS|Skills|PROJECTS|Projects|CERTIFICATIONS|$))/i);
      if (educationMatch) {
        effectiveEducation = educationMatch[0].trim();
        console.log('[SS:generateAll] Education extracted from resume:', effectiveEducation.length, 'chars, preview:', effectiveEducation.substring(0, 100));
      } else {
        console.log('[SS:generateAll] No education section found in resume. resumeEducation was:', resumeEducation ? `"${resumeEducation.substring(0, 50)}..."` : 'null/undefined');
      }
    }

    const usedFallback = effectiveSummary === resumeContent || effectiveSkills === resumeContent || effectiveExperience === resumeContent;

    // Fetch user context for LLM personalization (gracefully handles missing data)
    const userContextResult = await getUserContext();
    const userContext = userContextResult.data ?? {};

    console.log(
      '[SS:generateAll] Starting suggestion generation for session:',
      sessionId.slice(0, 8) + '...',
      preferences ? `with preferences (tone: ${preferences.tone})` : 'with default preferences',
      userContext.careerGoal ? `goal=${userContext.careerGoal}` : 'no goal',
      userContext.targetIndustries?.length ? `industries=${userContext.targetIndustries.join(',')}` : 'no industries',
      usedFallback ? '(using full resume as fallback for missing sections)' : ''
    );

    // Fire all 4 generation calls in parallel (Story 11.2: pass preferences, userContext)
    // Pass resumeEducation for co-op/internship context awareness
    // Education is only generated if education section exists in resume
    const [summaryResult, skillsResult, experienceResult, educationResult] =
      await Promise.allSettled([
        generateSummarySuggestion(effectiveSummary, jobDescription, keywords, preferences, userContext, resumeEducation),
        generateSkillsSuggestion(effectiveSkills, jobDescription, resumeContent, preferences, userContext, resumeEducation),
        generateExperienceSuggestion(effectiveExperience, jobDescription, resumeContent, preferences, userContext, resumeEducation),
        // Only generate education suggestions if education section exists
        effectiveEducation
          ? generateEducationSuggestion(effectiveEducation, jobDescription, resumeContent, preferences, userContext)
          : Promise.resolve({ data: null, error: null }),
      ]);

    // Extract results from settled promises
    const result: GenerateAllResult = {
      summary: null,
      skills: null,
      experience: null,
      education: null,
      sectionErrors: {},
    };

    // Process summary
    if (summaryResult.status === 'fulfilled') {
      if (summaryResult.value.data) {
        result.summary = summaryResult.value.data;
      } else if (summaryResult.value.error) {
        result.sectionErrors.summary = summaryResult.value.error.message;
      }
    } else {
      result.sectionErrors.summary = summaryResult.reason?.message || 'Summary generation failed';
    }

    // Process skills
    if (skillsResult.status === 'fulfilled') {
      if (skillsResult.value.data) {
        result.skills = skillsResult.value.data;
      } else if (skillsResult.value.error) {
        result.sectionErrors.skills = skillsResult.value.error.message;
      }
    } else {
      result.sectionErrors.skills = skillsResult.reason?.message || 'Skills generation failed';
    }

    // Process experience
    if (experienceResult.status === 'fulfilled') {
      if (experienceResult.value.data) {
        result.experience = experienceResult.value.data;
      } else if (experienceResult.value.error) {
        result.sectionErrors.experience = experienceResult.value.error.message;
      }
    } else {
      result.sectionErrors.experience = experienceResult.reason?.message || 'Experience generation failed';
    }

    // Process education (only if education section was present)
    if (effectiveEducation && educationResult.status === 'fulfilled') {
      if (educationResult.value.data) {
        result.education = educationResult.value.data;
      } else if (educationResult.value.error) {
        result.sectionErrors.education = educationResult.value.error.message;
      }
    } else if (effectiveEducation && educationResult.status === 'rejected') {
      result.sectionErrors.education = educationResult.reason?.message || 'Education generation failed';
    }

    // Save successful suggestions to session using server client (for proper auth context)
    const dbUpdate: Record<string, unknown> = {};
    if (result.summary) dbUpdate.summary_suggestion = result.summary;
    if (result.skills) dbUpdate.skills_suggestion = result.skills;
    if (result.experience) dbUpdate.experience_suggestion = result.experience;
    if (result.education) dbUpdate.education_suggestion = result.education;

    if (Object.keys(dbUpdate).length > 0) {
      try {
        const supabase = await createClient();
        const { error: saveError } = await supabase
          .from('sessions')
          .update(dbUpdate)
          .eq('id', sessionId);

        if (saveError) {
          console.error('[SS:generateAll] Session save failed:', saveError.message);
          // Continue — user still gets suggestions in the UI
        } else {
          console.log('[SS:generateAll] Suggestions saved to session');
        }
      } catch (err) {
        console.error('[SS:generateAll] Session save error:', err);
      }
    }

    // Check if ALL sections failed (education is optional, so not required for success)
    const hasAnyResult = result.summary || result.skills || result.experience || result.education;
    if (!hasAnyResult) {
      console.error('[SS:generateAll] All sections failed:', result.sectionErrors);
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'All suggestion sections failed to generate. Please try again.',
        },
      };
    }

    console.log(
      '[SS:generateAll] Generation complete.',
      'Summary:', result.summary ? 'OK' : 'FAILED',
      'Skills:', result.skills ? 'OK' : 'FAILED',
      'Experience:', result.experience ? 'OK' : 'FAILED',
      'Education:', effectiveEducation ? (result.education ? 'OK' : 'FAILED') : 'SKIPPED'
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('[SS:generateAll] Unexpected error:', error);

    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      return {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Suggestion generation timed out. Please try again.',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate suggestions',
      },
    };
  }
}

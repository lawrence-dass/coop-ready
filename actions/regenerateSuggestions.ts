/**
 * Regenerate Suggestions Server Action
 * Story 6.7: Implement Regenerate Suggestions
 *
 * Handles section-specific regeneration by directly calling the LLM generation functions.
 * Simpler than going through the full optimization pipeline.
 *
 * **ActionResponse Pattern:**
 * - Never throws errors
 * - Always returns { data: T; error: null } | { data: null; error: ErrorObject }
 */

'use server';

import type { ActionResponse } from '@/types';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';
import { generateSummarySuggestion } from '@/lib/ai/generateSummarySuggestion';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import { updateSession } from '@/lib/supabase/sessions';

// ============================================================================
// TYPES
// ============================================================================

type SectionType = 'summary' | 'skills' | 'experience';

type SectionSuggestion = SummarySuggestion | SkillsSuggestion | ExperienceSuggestion;

interface RegenerateRequest {
  /** Current section content to regenerate */
  currentContent: string;
  /** Job description content */
  jdContent: string;
  /** Which section to regenerate */
  sectionType: SectionType;
  /** Current session ID */
  sessionId: string;
  /** Optional: full resume content for context (required for skills/experience) */
  resumeContent?: string;
  /** Optional: pre-extracted keywords for context (summary only) */
  keywords?: string[];
}

interface RegenerateSuggestionsResult {
  section: SectionType;
  suggestion: SectionSuggestion;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateRegenerateRequest(
  request: Partial<RegenerateRequest>
): ActionResponse<RegenerateRequest> {
  if (!request.currentContent || request.currentContent.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Section content is required',
      },
    };
  }

  if (!request.jdContent || request.jdContent.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      },
    };
  }

  if (!request.sectionType || !['summary', 'skills', 'experience'].includes(request.sectionType)) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Valid section type is required (summary, skills, or experience)',
      },
    };
  }

  if (!request.sessionId || request.sessionId.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
      },
    };
  }

  return {
    data: request as RegenerateRequest,
    error: null,
  };
}

// ============================================================================
// MAIN ACTION
// ============================================================================

/**
 * Regenerate suggestions for a specific section
 *
 * Calls the appropriate LLM generation function for the specified section.
 * Saves result to session for persistence.
 *
 * @param request - Regeneration request parameters
 * @returns ActionResponse with regenerated suggestion
 */
export async function regenerateSuggestions(
  request: Partial<RegenerateRequest>
): Promise<ActionResponse<RegenerateSuggestionsResult>> {
  try {
    // Validate input
    const validation = validateRegenerateRequest(request);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    const { currentContent, jdContent, sectionType, sessionId, keywords, resumeContent } = validation.data;

    let suggestionResult: ActionResponse<SectionSuggestion>;

    // Call appropriate generation function based on section type
    switch (sectionType) {
      case 'summary':
        suggestionResult = await generateSummarySuggestion(
          currentContent,
          jdContent,
          keywords
        );
        break;

      case 'skills':
        // Skills function takes resumeContent as third parameter
        suggestionResult = await generateSkillsSuggestion(
          currentContent,
          jdContent,
          resumeContent
        );
        break;

      case 'experience':
        // Experience function requires full resumeContent
        if (!resumeContent) {
          return {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Resume content is required for experience regeneration',
            },
          };
        }
        suggestionResult = await generateExperienceSuggestion(
          currentContent,
          jdContent,
          resumeContent
        );
        break;

      default:
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid section type: ${sectionType}`,
          },
        };
    }

    // Check if generation failed
    if (suggestionResult.error) {
      return {
        data: null,
        error: suggestionResult.error,
      };
    }

    // Save to session (graceful degradation - don't fail if session update fails)
    const sessionUpdate =
      sectionType === 'summary'
        ? { summarySuggestion: suggestionResult.data as SummarySuggestion }
        : sectionType === 'skills'
          ? { skillsSuggestion: suggestionResult.data as SkillsSuggestion }
          : { experienceSuggestion: suggestionResult.data as ExperienceSuggestion };

    const sessionUpdateResult = await updateSession(sessionId, sessionUpdate);

    if (sessionUpdateResult.error) {
      console.error('[regenerateSuggestions] Session update failed:', sessionUpdateResult.error);
      // Continue anyway - user still gets the suggestion
    }

    return {
      data: {
        section: sectionType,
        suggestion: suggestionResult.data,
      },
      error: null,
    };
  } catch (error) {
    console.error('[regenerateSuggestions] Error:', error);

    // Handle timeout
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      return {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Regeneration timed out after 60 seconds. Please try again.',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to regenerate suggestions',
      },
    };
  }
}

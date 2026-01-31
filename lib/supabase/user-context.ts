/**
 * User Context Functions
 *
 * Fetches user context from onboarding answers for LLM personalization.
 * All functions follow the ActionResponse pattern and never throw errors.
 *
 * Context includes:
 * - careerGoal: User's primary career goal from onboarding
 * - targetIndustries: Industries the user is targeting
 */

import { createClient } from './server';
import type { ActionResponse, UserContext, CareerGoal } from '@/types';

/**
 * Valid career goal values from onboarding
 */
const VALID_CAREER_GOALS: CareerGoal[] = [
  'first-job',
  'switching-careers',
  'advancing',
  'promotion',
  'returning',
];

/**
 * Get user context from onboarding answers for the current authenticated user
 *
 * Returns empty context if:
 * - User is not authenticated
 * - User is anonymous
 * - User hasn't completed onboarding
 * - Database query fails
 *
 * This function gracefully degrades - it never blocks suggestion generation.
 *
 * @returns ActionResponse with UserContext (empty object {} on error/missing data)
 */
export async function getUserContext(): Promise<ActionResponse<UserContext>> {
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Return empty context for anonymous users or auth errors
    if (authError || !user || user.is_anonymous) {
      return {
        data: {},
        error: null,
      };
    }

    // Query users table for onboarding_answers
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_answers')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[SS:getUserContext] Error fetching onboarding answers:', error.message);
      // Return empty context on error (don't fail the user experience)
      return {
        data: {},
        error: null,
      };
    }

    // If no onboarding answers exist or they're null, return empty context
    if (!data?.onboarding_answers) {
      return {
        data: {},
        error: null,
      };
    }

    // Extract and validate onboarding answers
    const answers = data.onboarding_answers as {
      careerGoal?: string;
      targetIndustries?: string[];
    };

    // Validate careerGoal is a valid value
    let careerGoal: CareerGoal | null = null;
    if (answers.careerGoal && VALID_CAREER_GOALS.includes(answers.careerGoal as CareerGoal)) {
      careerGoal = answers.careerGoal as CareerGoal;
    }

    // Validate targetIndustries is an array of strings
    let targetIndustries: string[] = [];
    if (Array.isArray(answers.targetIndustries)) {
      targetIndustries = answers.targetIndustries.filter(
        (industry) => typeof industry === 'string' && industry.trim().length > 0
      );
    }

    return {
      data: {
        careerGoal: careerGoal,
        targetIndustries: targetIndustries,
      },
      error: null,
    };
  } catch (err) {
    console.error('[SS:getUserContext] Unexpected error:', err);
    // Return empty context on unexpected errors
    return {
      data: {},
      error: null,
    };
  }
}

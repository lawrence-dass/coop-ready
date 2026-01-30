'use server';

/**
 * Update Onboarding Selections Action
 *
 * Updates user's onboarding answers (career goal, experience level, target industries).
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

interface UpdateOnboardingSelectionsInput {
  careerGoal: string;
  experienceLevel: string;
  targetIndustries: string[];
}

const VALID_CAREER_GOALS = ['first-job', 'switching-careers', 'advancing', 'promotion', 'returning'];
const VALID_EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive'];
const VALID_INDUSTRIES = ['technology', 'healthcare', 'finance', 'education', 'marketing', 'engineering', 'retail', 'other'];

export async function updateOnboardingSelections(
  input: UpdateOnboardingSelectionsInput
): Promise<ActionResponse<{ success: boolean }>> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: {
        message: 'Not authenticated',
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }

  // Validate input
  if (!VALID_CAREER_GOALS.includes(input.careerGoal)) {
    return {
      data: null,
      error: {
        message: 'Invalid career goal',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  if (!VALID_EXPERIENCE_LEVELS.includes(input.experienceLevel)) {
    return {
      data: null,
      error: {
        message: 'Invalid experience level',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  if (!Array.isArray(input.targetIndustries) || input.targetIndustries.length === 0) {
    return {
      data: null,
      error: {
        message: 'Please select at least one industry',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  if (!input.targetIndustries.every(i => VALID_INDUSTRIES.includes(i))) {
    return {
      data: null,
      error: {
        message: 'Invalid industry selection',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  // Update onboarding_answers in users table
  const { error: updateError } = await supabase
    .from('users')
    .update({
      onboarding_answers: {
        careerGoal: input.careerGoal,
        experienceLevel: input.experienceLevel,
        targetIndustries: input.targetIndustries,
      },
    })
    .eq('id', user.id);

  if (updateError) {
    return {
      data: null,
      error: {
        message: updateError.message,
        code: ERROR_CODES.ONBOARDING_SAVE_ERROR,
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}

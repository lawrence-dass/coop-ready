'use server';

/**
 * Save Onboarding Action
 * Story 8-5: Implement Onboarding Flow
 *
 * Saves user's onboarding answers to their profile.
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';
import type {
  OnboardingAnswers,
  OnboardingSaveResult,
  CareerGoal,
  ExperienceLevel,
  Industry,
} from '@/types/auth';

const VALID_CAREER_GOALS: CareerGoal[] = [
  'first-job',
  'switching-careers',
  'advancing',
  'promotion',
  'returning',
];

const VALID_EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'entry',
  'mid',
  'senior',
  'executive',
];

const VALID_INDUSTRIES: Industry[] = [
  'technology',
  'healthcare',
  'finance',
  'education',
  'marketing',
  'engineering',
  'retail',
  'other',
];

function validateOnboardingAnswers(
  answers: OnboardingAnswers
): string | null {
  if (!answers.firstName || typeof answers.firstName !== 'string' || !answers.firstName.trim()) {
    return 'First name is required';
  }
  if (!answers.lastName || typeof answers.lastName !== 'string' || !answers.lastName.trim()) {
    return 'Last name is required';
  }
  if (
    !answers.careerGoal ||
    !VALID_CAREER_GOALS.includes(answers.careerGoal as CareerGoal)
  ) {
    return 'Invalid career goal';
  }
  if (
    !answers.experienceLevel ||
    !VALID_EXPERIENCE_LEVELS.includes(
      answers.experienceLevel as ExperienceLevel
    )
  ) {
    return 'Invalid experience level';
  }
  if (
    !Array.isArray(answers.targetIndustries) ||
    answers.targetIndustries.length === 0 ||
    !answers.targetIndustries.every((i) =>
      VALID_INDUSTRIES.includes(i as Industry)
    )
  ) {
    return 'Invalid target industries';
  }
  return null;
}

/**
 * Save onboarding answers to user profile
 *
 * @param answers - User's answers to onboarding questions
 * @returns ActionResponse with success result
 */
export async function saveOnboarding(
  answers: OnboardingAnswers
): Promise<ActionResponse<OnboardingSaveResult>> {
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

  // Validate answers server-side
  const validationError = validateOnboardingAnswers(answers);
  if (validationError) {
    return {
      data: null,
      error: {
        message: validationError,
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  // Store firstName/lastName in separate columns, other answers in JSONB
  const { firstName, lastName, ...otherAnswers } = answers;

  // Update profile with onboarding data
  const { error: updateError } = await supabase
    .from('users')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      onboarding_answers: otherAnswers,
      onboarding_complete: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

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

/**
 * Skip onboarding (mark as complete without answers)
 *
 * @returns ActionResponse with success result
 */
export async function skipOnboarding(): Promise<
  ActionResponse<OnboardingSaveResult>
> {
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

  // Mark onboarding as complete without answers
  const { error: updateError } = await supabase
    .from('users')
    .update({
      onboarding_complete: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

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

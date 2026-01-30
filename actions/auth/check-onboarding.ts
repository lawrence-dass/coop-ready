'use server';

/**
 * Check Onboarding Action
 * Fix Onboarding Flow
 *
 * Checks if the current user has completed onboarding.
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Check onboarding result
 */
export interface CheckOnboardingResult {
  /** Whether onboarding is complete */
  onboardingComplete: boolean;
}

/**
 * Check if the current user has completed onboarding
 *
 * @returns ActionResponse with onboarding completion status
 */
export async function checkOnboarding(): Promise<ActionResponse<CheckOnboardingResult>> {
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

  // Check users table for onboarding_complete flag
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .single();

  if (userDataError) {
    // If user record doesn't exist, onboarding is not complete
    if (userDataError.code === 'PGRST116') {
      return {
        data: { onboardingComplete: false },
        error: null,
      };
    }
    return {
      data: null,
      error: {
        message: userDataError.message,
        code: ERROR_CODES.ONBOARDING_SAVE_ERROR,
      },
    };
  }

  return {
    data: { onboardingComplete: userData?.onboarding_complete || false },
    error: null,
  };
}

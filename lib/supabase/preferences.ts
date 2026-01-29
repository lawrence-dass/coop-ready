/**
 * Supabase Preferences Functions
 *
 * This file provides functions to get and update user optimization preferences.
 * All functions follow the ActionResponse pattern and never throw errors.
 *
 * Story: 11.2 - Implement Optimization Preferences
 */

import { createClient } from './server';
import type { ActionResponse, OptimizationPreferences } from '@/types';
import { DEFAULT_PREFERENCES as DEFAULTS, validatePreferences } from '@/types';

/**
 * Get optimization preferences for the current authenticated user
 *
 * Returns default preferences if:
 * - User is not authenticated
 * - User hasn't customized preferences yet
 * - Database query fails
 *
 * @returns ActionResponse with OptimizationPreferences
 */
export async function getUserPreferences(): Promise<
  ActionResponse<OptimizationPreferences>
> {
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.is_anonymous) {
      // Return defaults for anonymous users or auth errors
      return {
        data: DEFAULTS,
        error: null,
      };
    }

    // Query profiles table for optimization_preferences
    const { data, error } = await supabase
      .from('profiles')
      .select('optimization_preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      // Return defaults on error (don't fail the user experience)
      return {
        data: DEFAULTS,
        error: null,
      };
    }

    // If no preferences exist or they're null, return defaults
    if (!data?.optimization_preferences) {
      return {
        data: DEFAULTS,
        error: null,
      };
    }

    // Validate and merge with defaults to handle missing fields
    const userPrefs = data.optimization_preferences as Partial<OptimizationPreferences>;
    const preferences: OptimizationPreferences = {
      tone: userPrefs.tone ?? DEFAULTS.tone,
      verbosity: userPrefs.verbosity ?? DEFAULTS.verbosity,
      emphasis: userPrefs.emphasis ?? DEFAULTS.emphasis,
      industry: userPrefs.industry ?? DEFAULTS.industry,
      experienceLevel: userPrefs.experienceLevel ?? DEFAULTS.experienceLevel,
      jobType: userPrefs.jobType ?? DEFAULTS.jobType,
      modificationLevel: userPrefs.modificationLevel ?? DEFAULTS.modificationLevel,
    };

    return {
      data: preferences,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error fetching preferences:', err);
    // Return defaults on unexpected errors
    return {
      data: DEFAULTS,
      error: null,
    };
  }
}

/**
 * Update optimization preferences for the current authenticated user
 *
 * This function:
 * - Validates user is authenticated
 * - Updates the optimization_preferences column in profiles table
 * - Returns the updated preferences on success
 *
 * @param preferences - The optimization preferences to save
 * @returns ActionResponse with updated preferences or error
 */
export async function updateUserPreferences(
  preferences: OptimizationPreferences
): Promise<ActionResponse<OptimizationPreferences>> {
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return {
        data: null,
        error: {
          message: authError.message,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!user || user.is_anonymous) {
      return {
        data: null,
        error: {
          message: 'User must be authenticated to save preferences',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Runtime validation of preference values
    const validationError = validatePreferences(preferences);
    if (validationError) {
      return {
        data: null,
        error: {
          message: validationError,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Update preferences in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        optimization_preferences: preferences,
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        data: null,
        error: {
          message: `Failed to save preferences: ${updateError.message}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Return the updated preferences
    return {
      data: preferences,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Failed to save preferences',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

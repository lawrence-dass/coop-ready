'use server';

/**
 * Update User Preferences Server Action
 * Story 16.6: Migrate History and Settings - Task 8
 *
 * Updates user optimization preferences in the users table.
 * Uses same values as scan page - no mapping needed.
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User Preferences - matches scan page values exactly
 */
export interface UserPreferences {
  jobType: 'coop' | 'fulltime';
  modLevel: 'conservative' | 'moderate' | 'aggressive';
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Server-side validation schema for user preferences
 * CRITICAL: Never trust client-side types - always validate on server
 */
const userPreferencesSchema = z.object({
  jobType: z.enum(['coop', 'fulltime']),
  modLevel: z.enum(['conservative', 'moderate', 'aggressive']),
});

// ============================================================================
// ACTION
// ============================================================================

/**
 * Update user optimization preferences
 *
 * Updates the users.optimization_preferences JSONB column.
 * Preserves existing preferences fields (tone, verbosity, etc.) while updating
 * only the fields provided.
 *
 * @param preferences - Preferences to update
 * @returns ActionResponse with updated UserPreferences
 */
export async function updateUserPreferences(
  preferences: UserPreferences
): Promise<ActionResponse<UserPreferences>> {
  try {
    // CRITICAL: Validate input on server - never trust client types
    const validationResult = userPreferencesSchema.safeParse(preferences);

    if (!validationResult.success) {
      return {
        data: null,
        error: {
          message: 'Invalid preferences data',
          code: ERROR_CODES.VALIDATION_ERROR,
        },
      };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'You must be signed in to update preferences',
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
    }

    // Get current preferences to preserve other fields
    // Note: Query by 'id' to match RLS policy (auth.uid() = id)
    const { data: currentProfile } = await supabase
      .from('users')
      .select('optimization_preferences')
      .eq('id', user.id)
      .single();

    // Type-safe access to JSONB column
    const currentPrefs = (currentProfile?.optimization_preferences as Record<string, unknown>) || {};

    // Build updated preferences object - store values directly, no mapping
    const updatedPrefs = {
      ...currentPrefs,
      jobType: preferences.jobType,
      modificationLevel: preferences.modLevel,
    };

    // Update preferences in database
    // Note: Query by 'id' to match RLS policy (auth.uid() = id)
    const { error: updateError } = await supabase
      .from('users')
      .update({ optimization_preferences: updatedPrefs })
      .eq('id', user.id);

    if (updateError) {
      return {
        data: null,
        error: {
          message: updateError.message || 'Failed to update preferences',
          code: ERROR_CODES.VALIDATION_ERROR,
        },
      };
    }

    // Return updated preferences
    return {
      data: preferences,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'Failed to update preferences',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }
}

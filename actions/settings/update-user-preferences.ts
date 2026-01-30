/**
 * Update User Preferences Server Action
 * Story 16.6: Migrate History and Settings - Task 8
 *
 * Updates user optimization preferences in the profiles table.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';
import type { UserPreferences } from '@/lib/dashboard/getUserPreferences';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Server-side validation schema for user preferences
 * CRITICAL: Never trust client-side types - always validate on server
 */
const userPreferencesSchema = z.object({
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  modLevel: z.enum(['Minimal', 'Moderate', 'Aggressive']),
  industry: z.string().nullable(),
  keywords: z.string().nullable(),
});

/**
 * Type for optimization_preferences JSONB column in database
 */
interface OptimizationPreferencesDB {
  jobType?: string;
  modificationLevel?: string;
  industry?: string | null;
  keywords?: string | null;
  // Other fields that may exist
  tone?: string;
  verbosity?: string;
  emphasis?: string;
  experienceLevel?: string;
}

/**
 * Maps display jobType values to database values
 */
function mapJobTypeToDB(displayValue: UserPreferences['jobType']): string {
  const mapping: Record<UserPreferences['jobType'], string> = {
    'Full-time': 'fulltime',
    'Part-time': 'parttime',
    'Contract': 'contract',
    'Internship': 'intern',
  };
  return mapping[displayValue];
}

/**
 * Maps display modLevel values to database values
 */
function mapModLevelToDB(displayValue: UserPreferences['modLevel']): string {
  const mapping: Record<UserPreferences['modLevel'], string> = {
    'Minimal': 'conservative',
    'Moderate': 'moderate',
    'Aggressive': 'aggressive',
  };
  return mapping[displayValue];
}

/**
 * Update user optimization preferences
 * 
 * Updates the profiles.optimization_preferences JSONB column.
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
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('optimization_preferences')
      .eq('user_id', user.id)
      .single();

    // Type-safe access to JSONB column with proper interface
    const currentPrefs: OptimizationPreferencesDB = (currentProfile?.optimization_preferences as OptimizationPreferencesDB) || {};

    // Build updated preferences object
    const updatedPrefs = {
      ...currentPrefs,
      jobType: mapJobTypeToDB(preferences.jobType),
      modificationLevel: mapModLevelToDB(preferences.modLevel),
      industry: preferences.industry || null,
      keywords: preferences.keywords || null,
    };

    // Update preferences in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ optimization_preferences: updatedPrefs })
      .eq('user_id', user.id);

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

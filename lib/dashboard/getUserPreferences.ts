/**
 * Get User Preferences Query
 * Story 16.6: Migrate History and Settings - Task 8
 *
 * Fetches user optimization preferences from the users table.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * User Preferences Type
 *
 * Maps to preferences needed for Settings page.
 * Extracted from optimization_preferences JSONB column.
 */
export interface UserPreferences {
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  modLevel: 'Minimal' | 'Moderate' | 'Aggressive';
  industry: string | null;
  keywords: string | null;
}

/**
 * Type for optimization_preferences JSONB column in database
 * This matches the actual structure stored in Postgres
 */
interface OptimizationPreferencesDB {
  jobType?: string;
  modificationLevel?: string;
  industry?: string | null;
  keywords?: string | null;
  // Other fields that may exist from Epic 11
  tone?: string;
  verbosity?: string;
  emphasis?: string;
  experienceLevel?: string;
}

/**
 * Maps database jobType values to display values
 */
function mapJobTypeFromDB(dbValue: string | null | undefined): UserPreferences['jobType'] {
  const mapping: Record<string, UserPreferences['jobType']> = {
    'fulltime': 'Full-time',
    'parttime': 'Part-time',
    'contract': 'Contract',
    'intern': 'Internship',
  };
  return mapping[dbValue || 'fulltime'] || 'Full-time';
}

/**
 * Maps database modificationLevel values to display values
 */
function mapModLevelFromDB(dbValue: string | null | undefined): UserPreferences['modLevel'] {
  const mapping: Record<string, UserPreferences['modLevel']> = {
    'conservative': 'Minimal',
    'moderate': 'Moderate',
    'aggressive': 'Aggressive',
  };
  return mapping[dbValue || 'moderate'] || 'Moderate';
}

/**
 * Get user optimization preferences
 * 
 * Returns preferences from the profiles.optimization_preferences JSONB column.
 * If preferences don't exist, returns sensible defaults.
 * 
 * @returns ActionResponse with UserPreferences
 */
export async function getUserPreferences(): Promise<ActionResponse<UserPreferences>> {
  try {
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
          message: 'You must be signed in to view preferences',
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
    }

    // Fetch preferences from users table
    // Note: Query by 'id' to match RLS policy (auth.uid() = id)
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('optimization_preferences')
      .eq('id', user.id)
      .single();

    if (dbError) {
      // User record might not exist yet - return defaults
      return {
        data: {
          jobType: 'Full-time',
          modLevel: 'Moderate',
          industry: null,
          keywords: null,
        },
        error: null,
      };
    }

    // Extract preferences from JSONB with proper typing
    const prefs: OptimizationPreferencesDB = profile?.optimization_preferences as OptimizationPreferencesDB;

    return {
      data: {
        jobType: mapJobTypeFromDB(prefs?.jobType),
        modLevel: mapModLevelFromDB(prefs?.modificationLevel),
        industry: prefs?.industry || null,
        keywords: prefs?.keywords || null,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: `Failed to load preferences: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }
}

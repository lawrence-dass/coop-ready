'use server';

/**
 * Get User Preferences Query
 * Story 16.6: Migrate History and Settings - Task 8
 *
 * Fetches user optimization preferences from the users table.
 * Uses same values as scan page - no mapping needed.
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * User Preferences Type - matches scan page values exactly
 */
export interface UserPreferences {
  jobType: 'coop' | 'fulltime';
  modLevel: 'conservative' | 'moderate' | 'aggressive';
  industry: string | null;
  keywords: string | null;
}

/**
 * Get user optimization preferences
 *
 * Returns preferences from the users.optimization_preferences JSONB column.
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
          jobType: 'fulltime',
          modLevel: 'moderate',
          industry: null,
          keywords: null,
        },
        error: null,
      };
    }

    // Extract preferences from JSONB - values stored directly, no mapping needed
    const prefs = profile?.optimization_preferences as {
      jobType?: string;
      modificationLevel?: string;
      industry?: string | null;
      keywords?: string | null;
    } | null;

    return {
      data: {
        jobType: (prefs?.jobType as 'coop' | 'fulltime') || 'fulltime',
        modLevel: (prefs?.modificationLevel as 'conservative' | 'moderate' | 'aggressive') || 'moderate',
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

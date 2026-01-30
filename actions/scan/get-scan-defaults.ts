'use server';

/**
 * Get Scan Defaults Action
 *
 * Fetches user's saved optimization preferences for the scan page.
 * Settings and scan page use the same values - no mapping needed.
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import type {
  JobTypePreference,
  ModificationLevelPreference,
} from '@/types/preferences';

interface ScanDefaults {
  jobType: JobTypePreference;
  modificationLevel: ModificationLevelPreference;
}

/**
 * Get user's default scan preferences
 *
 * Returns preferences stored in the database.
 * Falls back to sensible defaults if user hasn't set preferences.
 */
export async function getScanDefaults(): Promise<ActionResponse<ScanDefaults>> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Return defaults for anonymous users
    return {
      data: {
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      },
      error: null,
    };
  }

  // Fetch preferences from users table
  const { data: userData } = await supabase
    .from('users')
    .select('optimization_preferences')
    .eq('id', user.id)
    .single();

  const prefs = userData?.optimization_preferences as {
    jobType?: string;
    modificationLevel?: string;
  } | null;

  return {
    data: {
      jobType: (prefs?.jobType as JobTypePreference) || 'fulltime',
      modificationLevel: (prefs?.modificationLevel as ModificationLevelPreference) || 'moderate',
    },
    error: null,
  };
}

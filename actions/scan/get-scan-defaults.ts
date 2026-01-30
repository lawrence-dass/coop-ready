'use server';

/**
 * Get Scan Defaults Action
 *
 * Fetches user's saved optimization preferences and maps them to the format
 * used by the scan PreferencesPanel (jobType, modificationLevel).
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
 * Maps database jobType values to scan preference values
 */
function mapJobTypeForScan(dbValue: string | undefined): JobTypePreference {
  // 'intern' maps to 'coop', everything else maps to 'fulltime'
  if (dbValue === 'intern') return 'coop';
  return 'fulltime';
}

/**
 * Maps database modificationLevel values to scan preference values
 */
function mapModLevelForScan(dbValue: string | undefined): ModificationLevelPreference {
  const mapping: Record<string, ModificationLevelPreference> = {
    'conservative': 'conservative',
    'moderate': 'moderate',
    'aggressive': 'aggressive',
  };
  return mapping[dbValue || 'moderate'] || 'moderate';
}

/**
 * Get user's default scan preferences
 *
 * Returns preferences mapped to the scan panel format.
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
      jobType: mapJobTypeForScan(prefs?.jobType),
      modificationLevel: mapModLevelForScan(prefs?.modificationLevel),
    },
    error: null,
  };
}

/**
 * Server Actions for Optimization Preferences
 *
 * This file provides server actions for managing user optimization preferences.
 * All actions follow the ActionResponse pattern and never throw errors.
 *
 * Story: 11.2 - Implement Optimization Preferences
 */

'use server';

import type { ActionResponse, OptimizationPreferences } from '@/types';
import { getUserPreferences, updateUserPreferences } from '@/lib/supabase/preferences';

/**
 * Get current user's optimization preferences
 *
 * Server action that fetches preferences for the authenticated user.
 * Returns defaults if user is anonymous or hasn't set preferences.
 *
 * @returns ActionResponse with OptimizationPreferences
 *
 * @example
 * ```typescript
 * const { data: preferences, error } = await getPreferences();
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // Use preferences...
 * ```
 */
export async function getPreferences(): Promise<
  ActionResponse<OptimizationPreferences>
> {
  return getUserPreferences();
}

/**
 * Save user's optimization preferences
 *
 * Server action that updates preferences for the authenticated user.
 * Validates user is authenticated before saving.
 *
 * @param preferences - The optimization preferences to save
 * @returns ActionResponse with saved preferences or error
 *
 * @example
 * ```typescript
 * const { data, error } = await savePreferences({
 *   tone: 'technical',
 *   verbosity: 'concise',
 *   emphasis: 'keywords',
 *   industry: 'tech',
 *   experienceLevel: 'senior',
 * });
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * toast.success('Preferences saved!');
 * ```
 */
export async function savePreferences(
  preferences: OptimizationPreferences
): Promise<ActionResponse<OptimizationPreferences>> {
  return updateUserPreferences(preferences);
}

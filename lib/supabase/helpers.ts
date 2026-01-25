/**
 * Supabase Auth Helper Functions
 *
 * This file provides convenience helper functions for working with
 * Supabase authentication in various contexts.
 */

import { createClient } from './client';

/**
 * Get the current anonymous user's ID.
 *
 * This is a convenience helper for quickly accessing the anonymous_id
 * that should be used for RLS policies and session tracking.
 *
 * **Usage Context:** Call this from client-side code where you need
 * the user's ID but don't need the full auth context.
 *
 * @returns The anonymous user's UUID, or null if not authenticated
 *
 * @example
 * ```typescript
 * const anonymousId = await getAnonymousId();
 * if (anonymousId) {
 *   // Use for database operations
 *   await saveSession({ anonymous_id: anonymousId, ... });
 * }
 * ```
 */
export async function getAnonymousId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

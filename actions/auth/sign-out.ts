/**
 * Sign-Out Server Action
 *
 * Handles user sign-out by terminating the Supabase session.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await signOut();
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // Success - session terminated
 * router.push('/');
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Result type for successful sign-out
 */
export interface SignOutResult {
  success: true;
}

/**
 * Signs out the current user and terminates their session
 *
 * **Process:**
 * 1. Get Supabase client
 * 2. Call supabase.auth.signOut()
 * 3. Return success or error
 *
 * **Session Handling:**
 * - Supabase automatically clears JWT token from httpOnly cookie
 * - Triggers onAuthStateChange with SIGNED_OUT event
 * - Session is invalidated on Supabase backend
 * - User context becomes null in AuthProvider
 *
 * @returns ActionResponse with sign-out result
 */
export async function signOut(): Promise<ActionResponse<SignOutResult>> {
  try {
    const supabase = await createClient();

    // Call Supabase Auth to sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Sign-out failed - return error response
      return {
        data: null,
        error: {
          message: error.message || 'Failed to sign out. Please try again.',
          code: ERROR_CODES.SIGN_OUT_ERROR,
        },
      };
    }

    // Success - session terminated
    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors (network issues, etc.)
    return {
      data: null,
      error: {
        message: `Sign out failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.SIGN_OUT_ERROR,
      },
    };
  }
}

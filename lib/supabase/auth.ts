/**
 * Supabase Authentication Functions
 *
 * This file provides authentication utilities using the ActionResponse pattern.
 * All functions follow the project convention of never throwing errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await signInAnonymously();
 * if (error) {
 *   console.error(error.message);
 *   return;
 * }
 * console.log('Signed in as:', data.userId);
 * ```
 */

import { createClient } from './client';
import type { ActionResponse } from '@/types';

/**
 * Signs in the user anonymously via Supabase Auth.
 *
 * **How Anonymous Auth Works:**
 * 1. Creates a user record in Supabase Auth with `is_anonymous = true`
 * 2. Returns a session with `auth.uid()` that can be used for RLS
 * 3. Session persists across page refreshes via cookies
 * 4. User can later upgrade to email/OAuth authentication (V1.0)
 *
 * **RLS Integration:**
 * The returned userId should be stored as `anonymous_id` in the sessions table.
 * RLS policies check: `(user_id IS NULL AND anonymous_id = auth.uid())`
 *
 * @returns ActionResponse with userId on success, or error on failure
 */
export async function signInAnonymously(): Promise<
  ActionResponse<{ userId: string }>
> {
  const supabase = createClient();

  try {
    // Check if already signed in
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      return {
        data: { userId: session.user.id },
        error: null,
      };
    }

    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: {
          message: 'Failed to create anonymous session',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    return {
      data: { userId: data.user.id },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error ? err.message : 'Unknown authentication error',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

/**
 * Gets the current session without signing in.
 *
 * Use this to check if a user is already authenticated.
 *
 * @returns ActionResponse with session data or null if not signed in
 */
export async function getSession(): Promise<
  ActionResponse<{ userId: string; isAnonymous: boolean } | null>
> {
  const supabase = createClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!session?.user) {
      return {
        data: null,
        error: null,
      };
    }

    return {
      data: {
        userId: session.user.id,
        isAnonymous: session.user.is_anonymous ?? false,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Failed to get session',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

/**
 * Signs out the current user.
 *
 * For anonymous users, this clears the session and a new anonymous
 * session will be created on next visit.
 *
 * @returns ActionResponse with success status
 */
export async function signOut(): Promise<ActionResponse<{ success: boolean }>> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Failed to sign out',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

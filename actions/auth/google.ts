/**
 * Google OAuth Server Actions
 *
 * Handles Google OAuth sign-in flow:
 * - Initiates OAuth with Supabase
 * - Returns redirect URL for client
 * - Uses ActionResponse pattern
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Initiate Google OAuth sign-in flow
 *
 * @returns ActionResponse with OAuth URL or error
 *
 * @example
 * ```ts
 * const { data, error } = await signInWithGoogle();
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * window.location.href = data.url;
 * ```
 */
export async function signInWithGoogle(): Promise<
  ActionResponse<{ url: string }>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: ERROR_CODES.AUTH_ERROR,
        },
      };
    }

    return {
      data: { url: data.url },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'Failed to initiate Google sign-in',
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }
}

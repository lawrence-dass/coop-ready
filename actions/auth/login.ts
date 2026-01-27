/**
 * Login Server Action
 *
 * Handles email/password authentication with Supabase Auth.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await login(email, password);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // Redirect to main app
 * router.push('/optimize');
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import type { LoginResult } from '@/types/auth';
import { ERROR_CODES } from '@/types';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Logs in an existing user with email and password
 *
 * **Process:**
 * 1. Validate credentials format
 * 2. Call Supabase Auth signInWithPassword
 * 3. Return user info and session status
 *
 * **Session Handling:**
 * Supabase automatically stores JWT token in secure httpOnly cookie.
 * No manual session management required.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns ActionResponse with login result
 */
export async function login(
  email: string,
  password: string
): Promise<ActionResponse<LoginResult>> {
  // Server-side input validation (defense in depth)
  const validation = loginSchema.safeParse({ email, password });

  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const field = firstIssue.path[0];

    if (field === 'email') {
      return {
        data: null,
        error: {
          message: 'Please enter a valid email address.',
          code: ERROR_CODES.INVALID_EMAIL,
        },
      };
    }

    return {
      data: null,
      error: {
        message: firstIssue.message,
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  const supabase = await createClient();

  try {
    // Call Supabase Auth to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error codes to our standard error codes

      // Invalid credentials (wrong password, user not found)
      // Note: Supabase returns same error for both to prevent email enumeration
      if (
        error.message.includes('Invalid login credentials') ||
        error.status === 401 ||
        error.code === 'invalid_credentials'
      ) {
        return {
          data: null,
          error: {
            message: 'Email or password is incorrect.',
            code: ERROR_CODES.INVALID_CREDENTIALS,
          },
        };
      }

      // Email not confirmed
      if (
        error.message.includes('Email not confirmed') ||
        error.code === 'email_not_confirmed'
      ) {
        return {
          data: null,
          error: {
            message: 'Please verify your email before logging in.',
            code: ERROR_CODES.EMAIL_NOT_CONFIRMED,
          },
        };
      }

      // Generic auth error
      return {
        data: null,
        error: {
          message: error.message || 'Login failed. Please try again.',
          code: ERROR_CODES.AUTH_ERROR,
        },
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: {
          message: 'Login failed. Please try again.',
          code: ERROR_CODES.AUTH_ERROR,
        },
      };
    }

    // Success - session automatically established by Supabase
    return {
      data: {
        userId: data.user.id,
        email: data.user.email || email,
        isAnonymous: false,
      },
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors (network issues, etc.)
    return {
      data: null,
      error: {
        message: `Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }
}

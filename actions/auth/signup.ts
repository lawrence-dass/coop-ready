/**
 * Signup Server Action
 *
 * Handles email/password registration with Supabase Auth.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await signup(email, password);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // Redirect to dashboard or show verification message
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/client';
import type { ActionResponse } from '@/types';
import type { SignupResult } from '@/types/auth';
import { ERROR_CODES } from '@/types';

/**
 * Signs up a new user with email and password
 *
 * **Process:**
 * 1. Get current anonymous session (if exists)
 * 2. Call Supabase Auth signUp
 * 3. Migrate anonymous session data to new user
 * 4. Return user info and verification status
 *
 * **Session Migration:**
 * If the user was previously anonymous, their session data
 * (resume, job description, analysis, suggestions) is transferred
 * to the new authenticated account.
 *
 * @param email - User's email address
 * @param password - User's password (must meet strength requirements)
 * @returns ActionResponse with signup result
 */
export async function signup(
  email: string,
  password: string
): Promise<ActionResponse<SignupResult>> {
  const supabase = createClient();

  try {
    // Step 1: Get current anonymous session (for migration)
    let anonymousId: string | null = null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.is_anonymous) {
        anonymousId = session.user.id;
      }
    } catch {
      // Ignore errors getting anonymous session
      // User might not have one, which is fine
    }

    // Step 2: Create new account with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Map Supabase error codes to our standard error codes
      if (
        error.message.includes('already registered') ||
        error.code === 'user_already_exists'
      ) {
        return {
          data: null,
          error: {
            message:
              'An account with this email already exists. Please sign in instead.',
            code: ERROR_CODES.USER_EXISTS,
          },
        };
      }

      if (
        error.message.includes('Password') ||
        error.code === 'weak_password'
      ) {
        return {
          data: null,
          error: {
            message:
              'Password must be at least 8 characters with uppercase, number, and special character.',
            code: ERROR_CODES.WEAK_PASSWORD,
          },
        };
      }

      if (
        error.message.includes('email') ||
        error.code === 'invalid_email'
      ) {
        return {
          data: null,
          error: {
            message: 'Please enter a valid email address.',
            code: ERROR_CODES.INVALID_EMAIL,
          },
        };
      }

      // Generic auth error
      return {
        data: null,
        error: {
          message: error.message || 'Signup failed. Please try again.',
          code: ERROR_CODES.AUTH_ERROR,
        },
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: {
          message: 'Failed to create account. Please try again.',
          code: ERROR_CODES.AUTH_ERROR,
        },
      };
    }

    // Step 3: Migrate anonymous session data (if exists)
    if (anonymousId) {
      try {
        // Find anonymous user's session
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('anonymous_id', anonymousId)
          .maybeSingle();

        if (sessionData) {
          // Update session to associate with new user
          await supabase
            .from('sessions')
            .update({
              user_id: data.user.id,
              anonymous_id: null,
            })
            .eq('id', sessionData.id);
        }
      } catch (migrationError) {
        // Log but don't fail signup if migration fails
        console.error('Session migration failed:', migrationError);
        // User account is created successfully, they just won't have
        // their anonymous data transferred
      }
    }

    // Step 4: Return success
    // Check if email verification is required
    const requiresVerification =
      data.user.email_confirmed_at === null &&
      data.user.confirmation_sent_at !== null;

    return {
      data: {
        userId: data.user.id,
        email: data.user.email || email,
        requiresVerification,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: `Signup failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }
}

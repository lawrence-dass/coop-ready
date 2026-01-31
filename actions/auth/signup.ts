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

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import type { SignupResult } from '@/types/auth';
import { ERROR_CODES } from '@/types';
import { signupSchema } from '@/lib/validations/auth';

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
  // Server-side input validation (defense in depth)
  const validation = signupSchema.safeParse({
    email,
    password,
    confirmPassword: password,
    acceptTerms: true,
  });

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
    // Step 1: Get current anonymous user (for migration)
    let anonymousId: string | null = null;
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser?.is_anonymous) {
        anonymousId = currentUser.id;
      }
    } catch {
      // Ignore errors getting anonymous user
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

      // Check for rate limit BEFORE checking for email errors
      // (rate limit message contains "email" which would incorrectly match)
      if (
        error.code === 'over_email_send_rate_limit' ||
        error.message.includes('rate limit')
      ) {
        return {
          data: null,
          error: {
            message: 'Too many signup attempts. Please wait a few minutes and try again.',
            code: ERROR_CODES.RATE_LIMITED,
          },
        };
      }

      if (error.code === 'invalid_email') {
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

    // Step 4: Check if Supabase requires email verification (legacy check)
    // With our new flow, Supabase email confirmation should be DISABLED
    // so this should always be false
    const requiresVerification =
      data.user.email_confirmed_at === null &&
      data.user.confirmation_sent_at !== null;

    console.log('[SS:signup] signUp result:', {
      hasSession: !!data.session,
      emailConfirmedAt: data.user.email_confirmed_at,
      confirmationSentAt: data.user.confirmation_sent_at,
      requiresVerification,
    });

    // Step 5: Ensure we have a session
    // If Supabase email confirmation is disabled, signUp creates a session
    // If not, we need to handle it gracefully
    if (!data.session) {
      if (requiresVerification) {
        // Supabase email confirmation is still enabled - old flow
        // User must verify email before they can log in
        return {
          data: {
            userId: data.user.id,
            email: data.user.email || email,
            requiresVerification: true,
            emailVerificationSent: true, // Supabase sent it
          },
          error: null,
        };
      }

      // No session and no verification required - try explicit sign in
      console.log('[SS:signup] No session from signUp, attempting explicit sign in');
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.session) {
        console.error('Auto-login after signup failed:', signInError?.message);
        return {
          data: null,
          error: {
            message: 'Account created successfully! Please sign in to continue.',
            code: ERROR_CODES.AUTH_ERROR,
          },
        };
      }
    }

    // Step 6: Set email_verified = false in users table (for email signups)
    // The trigger should have created the user record, but update to ensure flag is set
    await supabase
      .from('users')
      .update({
        email_verified: false,
        email_verification_sent_at: new Date().toISOString(),
      })
      .eq('id', data.user.id);

    // Step 7: Send verification email via magic link
    let emailVerificationSent = false;
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`,
        },
      });

      if (!otpError) {
        emailVerificationSent = true;
        console.log('[SS:signup] Verification email sent to:', email);
      } else {
        console.error('[SS:signup] Failed to send verification email:', otpError.message);
      }
    } catch (err) {
      console.error('[SS:signup] Error sending verification email:', err);
    }

    return {
      data: {
        userId: data.user.id,
        email: data.user.email || email,
        requiresVerification: false, // User has session, can access app
        emailVerificationSent,
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

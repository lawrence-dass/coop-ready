'use server';

/**
 * Send/Resend Email Verification
 *
 * Sends a magic link to verify the user's email address.
 * Rate limited to 1 email per 60 seconds.
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

const RATE_LIMIT_SECONDS = 60;

interface SendVerificationResult {
  sent: boolean;
  email: string;
}

/**
 * Sends a verification email to the current user
 *
 * @returns ActionResponse with success status
 */
export async function sendVerificationEmail(): Promise<
  ActionResponse<SendVerificationResult>
> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: {
        message: 'You must be logged in to verify your email.',
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }

  if (!user.email) {
    return {
      data: null,
      error: {
        message: 'No email address found for this account.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  // Check if already verified
  const { data: userData } = await supabase
    .from('users')
    .select('email_verified, email_verification_sent_at')
    .eq('id', user.id)
    .single();

  if (userData?.email_verified) {
    return {
      data: null,
      error: {
        message: 'Your email is already verified.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  // Rate limit check
  if (userData?.email_verification_sent_at) {
    const lastSent = new Date(userData.email_verification_sent_at);
    const now = new Date();
    const secondsSinceLastSent = (now.getTime() - lastSent.getTime()) / 1000;

    if (secondsSinceLastSent < RATE_LIMIT_SECONDS) {
      const waitSeconds = Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastSent);
      return {
        data: null,
        error: {
          message: `Please wait ${waitSeconds} seconds before requesting another verification email.`,
          code: ERROR_CODES.RATE_LIMITED,
        },
      };
    }
  }

  // Send magic link for email verification
  // Using signInWithOtp with shouldCreateUser: false just sends the link
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`,
    },
  });

  if (otpError) {
    console.error('[SS:verify] Failed to send verification email:', otpError);
    return {
      data: null,
      error: {
        message: 'Failed to send verification email. Please try again.',
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }

  // Update sent timestamp for rate limiting
  await supabase
    .from('users')
    .update({ email_verification_sent_at: new Date().toISOString() })
    .eq('id', user.id);

  console.log('[SS:verify] Verification email sent to:', user.email);

  return {
    data: {
      sent: true,
      email: user.email,
    },
    error: null,
  };
}

/**
 * Check if the current user's email is verified
 */
export async function checkEmailVerified(): Promise<
  ActionResponse<{ verified: boolean; email: string | null }>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: {
        message: 'You must be logged in.',
        code: ERROR_CODES.AUTH_ERROR,
      },
    };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('email_verified')
    .eq('id', user.id)
    .single();

  return {
    data: {
      verified: userData?.email_verified ?? false,
      email: user.email ?? null,
    },
    error: null,
  };
}

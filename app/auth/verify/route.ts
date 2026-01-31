/**
 * Email Verification Callback Route
 *
 * Handles the magic link callback when user clicks verification email.
 * Updates email_verified status and redirects to dashboard.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;

  // Handle errors
  const error = requestUrl.searchParams.get('error');
  if (error) {
    const errorDescription = requestUrl.searchParams.get('error_description');
    console.error('[SS:verify] Verification error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/dashboard?error=${encodeURIComponent('Email verification failed. Please try again.')}`
    );
  }

  const supabase = await createClient();

  // Handle PKCE flow (code exchange)
  if (code) {
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[SS:verify] Code exchange error:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/dashboard?error=${encodeURIComponent('Verification link expired. Please request a new one.')}`
      );
    }

    if (data.user) {
      // Mark email as verified in our users table
      await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', data.user.id);

      console.log('[SS:verify] Email verified for user:', data.user.id);
    }

    return NextResponse.redirect(
      `${origin}/dashboard?success=${encodeURIComponent('Email verified successfully!')}`
    );
  }

  // Handle magic link flow (token_hash)
  if (token_hash && type === 'magiclink') {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'magiclink',
    });

    if (verifyError) {
      console.error('[SS:verify] OTP verification error:', verifyError.message);
      return NextResponse.redirect(
        `${origin}/dashboard?error=${encodeURIComponent('Verification link expired. Please request a new one.')}`
      );
    }

    if (data.user) {
      // Mark email as verified in our users table
      await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', data.user.id);

      console.log('[SS:verify] Email verified for user:', data.user.id);
    }

    return NextResponse.redirect(
      `${origin}/dashboard?success=${encodeURIComponent('Email verified successfully!')}`
    );
  }

  // No valid parameters
  console.error('[SS:verify] No valid verification parameters');
  return NextResponse.redirect(
    `${origin}/dashboard?error=${encodeURIComponent('Invalid verification link.')}`
  );
}

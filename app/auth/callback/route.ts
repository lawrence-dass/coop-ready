/**
 * OAuth Callback Route Handler
 *
 * Handles OAuth redirect from providers (Google, etc.)
 * Uses Route Handler to properly exchange code and redirect
 * without the client-side Supabase trying to re-exchange the code.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle OAuth errors (user cancelled, provider error, etc.)
  if (error) {
    const errorMessage = errorDescription || 'OAuth authentication failed';
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(errorMessage)}`
    );
  }

  // Ensure code is present
  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=No authorization code provided`
    );
  }

  // Exchange code for session
  const supabase = await createClient();
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.session) {
    console.error('OAuth exchange error:', exchangeError?.message);
    return NextResponse.redirect(
      `${origin}/auth/error?message=Authentication failed`
    );
  }

  // OAuth users (Google) have verified emails - mark as verified
  // This also ensures the user record exists (trigger should create it)
  await supabase
    .from('users')
    .update({ email_verified: true })
    .eq('id', data.session.user.id);

  // Check if user needs onboarding
  // New users (no record or onboarding_complete=false) should complete onboarding
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('user_id', data.session.user.id)
    .single();

  if (!userData || !userData.onboarding_complete) {
    return NextResponse.redirect(`${origin}/auth/onboarding`);
  }

  // Success - redirect to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}

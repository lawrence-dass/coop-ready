/**
 * OAuth Callback Page
 *
 * Handles OAuth redirect from providers (Google, etc.)
 * Exchanges authorization code for session
 * Redirects to /optimize on success or /auth/error on failure
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface CallbackPageProps {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps) {
  const { code, error, error_description } = await searchParams;

  // Handle OAuth errors (user cancelled, provider error, etc.)
  if (error) {
    const errorMessage = error_description || 'OAuth authentication failed';
    redirect(`/auth/error?message=${encodeURIComponent(errorMessage)}`);
  }

  // Ensure code is present
  if (!code) {
    redirect('/auth/error?message=No code provided');
  }

  // Exchange code for session
  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.session) {
    redirect('/auth/error?message=OAuth authentication failed');
  }

  // Success - redirect to main app
  redirect('/');
}

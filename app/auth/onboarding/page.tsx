/**
 * Onboarding Page
 * Story 8-5: Implement Onboarding Flow
 *
 * Page shown to users after first-time signup to collect preferences.
 * Server component that verifies authentication before rendering form.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from '@/components/forms/OnboardingForm';
import { Mail } from 'lucide-react';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (error || !user) {
    redirect('/auth/login');
  }

  // Check if user already completed onboarding and their email verification status
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_complete, email_verified')
    .eq('user_id', user.id)
    .single();

  if (userData?.onboarding_complete) {
    redirect('/');
  }

  // Show verification banner for email signup users who haven't verified
  const showVerificationBanner = userData?.email_verified === false;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Email Verification Banner */}
        {showVerificationBanner && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
            <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Verify your email</p>
              <p className="text-blue-700 mt-1">
                We sent a verification link to <strong>{user.email}</strong>.
                Please verify your email to unlock all features.
              </p>
            </div>
          </div>
        )}

        <OnboardingForm />
      </div>
    </div>
  );
}

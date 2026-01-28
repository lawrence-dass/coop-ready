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

  // Check if user already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .single();

  if (profile?.onboarding_complete) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <OnboardingForm />
    </div>
  );
}

/**
 * Settings Page (Server Component)
 * Story 16.6: Migrate History and Settings
 *
 * Renders user settings page within the dashboard layout.
 * Loads user data and preferences server-side with RLS enforcement.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Settings | SubmitSmart',
  description: 'Manage your account and optimization preferences',
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { ClientSettingsPage } from './ClientSettingsPage';
import { getUserPreferences } from '@/lib/dashboard/getUserPreferences';

export default async function SettingsPage() {
  // Get authenticated user (already protected by layout)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Load user preferences
  const { data: preferences, error: prefsError } = await getUserPreferences();

  // Use defaults if preferences load failed (with logging)
  // Values match scan page options - no mapping needed
  const userPreferences = preferences || {
    jobType: 'fulltime' as const,
    modLevel: 'moderate' as const,
  };

  // Log error for monitoring (user sees defaults, no UI disruption)
  if (prefsError) {
    console.error('[Settings Page] Failed to load preferences:', prefsError);
  }

  // Load onboarding data from users table
  // Note: Query by 'id' to match RLS policy (auth.uid() = id)
  const { data: userData } = await supabase
    .from('users')
    .select('email, first_name, last_name, onboarding_answers')
    .eq('id', user.id)
    .single();

  // Privacy consent - column doesn't exist yet, use defaults
  const privacyConsent = {
    accepted: false,
    acceptedAt: null,
  };

  const onboardingData = {
    firstName: userData?.first_name || null,
    lastName: userData?.last_name || null,
    answers: userData?.onboarding_answers || null,
  };

  // Pass user data to client component
  // Use email from users table as fallback if auth email is empty
  const userEmail = user.email || userData?.email || '';

  return (
    <ClientSettingsPage
      user={{
        email: userEmail,
        createdAt: user.created_at,
        id: user.id,
      }}
      preferences={userPreferences}
      privacyConsent={privacyConsent}
      onboarding={onboardingData}
    />
  );
}

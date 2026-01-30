/**
 * Settings Page (Server Component)
 * Story 16.6: Migrate History and Settings
 *
 * Renders user settings page within the dashboard layout.
 * Loads user profile and preferences server-side with RLS enforcement.
 */

import { redirect } from 'next/navigation';
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
  const userPreferences = preferences || {
    jobType: 'Full-time' as const,
    modLevel: 'Moderate' as const,
    industry: null,
    keywords: null,
  };

  // Log error for monitoring (user sees defaults, no UI disruption)
  if (prefsError) {
    console.error('[Settings Page] Failed to load preferences:', prefsError);
  }

  // Load privacy consent status from profiles table
  const { data: profileData } = await supabase
    .from('profiles')
    .select('privacy_consent_accepted, privacy_consent_accepted_at')
    .eq('user_id', user.id)
    .single();

  const privacyConsent = {
    accepted: profileData?.privacy_consent_accepted || false,
    acceptedAt: profileData?.privacy_consent_accepted_at || null,
  };

  // Pass user data to client component
  return (
    <ClientSettingsPage
      user={{
        email: user.email || '',
        createdAt: user.created_at,
        id: user.id,
      }}
      preferences={userPreferences}
      privacyConsent={privacyConsent}
    />
  );
}

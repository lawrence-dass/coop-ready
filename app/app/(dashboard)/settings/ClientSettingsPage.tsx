/**
 * Client Settings Page Component
 * Story 16.6: Migrate History and Settings
 *
 * Main settings page with organized sections for profile, preferences, privacy, and account actions.
 */

'use client';

import { Card } from '@/components/ui/card';
import { ProfileSection } from './ProfileSection';
import { OptimizationPreferencesSection } from './OptimizationPreferencesSection';
import { PrivacySection } from './PrivacySection';
import { AccountActionsSection } from './AccountActionsSection';

interface User {
  email: string;
  createdAt: string;
  id: string;
}

interface Preferences {
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  modLevel: 'Minimal' | 'Moderate' | 'Aggressive';
  industry: string | null;
  keywords: string | null;
}

interface PrivacyConsent {
  accepted: boolean;
  acceptedAt: string | null;
}

interface OnboardingData {
  firstName: string | null;
  lastName: string | null;
  answers: {
    careerGoal?: string;
    experienceLevel?: string;
    targetIndustries?: string[];
  } | null;
}

interface ClientSettingsPageProps {
  user: User;
  preferences: Preferences;
  privacyConsent: PrivacyConsent;
  onboarding: OnboardingData;
}

export function ClientSettingsPage({
  user,
  preferences,
  privacyConsent,
  onboarding,
}: ClientSettingsPageProps) {
  // Convert null to undefined for React Hook Form compatibility
  // NOTE: RHF expects undefined for optional fields, but DB stores null
  // The form component will convert undefined → '' for inputs, then back to null on save
  const preferencesForForm = {
    jobType: preferences.jobType,
    modLevel: preferences.modLevel,
    industry: preferences.industry ?? undefined,
    keywords: preferences.keywords ?? undefined,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6 max-w-3xl">
        {/* Profile Information */}
        <ProfileSection
          email={user.email}
          createdAt={user.createdAt}
          userId={user.id}
          firstName={onboarding.firstName}
          lastName={onboarding.lastName}
          onboardingAnswers={onboarding.answers}
        />

        {/* Optimization Preferences */}
        <OptimizationPreferencesSection
          userId={user.id}
          preferences={preferencesForForm}
        />

        {/* Privacy Settings */}
        <PrivacySection consent={privacyConsent} />

        {/* Account Actions */}
        <AccountActionsSection />
      </div>
    </div>
  );
}

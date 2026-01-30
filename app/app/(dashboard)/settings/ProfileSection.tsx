/**
 * ProfileSection Component
 * Story 16.6: Migrate History and Settings - Task 3
 *
 * Displays user profile information (name, email) and onboarding selections.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Target, Briefcase, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OnboardingAnswers {
  careerGoal?: string;
  experienceLevel?: string;
  targetIndustries?: string[];
}

interface ProfileSectionProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  onboardingAnswers: OnboardingAnswers | null;
}

// Labels for career goals
const CAREER_GOAL_LABELS: Record<string, string> = {
  'first-job': 'Looking for my first job',
  'switching-careers': 'Switching careers',
  'advancing': 'Advancing in current field',
  'promotion': 'Getting promoted',
  'returning': 'Returning after a break',
};

// Labels for experience levels
const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  'entry': 'Entry Level (0-2 years)',
  'mid': 'Mid-Level (3-7 years)',
  'senior': 'Senior (8-15 years)',
  'executive': 'Executive (15+ years)',
};

// Labels for industries
const INDUSTRY_LABELS: Record<string, string> = {
  'technology': 'Technology',
  'healthcare': 'Healthcare',
  'finance': 'Finance',
  'education': 'Education',
  'marketing': 'Marketing/Media',
  'engineering': 'Engineering',
  'retail': 'Retail/Hospitality',
  'other': 'Other',
};

export function ProfileSection({
  email,
  firstName,
  lastName,
  onboardingAnswers,
}: ProfileSectionProps) {
  // Build display name
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || null;

  const hasOnboardingData = onboardingAnswers?.careerGoal ||
    onboardingAnswers?.experienceLevel ||
    (onboardingAnswers?.targetIndustries && onboardingAnswers.targetIndustries.length > 0);

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">
                {displayName || <span className="text-gray-400 italic">Not provided</span>}
              </p>
            </div>
          </div>

          {/* Email Address */}
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-900">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Selections Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Selections</CardTitle>
          <CardDescription>
            Preferences you selected during onboarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasOnboardingData ? (
            <p className="text-sm text-gray-500 italic">
              No selections found. Your account may have been created before onboarding was available.
            </p>
          ) : (
            <>
              {/* Career Goal */}
              {onboardingAnswers?.careerGoal && (
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Career Goal</p>
                    <p className="text-sm text-gray-900">
                      {CAREER_GOAL_LABELS[onboardingAnswers.careerGoal] || onboardingAnswers.careerGoal}
                    </p>
                  </div>
                </div>
              )}

              {/* Experience Level */}
              {onboardingAnswers?.experienceLevel && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Experience Level</p>
                    <p className="text-sm text-gray-900">
                      {EXPERIENCE_LEVEL_LABELS[onboardingAnswers.experienceLevel] || onboardingAnswers.experienceLevel}
                    </p>
                  </div>
                </div>
              )}

              {/* Target Industries */}
              {onboardingAnswers?.targetIndustries && onboardingAnswers.targetIndustries.length > 0 && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Target Industries</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {onboardingAnswers.targetIndustries.map((industry) => (
                        <Badge key={industry} variant="secondary" className="text-xs">
                          {INDUSTRY_LABELS[industry] || industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ProfileSection Component
 * Story 16.6: Migrate History and Settings - Task 3
 *
 * Displays user profile information (email, account creation date, user ID, and onboarding data).
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, Hash, Target, Briefcase, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OnboardingAnswers {
  careerGoal?: string;
  experienceLevel?: string;
  targetIndustries?: string[];
}

interface ProfileSectionProps {
  email: string;
  createdAt: string;
  userId: string;
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
  createdAt,
  userId,
  firstName,
  lastName,
  onboardingAnswers,
}: ProfileSectionProps) {
  // Format date: "Member since Jan 24, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt));

  // Build display name
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name (if available) */}
        {displayName && (
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{displayName}</p>
            </div>
          </div>
        )}

        {/* Email Address */}
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900">{email}</p>
          </div>
        </div>

        {/* Account Creation Date */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Member since</p>
            <p className="text-sm text-gray-900">{formattedDate}</p>
          </div>
        </div>

        {/* Career Goal (if available) */}
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

        {/* Experience Level (if available) */}
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

        {/* Target Industries (if available) */}
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

        {/* User ID (optional, for debugging) */}
        <div className="flex items-start gap-3">
          <Hash className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">User ID</p>
            <p className="text-xs font-mono text-gray-500 break-all">{userId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

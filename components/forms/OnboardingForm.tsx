'use client';

/**
 * OnboardingForm Component
 * Story 8-5: Implement Onboarding Flow
 *
 * Multi-question form for collecting user preferences during onboarding.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { saveOnboarding, skipOnboarding } from '@/actions/auth/save-onboarding';
import type { OnboardingAnswers, CareerGoal, ExperienceLevel, Industry } from '@/types/auth';

// Career goal options
const CAREER_GOALS = [
  { value: 'first-job', label: 'Looking for my first job' },
  { value: 'switching-careers', label: 'Switching careers' },
  { value: 'advancing', label: 'Advancing in current field' },
  { value: 'promotion', label: 'Getting promoted' },
  { value: 'returning', label: 'Returning after a break' },
] as const;

// Experience level options
const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid-Level (3-7 years)' },
  { value: 'senior', label: 'Senior (8-15 years)' },
  { value: 'executive', label: 'Executive (15+ years)' },
] as const;

// Industry options
const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing/Media' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'retail', label: 'Retail/Hospitality' },
  { value: 'other', label: 'Other' },
] as const;

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    firstName: '',
    lastName: '',
    careerGoal: '',
    experienceLevel: '',
    targetIndustries: [],
  });

  // Handle name changes
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers((prev) => ({ ...prev, firstName: e.target.value }));
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers((prev) => ({ ...prev, lastName: e.target.value }));
  };

  // Handle career goal change
  const handleCareerGoalChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, careerGoal: value as CareerGoal }));
  };

  // Handle experience level change
  const handleExperienceLevelChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, experienceLevel: value as ExperienceLevel }));
  };

  // Handle industry checkbox change
  const handleIndustryChange = (industry: Industry, checked: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      targetIndustries: checked
        ? [...prev.targetIndustries, industry]
        : prev.targetIndustries.filter((i) => i !== industry),
    }));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all questions answered
    if (
      !answers.firstName.trim() ||
      !answers.lastName.trim() ||
      !answers.careerGoal ||
      !answers.experienceLevel ||
      answers.targetIndustries.length === 0
    ) {
      toast.error('Please answer all questions');
      return;
    }

    startTransition(async () => {
      const { data, error } = await saveOnboarding(answers);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.success) {
        toast.success('Welcome to SubmitSmart!');
        // Full page load so AuthProvider reinitializes with the new session cookie
        window.location.href = '/';
      }
    });
  };

  // Handle skip
  const handleSkip = () => {
    startTransition(async () => {
      const { data, error } = await skipOnboarding();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.success) {
        // Full page load so AuthProvider reinitializes with the new session cookie
        window.location.href = '/';
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome!</h1>
        <p className="text-muted-foreground">
          Let&apos;s personalize your experience with a few quick questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" data-testid="onboarding-form">
        {/* Step 1: Name */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              What&apos;s your name?
            </Label>
            <p className="text-sm text-muted-foreground">Step 1 of 4</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={answers.firstName}
                onChange={handleFirstNameChange}
                placeholder="John"
                data-testid="first-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={answers.lastName}
                onChange={handleLastNameChange}
                placeholder="Doe"
                data-testid="last-name-input"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Career Goal */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              What&apos;s your primary career goal right now?
            </Label>
            <p className="text-sm text-muted-foreground">Step 2 of 4</p>
          </div>

          <RadioGroup
            value={answers.careerGoal}
            onValueChange={handleCareerGoalChange}
            data-testid="career-goal-group"
          >
            {CAREER_GOALS.map((goal) => (
              <div key={goal.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={goal.value}
                  id={goal.value}
                  data-testid={`career-goal-${goal.value}`}
                />
                <Label htmlFor={goal.value} className="font-normal cursor-pointer">
                  {goal.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Step 3: Experience Level */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              What&apos;s your professional experience level?
            </Label>
            <p className="text-sm text-muted-foreground">Step 3 of 4</p>
          </div>

          <RadioGroup
            value={answers.experienceLevel}
            onValueChange={handleExperienceLevelChange}
            data-testid="experience-level-group"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={level.value}
                  id={level.value}
                  data-testid={`experience-level-${level.value}`}
                />
                <Label htmlFor={level.value} className="font-normal cursor-pointer">
                  {level.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Step 4: Target Industries */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Which industries are you targeting?
            </Label>
            <p className="text-sm text-muted-foreground">
              Step 4 of 4 • Select all that apply
            </p>
          </div>

          <div className="space-y-3" data-testid="industries-group">
            {INDUSTRIES.map((industry) => (
              <div key={industry.value} className="flex items-center space-x-2">
                <Checkbox
                  id={industry.value}
                  checked={answers.targetIndustries.includes(industry.value)}
                  onCheckedChange={(checked) =>
                    handleIndustryChange(industry.value, checked as boolean)
                  }
                  data-testid={`industry-${industry.value}`}
                />
                <Label
                  htmlFor={industry.value}
                  className="font-normal cursor-pointer"
                >
                  {industry.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            data-testid="complete-button"
          >
            {isPending ? 'Saving...' : 'Complete Onboarding'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSkip}
            disabled={isPending}
            data-testid="skip-button"
          >
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}

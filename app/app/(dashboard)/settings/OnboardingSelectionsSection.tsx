/**
 * OnboardingSelectionsSection Component
 *
 * Editable form for onboarding selections (career goal, experience level, target industries).
 */

'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, Briefcase, Building2, Pencil, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateOnboardingSelections } from '@/actions/settings/update-onboarding-selections';

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

// Labels for display
const CAREER_GOAL_LABELS: Record<string, string> = Object.fromEntries(
  CAREER_GOALS.map(g => [g.value, g.label])
);
const EXPERIENCE_LEVEL_LABELS: Record<string, string> = Object.fromEntries(
  EXPERIENCE_LEVELS.map(l => [l.value, l.label])
);
const INDUSTRY_LABELS: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map(i => [i.value, i.label])
);

interface OnboardingAnswers {
  careerGoal?: string;
  experienceLevel?: string;
  targetIndustries?: string[];
}

interface OnboardingSelectionsSectionProps {
  answers: OnboardingAnswers | null;
}

export function OnboardingSelectionsSection({ answers }: OnboardingSelectionsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [careerGoal, setCareerGoal] = useState(answers?.careerGoal || '');
  const [experienceLevel, setExperienceLevel] = useState(answers?.experienceLevel || '');
  const [targetIndustries, setTargetIndustries] = useState<string[]>(answers?.targetIndustries || []);

  const hasData = answers?.careerGoal || answers?.experienceLevel ||
    (answers?.targetIndustries && answers.targetIndustries.length > 0);

  const handleIndustryChange = (industry: string, checked: boolean) => {
    setTargetIndustries(prev =>
      checked ? [...prev, industry] : prev.filter(i => i !== industry)
    );
  };

  const handleCancel = () => {
    // Reset to original values
    setCareerGoal(answers?.careerGoal || '');
    setExperienceLevel(answers?.experienceLevel || '');
    setTargetIndustries(answers?.targetIndustries || []);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!careerGoal || !experienceLevel || targetIndustries.length === 0) {
      toast.error('Please fill in all fields');
      return;
    }

    startTransition(async () => {
      const { error } = await updateOnboardingSelections({
        careerGoal,
        experienceLevel,
        targetIndustries,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Selections updated successfully');
      setIsEditing(false);
    });
  };

  // Edit mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Your Selections</CardTitle>
              <CardDescription>Update your preferences</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Career Goal */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Career Goal</Label>
            <RadioGroup value={careerGoal} onValueChange={setCareerGoal}>
              {CAREER_GOALS.map((goal) => (
                <div key={goal.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={goal.value} id={`goal-${goal.value}`} />
                  <Label htmlFor={`goal-${goal.value}`} className="font-normal cursor-pointer">
                    {goal.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Experience Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Experience Level</Label>
            <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
              {EXPERIENCE_LEVELS.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={level.value} id={`level-${level.value}`} />
                  <Label htmlFor={`level-${level.value}`} className="font-normal cursor-pointer">
                    {level.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Target Industries */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Target Industries</Label>
            <div className="space-y-2">
              {INDUSTRIES.map((industry) => (
                <div key={industry.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`industry-${industry.value}`}
                    checked={targetIndustries.includes(industry.value)}
                    onCheckedChange={(checked) => handleIndustryChange(industry.value, checked as boolean)}
                  />
                  <Label htmlFor={`industry-${industry.value}`} className="font-normal cursor-pointer">
                    {industry.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Your Selections</CardTitle>
            <CardDescription>Preferences you selected during onboarding</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <p className="text-sm text-gray-500 italic">
            No selections found. Click the edit button to add your preferences.
          </p>
        ) : (
          <>
            {/* Career Goal */}
            {answers?.careerGoal && (
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Career Goal</p>
                  <p className="text-sm text-gray-900">
                    {CAREER_GOAL_LABELS[answers.careerGoal] || answers.careerGoal}
                  </p>
                </div>
              </div>
            )}

            {/* Experience Level */}
            {answers?.experienceLevel && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Experience Level</p>
                  <p className="text-sm text-gray-900">
                    {EXPERIENCE_LEVEL_LABELS[answers.experienceLevel] || answers.experienceLevel}
                  </p>
                </div>
              </div>
            )}

            {/* Target Industries */}
            {answers?.targetIndustries && answers.targetIndustries.length > 0 && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Target Industries</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {answers.targetIndustries.map((industry) => (
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
  );
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ProfileForm } from '@/components/forms/ProfileForm'
import { OnboardingInput } from '@/lib/validations/profile'
import { completeOnboarding } from '@/actions/profile'
import { EXPERIENCE_LEVELS } from '@/config/experience-levels'

/**
 * Onboarding Page - Multi-step Profile Setup
 *
 * Step 1: Experience level selection (inline RadioGroup)
 * Step 2: Target role selection (via ProfileForm)
 *
 * @see Story 2.1: Onboarding Flow - Experience Level & Target Role
 * @see Story 2.2: Profile Settings Page - Refactored to use ProfileForm
 */

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<'student' | 'career_changer' | undefined>()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Handle step 1 completion - validate experience level selected
  const handleNext = () => {
    if (!selectedExperienceLevel) {
      toast.error('Please select an experience level')
      return
    }
    setStep(2)
  }

  // Navigate to previous step
  const handleBack = () => {
    setStep(1)
  }

  // Submit form - complete onboarding
  const handleCompleteOnboarding = async (data: OnboardingInput) => {
    startTransition(async () => {
      const { error } = await completeOnboarding(data)
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Profile setup complete!')
      router.push('/dashboard')
    })
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6" data-testid="onboarding-container">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Welcome to CoopReady!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let&apos;s personalize your experience in just 2 steps
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 ? 'Step 1: Experience Level' : 'Step 2: Target Role'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Tell us about your current situation'
                : 'What role are you targeting?'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              // Step 1: Experience level selection
              <div className="space-y-6">
                <RadioGroup
                  value={selectedExperienceLevel}
                  onValueChange={(value) => setSelectedExperienceLevel(value as 'student' | 'career_changer')}
                >
                  <div className="space-y-4">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <div key={level.id} className="flex items-start space-x-3">
                        <RadioGroupItem
                          value={level.id}
                          id={`onboarding-${level.id}`}
                          data-testid={`experience-level-${level.id}`}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`onboarding-${level.id}`}
                            className="text-base font-medium cursor-pointer"
                          >
                            {level.label}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {level.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!selectedExperienceLevel}
                    data-testid="onboarding-next-button"
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              // Step 2: Target role selection via ProfileForm
              <div className="space-y-6">
                <ProfileForm
                  initialData={{
                    experienceLevel: selectedExperienceLevel!,
                    targetRole: '',
                    customRole: null,
                  }}
                  onSubmit={handleCompleteOnboarding}
                  submitLabel="Complete Setup"
                  showCancel={false}
                  isPending={isPending}
                  hideExperienceLevel={true}
                />
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isPending}
                    data-testid="onboarding-back-button"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </div>
    </div>
  )
}

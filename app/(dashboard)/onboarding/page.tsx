'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EXPERIENCE_LEVELS, TARGET_ROLES } from '@/config/experience-levels'
import { onboardingInputSchema, OnboardingInput } from '@/lib/validations/profile'
import { completeOnboarding } from '@/actions/profile'

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [showCustomRole, setShowCustomRole] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingInputSchema),
    defaultValues: {
      experienceLevel: undefined,
      targetRole: '',
      customRole: null,
    },
  })

  const experienceLevel = form.watch('experienceLevel')
  const targetRole = form.watch('targetRole')

  // Handle target role selection - show custom input if "Other" selected
  const handleTargetRoleChange = (value: string) => {
    form.setValue('targetRole', value)
    if (value === 'Other') {
      setShowCustomRole(true)
      form.setValue('customRole', '')
    } else {
      setShowCustomRole(false)
      form.setValue('customRole', null)
    }
  }

  // Navigate to next step
  const handleNext = () => {
    if (experienceLevel) {
      setStep(2)
    }
  }

  // Navigate to previous step
  const handleBack = () => {
    setStep(1)
  }

  // Submit form
  const onSubmit = (data: OnboardingInput) => {
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

  // Check if Step 2 form is valid (target role selected and custom role if needed)
  const isStep2Valid = () => {
    if (!targetRole) return false
    if (showCustomRole && !form.watch('customRole')) return false
    return true
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Experience Level */}
              {step === 1 && (
                <div className="space-y-6">
                  <RadioGroup
                    value={experienceLevel}
                    onValueChange={(value) => form.setValue('experienceLevel', value as 'student' | 'career_changer')}
                  >
                    <div className="space-y-4">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <div key={level.id} className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={level.id}
                            id={level.id}
                            data-testid={`experience-level-${level.id}`}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={level.id}
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

                  {form.formState.errors.experienceLevel && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.experienceLevel.message}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!experienceLevel}
                      data-testid="onboarding-next-button"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Target Role */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="target-role">Select your target role</Label>
                    <Select value={targetRole} onValueChange={handleTargetRoleChange}>
                      <SelectTrigger id="target-role" data-testid="target-role-select">
                        <SelectValue placeholder="Choose a role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.targetRole && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.targetRole.message}
                      </p>
                    )}
                  </div>

                  {/* Conditional custom role input */}
                  {showCustomRole && (
                    <div className="grid gap-2">
                      <Label htmlFor="custom-role">Enter your custom role</Label>
                      <Input
                        id="custom-role"
                        type="text"
                        placeholder="e.g., Blockchain Developer, DevRel Engineer"
                        data-testid="custom-role-input"
                        autoFocus
                        {...form.register('customRole')}
                      />
                      {form.formState.errors.customRole && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.customRole.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isPending}
                      data-testid="onboarding-back-button"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isStep2Valid() || isPending}
                      data-testid="onboarding-complete-button"
                    >
                      {isPending ? 'Saving...' : 'Complete Setup'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
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

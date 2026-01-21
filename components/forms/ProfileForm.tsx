'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { EXPERIENCE_LEVELS, TARGET_ROLES } from '@/config/experience-levels'
import { onboardingInputSchema, OnboardingInput } from '@/lib/validations/profile'

/**
 * Reusable Profile Form Component
 *
 * Used for both onboarding flow and profile settings page.
 * Handles experience level and target role selection with custom role input.
 *
 * @see Story 2.2: Profile Settings Page
 * @see Story 2.1: Onboarding Flow - original implementation
 */

interface ProfileFormProps {
  initialData?: {
    experienceLevel: 'student' | 'career_changer' | 'experienced'
    targetRole: string
    customRole?: string | null
  }
  onSubmit: (data: OnboardingInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  showCancel?: boolean
  isPending?: boolean
  /** Show only experience level section (for multi-step onboarding) */
  showOnlyExperienceLevel?: boolean
  /** Hide experience level section (for onboarding step 2 where it's already selected) */
  hideExperienceLevel?: boolean
}

export function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Changes',
  showCancel = false,
  isPending = false,
  showOnlyExperienceLevel = false,
  hideExperienceLevel = false,
}: ProfileFormProps) {
  const [showCustomRole, setShowCustomRole] = useState(false)

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingInputSchema),
    defaultValues: {
      experienceLevel: initialData?.experienceLevel,
      targetRole: initialData?.targetRole || '',
      customRole: initialData?.customRole || null,
    },
  })

  const targetRole = form.watch('targetRole')

  // Reset form when initialData changes (e.g., re-opening edit mode after cancel)
  useEffect(() => {
    if (initialData) {
      form.reset({
        experienceLevel: initialData.experienceLevel,
        targetRole: initialData.targetRole || '',
        customRole: initialData.customRole || null,
      })
      setShowCustomRole(initialData.targetRole === 'Other')
    }
  }, [initialData, form])

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

  // Handle form submission with defensive error handling
  const handleSubmit = async (data: OnboardingInput) => {
    try {
      await onSubmit(data)
    } catch (error) {
      // Log unexpected errors for debugging - Server Actions should return
      // ActionResponse, not throw, but handle gracefully if they do
      console.error('[ProfileForm] Unexpected error during submit:', error)
      throw error // Re-throw to let parent error boundary handle it
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} data-testid="profile-form">
      <div className="space-y-6">
        {/* Experience Level - hidden when hideExperienceLevel is true */}
        {!hideExperienceLevel && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Experience Level</Label>
            <RadioGroup
              value={form.watch('experienceLevel')}
              onValueChange={(value) => form.setValue('experienceLevel', value as 'student' | 'career_changer' | 'experienced')}
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
          </div>
        )}

        {/* Target Role - hidden when showOnlyExperienceLevel is true */}
        {!showOnlyExperienceLevel && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="target-role">Target Role</Label>
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
          </>
        )}

        {/* Submit and Cancel buttons */}
        <div className={showCancel ? 'flex justify-end gap-2' : 'flex justify-end'}>
          {showCancel && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            data-testid="save-button"
          >
            {isPending ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

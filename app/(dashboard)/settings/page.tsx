'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfileForm } from '@/components/forms/ProfileForm'
import { getProfile, updateProfile, UserProfile } from '@/actions/profile'
import { OnboardingInput } from '@/lib/validations/profile'
import { EXPERIENCE_LEVELS } from '@/config/experience-levels'

/**
 * Settings Page - Profile Management
 *
 * Allows users to view and update their experience level and target role.
 * Uses reusable ProfileForm component in edit mode.
 *
 * @see Story 2.2: Profile Settings Page
 */

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await getProfile()
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
        return
      }
      setProfile(data)
      setIsLoading(false)
    }
    loadProfile()
  }, [])

  // Handle profile update
  const handleUpdateProfile = async (data: OnboardingInput) => {
    startTransition(async () => {
      const { data: updatedProfile, error } = await updateProfile(data)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Profile updated successfully')
      setProfile(updatedProfile)
      setIsEditing(false)
    })
  }

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false)
  }

  // Get experience level label
  const getExperienceLevelLabel = (level: string) => {
    const found = EXPERIENCE_LEVELS.find((l) => l.id === level)
    return found?.label || level
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6" data-testid="settings-page">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // No profile state (shouldn't happen if user completed onboarding)
  if (!profile) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6" data-testid="settings-page">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Please complete onboarding to set up your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6" data-testid="settings-page">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your experience level and target role help us personalize your resume analysis
            </CardDescription>
          </CardHeader>

          <CardContent data-testid="profile-section">
            {!isEditing ? (
              // Read-only view
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                  <p className="text-base font-medium mt-1">
                    {getExperienceLevelLabel(profile.experienceLevel)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Role</p>
                  <p className="text-base font-medium mt-1">
                    {profile.targetRole === 'Other' ? profile.customRole : profile.targetRole}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsEditing(true)}
                    data-testid="edit-profile-button"
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
            ) : (
              // Edit mode with ProfileForm
              <ProfileForm
                initialData={{
                  experienceLevel: profile.experienceLevel as 'student' | 'career_changer' | 'experienced',
                  targetRole: profile.targetRole,
                  customRole: profile.customRole,
                }}
                onSubmit={handleUpdateProfile}
                onCancel={handleCancel}
                submitLabel="Save Changes"
                showCancel={true}
                isPending={isPending}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

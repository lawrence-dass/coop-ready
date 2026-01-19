'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { onboardingInputSchema } from '@/lib/validations/profile'
import { createClient } from '@/lib/supabase/server'

/**
 * Profile Server Actions
 *
 * Handles user profile operations for onboarding and profile management.
 * Uses ActionResponse pattern for consistent error handling.
 *
 * @see Story 2.1: Onboarding Flow - Experience Level & Target Role
 * @see project-context.md - ActionResponse pattern required for all Server Actions
 */

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

export type UserProfile = {
  id: string
  userId: string
  experienceLevel: string
  targetRole: string
  customRole: string | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Complete onboarding by saving user profile
 * Creates new profile or updates existing one with onboarding_completed=true
 */
export async function completeOnboarding(
  input: z.infer<typeof onboardingInputSchema>
): Promise<ActionResponse<UserProfile>> {
  const parsed = onboardingInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }

  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: { message: 'Not authenticated', code: 'AUTH_ERROR' } }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const profileData = {
      user_id: user.id,
      experience_level: parsed.data.experienceLevel,
      target_role: parsed.data.targetRole,
      custom_role: parsed.data.customRole || null,
      onboarding_completed: true,
    }

    let result

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('[completeOnboarding] Update error:', error)
        return { data: null, error: { message: 'Failed to update profile', code: 'DB_ERROR' } }
      }
      result = data
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('[completeOnboarding] Insert error:', error)
        return { data: null, error: { message: 'Failed to create profile', code: 'DB_ERROR' } }
      }
      result = data
    }

    // Transform snake_case to camelCase at boundary
    const transformedProfile: UserProfile = {
      id: result.id,
      userId: result.user_id,
      experienceLevel: result.experience_level,
      targetRole: result.target_role,
      customRole: result.custom_role,
      onboardingCompleted: result.onboarding_completed,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    }

    // Revalidate dashboard to ensure fresh profile data is displayed
    revalidatePath('/dashboard')

    return { data: transformedProfile, error: null }
  } catch (e) {
    console.error('[completeOnboarding]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

/**
 * Get user profile to check onboarding status
 * Returns null if profile doesn't exist (user hasn't completed onboarding)
 */
export async function getProfile(): Promise<ActionResponse<UserProfile | null>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: { message: 'Not authenticated', code: 'AUTH_ERROR' } }
    }

    // Get profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // Profile doesn't exist - this is OK for new users
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      console.error('[getProfile]', error)
      return { data: null, error: { message: 'Failed to fetch profile', code: 'DB_ERROR' } }
    }

    // Transform snake_case to camelCase at boundary
    const transformedProfile: UserProfile = {
      id: data.id,
      userId: data.user_id,
      experienceLevel: data.experience_level,
      targetRole: data.target_role,
      customRole: data.custom_role,
      onboardingCompleted: data.onboarding_completed,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return { data: transformedProfile, error: null }
  } catch (e) {
    console.error('[getProfile]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

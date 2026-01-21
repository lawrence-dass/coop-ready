/**
 * Supabase Query Functions
 *
 * Centralized database query functions for reusable database operations.
 * Follows project-context.md patterns: transforms snake_case to camelCase at boundary.
 *
 * @see Story 4.5: Experience-Level-Aware Analysis - getUserProfile
 */

import { createClient } from '@/lib/supabase/server'

/**
 * User profile type returned by getUserProfile
 * Minimal type focused on experience-level analysis needs
 */
export type UserProfile = {
  id?: string
  userId?: string
  experienceLevel: string
  targetRole: string | null
  customRole?: string | null
  onboardingCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Fetch user profile with experience level and target role
 *
 * Used during analysis to personalize feedback based on user's experience level.
 * Returns default profile (student level) if profile doesn't exist or on error.
 *
 * @param userId - User ID from auth.users
 * @returns UserProfile with experienceLevel and targetRole (defaults to student/null if not found)
 *
 * @see Story 4.5 AC: 1, 3 - Fetch user profile for experience-aware analysis
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Profile doesn't exist - return default (student level)
    if (error?.code === 'PGRST116' || !data) {
      console.log('[getUserProfile] Profile not found for user, using default (student)')
      return {
        experienceLevel: 'student',
        targetRole: null,
      }
    }

    // Database error - return default and log error
    if (error) {
      console.error('[getUserProfile] Database error:', error)
      return {
        experienceLevel: 'student',
        targetRole: null,
      }
    }

    // Transform snake_case to camelCase at boundary (project-context.md rule)
    return {
      id: data.id,
      userId: data.user_id,
      experienceLevel: data.experience_level ?? 'student',
      targetRole: data.target_role ?? null,
      customRole: data.custom_role,
      onboardingCompleted: data.onboarding_completed,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (e) {
    // Catch-all error handling - return default
    console.error('[getUserProfile] Unexpected error:', e)
    return {
      experienceLevel: 'student',
      targetRole: null,
    }
  }
}

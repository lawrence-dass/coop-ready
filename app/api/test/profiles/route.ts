/**
 * Test API: Profile Management
 *
 * SECURITY: This endpoint should ONLY be available in test/dev environments.
 * Production deployments MUST disable or protect these endpoints.
 *
 * Provides test-only API for creating/deleting profiles during E2E tests.
 * Used by ProfileFactory for test data management.
 *
 * @see tests/support/fixtures/factories/profile-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test API endpoints are not available in production' },
      { status: 404 }
    )
  }

  try {
    const body = await request.json()
    const { userId, experienceLevel, targetRole, customRole, onboardingCompleted } = body

    const supabase = await createClient()

    // Insert profile - RLS policy allows users to insert their own profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        experience_level: experienceLevel,
        target_role: targetRole,
        custom_role: customRole,
        onboarding_completed: onboardingCompleted,
      })
      .select()
      .single()

    if (error) {
      console.error('[Test API] Profile creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create profile', details: error.message },
        { status: 500 }
      )
    }

    // Transform to camelCase for response
    const profile = {
      id: data.id,
      userId: data.user_id,
      experienceLevel: data.experience_level,
      targetRole: data.target_role,
      customRole: data.custom_role,
      onboardingCompleted: data.onboarding_completed,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('[Test API] Profile POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

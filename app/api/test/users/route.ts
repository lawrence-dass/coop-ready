/**
 * Test API: User Management
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for creating users during E2E tests.
 * Creates both Supabase Auth user and user profile in a single operation.
 * Used by UserFactory for test data management.
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see tests/support/fixtures/factories/user-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createTestUserSchema } from '@/lib/validations/test-endpoints'

export async function POST(request: NextRequest) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/users in production')
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Test API endpoints are not available in production', code: 'FORBIDDEN' },
      },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    // Validate input with Zod
    const parsed = createTestUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    const { email, password, experienceLevel } = parsed.data

    // Use service role client for admin privileges
    const supabase = createServiceRoleClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for test users
    })

    if (authError) {
      console.error('[Test API] User creation error:', authError)

      // Handle duplicate email error
      if (authError.message?.includes('already registered')) {
        return NextResponse.json(
          {
            data: null,
            error: { message: 'User with this email already exists', code: 'DUPLICATE_EMAIL' },
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to create user', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        experience_level: experienceLevel,
        target_role: 'Software Engineer', // Default for test users
        onboarding_completed: true, // Mark as completed for tests
      })
      .select()
      .single()

    if (profileError) {
      console.error('[Test API] Profile creation error:', profileError)

      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to create user profile', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Return response following ActionResponse<T> pattern
    return NextResponse.json(
      {
        data: {
          userId: authData.user.id,
          email: authData.user.email,
          experienceLevel: profileData.experience_level,
        },
        error: null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Test API] User POST error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

/**
 * Test API: User Deletion
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for deleting users during E2E test cleanup.
 * Deletes both user profile and Supabase Auth user (cascade handles profile).
 * Used by UserFactory.cleanup() method.
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see tests/support/fixtures/factories/user-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/users/:id DELETE in production')
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Test API endpoints are not available in production', code: 'FORBIDDEN' },
      },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Invalid user ID format', code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Use service role client for admin privileges
    const supabase = createServiceRoleClient()

    // Delete auth user (cascade will delete profile due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('[Test API] User deletion error:', deleteError)

      // Check if user not found
      if (deleteError.message?.includes('not found')) {
        return NextResponse.json(
          {
            data: null,
            error: { message: 'User not found', code: 'NOT_FOUND' },
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to delete user', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Return success response following ActionResponse<T> pattern
    return NextResponse.json(
      {
        data: { success: true },
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Test API] User DELETE error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

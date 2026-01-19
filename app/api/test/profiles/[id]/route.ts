/**
 * Test API: Profile Deletion
 *
 * SECURITY: This endpoint should ONLY be available in test/dev environments.
 * Production deployments MUST disable or protect these endpoints.
 *
 * Provides test-only API for deleting profiles during E2E test cleanup.
 * Used by ProfileFactory.cleanup() method.
 *
 * @see tests/support/fixtures/factories/profile-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test API endpoints are not available in production' },
      { status: 404 }
    )
  }

  try {
    const { id } = await params

    const supabase = await createClient()

    // Delete profile by ID - Note: This uses anon key, may fail if RLS restricts deletion
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Test API] Profile deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Test API] Profile DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

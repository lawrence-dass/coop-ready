/**
 * Test API: Resume Deletion
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for deleting resumes during E2E test cleanup.
 * Deletes both file from Supabase Storage and database record.
 * Used by ResumeFactory.cleanup() method.
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see tests/support/fixtures/factories/resume-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/resumes/:id DELETE in production')
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
          error: { message: 'Invalid resume ID format', code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Use service role client for admin privileges
    const supabase = createServiceRoleClient()

    // Get resume record to find file path
    const { data: resumeData, error: fetchError } = await supabase
      .from('resumes')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError || !resumeData) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Resume not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      )
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('resume-uploads')
      .remove([resumeData.file_path])

    if (storageError) {
      console.error('[Test API] Resume file deletion error:', storageError)
      // Continue with DB deletion even if file deletion fails (file might already be gone)
    }

    // Delete resume database record
    const { error: deleteError } = await supabase.from('resumes').delete().eq('id', id)

    if (deleteError) {
      console.error('[Test API] Resume deletion error:', deleteError)
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to delete resume', code: 'INTERNAL_ERROR' },
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
    console.error('[Test API] Resume DELETE error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
        },
      { status: 500 }
    )
  }
}

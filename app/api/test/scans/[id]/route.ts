/**
 * Test API: Scan Deletion
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for deleting scans during E2E test cleanup.
 * Deletes scan database record.
 * Used by ScanFactory.cleanup() method.
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see tests/support/fixtures/factories/scan-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/scans/:id DELETE in production')
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
          error: { message: 'Invalid scan ID format', code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Use service role client for admin privileges
    const supabase = createServiceRoleClient()

    // Delete scan database record
    const { data: deleteData, error: deleteError } = await supabase
      .from('scans')
      .delete()
      .eq('id', id)
      .select()

    if (deleteError) {
      console.error('[Test API] Scan deletion error:', deleteError)
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to delete scan', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    if (!deleteData || deleteData.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Scan not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
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
    console.error('[Test API] Scan DELETE error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

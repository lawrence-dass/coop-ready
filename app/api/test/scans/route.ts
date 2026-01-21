/**
 * Test API: Scan Management
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for creating scans during E2E tests.
 * Creates scan database record with job description.
 * Used by ScanFactory for test data management.
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see tests/support/fixtures/factories/scan-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createTestScanSchema } from '@/lib/validations/test-endpoints'

export async function POST(request: NextRequest) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/scans in production')
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
    const parsed = createTestScanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    const { userId, resumeId, jobDescription } = parsed.data

    // Use service role client for admin privileges (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Verify user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'User not found', code: 'MISSING_USER' },
        },
        { status: 400 }
      )
    }

    // Verify resume exists
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', resumeId)
      .single()

    if (resumeError || !resumeData) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Resume not found', code: 'MISSING_RESUME' },
        },
        { status: 400 }
      )
    }

    // Create scan database record
    const { data: scanData, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        job_description: jobDescription,
        status: 'pending',
      })
      .select()
      .single()

    if (scanError) {
      console.error('[Test API] Scan creation error:', scanError)
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to create scan', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Return response following ActionResponse<T> pattern
    return NextResponse.json(
      {
        data: {
          scanId: scanData.id,
          userId: scanData.user_id,
          resumeId: scanData.resume_id,
          createdAt: scanData.created_at,
        },
        error: null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Test API] Scan POST error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

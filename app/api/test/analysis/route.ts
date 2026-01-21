/**
 * Test API: Analysis Endpoint
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for running ATS analysis during E2E tests.
 * Wraps the runAnalysis Server Action for testability.
 *
 * @see Story 4.2: ATS Score Calculation
 * @see tests/e2e/analysis-flow.spec.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAnalysis } from '@/actions/analysis'
import { z } from 'zod'

const analysisRequestSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID format'),
})

export async function POST(request: NextRequest) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/analysis in production')
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
    const parsed = analysisRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Verify user is authenticated (test must be logged in)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        },
        { status: 401 }
      )
    }

    // Call the Server Action
    const result = await runAnalysis({ scanId: parsed.data.scanId })

    // Return the result from the Server Action
    if (result.error) {
      return NextResponse.json(
        {
          data: null,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        data: result.data,
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Test API] Analysis POST error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

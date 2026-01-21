/**
 * Test API: Suggestions Management
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for creating and querying suggestions during E2E tests.
 * Used for verifying database persistence and RLS policies.
 *
 * @see Story 5.1: Bullet Point Rewrite Generation
 * @see tests/e2e/bullet-point-rewrites.spec.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  createTestSuggestionSchema,
  queryTestSuggestionsSchema,
} from '@/lib/validations/test-endpoints'

/**
 * GET /api/test/suggestions?scanId=<uuid>
 *
 * Query suggestions for a specific scan.
 * Uses service role to bypass RLS for test verification.
 */
export async function GET(request: NextRequest) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/suggestions in production')
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Test API endpoints are not available in production', code: 'FORBIDDEN' },
      },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    // Validate input
    const parsed = queryTestSuggestionsSchema.safeParse({ scanId })
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Use service role client for admin privileges (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Query suggestions for the scan
    const { data: suggestions, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('scan_id', parsed.data.scanId)
      .order('item_index', { ascending: true })

    if (error) {
      console.error('[Test API] Suggestions query error:', error)
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to query suggestions', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Transform to camelCase for API response
    const transformedSuggestions = suggestions.map((s) => ({
      id: s.id,
      scanId: s.scan_id,
      section: s.section,
      itemIndex: s.item_index,
      suggestionType: s.suggestion_type,
      originalText: s.original_text,
      suggestedText: s.suggested_text,
      reasoning: s.reasoning,
      status: s.status,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }))

    return NextResponse.json(
      {
        data: {
          suggestions: transformedSuggestions,
          count: suggestions.length,
        },
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Test API] Suggestions GET error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/test/suggestions
 *
 * Create a suggestion directly in database for testing.
 * Uses service role to bypass RLS.
 */
export async function POST(request: NextRequest) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/suggestions in production')
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

    // Validate input
    const parsed = createTestSuggestionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Use service role client for admin privileges (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Verify scan exists
    const { data: scanData, error: scanError } = await supabase
      .from('scans')
      .select('id')
      .eq('id', parsed.data.scanId)
      .single()

    if (scanError || !scanData) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Scan not found', code: 'MISSING_SCAN' },
        },
        { status: 400 }
      )
    }

    // Create suggestion
    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .insert({
        scan_id: parsed.data.scanId,
        section: parsed.data.section,
        item_index: parsed.data.itemIndex,
        suggestion_type: parsed.data.suggestionType,
        original_text: parsed.data.originalText,
        suggested_text: parsed.data.suggestedText,
        reasoning: parsed.data.reasoning || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[Test API] Suggestion creation error:', error)
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to create suggestion', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        data: {
          suggestionId: suggestion.id,
          scanId: suggestion.scan_id,
          section: suggestion.section,
          status: suggestion.status,
        },
        error: null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Test API] Suggestions POST error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

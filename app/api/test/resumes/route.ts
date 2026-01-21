/**
 * Test API: Resume Management
 *
 * SECURITY: This endpoint is ONLY available in test/development environments.
 * Production deployments automatically disable these endpoints.
 *
 * Provides test-only API for creating resumes during E2E tests.
 * Creates both file in Supabase Storage and database record.
 * Used by ResumeFactory for test data management.
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see tests/support/fixtures/factories/resume-factory.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createTestResumeSchema } from '@/lib/validations/test-endpoints'

export async function POST(request: NextRequest) {
  // Environment gating - only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Test API] Attempted access to /api/test/resumes in production')
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
    const parsed = createTestResumeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    const { userId, fileName, textContent } = parsed.data

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

    // Create file in Supabase Storage
    const filePath = `${userId}/${fileName}`
    const fileBlob = new Blob([textContent], { type: 'text/plain' })

    const { error: uploadError } = await supabase.storage
      .from('resume-uploads')
      .upload(filePath, fileBlob, {
        contentType: 'application/pdf', // Fake as PDF for test purposes
        upsert: false,
      })

    if (uploadError) {
      console.error('[Test API] Resume upload error:', uploadError)
      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to upload resume file', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Get public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from('resume-uploads').getPublicUrl(filePath)

    // Create resume database record
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
        file_type: 'pdf', // Fake as PDF for test purposes
        file_size: textContent.length,
        extracted_text: textContent, // Store text content from migration 004
      })
      .select()
      .single()

    if (resumeError) {
      console.error('[Test API] Resume creation error:', resumeError)

      // Cleanup: delete uploaded file if DB insert fails
      await supabase.storage.from('resume-uploads').remove([filePath])

      return NextResponse.json(
        {
          data: null,
          error: { message: 'Failed to create resume record', code: 'INTERNAL_ERROR' },
        },
        { status: 500 }
      )
    }

    // Return response following ActionResponse<T> pattern
    return NextResponse.json(
      {
        data: {
          resumeId: resumeData.id,
          fileName: resumeData.file_name,
          fileUrl: publicUrl,
          userId: resumeData.user_id,
        },
        error: null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Test API] Resume POST error:', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

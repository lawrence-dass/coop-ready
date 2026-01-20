/**
 * API Route: Parse Resume Section
 * Story: 3.3 Resume Section Parsing
 *
 * Supports two modes:
 * 1. Direct parsing: Pass extractedText to parse directly (for E2E testing)
 * 2. Database parsing: Pass resumeId to parse from stored extracted text
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseResumeSection } from '@/actions/resume'
import { parseResumeText } from '@/lib/parsers/resume'
import { parsedResumeSchema } from '@/lib/parsers/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeId, extractedText } = body.data || {}

    // Mode 1: Direct parsing with extractedText (for E2E tests)
    if (extractedText) {
      try {
        const parsed = parseResumeText(extractedText)
        const validation = parsedResumeSchema.safeParse(parsed)

        if (!validation.success) {
          return NextResponse.json({
            data: {
              ...parsed,
              parsingStatus: 'failed',
              parsingError: 'Validation failed',
            },
            error: null,
          })
        }

        return NextResponse.json({
          data: {
            ...validation.data,
            parsingStatus: 'completed',
          },
          error: null,
        })
      } catch (error) {
        const err = error as Error
        console.error('[API /api/resumes/parse-section] Direct parsing error:', err)
        return NextResponse.json({
          data: {
            contact: '',
            summary: '',
            experience: [],
            education: [],
            skills: [],
            projects: '',
            other: '',
            parsingStatus: 'failed',
            parsingError: err.message || 'Parsing failed',
          },
          error: null,
        })
      }
    }

    // Mode 2: Database parsing with resumeId
    if (!resumeId) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'resumeId or extractedText is required', code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      )
    }

    // Call the Server Action
    const result = await parseResumeSection(resumeId)

    if (result.error) {
      return NextResponse.json(result, { status: 400 })
    }

    // Add parsing status to response for E2E tests
    return NextResponse.json({
      data: {
        ...result.data,
        parsingStatus: 'completed',
      },
      error: null,
    })
  } catch (error) {
    console.error('[API /api/resumes/parse-section]', error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}

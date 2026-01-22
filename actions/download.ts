'use server'

/**
 * Download Server Actions
 * Handles download validation and analytics tracking
 * Story 6.4: Download UI & Format Selection
 */

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

/**
 * Input validation for trackDownload
 */
const trackDownloadSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID'),
  format: z.enum(['pdf', 'docx']),
})

/**
 * Track download in database
 * Updates scans table with download timestamp and format
 *
 * @param input - Contains scanId and format
 * @returns Download tracking info, or error
 */
export async function trackDownload(input: {
  scanId: string
  format: 'pdf' | 'docx'
}): Promise<ActionResponse<{
  downloadedAt: string
  format: string
}>> {
  // Validate input
  const parsed = trackDownloadSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
      },
    }
  }

  const { scanId, format } = parsed.data

  try {
    const supabase = await createClient()

    // Get current user for authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        data: null,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      }
    }

    // Verify user owns this scan and update download metadata
    const now = new Date().toISOString()

    // First fetch current download_count to increment
    const { data: currentScan, error: fetchError } = await supabase
      .from('scans')
      .select('id, download_count')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !currentScan) {
      console.error('[trackDownload] Scan fetch error:', fetchError)
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // Update with incremented download_count
    const { data: scan, error: updateError } = await supabase
      .from('scans')
      .update({
        downloaded_at: now,
        download_format: format,
        download_count: (currentScan.download_count || 0) + 1,
      })
      .eq('id', scanId)
      .eq('user_id', user.id)
      .select('id, downloaded_at, download_format, download_count')
      .single()

    if (updateError || !scan) {
      console.error('[trackDownload] Update error:', updateError)
      return {
        data: null,
        error: {
          message: 'Failed to track download',
          code: 'DATABASE_ERROR',
        },
      }
    }

    return {
      data: {
        downloadedAt: scan.downloaded_at || now,
        format: scan.download_format || format,
      },
      error: null,
    }
  } catch (error) {
    console.error('[trackDownload] Unexpected error:', error)
    return {
      data: null,
      error: {
        message: 'Failed to track download',
        code: 'INTERNAL_ERROR',
      },
    }
  }
}

/**
 * Input validation for validateDownloadAccess
 */
const validateDownloadAccessSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID'),
})

/**
 * Validate user can download this scan
 * Checks ownership and whether any suggestions were accepted
 *
 * @param input - Contains scanId
 * @returns Validation result with access info, or error
 */
export async function validateDownloadAccess(input: {
  scanId: string
}): Promise<ActionResponse<{
  canDownload: boolean
  hasAcceptedSuggestions: boolean
  userName: string
}>> {
  // Validate input
  const parsed = validateDownloadAccessSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
      },
    }
  }

  const { scanId } = parsed.data

  try {
    const supabase = await createClient()

    // Get current user for authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        data: null,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      }
    }

    // Fetch scan to verify ownership
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, user_id, resume_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('[validateDownloadAccess] Scan fetch error:', scanError)
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // Verify user owns this scan
    if (scan.user_id !== user.id) {
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // Fetch user profile for name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[validateDownloadAccess] Profile fetch error:', profileError)
      // Not critical - continue with email as fallback
    }

    const userName = profile?.full_name || user.email?.split('@')[0] || 'User'

    // Check if any suggestions were accepted
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('suggestions')
      .select('status')
      .eq('scan_id', scanId)
      .eq('status', 'accepted')

    if (suggestionsError) {
      console.error('[validateDownloadAccess] Suggestions fetch error:', suggestionsError)
      // Not critical - continue assuming no accepted suggestions
    }

    const hasAcceptedSuggestions = (suggestions || []).length > 0

    return {
      data: {
        canDownload: true,
        hasAcceptedSuggestions,
        userName,
      },
      error: null,
    }
  } catch (error) {
    console.error('[validateDownloadAccess] Unexpected error:', error)
    return {
      data: null,
      error: {
        message: 'Failed to validate download access',
        code: 'INTERNAL_ERROR',
      },
    }
  }
}

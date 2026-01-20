'use server'

import { revalidatePath } from 'next/cache'
import { resumeFileSchema, getFileExtension } from '@/lib/validations/resume'
import { createClient } from '@/lib/supabase/server'
import { extractResumeText } from '@/lib/parsers/extraction'
import { parseResumeText } from '@/lib/parsers/resume'
import { parsedResumeSchema, type ParsedResume } from '@/lib/parsers/types'

/**
 * Resume Server Actions
 *
 * Handles resume upload, validation, and storage operations.
 * Uses ActionResponse pattern for consistent error handling.
 *
 * @see Story 3.1: Resume Upload with Validation
 * @see project-context.md - ActionResponse pattern required for all Server Actions
 */

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

export type ResumeData = {
  id: string
  userId: string
  filePath: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
  extractedText: string | null
  extractionStatus: 'pending' | 'completed' | 'failed'
  extractionError: string | null
  parsedSections: ParsedResume | null
  parsingStatus: 'pending' | 'completed' | 'failed'
  parsingError: string | null
}

/**
 * Upload resume file to Supabase Storage and create database record
 *
 * Process:
 * 1. Validate user authentication
 * 2. Validate file on server-side (type + size)
 * 3. Upload to Supabase Storage with unique filename
 * 4. Create resume record in database
 * 5. Return resume data
 */
export async function uploadResume(formData: FormData): Promise<ActionResponse<ResumeData>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: { message: 'Not authenticated', code: 'AUTH_ERROR' } }
    }

    // Extract file from FormData
    const file = formData.get('file') as File | null
    if (!file) {
      return { data: null, error: { message: 'No file provided', code: 'VALIDATION_ERROR' } }
    }

    // Server-side validation (re-validate even though client did it)
    const validation = resumeFileSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return { data: null, error: { message: firstError.message, code: 'VALIDATION_ERROR' } }
    }

    // Generate unique filename: {user_id}/{timestamp}-{originalFilename}
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.id}/${timestamp}-${sanitizedFilename}`
    const fileExtension = getFileExtension(file.name)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resume-uploads')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[uploadResume] Storage upload error:', uploadError)

      // Handle specific storage errors
      if (uploadError.message.includes('row-level security')) {
        return { data: null, error: { message: 'Upload permission denied', code: 'PERMISSION_ERROR' } }
      }
      if (uploadError.message.includes('size')) {
        return { data: null, error: { message: 'File size exceeds limit', code: 'FILE_TOO_LARGE' } }
      }

      return { data: null, error: { message: 'Failed to upload file', code: 'STORAGE_ERROR' } }
    }

    // Create resume record in database with initial extraction_status='pending'
    const { data: resumeRecord, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        file_path: uploadData.path,
        file_name: file.name,
        file_type: fileExtension,
        file_size: file.size,
        extraction_status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[uploadResume] Database error:', dbError)

      // Cleanup: Delete uploaded file if DB insert fails
      await supabase.storage.from('resume-uploads').remove([uploadData.path])

      return { data: null, error: { message: 'Failed to save resume record', code: 'DB_ERROR' } }
    }

    // Attempt text extraction (non-blocking - upload succeeds even if extraction fails)
    let extractedText: string | null = null
    let extractionStatus: 'pending' | 'completed' | 'failed' = 'pending'
    let extractionError: string | null = null

    try {
      // Download file from storage to extract text
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('resume-uploads')
        .download(uploadData.path)

      if (downloadError) {
        throw new Error('Failed to download file for extraction')
      }

      // Convert Blob to Buffer for extraction
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Extract text using appropriate parser
      extractedText = await extractResumeText(buffer, fileExtension)
      extractionStatus = 'completed'

      console.log('[uploadResume] Text extraction successful:', extractedText.length, 'characters')
    } catch (error) {
      const err = error as Error
      console.error('[uploadResume] Text extraction failed:', err)

      // Set extraction status to failed with error message
      extractionStatus = 'failed'
      extractionError = err.message || 'Unable to extract text from file'

      // Upload should still succeed even if extraction fails
      // User can re-upload or handle extraction failure separately
    }

    // Attempt resume parsing (non-blocking - extraction succeeds even if parsing fails)
    let parsedSections: ParsedResume | null = null
    let parsingStatus: 'pending' | 'completed' | 'failed' = 'pending'
    let parsingError: string | null = null

    if (extractionStatus === 'completed' && extractedText) {
      try {
        // Parse extracted text into structured sections
        const parsed = parseResumeText(extractedText)

        // Validate parsed output with Zod schema
        const validation = parsedResumeSchema.safeParse(parsed)

        if (validation.success) {
          parsedSections = validation.data
          parsingStatus = 'completed'
          console.log('[uploadResume] Resume parsing successful')
        } else {
          throw new Error('Parsed data validation failed')
        }
      } catch (error) {
        const err = error as Error
        console.error('[uploadResume] Resume parsing failed:', err)

        // Set parsing status to failed with error message
        parsingStatus = 'failed'
        parsingError = err.message || 'Unable to parse resume sections'

        // Extraction still succeeded - parsing failure is non-blocking
      }
    }

    // Update resume record with extraction and parsing results
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        extracted_text: extractedText,
        extraction_status: extractionStatus,
        extraction_error: extractionError,
        parsed_sections: parsedSections,
        parsing_status: parsingStatus,
        parsing_error: parsingError,
      })
      .eq('id', resumeRecord.id)

    if (updateError) {
      console.error('[uploadResume] Failed to update extraction/parsing results:', updateError)
      // Continue anyway - upload succeeded
    }

    // Transform snake_case to camelCase at boundary
    const transformedResume: ResumeData = {
      id: resumeRecord.id,
      userId: resumeRecord.user_id,
      filePath: resumeRecord.file_path,
      fileName: resumeRecord.file_name,
      fileType: resumeRecord.file_type,
      fileSize: resumeRecord.file_size,
      createdAt: resumeRecord.created_at,
      extractedText: extractedText,
      extractionStatus: extractionStatus,
      extractionError: extractionError,
      parsedSections: parsedSections,
      parsingStatus: parsingStatus,
      parsingError: parsingError,
    }

    // Revalidate scan page to show updated resume
    revalidatePath('/scan/new')

    return { data: transformedResume, error: null }
  } catch (e) {
    console.error('[uploadResume]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

/**
 * Parse resume sections from extracted text
 *
 * Can be called separately to retry parsing if needed.
 * Requires that text extraction has already completed.
 */
export async function parseResumeSection(resumeId: string): Promise<ActionResponse<ParsedResume>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: { message: 'Not authenticated', code: 'AUTH_ERROR' } }
    }

    // Get resume record to verify ownership and get extracted text
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('id, user_id, extracted_text, extraction_status')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      return { data: null, error: { message: 'Resume not found', code: 'NOT_FOUND' } }
    }

    // Verify ownership
    if (resume.user_id !== user.id) {
      return { data: null, error: { message: 'Permission denied', code: 'PERMISSION_ERROR' } }
    }

    // Check if extraction completed
    if (resume.extraction_status !== 'completed' || !resume.extracted_text) {
      return {
        data: null,
        error: {
          message: 'Text extraction must complete before parsing',
          code: 'EXTRACTION_REQUIRED',
        },
      }
    }

    // Parse the extracted text
    try {
      const parsed = parseResumeText(resume.extracted_text)

      // Validate parsed output
      const validation = parsedResumeSchema.safeParse(parsed)

      if (!validation.success) {
        console.error('[parseResumeSection] Validation failed:', validation.error)

        // Update status to failed
        await supabase
          .from('resumes')
          .update({
            parsing_status: 'failed',
            parsing_error: 'Parsed data validation failed',
          })
          .eq('id', resumeId)

        return {
          data: null,
          error: { message: 'Failed to validate parsed resume', code: 'VALIDATION_ERROR' },
        }
      }

      // Update resume record with parsed sections
      const { error: updateError } = await supabase
        .from('resumes')
        .update({
          parsed_sections: validation.data,
          parsing_status: 'completed',
          parsing_error: null,
        })
        .eq('id', resumeId)

      if (updateError) {
        console.error('[parseResumeSection] Failed to update resume:', updateError)
        return { data: null, error: { message: 'Failed to save parsed sections', code: 'DB_ERROR' } }
      }

      revalidatePath('/scan/new')

      return { data: validation.data, error: null }
    } catch (error) {
      const err = error as Error
      console.error('[parseResumeSection] Parsing error:', err)

      // Update status to failed
      await supabase
        .from('resumes')
        .update({
          parsing_status: 'failed',
          parsing_error: err.message || 'Unable to parse resume sections',
        })
        .eq('id', resumeId)

      return { data: null, error: { message: 'Failed to parse resume', code: 'PARSING_ERROR' } }
    }
  } catch (e) {
    console.error('[parseResumeSection]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

/**
 * Delete resume file and database record
 */
export async function deleteResume(resumeId: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: { message: 'Not authenticated', code: 'AUTH_ERROR' } }
    }

    // Get resume record to verify ownership and get file path
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('file_path, user_id')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      return { data: null, error: { message: 'Resume not found', code: 'NOT_FOUND' } }
    }

    // Verify ownership (extra security check - RLS should prevent this)
    if (resume.user_id !== user.id) {
      return { data: null, error: { message: 'Permission denied', code: 'PERMISSION_ERROR' } }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('resume-uploads')
      .remove([resume.file_path])

    if (storageError) {
      console.error('[deleteResume] Storage error:', storageError)
      // Continue with DB deletion even if storage fails
    }

    // Delete database record (RLS ensures user can only delete own records)
    const { error: dbError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)

    if (dbError) {
      console.error('[deleteResume] Database error:', dbError)
      return { data: null, error: { message: 'Failed to delete resume', code: 'DB_ERROR' } }
    }

    // Revalidate scan page
    revalidatePath('/scan/new')

    return { data: { success: true }, error: null }
  } catch (e) {
    console.error('[deleteResume]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

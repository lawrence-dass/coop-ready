'use server'

import { revalidatePath } from 'next/cache'
import { resumeFileSchema, getFileExtension } from '@/lib/validations/resume'
import { createClient } from '@/lib/supabase/server'
import { extractResumeText } from '@/lib/parsers/extraction'

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

    // Update resume record with extraction results
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        extracted_text: extractedText,
        extraction_status: extractionStatus,
        extraction_error: extractionError,
      })
      .eq('id', resumeRecord.id)

    if (updateError) {
      console.error('[uploadResume] Failed to update extraction results:', updateError)
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

import { z } from 'zod'

// File validation constants
export const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx'] as const
export const MAX_FILE_SIZE = 2097152 // 2MB in bytes

/**
 * Validates resume file upload
 * - Type: PDF or DOCX only
 * - Size: Max 2MB
 */
export const resumeFileSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z.number()
    .max(MAX_FILE_SIZE, 'File size must be under 2MB')
    .positive('File size must be greater than 0'),
  type: z.enum(ALLOWED_FILE_TYPES, {
    message: 'Please upload a PDF or DOCX file'
  })
})

export type ResumeFileValidation = z.infer<typeof resumeFileSchema>

/**
 * Helper function to validate file extension
 */
export function isValidFileExtension(filename: string): boolean {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  return ALLOWED_FILE_EXTENSIONS.includes(extension as typeof ALLOWED_FILE_EXTENSIONS[number])
}

/**
 * Helper function to get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf('.') + 1)
}

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

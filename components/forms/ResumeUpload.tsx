'use client'

import { useState, useRef, useCallback, ChangeEvent, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { resumeFileSchema, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE, formatFileSize } from '@/lib/validations/resume'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

/**
 * Resume Upload Component with Drag & Drop
 *
 * Handles file validation, drag-drop, and upload progress display.
 * Validates files client-side before allowing upload.
 *
 * @see Story 3.1: Resume Upload with Validation
 */

export interface ResumeUploadProps {
  /** Callback when file is selected and validated */
  onFileSelect: (file: File) => void
  /** Upload progress (0-100) */
  uploadProgress?: number
  /** Whether upload is in progress */
  isUploading?: boolean
  /** Current uploaded file info */
  uploadedFile?: {
    fileName: string
    fileSize: number
  } | null
  /** Callback to remove/clear file */
  onRemove: () => void
  /** Validation error message */
  error?: string | null
}

export function ResumeUpload({
  onFileSelect,
  uploadProgress = 0,
  isUploading = false,
  uploadedFile = null,
  onRemove,
  error = null,
}: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Combine external error and local validation error
  const displayError = error || validationError

  const validateFile = useCallback((file: File): string | null => {
    // Validate using Zod schema
    const validation = resumeFileSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return firstError.message
    }

    return null
  }, [])

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return

    setValidationError(null)
    const error = validateFile(file)

    if (error) {
      setValidationError(error)
      return
    }

    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove()
  }

  // If file is uploaded, show file display
  if (uploadedFile) {
    return (
      <div className="space-y-2" data-testid="resume-upload">
        <Label>Resume</Label>
        <div
          className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
          data-testid="file-display"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-sm">{uploadedFile.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.fileSize)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              data-testid="remove-button"
              className="hover:bg-green-100"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show upload zone
  return (
    <div className="space-y-2" data-testid="resume-upload">
      <Label>Upload Resume</Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="hidden"
        data-testid="file-input"
        disabled={isUploading}
      />

      {/* Drag and drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!isUploading ? handleBrowseClick : undefined}
        data-testid="upload-zone"
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Uploading...</p>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                      data-testid="progress-indicator"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag and drop your resume
              </p>
              <p className="text-xs text-muted-foreground">
                or{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBrowseClick()
                  }}
                  data-testid="browse-button"
                >
                  browse files
                </Button>
              </p>
            </div>
          </div>
        )}

        {/* Accepted formats */}
        <p className="text-xs text-muted-foreground mt-4">
          Accepted formats: PDF, DOCX • Max size: {formatFileSize(MAX_FILE_SIZE)}
        </p>
      </div>

      {/* Validation error */}
      {displayError && (
        <p className="text-sm text-red-500" data-testid="error-message">
          {displayError}
        </p>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResumeUpload } from '@/components/forms/ResumeUpload'
import { uploadResume, ResumeData } from '@/actions/resume'
import { toast } from 'sonner'

/**
 * New Scan Page
 *
 * Allows users to upload their resume for ATS analysis.
 * Integrates ResumeUpload component with uploadResume Server Action.
 *
 * @see Story 3.1: Resume Upload with Validation
 */

export default function NewScanPage() {
  const [isPending, startTransition] = useTransition()
  const [uploadedResume, setUploadedResume] = useState<ResumeData | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setUploadError(null)
    setUploadProgress(0)

    // Create FormData for Server Action
    const formData = new FormData()
    formData.append('file', file)

    // Simulate upload progress (actual upload happens in Server Action)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    startTransition(async () => {
      try {
        const { data, error } = await uploadResume(formData)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (error) {
          setUploadError(error.message)
          toast.error(error.message)
          setUploadProgress(0)
          return
        }

        toast.success('Resume uploaded successfully')
        setUploadedResume(data)
        setUploadProgress(0)
      } catch (e) {
        clearInterval(progressInterval)
        setUploadProgress(0)
        const errorMessage = 'Upload failed. Please try again.'
        setUploadError(errorMessage)
        toast.error(errorMessage)
        console.error('[NewScanPage] Upload error:', e)
      }
    })
  }

  const handleRemove = () => {
    setUploadedResume(null)
    setUploadError(null)
    setUploadProgress(0)
    // Note: We don't delete from database here, just clear the UI
    // User can upload a new file to replace it
  }

  return (
    <div className="space-y-6" data-testid="scan-new-page">
      <h1 className="text-3xl font-bold">New Scan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume & Job Description</CardTitle>
          <CardDescription>
            Get instant ATS feedback and optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="resume-section">
            <ResumeUpload
              onFileSelect={handleFileSelect}
              uploadProgress={uploadProgress}
              isUploading={isPending}
              uploadedFile={uploadedResume ? {
                fileName: uploadedResume.fileName,
                fileSize: uploadedResume.fileSize,
              } : null}
              onRemove={handleRemove}
              error={uploadError}
            />

            {/* Job description input will be added in a future story */}
            {uploadedResume && (
              <p className="text-sm text-muted-foreground">
                Job description input will be available in the next update.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

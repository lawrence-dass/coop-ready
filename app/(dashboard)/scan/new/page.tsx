'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResumeUpload } from '@/components/forms/ResumeUpload'
import { ResumePreview } from '@/components/analysis/ResumePreview'
import { uploadResume, getResume, ResumeData } from '@/actions/resume'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'

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
  const [isPolling, setIsPolling] = useState(false)

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

        // Show warning if text extraction failed (non-blocking)
        if (data.extractionStatus === 'failed') {
          toast.warning(
            data.extractionError || 'Text extraction failed. You can still proceed with the upload.',
            { duration: 5000 }
          )
        }
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
    setIsPolling(false)
    // Note: We don't delete from database here, just clear the UI
    // User can upload a new file to replace it
  }

  const handleProceed = () => {
    // TODO: Navigate to job description input or analysis page (Story 3.5/3.6)
    toast.info('Job description input coming in next update')
  }

  // Poll for parsing status updates when parsing is pending
  useEffect(() => {
    if (!uploadedResume) return

    // Check if we need to poll (extraction or parsing pending)
    const needsPolling =
      uploadedResume.extractionStatus === 'pending' ||
      (uploadedResume.extractionStatus === 'completed' &&
        uploadedResume.parsingStatus === 'pending')

    if (!needsPolling) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    // Poll every 2 seconds for status updates
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await getResume(uploadedResume.id)

        if (error) {
          // Stop polling on error
          clearInterval(pollInterval)
          setIsPolling(false)
          return
        }

        if (data) {
          // Update state with fresh data
          setUploadedResume(data)

          // Check if processing is complete
          const processingComplete =
            data.extractionStatus !== 'pending' &&
            (data.extractionStatus === 'failed' || data.parsingStatus !== 'pending')

          if (processingComplete) {
            clearInterval(pollInterval)
            setIsPolling(false)
          }
        }
      } catch {
        // Stop polling on unexpected error
        clearInterval(pollInterval)
        setIsPolling(false)
      }
    }, 2000)

    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [uploadedResume])

  // Check if resume is ready to proceed
  const canProceed =
    uploadedResume &&
    uploadedResume.extractionStatus === 'completed' &&
    uploadedResume.parsingStatus === 'completed' &&
    uploadedResume.parsedSections !== null

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

            {/* Resume Preview - shown after upload */}
            {uploadedResume && (
              <div className="space-y-6 mt-8">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Resume Preview</h3>
                  <ResumePreview
                    resume={{
                      id: uploadedResume.id,
                      fileName: uploadedResume.fileName,
                      extractionStatus: uploadedResume.extractionStatus,
                      extractionError: uploadedResume.extractionError,
                      parsingStatus: uploadedResume.parsingStatus,
                      parsingError: uploadedResume.parsingError,
                      parsedSections: uploadedResume.parsedSections,
                    }}
                    isLoading={isPolling}
                    onReupload={handleRemove}
                  />
                </div>

                {/* Proceed Button - shown when resume is ready */}
                {canProceed && (
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleProceed}
                      size="lg"
                      data-testid="proceed-button"
                    >
                      Proceed to Analysis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

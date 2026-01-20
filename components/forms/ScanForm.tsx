'use client'

import { useState, useTransition, useEffect } from 'react'
import { ResumeUpload } from '@/components/forms/ResumeUpload'
import { JDInput } from '@/components/forms/JDInput'
import { KeywordPreview } from '@/components/forms/KeywordPreview'
import { ResumePreview } from '@/components/analysis/ResumePreview'
import { Button } from '@/components/ui/button'
import { uploadResume, getResume, ResumeData } from '@/actions/resume'
import { jobDescriptionSchema } from '@/lib/validations/scan'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'

/**
 * Scan Form Component
 *
 * Combines resume upload and job description input for ATS scan creation.
 * Validates both inputs before allowing scan creation.
 *
 * @see Story 3.5: Job Description Input - AC1-6
 */

export interface ScanFormProps {
  /** Callback when form is successfully submitted */
  onSubmit?: (data: { resumeId: string; jobDescription: string }) => void
}

export function ScanForm({ onSubmit }: ScanFormProps) {
  const [isPending, startTransition] = useTransition()
  const [uploadedResume, setUploadedResume] = useState<ResumeData | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Job description state
  const [jobDescription, setJobDescription] = useState('')
  const [jdError, setJdError] = useState<string | null>(null)

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
        console.error('[ScanForm] Upload error:', e)
      }
    })
  }

  const handleRemove = () => {
    setUploadedResume(null)
    setUploadError(null)
    setUploadProgress(0)
    setIsPolling(false)
  }

  const handleJDChange = (value: string) => {
    setJobDescription(value)
    setJdError(null)

    // Validate on change
    const result = jobDescriptionSchema.safeParse({ jobDescription: value })
    if (!result.success && value.length > 0) {
      setJdError(result.error.issues[0].message)
    }
  }

  const handleStartAnalysis = () => {
    // Validate job description
    const validation = jobDescriptionSchema.safeParse({ jobDescription })
    if (!validation.success) {
      setJdError(validation.error.issues[0].message)
      toast.error('Please fix the validation errors')
      return
    }

    // Check resume
    if (!uploadedResume) {
      toast.error('Please upload a resume first')
      return
    }

    // Call onSubmit callback
    if (onSubmit) {
      onSubmit({
        resumeId: uploadedResume.id,
        jobDescription: jobDescription.trim(),
      })
    } else {
      // Placeholder: would create scan and navigate
      toast.info('Scan creation coming in next update')
    }
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
          clearInterval(pollInterval)
          setIsPolling(false)
          return
        }

        if (data) {
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
        clearInterval(pollInterval)
        setIsPolling(false)
      }
    }, 2000)

    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [uploadedResume])

  // Check if resume is ready
  const isResumeReady =
    uploadedResume &&
    uploadedResume.extractionStatus === 'completed' &&
    uploadedResume.parsingStatus === 'completed' &&
    uploadedResume.parsedSections !== null

  // Check if form is ready to submit
  const canProceed =
    isResumeReady &&
    jobDescription.trim().length > 0 &&
    !jdError

  return (
    <div className="space-y-6" data-testid="scan-form">
      {/* Resume Upload Section */}
      <div data-testid="resume-section">
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
          <div className="mt-6 border-t pt-6">
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
        )}
      </div>

      {/* Job Description Input Section */}
      {uploadedResume && (
        <div className="border-t pt-6" data-testid="jd-section">
          <JDInput
            value={jobDescription}
            onChange={handleJDChange}
            error={jdError}
            disabled={!isResumeReady || isPolling}
          />

          {/* Keyword Preview */}
          {jobDescription.trim().length > 0 && (
            <div className="mt-4">
              <KeywordPreview jobDescription={jobDescription} />
            </div>
          )}
        </div>
      )}

      {/* Start Analysis Button */}
      {uploadedResume && (
        <div className="flex justify-end pt-4" data-testid="submit-section">
          {!canProceed && (
            <p className="text-sm text-muted-foreground mr-4 self-center" data-testid="button-hint">
              {!isResumeReady
                ? 'Processing resume...'
                : jobDescription.trim().length === 0
                ? 'Enter a job description to continue'
                : jdError
                ? 'Fix validation errors to continue'
                : 'Ready to analyze'}
            </p>
          )}
          <Button
            onClick={handleStartAnalysis}
            size="lg"
            disabled={!canProceed}
            data-testid="start-analysis-button"
          >
            Start Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

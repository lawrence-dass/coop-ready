'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResumeUpload } from '@/components/forms/ResumeUpload'
import { JDInput } from '@/components/forms/JDInput'
import { createScan } from '@/actions/scan'
import { uploadResume, getResume, type ResumeData } from '@/actions/resume'
import { jobDescriptionSchema } from '@/lib/validations/scan'
import { toast } from 'sonner'
import { ArrowRight, Loader2 } from 'lucide-react'

/**
 * New Scan Page
 *
 * Integrated page for resume upload and job description input.
 * Two-column responsive layout with resume persistence.
 *
 * @see Story 3.6: New Scan Page Integration
 */

const RESUME_STORAGE_KEY = 'lastUploadedResumeId'

export default function NewScanPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Resume state
  const [uploadedResume, setUploadedResume] = useState<ResumeData | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Job description state
  const [jobDescription, setJobDescription] = useState('')
  const [jdError, setJdError] = useState<string | null>(null)

  // Load persisted resume on mount
  useEffect(() => {
    const loadPersistedResume = async () => {
      try {
        const persistedResumeId = sessionStorage.getItem(RESUME_STORAGE_KEY)
        if (!persistedResumeId) return

        const { data, error } = await getResume(persistedResumeId)
        if (error || !data) {
          // Clear invalid persisted ID
          sessionStorage.removeItem(RESUME_STORAGE_KEY)
          return
        }

        setUploadedResume(data)
      } catch (e) {
        // TODO: Replace with proper logging service when available (see project-context.md)
        if (process.env.NODE_ENV === 'development') {
          console.error('[NewScanPage] Error loading persisted resume:', e)
        }
        sessionStorage.removeItem(RESUME_STORAGE_KEY)
      }
    }

    loadPersistedResume()
  }, [])

  // Handle file selection and upload
  const handleFileSelect = (file: File) => {
    setUploadError(null)
    setUploadProgress(0)
    setIsUploading(true)

    // Create FormData for Server Action
    const formData = new FormData()
    formData.append('file', file)

    // Simulate upload progress
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
          setIsUploading(false)
          return
        }

        toast.success('Resume uploaded successfully')
        setUploadedResume(data)
        setUploadProgress(0)
        setIsUploading(false)

        // Persist resume ID to sessionStorage
        sessionStorage.setItem(RESUME_STORAGE_KEY, data.id)

        // Show warning if text extraction failed (non-blocking)
        if (data.extractionStatus === 'failed') {
          toast.warning(
            data.extractionError || 'Text extraction failed. You can still proceed with the upload.',
            { duration: 5000 }
          )
        }
      } catch (e) {
        // Note: progressInterval already cleared in try block on success/error return
        setUploadProgress(0)
        setIsUploading(false)
        const errorMessage = 'Upload failed. Please try again.'
        setUploadError(errorMessage)
        toast.error(errorMessage)
        // TODO: Replace with proper logging service when available (see project-context.md)
        if (process.env.NODE_ENV === 'development') {
          console.error('[NewScanPage] Upload error:', e)
        }
      }
    })
  }

  // Handle resume removal
  const handleRemove = () => {
    setUploadedResume(null)
    setUploadError(null)
    setUploadProgress(0)
    sessionStorage.removeItem(RESUME_STORAGE_KEY)
  }

  // Handle job description change
  const handleJDChange = (value: string) => {
    setJobDescription(value)
    setJdError(null)

    // Validate on change
    if (value.length > 0) {
      const result = jobDescriptionSchema.safeParse({ jobDescription: value })
      if (!result.success) {
        setJdError(result.error.issues[0].message)
      }
    }
  }

  // Handle scan submission
  const handleSubmit = () => {
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

    // Create scan
    startTransition(async () => {
      const { data, error } = await createScan({
        resumeId: uploadedResume.id,
        jobDescription: jobDescription.trim(),
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Scan created successfully!')
      // Navigate to scan results page
      router.push(`/scan/${data.id}`)
    })
  }

  // Determine form validity
  const isFormValid = uploadedResume !== null && jobDescription.trim().length > 0 && !jdError

  // Determine hint message
  const getHintMessage = (): string => {
    if (!uploadedResume && jobDescription.trim().length === 0) {
      return 'Upload your resume and enter a job description to continue'
    }
    if (!uploadedResume) {
      return 'Upload your resume to continue'
    }
    if (jobDescription.trim().length === 0) {
      return 'Enter a job description to continue'
    }
    if (jdError) {
      return 'Fix validation errors to continue'
    }
    return ''
  }

  return (
    <div className="space-y-6" data-testid="scan-new-page">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Start New Scan</h1>
        <p className="text-muted-foreground mt-2">
          Upload your resume and paste the job description to get instant ATS feedback
        </p>
      </div>

      {/* Two-column Layout */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        data-testid="scan-layout"
      >
        {/* Resume Upload Section (Left/Top) */}
        <Card data-testid="resume-section">
          <CardHeader>
            <CardTitle>Resume</CardTitle>
            <CardDescription>
              Upload your resume in PDF or DOCX format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUpload
              onFileSelect={handleFileSelect}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              uploadedFile={
                uploadedResume
                  ? {
                      fileName: uploadedResume.fileName,
                      fileSize: uploadedResume.fileSize,
                    }
                  : null
              }
              onRemove={handleRemove}
              error={uploadError}
            />
          </CardContent>
        </Card>

        {/* Job Description Section (Right/Bottom) */}
        <Card data-testid="jd-section">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>
              Paste the full job posting for best results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JDInput
              value={jobDescription}
              onChange={handleJDChange}
              error={jdError}
              disabled={isUploading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Start Analysis Button */}
      <div className="flex items-center justify-end gap-4">
        {!isFormValid && (
          <p className="text-sm text-muted-foreground" data-testid="form-hint">
            {getHintMessage()}
          </p>
        )}
        <Button
          onClick={handleSubmit}
          size="lg"
          disabled={!isFormValid || isPending}
          data-testid="start-analysis-button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              Start Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

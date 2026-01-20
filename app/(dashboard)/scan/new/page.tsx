'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScanForm } from '@/components/forms/ScanForm'
import { createScan } from '@/actions/scan'
import { toast } from 'sonner'

/**
 * New Scan Page
 *
 * Allows users to upload their resume and enter job description for ATS analysis.
 * Integrates ScanForm component with createScan Server Action.
 *
 * @see Story 3.1: Resume Upload with Validation
 * @see Story 3.5: Job Description Input
 */

export default function NewScanPage() {
  const [, startTransition] = useTransition()

  const handleScanSubmit = (data: {
    resumeId: string
    jobDescription: string
  }) => {
    startTransition(async () => {
      const { error } = await createScan(data)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Scan created successfully!')
      // TODO: Navigate to scan results page (Epic 4)
      // router.push(`/scan/${scan.id}/results`)
      toast.info('Analysis results page coming in next epic')
    })
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
          <ScanForm onSubmit={handleScanSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}

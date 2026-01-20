'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getScan, type ScanData } from '@/actions/scan'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Scan Results Page
 *
 * Displays scan processing status and will show results when Epic 4 is implemented.
 * Polls for status updates when scan is in pending/processing state.
 *
 * @see Story 3.6: New Scan Page Integration - AC4
 * @see Epic 4: ATS Analysis Engine (future implementation)
 */

// Poll interval in milliseconds (5 seconds)
const POLL_INTERVAL = 5000
// Terminal states that stop polling
const TERMINAL_STATES = ['completed', 'failed'] as const

export default function ScanResultsPage() {
  const params = useParams()
  const scanId = params?.scanId as string | undefined

  const [scan, setScan] = useState<ScanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch scan data
  const fetchScan = useCallback(async (showLoading = false) => {
    if (!scanId) return

    if (showLoading) setIsLoading(true)

    const { data, error: scanError } = await getScan(scanId)

    if (scanError || !data) {
      setError(scanError?.message || 'Failed to load scan')
      setIsLoading(false)
      return
    }

    setScan(data)
    setIsLoading(false)

    // Stop polling if scan reached terminal state
    if (TERMINAL_STATES.includes(data.status as typeof TERMINAL_STATES[number])) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [scanId])

  // Initial load and polling setup
  useEffect(() => {
    if (!scanId) {
      setError('No scan ID provided')
      setIsLoading(false)
      return
    }

    // Initial fetch with loading state
    fetchScan(true)

    // Start polling for status updates
    pollIntervalRef.current = setInterval(() => {
      fetchScan(false)
    }, POLL_INTERVAL)

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [scanId, fetchScan])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-lg font-medium">Analysis in progress</p>
            <p className="text-sm text-muted-foreground">
              Loading your scan results...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error || 'Scan not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Results</h1>
        <p className="text-muted-foreground mt-2">Scan ID: {scan.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicator */}
          {(scan.status === 'pending' || scan.status === 'processing') && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Analysis in progress</p>
                <p className="text-sm text-muted-foreground">
                  Status: {scan.status} (auto-refreshing every 5s)
                </p>
              </div>
            </div>
          )}

          {scan.status === 'completed' && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Analysis Complete</p>
                <p className="text-sm text-muted-foreground">
                  Your scan results are ready
                </p>
              </div>
            </div>
          )}

          {scan.status === 'failed' && (
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Analysis Failed</p>
                <p className="text-sm text-muted-foreground">
                  There was an error processing your scan
                </p>
              </div>
            </div>
          )}

          {(scan.status === 'pending' || scan.status === 'processing') && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">What&apos;s happening:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Extracting keywords from job description</li>
                <li>Analyzing resume structure and content</li>
                <li>Calculating ATS compatibility score</li>
                <li>Generating optimization suggestions</li>
              </ul>
            </div>
          )}

          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
            <p className="text-sm font-medium text-blue-900">
              Coming in Epic 4: ATS Analysis Engine
            </p>
            <p className="text-sm text-blue-700 mt-1">
              This page will display your ATS score, missing keywords,
              section-level breakdown, and optimization suggestions once the
              analysis engine is implemented.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Scan Details (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="font-medium">Scan ID:</dt>
            <dd className="text-muted-foreground">{scan.id}</dd>

            <dt className="font-medium">Resume ID:</dt>
            <dd className="text-muted-foreground">{scan.resumeId}</dd>

            <dt className="font-medium">Status:</dt>
            <dd className="text-muted-foreground">{scan.status}</dd>

            <dt className="font-medium">Created:</dt>
            <dd className="text-muted-foreground">
              {new Date(scan.createdAt).toLocaleString()}
            </dd>

            <dt className="font-medium">JD Length:</dt>
            <dd className="text-muted-foreground">
              {scan.jobDescription.length} characters
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

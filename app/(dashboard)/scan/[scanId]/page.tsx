'use client'

import { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { useScanPolling } from '@/lib/hooks/useScanPolling'
import { ScoreCard } from '@/components/analysis/ScoreCard'
import { SectionBreakdown } from '@/components/analysis/SectionBreakdown'
import { KeywordList } from '@/components/analysis/KeywordList'
import { FormatIssues } from '@/components/analysis/FormatIssues'
import { AnalysisError } from '@/components/analysis/AnalysisError'

/**
 * Scan Results Page
 *
 * Displays comprehensive ATS analysis results including score, keywords,
 * section breakdown, and format issues.
 *
 * @see Story 4.7: Analysis Results Page
 * @see Story 3.6: New Scan Page Integration - AC4 (initial polling)
 */

export default function ScanResultsPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params?.scanId as string | undefined

  // Use polling hook with exponential backoff
  const { scan, isLoading, error } = useScanPolling(scanId)

  // Retry analysis (navigate back to trigger new analysis)
  const handleRetry = useCallback(() => {
    router.push(`/scan/new?resumeId=${scan?.resumeId}`)
  }, [router, scan])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-lg font-medium">Loading analysis results</p>
            <p className="text-sm text-muted-foreground">
              Please wait...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !scan) {
    return (
      <AnalysisError
        scanId={scanId || ''}
        errorMessage={error || 'Scan not found'}
        onRetry={handleRetry}
      />
    )
  }

  // Processing state
  if (scan.status === 'pending' || scan.status === 'processing') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analyzing Your Resume</h1>
          <p className="text-muted-foreground mt-2">Scan ID: {scan.id}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900 text-lg">
                Analysis in progress...
              </p>
              <p className="text-sm text-blue-700">
                This usually takes 10-20 seconds
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mt-4">
            <p className="text-sm font-medium mb-2 text-gray-700">
              What&apos;s happening:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Extracting keywords from job description</li>
              <li>Analyzing resume structure and content</li>
              <li>Calculating ATS compatibility score</li>
              <li>Detecting format issues</li>
              <li>Generating section-level scores</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Failed state
  if (scan.status === 'failed') {
    return (
      <AnalysisError
        scanId={scan.id}
        errorMessage="Analysis failed. This could be due to an unsupported file format or temporary service issues."
        onRetry={handleRetry}
      />
    )
  }

  // Completed state - show results
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/history" className="hover:text-foreground transition-colors">
          Scans
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Results</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Analysis Results</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive ATS analysis for your resume
        </p>
      </div>

      {/* ATS Score Card - above the fold */}
      <ScoreCard
        atsScore={scan.atsScore}
        justification={scan.scoreJustification}
      />

      {/* Section Breakdown */}
      <SectionBreakdown sectionScores={scan.sectionScores} />

      {/* Keywords Analysis */}
      <KeywordList
        keywordsFound={scan.keywordsFound}
        keywordsMissing={scan.keywordsMissing}
      />

      {/* Format Issues */}
      <FormatIssues issues={scan.formatIssues} />

      {/* Experience Context (if available) */}
      {scan.experienceLevelContext && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Analysis Context:
          </p>
          <p className="text-sm">{scan.experienceLevelContext}</p>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        <p>
          Analysis completed on{' '}
          {new Date(scan.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

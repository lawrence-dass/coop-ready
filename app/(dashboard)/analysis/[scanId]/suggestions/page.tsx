import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchSuggestionsBySection, getCalibrationSummary } from '@/lib/supabase/suggestions'
import { SuggestionListClient } from '@/components/analysis/SuggestionListClient'
import { SuggestionsSummary } from '@/components/analysis/SuggestionsSummary'
import { SuggestionsErrorState } from '@/components/analysis/SuggestionsErrorState'
import { CalibrationSummary } from '@/components/analysis/CalibrationSummary'
import Link from 'next/link'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import type { SuggestionMode } from '@/lib/utils/suggestionCalibrator'

interface PageProps {
  params: Promise<{
    scanId: string
  }>
}

/**
 * Suggestions Page
 *
 * Displays all AI-generated suggestions organized by section.
 * Users can review, accept, or reject individual suggestions.
 *
 * @see Story 5.9: Suggestions Page UI Implementation
 * @see Story 5.6: Suggestions Display by Section
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
export default async function SuggestionsPage({ params }: PageProps) {
  // Await params in Next.js 14+
  const { scanId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch scan data to verify ownership and get scan info (Story 10.1: Include ATS score)
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('id, user_id, status, created_at, ats_score')
    .eq('id', scanId)
    .eq('user_id', user.id)
    .single()

  if (scanError || !scan) {
    console.error('[suggestions page]', 'Scan not found:', scanError)
    notFound()
  }

  // Fetch suggestions grouped by section
  let suggestionsBySection: Record<string, any[]> = {}
  let totalSuggestions = 0
  let error: Error | null = null

  // Story 9.2: Fetch calibration summary
  let calibration: {
    suggestionMode: string | null
    targetSuggestionCount: number | null
    focusAreas: string[]
    reasoning: string | null
    atsScore: number | null
  } | null = null

  try {
    suggestionsBySection = await fetchSuggestionsBySection(scanId)
    totalSuggestions = Object.values(suggestionsBySection).reduce(
      (sum, suggestions) => sum + suggestions.length,
      0
    )

    // Fetch calibration if suggestions exist
    if (totalSuggestions > 0) {
      calibration = await getCalibrationSummary(scanId)
    }
  } catch (e) {
    console.error('[suggestions page]', 'Error fetching suggestions:', e)
    error = e as Error
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/scan/${scanId}`}
          className="hover:text-foreground transition-colors"
        >
          Analysis Results
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Suggestions</span>
      </nav>

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/scan/${scanId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Resume Optimization Suggestions</h1>
        <p className="text-muted-foreground mt-2">
          Review AI-powered suggestions to improve your resume's ATS compatibility
        </p>
      </div>

      {/* Story 9.2: Calibration Summary */}
      {calibration && (
        <CalibrationSummary
          suggestionMode={calibration.suggestionMode as SuggestionMode}
          targetSuggestionCount={calibration.targetSuggestionCount || undefined}
          focusAreas={calibration.focusAreas}
          reasoning={calibration.reasoning || undefined}
          atsScore={calibration.atsScore || undefined}
        />
      )}

      {/* Summary Stats */}
      <SuggestionsSummary scanId={scanId} />

      {/* Error State - AC7 */}
      {error && (
        <SuggestionsErrorState errorMessage={error.message} />
      )}

      {/* Suggestions List - AC2, AC3, AC4, AC5 */}
      {!error && (
        <SuggestionListClient
          scanId={scanId}
          suggestionsBySection={suggestionsBySection}
          totalSuggestions={totalSuggestions}
          atsScore={scan.ats_score ?? null}
        />
      )}

      {/* Navigation Footer - AC6 */}
      {!error && totalSuggestions > 0 && (
        <div className="flex justify-center pt-6 border-t">
          <Link
            href={`/analysis/${scanId}/preview`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Preview Optimized Resume
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </div>
  )
}

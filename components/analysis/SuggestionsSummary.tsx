'use client'

/**
 * SuggestionsSummary - Summary stats display for all suggestions
 *
 * Features:
 * - Real-time stats with auto-refresh
 * - Progress bar showing completion percentage
 * - "Skip All" button to reject remaining suggestions
 * - "Continue to Preview" button (gated on all reviewed)
 * - Responsive grid layout
 *
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getSuggestionSummary, skipAllPending } from '@/actions/suggestions'
import { useTransition } from 'react'
import { toast } from 'sonner'

interface SuggestionsSummaryProps {
  scanId: string
  onContinue?: () => void
}

export function SuggestionsSummary({
  scanId,
  onContinue,
}: SuggestionsSummaryProps) {
  const [summary, setSummary] = useState<{
    total: number
    accepted: number
    rejected: number
    pending: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Load summary on mount and set up auto-refresh only when needed
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const loadSummary = async () => {
      const { data, error } = await getSuggestionSummary(scanId)
      if (!error && data) {
        setSummary(data)
        // Stop polling if no suggestions or all reviewed
        if (data.total === 0 || data.pending === 0) {
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }
      }
      setLoading(false)
    }

    loadSummary()
    // Only start polling if we might have pending suggestions
    interval = setInterval(loadSummary, 2000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [scanId])

  const handleSkipAll = () => {
    if (!summary || summary.pending === 0) return

    startTransition(async () => {
      // Skip ALL pending suggestions across ALL sections
      const { data, error } = await skipAllPending({ scanId })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(`${data?.count || 0} suggestions skipped`)
    })
  }

  if (loading || !summary) {
    return (
      <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />
    )
  }

  const completionPercentage = summary.total > 0
    ? Math.round(((summary.accepted + summary.rejected) / summary.total) * 100)
    : 100
  const isComplete = summary.pending === 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      {/* Header */}
      <h3 className="font-semibold text-gray-900">Suggestions Summary</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="text-xs text-green-700 font-medium">Accepted</div>
          <div className="text-2xl font-bold text-green-600">
            {summary.accepted}
          </div>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <div className="text-xs text-red-700 font-medium">Rejected</div>
          <div className="text-2xl font-bold text-red-600">
            {summary.rejected}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-xs text-gray-700 font-medium">Pending</div>
          <div className="text-2xl font-bold text-gray-600">
            {summary.pending}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-600">
            {completionPercentage}%
          </span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="default"
          onClick={onContinue}
          disabled={!isComplete}
          className="flex-1"
        >
          {isComplete ? 'Continue to Preview' : 'Review Remaining'}
        </Button>
        {!isComplete && (
          <Button
            variant="outline"
            onClick={handleSkipAll}
            disabled={isPending}
            className="flex-1"
          >
            Skip All
          </Button>
        )}
      </div>

      {/* Info Text */}
      {!isComplete && (
        <p className="text-xs text-gray-600 text-center">
          Review all suggestions or skip remaining to proceed to preview
        </p>
      )}
    </div>
  )
}

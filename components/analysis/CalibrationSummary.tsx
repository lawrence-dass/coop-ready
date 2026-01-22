'use client'

import { ResultCard } from './ResultCard'
import { Sparkles, Info } from 'lucide-react'
import type { SuggestionMode } from '@/lib/utils/suggestionCalibrator'
import {
  getSuggestionModeDescription,
  getFocusAreasDescription
} from '@/lib/utils/suggestionCalibrator'

/**
 * Calibration Summary Component
 *
 * Displays suggestion calibration mode and focus areas based on ATS score
 * and user experience level.
 *
 * @see Story 9.2: Inference-Based Suggestion Calibration - Task 5
 */

export interface CalibrationSummaryProps {
  suggestionMode: SuggestionMode | null | undefined
  targetSuggestionCount?: number
  focusAreas?: string[]
  reasoning?: string
  atsScore?: number
}

/**
 * Get mode color for badges and styling
 */
function getModeColor(mode: SuggestionMode): {
  badge: string
  bg: string
  border: string
  text: string
} {
  switch (mode) {
    case 'Transformation':
      return {
        badge: 'bg-red-100 text-red-800 border-red-200',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900'
      }
    case 'Improvement':
      return {
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-900'
      }
    case 'Optimization':
      return {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900'
      }
    case 'Validation':
      return {
        badge: 'bg-green-100 text-green-800 border-green-200',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900'
      }
  }
}

export function CalibrationSummary({
  suggestionMode,
  targetSuggestionCount,
  focusAreas = [],
  reasoning,
  atsScore
}: CalibrationSummaryProps) {
  // Don't show if no calibration data
  if (!suggestionMode) {
    return null
  }

  const colors = getModeColor(suggestionMode)
  const modeDescription = getSuggestionModeDescription(suggestionMode)
  const focusAreasDescription = focusAreas.length > 0
    ? getFocusAreasDescription(focusAreas)
    : 'General resume optimization'

  return (
    <ResultCard
      title="Suggestion Strategy"
      icon={<Sparkles className="h-5 w-5" />}
      defaultExpanded={true}
      className={`border-l-4 ${colors.border}`}
    >
      <div className="space-y-6">
        {/* Mode Badge and Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Mode:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors.badge}`}>
                {suggestionMode}
              </span>
            </div>

            {atsScore !== undefined && (
              <span className="text-xs text-muted-foreground">
                (Based on ATS score: {atsScore})
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {modeDescription}
          </p>
        </div>

        {/* Focus Areas and Target Count */}
        <div className={`rounded-lg p-4 border ${colors.bg} ${colors.border}`}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Focus Areas */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`text-sm font-semibold ${colors.text}`}>
                  Priority Focus Areas
                </h4>
                <div className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                    Areas where suggestions will be concentrated based on your profile and resume analysis
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {focusAreasDescription}
              </p>
            </div>

            {/* Target Suggestion Count */}
            {targetSuggestionCount !== undefined && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={`text-sm font-semibold ${colors.text}`}>
                    Expected Suggestions
                  </h4>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                      Approximate number of suggestions you'll receive based on your calibration mode
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${colors.text}`}>
                    ~{targetSuggestionCount}
                  </span>
                  <span className="text-sm text-muted-foreground">suggestions</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calibration Reasoning (optional, detailed) */}
        {reasoning && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <span>View calibration details</span>
              <svg
                className="h-4 w-4 transform group-open:rotate-180 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 pl-4 border-l-2 border-muted">
              <p className="text-xs text-muted-foreground">
                {reasoning}
              </p>
            </div>
          </details>
        )}

        {/* Mode Explanation Footer */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>How this works:</strong> Based on your ATS score and experience level,
            we automatically calibrate the type and intensity of suggestions you receive.
            This ensures you get the most relevant feedback for your situation.
          </p>
        </div>
      </div>
    </ResultCard>
  )
}

'use client'

import { useState, useCallback, ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Info } from 'lucide-react'

/**
 * Job Description Input Component
 *
 * Textarea for job description with character counting and validation.
 * Supports real-time character counting, length validation, and keyword preview.
 *
 * @see Story 3.5: Job Description Input
 */

export interface JDInputProps {
  /** Current job description value */
  value: string
  /** Callback when job description changes */
  onChange: (value: string) => void
  /** Validation error message */
  error?: string | null
  /** Whether the input is disabled */
  disabled?: boolean
}

const MAX_CHAR_COUNT = 5000
const SHORT_JD_THRESHOLD = 100
const CHAR_COUNT_YELLOW_THRESHOLD = 3500
const CHAR_COUNT_RED_THRESHOLD = 4500

export function JDInput({
  value,
  onChange,
  error = null,
  disabled = false,
}: JDInputProps) {
  const [showShortWarning, setShowShortWarning] = useState(false)

  const currentLength = value.length
  const isOverLimit = currentLength > MAX_CHAR_COUNT

  // Determine character counter color
  const getCounterColor = (): string => {
    if (isOverLimit) return 'text-red-600 font-semibold'
    if (currentLength >= CHAR_COUNT_RED_THRESHOLD) return 'text-red-600'
    if (currentLength >= CHAR_COUNT_YELLOW_THRESHOLD) return 'text-yellow-600'
    return 'text-muted-foreground'
  }

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Show short warning if text is short
    const isShortNow = newValue.length > 0 && newValue.length < SHORT_JD_THRESHOLD
    setShowShortWarning(isShortNow)
  }, [onChange])

  return (
    <div className="space-y-2" data-testid="jd-input">
      <div className="flex items-center justify-between">
        <Label htmlFor="job-description">Job Description</Label>
        <span
          className={`text-sm ${getCounterColor()}`}
          data-testid="char-counter"
        >
          {currentLength} / {MAX_CHAR_COUNT}
        </span>
      </div>

      <Textarea
        id="job-description"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Paste the full job description"
        className={`min-h-[200px] ${isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        data-testid="jd-textarea"
      />

      <p className="text-xs text-muted-foreground" data-testid="helper-text">
        Paste the full job description
      </p>

      {/* Short JD Warning */}
      {showShortWarning && !error && (
        <div
          className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          data-testid="short-warning"
        >
          <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Job description seems short. Include the full posting for best results.
          </p>
        </div>
      )}

      {/* Validation Error */}
      {error && (
        <div
          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md"
          data-testid="error-message"
        >
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}

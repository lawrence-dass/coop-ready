'use client'

import { useState, useCallback, useMemo, ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Info, Tags } from 'lucide-react'

/**
 * Job Description Input Component
 *
 * Textarea for job description with character counting, validation, and keyword preview.
 * Extracts potential keywords from job description for ATS matching preview.
 *
 * @see Story 3.5: Job Description Input
 * @see Story 3.6: New Scan Page Integration (keyword preview)
 */

// Common words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'if', 'our',
  'your', 'their', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'any', 'while', 'experience',
  'work', 'working', 'ability', 'able', 'team', 'role', 'job', 'position', 'company',
  'including', 'required', 'requirements', 'skills', 'years', 'year', 'plus', 'strong',
])

/**
 * Extract potential keywords from job description text
 * Focuses on technical terms, tools, and skills
 */
function extractKeywords(text: string): string[] {
  if (!text || text.length < 50) return []

  // Split into words, normalize
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)

  // Count word frequency
  const wordCounts = new Map<string, number>()
  for (const word of words) {
    if (!STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    }
  }

  // Sort by frequency and take top keywords
  return Array.from(wordCounts.entries())
    .filter(([, count]) => count >= 2) // Mentioned at least twice
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8) // Top 8 keywords
    .map(([word]) => word)
}

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

  // Extract keywords for preview (memoized for performance)
  const keywords = useMemo(() => extractKeywords(value), [value])

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

      {/* Keyword Preview */}
      {keywords.length > 0 && (
        <div
          className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md"
          data-testid="keyword-preview"
        >
          <Tags className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-800 mb-1.5">
              Detected Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

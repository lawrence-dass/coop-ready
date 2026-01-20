'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

/**
 * Keyword Preview Component
 *
 * Displays client-side extracted keywords from job description.
 * Helps users verify they pasted the correct content.
 *
 * @see Story 3.5: Job Description Input - AC6
 */

export interface KeywordPreviewProps {
  /** Job description text */
  jobDescription: string
}

// Common words to filter out
const COMMON_WORDS = new Set([
  'The', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For', 'Of', 'With',
  'From', 'By', 'About', 'As', 'Into', 'Through', 'During', 'Before',
  'After', 'Above', 'Below', 'Between', 'Under', 'Since', 'Without',
  'We', 'Are', 'You', 'Your', 'Our', 'This', 'That', 'These', 'Those',
  'Be', 'Have', 'Do', 'Say', 'Get', 'Make', 'Go', 'Know', 'Take', 'See',
  'Come', 'Think', 'Look', 'Want', 'Give', 'Use', 'Find', 'Tell', 'Ask',
  'Work', 'Seem', 'Feel', 'Try', 'Leave', 'Call', 'Will', 'Should', 'Must'
])

/**
 * Extract keywords from job description
 * Simple regex-based extraction for client-side preview
 */
function extractKeywords(text: string): string[] {
  if (!text || text.trim().length === 0) return []

  // Match capitalized words and tech terms (e.g., "Python", "React", "C++", "Node.js")
  const matches = text.match(/\b[A-Z][a-zA-Z0-9+#]*(?:\.[a-z]+)?\b/g) || []

  // Filter out common words and duplicates
  const filtered = Array.from(new Set(
    matches.filter(word => !COMMON_WORDS.has(word) && word.length > 1)
  ))

  // Return top 20 keywords
  return filtered.slice(0, 20)
}

export function KeywordPreview({ jobDescription }: KeywordPreviewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const keywords = useMemo(
    () => extractKeywords(jobDescription),
    [jobDescription]
  )

  // Don't show if no keywords
  if (keywords.length === 0) return null

  return (
    <div className="border rounded-lg p-4 bg-muted/30" data-testid="keyword-preview">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left"
        data-testid="keyword-toggle"
      >
        <div>
          <h4 className="text-sm font-medium">Detected Keywords</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {keywords.length} skill{keywords.length !== 1 ? 's' : ''} and keywords detected
          </p>
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {!isCollapsed && (
        <div className="flex flex-wrap gap-2 mt-3" data-testid="keyword-list">
          {keywords.map((keyword, index) => (
            <Badge
              key={`${keyword}-${index}`}
              variant="secondary"
              className="text-xs"
            >
              {keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useId, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Reusable Result Card Component
 *
 * Collapsible card container for analysis results.
 * Provides consistent styling and expand/collapse functionality.
 *
 * @see Story 4.7: Analysis Results Page - Task 8
 */

export interface ResultCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  className?: string
}

export function ResultCard({
  title,
  icon,
  children,
  defaultExpanded = true,
  className = '',
}: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const contentId = useId()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <Card className={className}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={`${title} section, ${isExpanded ? 'expanded' : 'collapsed'}. Press Enter to ${isExpanded ? 'collapse' : 'expand'}.`}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent id={contentId} role="region" aria-label={`${title} content`}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}

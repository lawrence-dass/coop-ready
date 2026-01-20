'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, ChevronDown, ChevronUp } from 'lucide-react'
import type { JobEntry } from '@/lib/parsers/types'

/**
 * Experience Preview Sub-Component
 *
 * Displays job entries with company, title, dates, and bullet points.
 * Each job is shown as an expandable card with clear formatting.
 *
 * @see Story 3.4: Resume Preview Display - Task 2
 */

export interface ExperiencePreviewProps {
  experience: JobEntry[]
}

export function ExperiencePreview({ experience }: ExperiencePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!experience || experience.length === 0) {
    return null
  }

  return (
    <Card data-testid="experience-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle
            className="flex items-center gap-2"
            data-testid="experience-section-header"
          >
            <Briefcase className="h-5 w-5" />
            Experience
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="section-collapse-button"
            aria-label={isExpanded ? 'Collapse experience section' : 'Expand experience section'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && <CardContent className="space-y-6">
        {experience.map((job, index) => (
          <div
            key={index}
            data-testid={`experience-entry-${index}`}
            className="border-l-2 border-primary/20 pl-4 pb-4 last:pb-0"
          >
            {/* Job Title */}
            <p className="font-semibold text-base" data-testid="job-title">
              {job.title}
            </p>

            {/* Company */}
            <p className="text-sm text-muted-foreground" data-testid="job-company">
              {job.company}
            </p>

            {/* Dates */}
            <p className="text-xs text-muted-foreground mb-3" data-testid="job-dates">
              {job.dates}
            </p>

            {/* Bullet Points */}
            {job.bulletPoints && job.bulletPoints.length > 0 && (
              <ul className="space-y-2" data-testid="job-bullet-points">
                {job.bulletPoints.map((point, idx) => (
                  <li key={idx} className="text-sm flex gap-2 items-start">
                    <span className="text-muted-foreground mt-1 flex-shrink-0">•</span>
                    <span className="flex-1">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>}
    </Card>
  )
}

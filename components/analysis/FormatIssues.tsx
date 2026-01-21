'use client'

import { ResultCard } from './ResultCard'
import { AlertCircle, AlertTriangle, Info, CheckCircle2, FileText } from 'lucide-react'

/**
 * Format Issues Component
 *
 * Displays format issues detected in resume analysis.
 * Issues are categorized by severity: Critical, Warning, Suggestion.
 *
 * @see Story 4.7: Analysis Results Page - Task 7 (AC: 8)
 * @see Story 4.6: Resume Format Issues Detection
 */

type FormatIssueSeverity = 'critical' | 'warning' | 'suggestion'

export interface FormatIssue {
  type: FormatIssueSeverity
  message: string
  detail: string
  source: 'rule-based' | 'ai-detected'
}

export interface FormatIssuesProps {
  issues: FormatIssue[] | null | undefined
}

// Severity configuration
const severityConfig = {
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  suggestion: {
    label: 'Suggestion',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
} as const

export function FormatIssues({ issues }: FormatIssuesProps) {
  // If no issues, show success message
  if (!issues || issues.length === 0) {
    return (
      <ResultCard
        title="Format Analysis"
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
      >
        <div className="flex items-center gap-3 text-green-800">
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <p className="font-medium">No format issues detected</p>
            <p className="text-sm text-muted-foreground">
              Your resume follows ATS-friendly formatting guidelines
            </p>
          </div>
        </div>
      </ResultCard>
    )
  }

  // Sort issues by severity: critical → warning → suggestion
  const sortedIssues = [...issues].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, suggestion: 2 }
    return severityOrder[a.type] - severityOrder[b.type]
  })

  return (
    <ResultCard
      title="Format Issues"
      icon={<FileText className="h-5 w-5" />}
    >
      <div className="space-y-3">
        {sortedIssues.map((issue, index) => {
          const config = severityConfig[issue.type]
          const Icon = config.icon

          return (
            <div
              key={index}
              className={`border-l-4 ${config.borderColor} ${config.bgColor} p-4 rounded`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${config.color} uppercase`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{issue.message}</p>
                  <p className="text-sm text-muted-foreground">{issue.detail}</p>
                </div>
              </div>
            </div>
          )
        })}

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Use standard fonts (Arial, Calibri, Times New Roman),
            avoid tables/columns, and save as PDF for best ATS compatibility.
          </p>
        </div>
      </div>
    </ResultCard>
  )
}

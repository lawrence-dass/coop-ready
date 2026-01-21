'use client'

import { ResultCard } from './ResultCard'
import { Layers, TrendingUp, TrendingDown } from 'lucide-react'

/**
 * Section Breakdown Component
 *
 * Displays section-level scores for resume sections.
 * Shows scores, explanations, strengths, and weaknesses for each section.
 *
 * @see Story 4.7: Analysis Results Page - Task 5 (AC: 6)
 * @see Story 4.4: Section-Level Score Breakdown
 */

export interface SectionScore {
  score: number
  explanation: string
  strengths: string[]
  weaknesses: string[]
}

export interface SectionScores {
  experience?: SectionScore
  education?: SectionScore
  skills?: SectionScore
  projects?: SectionScore
  summary?: SectionScore
}

export interface SectionBreakdownProps {
  sectionScores: SectionScores | null | undefined
}

// Section display configuration
const sectionConfig = {
  experience: { label: 'Experience', priority: 1 },
  education: { label: 'Education', priority: 2 },
  skills: { label: 'Skills', priority: 3 },
  projects: { label: 'Projects', priority: 4 },
  summary: { label: 'Summary/Objective', priority: 5 },
} as const

// Color coding for scores - returns text class and background color
function getScoreStyles(score: number): { textClass: string; bgColor: string } {
  if (score >= 70) return { textClass: 'text-green-600', bgColor: 'rgb(22 163 74)' }
  if (score >= 50) return { textClass: 'text-yellow-600', bgColor: 'rgb(202 138 4)' }
  return { textClass: 'text-red-600', bgColor: 'rgb(220 38 38)' }
}

export function SectionBreakdown({ sectionScores }: SectionBreakdownProps) {
  if (!sectionScores || Object.keys(sectionScores).length === 0) {
    return (
      <ResultCard
        title="Section Breakdown"
        icon={<Layers className="h-5 w-5" />}
      >
        <p className="text-muted-foreground">No section scores available</p>
      </ResultCard>
    )
  }

  // Convert to array and sort by score (lowest first for prioritization)
  const sections = Object.entries(sectionScores)
    .map(([key, value]) => ({
      key: key as keyof SectionScores,
      label: sectionConfig[key as keyof typeof sectionConfig].label,
      ...value,
    }))
    .sort((a, b) => a.score - b.score)

  return (
    <ResultCard
      title="Section Breakdown"
      icon={<Layers className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Sections sorted by score (lowest to highest) to help you prioritize improvements
        </p>

        {sections.map((section) => {
          const scoreStyles = getScoreStyles(section.score)
          return (
            <div
              key={section.key}
              className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{section.label}</h3>
                <span className={`text-2xl font-bold ${scoreStyles.textClass}`}>
                  {section.score}/100
                </span>
              </div>

              {/* Progress Bar */}
              <div
                className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20"
                role="progressbar"
                aria-valuenow={section.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${section.label} score: ${section.score} out of 100`}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${section.score}%`,
                    backgroundColor: scoreStyles.bgColor,
                  }}
                />
              </div>

            {/* Explanation */}
            <p className="text-sm text-muted-foreground">{section.explanation}</p>

            {/* Strengths */}
            {section.strengths && section.strengths.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Strengths:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5 ml-6">
                  {section.strengths.map((strength: string, idx: number) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {section.weaknesses && section.weaknesses.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Areas to Improve:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5 ml-6">
                  {section.weaknesses.map((weakness: string, idx: number) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          )
        })}
      </div>
    </ResultCard>
  )
}

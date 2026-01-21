'use client'

import { ResultCard } from './ResultCard'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Target } from 'lucide-react'

/**
 * Score Card Component
 *
 * Displays ATS compatibility score with donut chart visualization.
 * Shows score interpretation and justification.
 *
 * @see Story 4.7: Analysis Results Page - Task 4 (AC: 4, 5)
 * @see Story 4.2: ATS Score Calculation
 */

export interface ScoreCardProps {
  atsScore: number | null | undefined
  justification: string | null | undefined
}

// Score interpretation thresholds
function getScoreInterpretation(score: number): {
  label: string
  description: string
  color: string
} {
  if (score >= 70) {
    return {
      label: 'Excellent fit',
      description: 'Strong match with job requirements',
      color: '#16a34a', // green-600
    }
  }
  if (score >= 50) {
    return {
      label: 'Good fit',
      description: 'Qualified with minor optimization opportunities',
      color: '#ca8a04', // yellow-600
    }
  }
  if (score >= 30) {
    return {
      label: 'Fair fit',
      description: 'Some relevant experience but improvements needed',
      color: '#ea580c', // orange-600
    }
  }
  return {
    label: 'Poor fit',
    description: 'Major gaps in qualifications or ATS compatibility',
    color: '#dc2626', // red-600
  }
}

export function ScoreCard({ atsScore, justification }: ScoreCardProps) {
  if (atsScore === null || atsScore === undefined) {
    return (
      <ResultCard
        title="ATS Compatibility Score"
        icon={<Target className="h-5 w-5" />}
        defaultExpanded={true}
      >
        <p className="text-muted-foreground">
          Score not available. Analysis may still be processing.
        </p>
      </ResultCard>
    )
  }

  const interpretation = getScoreInterpretation(atsScore)

  // Data for donut chart
  const data = [
    { name: 'Score', value: atsScore },
    { name: 'Remaining', value: 100 - atsScore },
  ]

  return (
    <ResultCard
      title="ATS Compatibility Score"
      icon={<Target className="h-5 w-5" />}
      defaultExpanded={true}
      className="border-2"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill={interpretation.color} />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Score in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-bold"
                style={{ color: interpretation.color }}
              >
                {atsScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Interpretation */}
          <div className="mt-4 text-center">
            <p
              className="font-semibold text-lg"
              style={{ color: interpretation.color }}
            >
              {interpretation.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {interpretation.description}
            </p>
          </div>
        </div>

        {/* Justification */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Score Analysis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {justification || 'No detailed justification available.'}
            </p>
          </div>

          {/* Score ranges legend */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Score Ranges
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-600" />
                <span>70-100: Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-600" />
                <span>50-70: Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-600" />
                <span>30-50: Fair</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-600" />
                <span>0-30: Poor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResultCard>
  )
}

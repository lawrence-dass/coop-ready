'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { ScoreBreakdown } from '@/types/analysis';

export interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown;
  className?: string;
}

interface CategoryConfig {
  name: string;
  weight: string;
  description: string;
  tooltip: string;
}

const CATEGORIES: Record<keyof ScoreBreakdown, CategoryConfig> = {
  keywordScore: {
    name: 'Keyword Alignment',
    weight: '50% weight',
    description: 'Measures keyword match between resume and job description',
    tooltip:
      'Percentage of job description keywords found in your resume. Higher match = better ATS compatibility.',
  },
  sectionCoverageScore: {
    name: 'Section Coverage',
    weight: '25% weight',
    description:
      'Checks if your resume includes essential sections: Summary, Skills, and Experience',
    tooltip:
      'Checks if your resume includes essential sections: Summary, Skills, and Experience.',
  },
  contentQualityScore: {
    name: 'Content Quality',
    weight: '25% weight',
    description:
      'AI evaluation of how relevant, clear, and impactful your resume content is',
    tooltip:
      'AI evaluation of how relevant, clear, and impactful your resume content is for this role.',
  },
};

/**
 * Returns the color class for a score value based on UX design spec ranges:
 * - 0-39%: Red (danger)
 * - 40-69%: Amber (warning)
 * - 70-100%: Green (success)
 */
function getScoreColorClass(score: number): string {
  if (score < 40) return 'bg-red-500';
  if (score < 70) return 'bg-amber-500';
  return 'bg-green-500';
}

export function ScoreBreakdownCard({
  breakdown,
  className = '',
}: ScoreBreakdownCardProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.keys(CATEGORIES) as Array<keyof ScoreBreakdown>).map(
              (key) => {
                const category = CATEGORIES[key];
                const score = breakdown[key];
                const colorClass = getScoreColorClass(score);

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={`More info about ${category.name}`}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              {category.tooltip}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-sm text-gray-500">
                        {category.weight}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${category.name} score: ${score} percent`}
                        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 flex-1"
                      >
                        <div
                          className={`h-full transition-all ${colorClass}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {score}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

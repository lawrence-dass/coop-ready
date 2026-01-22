'use client';

import { ResultCard } from './ResultCard';
import { BarChart3, Info } from 'lucide-react';
import type { ScoreBreakdown, ScoreBreakdownLegacy } from '@/lib/types/analysis';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Score Breakdown Card Component
 * Story 9.1: ATS Scoring Recalibration
 *
 * Displays the 5-category score breakdown with weights and explanations.
 * Handles both new V2 structure and legacy format for backward compatibility.
 */

export interface ScoreBreakdownCardProps {
  scoreBreakdown: ScoreBreakdown | ScoreBreakdownLegacy | null | undefined;
}

/**
 * Type guard to check if scoreBreakdown is V2 format
 */
function isScoreBreakdownV2(breakdown: unknown): breakdown is ScoreBreakdown {
  if (!breakdown || typeof breakdown !== 'object') return false;
  const b = breakdown as Record<string, unknown>;
  return typeof b.overall === 'number' && typeof b.categories === 'object';
}

/**
 * Type guard to check if scoreBreakdown is legacy format
 */
function isScoreBreakdownLegacy(breakdown: unknown): breakdown is ScoreBreakdownLegacy {
  if (!breakdown || typeof breakdown !== 'object') return false;
  const b = breakdown as Record<string, unknown>;
  return (
    typeof b.keywords === 'number' &&
    typeof b.skills === 'number' &&
    typeof b.experience === 'number' &&
    typeof b.format === 'number'
  );
}

/**
 * Get color for score value
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get background color for score bar
 */
function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-yellow-600';
  if (score >= 40) return 'bg-orange-600';
  return 'bg-red-600';
}

/**
 * Category display configuration
 */
const CATEGORY_INFO = {
  keywordAlignment: {
    label: 'Keyword Alignment',
    description: 'How well resume matches job-specific keywords and technical terms',
  },
  contentRelevance: {
    label: 'Content Relevance',
    description: 'How well experience aligns with role responsibilities and requirements',
  },
  quantificationImpact: {
    label: 'Quantification & Impact',
    description: 'How well resume demonstrates measurable achievements with metrics',
  },
  formatStructure: {
    label: 'Format & Structure',
    description: 'How easily an ATS can parse the resume structure and formatting',
  },
  skillsCoverage: {
    label: 'Skills Coverage',
    description: 'How well listed skills match job requirements and technical needs',
  },
} as const;

export function ScoreBreakdownCard({ scoreBreakdown }: ScoreBreakdownCardProps) {
  if (!scoreBreakdown) {
    return (
      <ResultCard title="Score Breakdown" icon={<BarChart3 className="h-5 w-5" />}>
        <p className="text-muted-foreground">Score breakdown not available.</p>
      </ResultCard>
    );
  }

  // Handle V2 format (Story 9.1)
  if (isScoreBreakdownV2(scoreBreakdown)) {
    return (
      <ResultCard
        title="Score Breakdown (Updated Weights)"
        icon={<BarChart3 className="h-5 w-5" />}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your resume is scored across 5 key categories. Each category contributes to your
            overall ATS compatibility score.
          </p>

          <div className="space-y-4">
            {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map((key) => {
              const category = scoreBreakdown.categories[key];
              const info = CATEGORY_INFO[key];
              const weightPercent = Math.round(category.weight * 100);

              return (
                <div key={key} className="space-y-2">
                  {/* Category header with tooltip */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{info.label}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{info.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Weight: {weightPercent}%
                      </span>
                      <span className={`font-bold text-sm ${getScoreColor(category.score)}`}>
                        {category.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${getScoreBarColor(
                        category.score
                      )}`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>

                  {/* Reason */}
                  {category.reason && (
                    <p className="text-xs text-muted-foreground italic">{category.reason}</p>
                  )}

                  {/* Quantification density indicator */}
                  {key === 'quantificationImpact' &&
                    'quantificationDensity' in category &&
                    typeof category.quantificationDensity === 'number' && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Quantification Density:
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            category.quantificationDensity >= 80
                              ? 'text-green-600'
                              : category.quantificationDensity >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {category.quantificationDensity}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (
                          {category.quantificationDensity >= 80
                            ? 'Strong'
                            : category.quantificationDensity >= 50
                              ? 'Moderate'
                              : 'Low'}
                          )
                        </span>
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          {/* Overall weighted score */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Overall Score (Weighted)</span>
              <span className={`font-bold text-lg ${getScoreColor(scoreBreakdown.overall)}`}>
                {scoreBreakdown.overall}/100
              </span>
            </div>
          </div>
        </div>
      </ResultCard>
    );
  }

  // Handle legacy format for backward compatibility
  if (isScoreBreakdownLegacy(scoreBreakdown)) {
    return (
      <ResultCard
        title="Score Breakdown (Legacy)"
        icon={<BarChart3 className="h-5 w-5" />}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This analysis uses the previous scoring model. Newer analyses use an updated 5-category
            breakdown.
          </p>

          <div className="space-y-3">
            {[
              { label: 'Keywords', score: scoreBreakdown.keywords, weight: 40 },
              { label: 'Skills', score: scoreBreakdown.skills, weight: 30 },
              { label: 'Experience', score: scoreBreakdown.experience, weight: 20 },
              { label: 'Format', score: scoreBreakdown.format, weight: 10 },
            ].map(({ label, score, weight }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Weight: {weight}%</span>
                    <span className={`font-bold text-sm ${getScoreColor(score)}`}>
                      {score}/100
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getScoreBarColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ResultCard>
    );
  }

  // Unknown format
  return (
    <ResultCard title="Score Breakdown" icon={<BarChart3 className="h-5 w-5" />}>
      <p className="text-muted-foreground">Unable to display score breakdown.</p>
    </ResultCard>
  );
}

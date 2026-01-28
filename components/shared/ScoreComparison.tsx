'use client';

/**
 * ScoreComparison Component
 * Story 11.3: Implement Score Comparison
 *
 * Displays original ATS score vs. projected score after optimization,
 * showing the improvement and breakdown by category.
 */

import { TrendingUp, AlertCircle } from 'lucide-react';
import {
  calculateProjectedScore,
  calculateScoreDelta,
  calculateCategoryDeltas,
  type AllSuggestions,
} from '@/lib/utils/scoreCalculation';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ScoreComparisonProps {
  /** Original ATS score (0-100) */
  originalScore: number;

  /** All available suggestions */
  suggestions: AllSuggestions;

  /** Whether suggestions are currently being regenerated */
  isLoading?: boolean;

  /** Whether an error occurred during suggestion generation */
  hasError?: boolean;

  /** Additional className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ScoreComparison({
  originalScore,
  suggestions,
  isLoading = false,
  hasError = false,
  className,
}: ScoreComparisonProps) {
  // Calculate projected score and delta
  const projectedScore = calculateProjectedScore(originalScore, suggestions);
  const delta = calculateScoreDelta(originalScore, projectedScore);
  const categoryDeltas = calculateCategoryDeltas(suggestions);

  // Check if there are any improvements
  const hasImprovement = delta > 0;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className ?? ''}`}
      data-testid="score-comparison"
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          ATS Score Comparison
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Your original score vs. projected score with suggested improvements
        </p>
      </div>

      {/* Score Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Original Score Card */}
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium mb-2">
              Original Score
            </div>
            <div
              className="text-5xl font-bold text-gray-700"
              data-testid="original-score"
              aria-label={`Original Score: ${originalScore} out of 100`}
            >
              {originalScore}
            </div>
            <div className="text-xs text-gray-500 mt-1">out of 100</div>
          </div>

          {/* Delta (Improvement) */}
          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <div data-testid="score-loading" className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 mx-auto mb-2" />
                <div className="text-sm text-gray-500">Calculating projected score...</div>
              </div>
            ) : hasError ? (
              <div data-testid="score-error" className="text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-red-500">Could not calculate projected score</div>
              </div>
            ) : hasImprovement ? (
              <>
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" aria-hidden="true" />
                <div
                  className="text-3xl font-bold text-green-600"
                  data-testid="score-delta"
                  aria-label={`${delta} point improvement`}
                >
                  +{delta}
                </div>
                <div className="text-sm text-gray-600 font-medium mt-1">
                  point improvement
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400" aria-hidden="true">—</div>
                <div className="text-sm text-gray-500 mt-1">No change</div>
              </>
            )}
          </div>

          {/* Projected Score Card */}
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium mb-2">
              Projected Score
            </div>
            {isLoading ? (
              <div className="h-12 w-20 mx-auto bg-gray-200 rounded animate-pulse" data-testid="projected-score-skeleton" />
            ) : hasError ? (
              <div
                className="text-5xl font-bold text-gray-400"
                data-testid="projected-score"
                aria-label="Projected score unavailable"
              >
                —
              </div>
            ) : (
              <div
                className={`text-5xl font-bold ${hasImprovement ? 'text-green-600' : 'text-gray-700'}`}
                data-testid="projected-score"
                aria-label={`Projected Score: ${projectedScore} out of 100`}
              >
                {projectedScore}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">out of 100</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {hasImprovement && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-900 mb-4">
              Improvement Breakdown by Section
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Summary */}
              {categoryDeltas.summary > 0 && (
                <div
                  className="bg-indigo-50 rounded-lg p-4"
                  data-testid="category-summary"
                >
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Summary
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    +{categoryDeltas.summary}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">points</div>
                </div>
              )}

              {/* Skills */}
              {categoryDeltas.skills > 0 && (
                <div
                  className="bg-purple-50 rounded-lg p-4"
                  data-testid="category-skills"
                >
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Skills
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    +{categoryDeltas.skills}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">points</div>
                </div>
              )}

              {/* Experience */}
              {categoryDeltas.experience > 0 && (
                <div
                  className="bg-green-50 rounded-lg p-4"
                  data-testid="category-experience"
                >
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Experience
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    +{categoryDeltas.experience}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">points</div>
                </div>
              )}
            </div>

            {/* No improvements message */}
            {categoryDeltas.summary === 0 &&
              categoryDeltas.skills === 0 &&
              categoryDeltas.experience === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No point values available for the current suggestions.
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

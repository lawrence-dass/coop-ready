'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface ScoreComparisonSectionProps {
  /** Original ATS score before optimization */
  originalScore: number;

  /** Total potential points if all suggestions applied */
  potentialPoints: number;
}

/**
 * ScoreComparisonSection Component
 *
 * Displays before/after ATS score comparison with improvement delta.
 * Shows visual indicators for score improvement potential.
 *
 * Story 16.5: Implement Suggestions Page (AC#5)
 */
export function ScoreComparisonSection({
  originalScore,
  potentialPoints,
}: ScoreComparisonSectionProps) {
  // Calculate projected score (capped at 100)
  const projectedScore = Math.min(originalScore + potentialPoints, 100);
  const improvementDelta = projectedScore - originalScore;
  const improvementPercentage = originalScore > 0
    ? ((improvementDelta / originalScore) * 100).toFixed(1)
    : '0';

  // Color coding based on original score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Color for improvement delta
  const getDeltaColor = (delta: number) => {
    if (delta >= 20) return 'text-green-600';
    if (delta >= 10) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Score Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
          {/* Original Score */}
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-gray-600 mb-2">Original Score</p>
            <div className="relative">
              <div
                className={`text-6xl font-bold ${getScoreColor(originalScore)}`}
                data-testid="original-score-display"
              >
                {originalScore}
              </div>
              <div className="text-center mt-1">
                <Badge variant="outline" className="text-xs">
                  Current
                </Badge>
              </div>
            </div>
          </div>

          {/* Arrow Indicator */}
          <div className="hidden md:block">
            <ArrowRight className="w-12 h-12 text-gray-400" />
          </div>

          {/* Mobile Arrow */}
          <div className="md:hidden">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>

          {/* Projected Score */}
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-gray-600 mb-2">Projected Score</p>
            <div className="relative">
              <div
                className={`text-6xl font-bold ${getScoreColor(projectedScore)}`}
                data-testid="projected-score-display"
              >
                {projectedScore}
              </div>
              <div className="text-center mt-1">
                <Badge variant="default" className="bg-green-600 text-xs">
                  If All Applied
                </Badge>
              </div>
            </div>
          </div>

          {/* Improvement Delta */}
          <div className="flex flex-col items-center md:ml-8">
            <p className="text-sm font-medium text-gray-600 mb-2">Potential Gain</p>
            <div className={`text-5xl font-bold ${getDeltaColor(improvementDelta)}`}>
              +{improvementDelta}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ({improvementPercentage}% improvement)
            </p>
          </div>
        </div>

        {/* Call-to-Action Message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">
              Apply the suggestions above to improve your ATS score by up to {improvementDelta} points.
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Point values are estimates based on keyword matching and content optimization
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

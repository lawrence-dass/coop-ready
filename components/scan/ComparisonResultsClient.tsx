'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreCircle } from '@/components/shared/ScoreCircle';
import { ScoreBreakdownCard } from '@/components/shared/ScoreBreakdownCard';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ATSScore } from '@/types/analysis';
import type { ATSScoreV21 } from '@/lib/scoring/types';

interface ComparisonResultsClientProps {
  sessionId: string;
  originalScore: ATSScore | ATSScoreV21;
  comparedScore: ATSScoreV21;
}

/**
 * Type guard to check if a score is V2.1 format (has tier property)
 */
function isATSScoreV21(score: ATSScore | ATSScoreV21): score is ATSScoreV21 {
  return 'tier' in score && typeof score.tier === 'string';
}

export function ComparisonResultsClient({
  sessionId,
  originalScore,
  comparedScore,
}: ComparisonResultsClientProps) {
  const router = useRouter();

  // Calculate improvement metrics
  const improvementPoints = comparedScore.overall - originalScore.overall;
  const improvementPercentage =
    originalScore.overall > 0
      ? (improvementPoints / originalScore.overall) * 100
      : 0;

  // Get tier using type guard instead of unsafe cast
  const originalTier = isATSScoreV21(originalScore)
    ? originalScore.tier
    : getScoreTier(originalScore.overall);
  const comparedTier = comparedScore.tier;
  const tierChanged = originalTier !== comparedTier;

  // Determine improvement type
  const isImprovement = improvementPoints > 0;
  const isDecrease = improvementPoints < 0;
  const noChange = improvementPoints === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Resume Comparison Results</h1>
        <p className="text-muted-foreground mt-2">
          See how your updated resume compares to the original
        </p>
      </div>

      {/* Score Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle>ATS Score Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Original Score */}
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground mb-2">Original Score</p>
              <ScoreCircle score={originalScore.overall} size="large" />
              <Badge variant="outline" className="mt-2">
                {originalTier}
              </Badge>
            </div>

            {/* Improvement Delta */}
            <div className="flex flex-col items-center text-center">
              {isImprovement && (
                <>
                  <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                  <p className="text-4xl font-bold text-green-600">
                    +{Math.round(improvementPoints)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">points gained</p>
                  <p className="text-lg text-green-600 mt-2">
                    +{improvementPercentage.toFixed(1)}% improvement
                  </p>
                  {tierChanged && (
                    <Badge className="mt-2 bg-green-600">
                      {originalTier} → {comparedTier}
                    </Badge>
                  )}
                  <p className="text-sm text-green-600 font-semibold mt-4">
                    {getImprovementMessage(improvementPoints)}
                  </p>
                </>
              )}

              {noChange && (
                <>
                  <Minus className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-4xl font-bold text-gray-600">0</p>
                  <p className="text-sm text-muted-foreground mt-1">points changed</p>
                  <p className="text-sm text-gray-600 mt-4">
                    Your scores are identical. Consider applying more suggestions!
                  </p>
                </>
              )}

              {isDecrease && (
                <>
                  <TrendingDown className="h-8 w-8 text-amber-600 mb-2" />
                  <p className="text-4xl font-bold text-amber-600">
                    {Math.round(improvementPoints)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">points changed</p>
                  <p className="text-sm text-amber-600 mt-4">
                    Your score decreased slightly. Review the suggestions to ensure accurate improvements.
                  </p>
                </>
              )}
            </div>

            {/* Compared Score */}
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground mb-2">Updated Score</p>
              <ScoreCircle score={comparedScore.overall} size="large" />
              <Badge variant="outline" className="mt-2">
                {comparedTier}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Original Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isATSScoreV21(originalScore) ? (
              <ScoreBreakdownCard scoreV21={originalScore} />
            ) : (
              <ScoreBreakdownCard breakdown={originalScore.breakdown} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Updated Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdownCard scoreV21={comparedScore} />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/scan/${sessionId}/suggestions`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suggestions
        </Button>
      </div>
    </div>
  );
}

// Helper function for improvement messaging
function getImprovementMessage(points: number): string {
  if (points >= 20) return '🎉 Excellent improvement!';
  if (points >= 10) return '🎯 Great progress!';
  if (points >= 5) return '✨ Nice improvement!';
  return '👍 You are on the right track!';
}

// Helper function for tier calculation (fallback for V1 scores without tier)
function getScoreTier(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Competitive';
  return 'Needs Work';
}

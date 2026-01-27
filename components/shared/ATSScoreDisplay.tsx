'use client';

import { ScoreCircle } from './ScoreCircle';
import { ScoreBreakdownCard } from './ScoreBreakdownCard';
import type { ATSScore } from '@/types/analysis';

export interface ATSScoreDisplayProps {
  score?: ATSScore;
  loading?: boolean;
  error?: { message: string; code: string } | null;
  className?: string;
}

function getScoreMessage(score: number): string {
  if (score < 40) {
    return 'Room for improvement! Review the suggestions below.';
  } else if (score < 70) {
    return "Good start! A few improvements will boost your score.";
  } else {
    return 'Great match! Your resume aligns well with the job.';
  }
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Updated just now';
  if (diffMins === 1) return 'Updated 1 minute ago';
  if (diffMins < 60) return `Updated ${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return 'Updated 1 hour ago';
  if (diffHours < 24) return `Updated ${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Updated 1 day ago';

  return `Updated ${diffDays} days ago`;
}

export function ATSScoreDisplay({
  score,
  loading = false,
  error = null,
  className = '',
}: ATSScoreDisplayProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-40 w-40 rounded-full bg-gray-200 animate-pulse" />
          <p className="text-sm text-gray-500">Calculating score...</p>
        </div>

        <div className="h-64 rounded-lg bg-gray-100 animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error calculating score</h3>
            <p className="mt-1 text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // No score state
  if (!score) {
    return null;
  }

  const interpretationMessage = getScoreMessage(score.overall);

  return (
    <div className={`space-y-6 ${className}`} data-testid="score-display">
      {/* Overall Score Display */}
      <div className="flex flex-col items-center gap-4">
        <ScoreCircle score={score.overall} size="large" animated={true} />

        <div className="text-center space-y-1">
          <p className="text-base font-medium text-gray-700">
            {interpretationMessage}
          </p>
          <p className="text-xs text-gray-500">
            {formatTimestamp(score.calculatedAt)}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <ScoreBreakdownCard breakdown={score.breakdown} />
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ATSScoreDisplay } from './ATSScoreDisplay';
import { KeywordAnalysisDisplay } from './KeywordAnalysisDisplay';
import { CopyButton } from './CopyButton';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import type { OptimizationSession } from '@/types/optimization';

export interface SessionDetailViewProps {
  /** Session data to display (null while loading) */
  session: OptimizationSession | null;

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: { message: string; code: string } | null;

  /** Callback when "Optimize Again" is clicked */
  onOptimizeAgain?: () => void;

  /** Callback when back button is clicked */
  onBack?: () => void;
}

/**
 * SessionDetailView Component
 *
 * Displays complete details of a previous optimization session including:
 * - Original resume and job description
 * - ATS score and keyword analysis
 * - All suggestions (read-only)
 * - Option to re-optimize with same inputs
 *
 * Story 10-2: Implement Session Reload
 * AC #2, #3, #5, #6, #7
 */
export function SessionDetailView({
  session,
  isLoading = false,
  error = null,
  onOptimizeAgain,
  onBack,
}: SessionDetailViewProps) {
  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="session-detail-loading">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Resume Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>

        {/* JD Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>

        {/* Score Skeleton */}
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !session) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="text-red-600 font-medium">
              {error?.message || 'Session not found'}
            </div>
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // SESSION DATA DISPLAY
  // ============================================================================

  const hasAnalysis = session.atsScore || session.keywordAnalysis;
  const hasSuggestions =
    session.summarySuggestion ||
    session.skillsSuggestion ||
    session.experienceSuggestion;

  // Format date for display
  const sessionDate = new Date(session.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6" data-testid="session-detail-view">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
          <p className="text-sm text-gray-500 mt-1">{sessionDate}</p>
        </div>

        <div className="flex gap-2">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {onOptimizeAgain && (
            <Button
              onClick={onOptimizeAgain}
              variant="default"
              size="sm"
              data-testid="optimize-again-button"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Optimize Again
            </Button>
          )}
        </div>
      </div>

      {/* Resume Content Card */}
      {session.resumeContent && (
        <Card data-testid="resume-content-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Resume Content</span>
              <Badge variant="secondary">Read-only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200">
                {session.resumeContent.rawText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Description Card */}
      {session.jobDescription && (
        <Card data-testid="job-description-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Job Description</span>
              <Badge variant="secondary">Read-only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200">
                {session.jobDescription}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {hasAnalysis && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Previous Analysis
          </h2>

          {/* ATS Score */}
          {session.atsScore && <ATSScoreDisplay score={session.atsScore} />}

          {/* Keyword Analysis */}
          {session.keywordAnalysis && (
            <KeywordAnalysisDisplay analysis={session.keywordAnalysis} />
          )}
        </div>
      )}

      {/* Suggestions Section */}
      {hasSuggestions && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Previous Suggestions
          </h2>

          {/* Summary Suggestion */}
          {session.summarySuggestion && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center justify-between">
                <span>Summary Section</span>
                <CopyButton
                  text={session.summarySuggestion.suggested}
                  label="Copy suggestion"
                  variant="outline"
                  size="sm"
                />
              </h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Original</p>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {session.summarySuggestion.original}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Suggested</p>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                      {session.summarySuggestion.suggested}
                    </pre>
                  </div>
                  {session.summarySuggestion.ats_keywords_added.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500">Keywords added:</span>
                      {session.summarySuggestion.ats_keywords_added.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skills Suggestion */}
          {session.skillsSuggestion && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center justify-between">
                <span>Skills Section</span>
                <CopyButton
                  text={session.skillsSuggestion.skill_additions.join(', ')}
                  label="Copy additions"
                  variant="outline"
                  size="sm"
                />
              </h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-gray-700">{session.skillsSuggestion.summary}</p>
                  {session.skillsSuggestion.skill_additions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Recommended additions</p>
                      <div className="flex flex-wrap gap-1">
                        {session.skillsSuggestion.skill_additions.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs bg-green-100 text-green-800">
                            + {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {session.skillsSuggestion.matched_keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Matched keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {session.skillsSuggestion.matched_keywords.map((kw) => (
                          <Badge key={kw} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Experience Suggestion */}
          {session.experienceSuggestion &&
            session.experienceSuggestion.experience_entries.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center justify-between">
                  <span>Experience Section</span>
                  <CopyButton
                    text={session.experienceSuggestion.experience_entries
                      .flatMap((entry) =>
                        entry.suggested_bullets.map((b) => b.suggested)
                      )
                      .join('\n\n')}
                    label="Copy all"
                    variant="outline"
                    size="sm"
                  />
                </h3>
                {session.experienceSuggestion.experience_entries.map((entry, idx) => (
                  <Card key={`exp-${idx}`}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {entry.role} at {entry.company}
                        <span className="text-sm text-gray-500 font-normal ml-2">{entry.dates}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {entry.suggested_bullets.map((bullet, bIdx) => (
                        <div key={`bullet-${bIdx}`} className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">Original</p>
                          <p className="text-sm text-gray-600">{bullet.original}</p>
                          <p className="text-xs font-medium text-gray-500 mt-2">Suggested</p>
                          <p className="text-sm text-gray-800 bg-green-50 p-2 rounded border border-green-200">
                            {bullet.suggested}
                          </p>
                          {bullet.keywords_incorporated.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {bullet.keywords_incorporated.map((kw) => (
                                <Badge key={kw} variant="secondary" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Empty State - No Data */}
      {!session.resumeContent &&
        !session.jobDescription &&
        !hasAnalysis &&
        !hasSuggestions && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <p>No optimization data available for this session.</p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

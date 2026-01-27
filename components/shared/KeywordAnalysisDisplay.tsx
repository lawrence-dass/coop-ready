'use client';

// Story 5.1: Keyword Analysis Display Component
// Story 5.4: Enhanced with Gap Analysis Display
import { useState } from 'react';
import { KeywordAnalysisResult, KeywordCategory } from '@/types/analysis';
import { CheckCircle2, AlertCircle, TrendingUp, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GapSummaryCard } from './GapSummaryCard';
import { PriorityFilterChips, PriorityFilter } from './PriorityFilterChips';
import { MissingKeywordItem } from './MissingKeywordItem';
import { getCategoryIcon } from '@/lib/utils/categoryIcons';

interface KeywordAnalysisDisplayProps {
  analysis: KeywordAnalysisResult;
}

/**
 * Displays keyword analysis results with matched and missing keywords
 *
 * Shows:
 * - Overall match rate with visual indicator
 * - Matched keywords grouped by category with context
 * - Missing keywords grouped by category with importance
 */
export function KeywordAnalysisDisplay({ analysis }: KeywordAnalysisDisplayProps) {
  const { matched, missing, matchRate } = analysis;
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  // Filter missing keywords by priority
  const filteredMissing =
    priorityFilter === 'all' ? missing : missing.filter((k) => k.importance === priorityFilter);

  // Group matched keywords by category
  const matchedByCategory = matched.reduce((acc, keyword) => {
    if (!acc[keyword.category]) {
      acc[keyword.category] = [];
    }
    acc[keyword.category].push(keyword);
    return acc;
  }, {} as Record<KeywordCategory, typeof matched>);

  // Get match rate color
  const getMatchRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get match rate label
  const getMatchRateLabel = (rate: number) => {
    if (rate >= 70) return 'Good Match';
    if (rate >= 50) return 'Fair Match';
    return 'Needs Improvement';
  };

  // Format category name for display
  const formatCategory = (category: KeywordCategory) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get match type badge color
  const getMatchTypeBadge = (matchType: 'exact' | 'fuzzy' | 'semantic') => {
    switch (matchType) {
      case 'exact':
        return 'bg-green-100 text-green-800';
      case 'fuzzy':
        return 'bg-blue-100 text-blue-800';
      case 'semantic':
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Keyword Analysis Results
          </CardTitle>
          <CardDescription>
            Analyzed {matched.length + missing.length} keywords from job description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getMatchRateColor(matchRate)}`}>
                  {matchRate}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {getMatchRateLabel(matchRate)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    matchRate >= 70 ? 'bg-green-600' : matchRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${matchRate}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Match Rate</p>
              <p className="text-lg font-semibold">
                {matched.length} / {matched.length + missing.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Gap Summary Dashboard */}
      {missing.length > 0 && <GapSummaryCard missing={missing} />}

      {/* Matched Keywords */}
      {matched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Matched Keywords ({matched.length})
            </CardTitle>
            <CardDescription>
              Keywords from the job description found in your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(matchedByCategory).map(([category, keywords]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  {formatCategory(category as KeywordCategory)} ({keywords.length})
                </h4>
                <div className="space-y-2">
                  {keywords.map((kw, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-green-200 bg-green-50 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-green-900">{kw.keyword}</span>
                            <Badge className={getMatchTypeBadge(kw.matchType)}>
                              {kw.matchType}
                            </Badge>
                          </div>
                          {kw.context && (
                            <p className="text-sm text-green-700 italic">
                              &ldquo;{kw.context}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ENHANCED: Missing Keywords with Priority Filter */}
      {missing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Missing Keywords ({missing.length})
            </CardTitle>
            <CardDescription>
              Important keywords from the job description not found in your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NEW: Priority Filter */}
            <PriorityFilterChips
              missing={missing}
              activeFilter={priorityFilter}
              onFilterChange={setPriorityFilter}
            />

            {/* ENHANCED: Missing keywords with expandable guidance and category icons */}
            {Object.entries(
              filteredMissing.reduce((acc, keyword) => {
                if (!acc[keyword.category]) {
                  acc[keyword.category] = [];
                }
                acc[keyword.category].push(keyword);
                return acc;
              }, {} as Record<KeywordCategory, typeof filteredMissing>)
            ).map(([category, keywords]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  {getCategoryIcon(category as KeywordCategory)}
                  {formatCategory(category as KeywordCategory)} ({keywords.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {keywords.map((kw, idx) => (
                    <MissingKeywordItem key={idx} keyword={kw} />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* NEW: Perfect Match Empty State */}
      {missing.length === 0 && matched.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-8 text-center">
            <PartyPopper className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Perfect! All key terms are present.</h3>
            <p className="text-green-700">
              Your resume includes all important keywords from the job description. Ready for content optimization
              suggestions!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {matched.length === 0 && missing.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No keywords analyzed yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}

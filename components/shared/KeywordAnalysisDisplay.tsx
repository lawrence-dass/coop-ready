'use client';

// Story 5.1: Keyword Analysis Display Component
// Story 5.4: Enhanced with Gap Analysis Display
import { useState } from 'react';
import { KeywordAnalysisResult, KeywordCategory } from '@/types/analysis';
import { CheckCircle2, AlertCircle, TrendingUp, PartyPopper, ChevronDown, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const { matched, missing, matchRate, keywordScore, requiredCount, preferredCount } = analysis;
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [matchedOpen, setMatchedOpen] = useState(false);

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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Keyword Analysis Results - Enhanced with dual metrics */}
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
            {/* PRIMARY METRIC: Keyword Score (if available) */}
            {keywordScore !== undefined && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Keyword Score</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-4xl font-bold ${getMatchRateColor(keywordScore)}`}>
                        {keywordScore}/100
                      </p>
                      <p className={`text-sm ${getMatchRateColor(keywordScore)}`}>
                        {getMatchRateLabel(keywordScore)}
                      </p>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="More info about Keyword Score"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Your keyword score weighs matches by importance and placement.
                        All required keywords matched perfectly!
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* SEPARATOR (if keyword score shown) */}
            {keywordScore !== undefined && <div className="border-t border-gray-200 my-4" />}

            {/* SECONDARY DETAILS: Match breakdown */}
            <div className="space-y-3">
              {/* Required keywords */}
              {requiredCount && requiredCount.total > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Required keywords:</span>
                  <span className={`text-sm font-medium ${requiredCount.matched === requiredCount.total ? 'text-green-600' : 'text-amber-600'}`}>
                    {requiredCount.matched}/{requiredCount.total}
                    {requiredCount.matched === requiredCount.total && ' ✓'}
                  </span>
                </div>
              )}

              {/* Preferred keywords */}
              {preferredCount && preferredCount.total > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Preferred keywords:</span>
                  <span className="text-sm font-medium">
                    {preferredCount.matched}/{preferredCount.total}
                  </span>
                </div>
              )}

              {/* Overall match rate */}
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm">Overall match rate:</span>
                <span className="text-sm">
                  {matched.length}/{matched.length + missing.length} ({matchRate}%)
                </span>
              </div>
            </div>

            {/* EXPLANATION (if scores differ) */}
            {keywordScore !== undefined && matchRate !== keywordScore && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-900 leading-relaxed">
                  💡 <strong>Why the difference?</strong> Your keyword score is {keywordScore}/100 because all high-importance required keywords matched perfectly. The {matchRate}% match rate shows you&apos;re missing {missing.length} {missing.length === 1 ? 'keyword' : 'keywords'}, which {missing.length === 1 ? 'is a' : 'are'} low-priority preferred term{missing.length === 1 ? '' : 's'}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      {/* NEW: Gap Summary Dashboard */}
      {missing.length > 0 && <GapSummaryCard missing={missing} />}

      {/* Matched Keywords - Collapsible, closed by default */}
      {matched.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setMatchedOpen(!matchedOpen)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Matched Keywords ({matched.length})
                </CardTitle>
                <CardDescription>
                  Keywords from the job description found in your resume
                </CardDescription>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  matchedOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CardHeader>
          {matchedOpen && (
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
          )}
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
                <div className="grid gap-2">
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
    </TooltipProvider>
  );
}

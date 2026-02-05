'use client';

// Story 5.4: Gap Analysis Summary Card Component
import { ExtractedKeyword } from '@/types/analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface GapSummaryCardProps {
  missing: ExtractedKeyword[];
}

/**
 * Displays a summary dashboard of gap analysis
 *
 * Shows:
 * - Total gaps count
 * - Priority breakdown (high/medium/low)
 * - Quick wins (all high-priority/required keywords)
 */
export function GapSummaryCard({ missing }: GapSummaryCardProps) {
  const highPriority = missing.filter((k) => k.importance === 'high').length;
  const mediumPriority = missing.filter((k) => k.importance === 'medium').length;
  const lowPriority = missing.filter((k) => k.importance === 'low').length;

  // Quick wins: all high-priority keywords (required keywords after normalization)
  // These have the biggest impact (+12 pts each for required keywords)
  const quickWins = missing.filter((k) => k.importance === 'high');

  return (
    <Card data-testid="gap-analysis">
      <CardHeader>
        <CardTitle>Gap Analysis Summary</CardTitle>
        <CardDescription>
          {missing.length} keyword{missing.length === 1 ? '' : 's'} from the job description{' '}
          {missing.length === 1 ? 'is' : 'are'} missing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Priority Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border-2 border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{highPriority}</p>
            <p className="text-sm text-destructive/80">High Priority</p>
          </div>
          <div className="rounded-lg border-2 border-warning/30 bg-warning/10 p-4 text-center">
            <p className="text-3xl font-bold text-warning">{mediumPriority}</p>
            <p className="text-sm text-warning/80">Medium Priority</p>
          </div>
          <div className="rounded-lg border-2 border-warning/20 bg-warning/5 p-4 text-center">
            <p className="text-3xl font-bold text-warning/70">{lowPriority}</p>
            <p className="text-sm text-warning/60">Low Priority</p>
          </div>
        </div>

        {/* Quick Wins - Show all high priority (required) keywords */}
        {quickWins.length > 0 && (
          <div className="rounded-lg bg-info/10 p-4 border border-info/30">
            <h4 className="font-semibold text-info mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Quick Wins - Add These {quickWins.length} First
            </h4>
            <div className="flex flex-wrap gap-2">
              {quickWins.map((kw, idx) => (
                <Badge key={idx} variant="outline" className="bg-white">
                  {kw.keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
 * - Quick wins (top 3 most impactful keywords)
 */
export function GapSummaryCard({ missing }: GapSummaryCardProps) {
  const highPriority = missing.filter((k) => k.importance === 'high').length;
  const mediumPriority = missing.filter((k) => k.importance === 'medium').length;
  const lowPriority = missing.filter((k) => k.importance === 'low').length;

  // Top 3 most impactful keywords (high priority first, then medium)
  // Copy array before sorting to avoid mutating the prop
  const topGaps = [...missing]
    .sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    })
    .slice(0, 3);

  return (
    <Card>
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
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{highPriority}</p>
            <p className="text-sm text-red-600">High Priority</p>
          </div>
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{mediumPriority}</p>
            <p className="text-sm text-amber-600">Medium Priority</p>
          </div>
          <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{lowPriority}</p>
            <p className="text-sm text-yellow-600">Low Priority</p>
          </div>
        </div>

        {/* Quick Wins */}
        {topGaps.length > 0 && (
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Quick Wins - Add These First
            </h4>
            <div className="flex flex-wrap gap-2">
              {topGaps.map((kw, idx) => (
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

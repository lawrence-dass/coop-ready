/**
 * ComparisonCard Component
 *
 * Displays before/after comparison for a single resume section.
 * Shows original text vs. suggested text with diff highlighting.
 *
 * Features:
 * - Side-by-side layout on desktop, stacked on mobile
 * - Change count badge (X words added, Y words changed)
 * - Navigation controls for multiple suggestions
 * - Responsive design with clear section headers
 */

'use client';

import { SideBySideDiff } from './TextDiff';
import { countChanges, diffTexts } from '@/lib/utils/textDiff';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

interface ComparisonCardProps {
  /** Section title (e.g., "Summary", "Skills", "Experience") */
  sectionTitle: string;
  /** Original text from resume */
  originalText: string;
  /** Suggested improvement text */
  suggestedText: string;
  /** Current suggestion index (1-based) */
  index?: number;
  /** Total number of suggestions for this section */
  total?: number;
  /** Callback when navigating to previous suggestion */
  onPrevious?: () => void;
  /** Callback when navigating to next suggestion */
  onNext?: () => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * Displays a single section comparison with navigation.
 */
export function ComparisonCard({
  sectionTitle,
  originalText,
  suggestedText,
  index,
  total,
  onPrevious,
  onNext,
  className = '',
}: ComparisonCardProps) {
  // Calculate change statistics
  const changeStats = useMemo(() => {
    const chunks = diffTexts(originalText, suggestedText);
    return countChanges(chunks);
  }, [originalText, suggestedText]);

  const hasMultiple = total && total > 1;
  const showNavigation = hasMultiple && index && total;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {sectionTitle}
            </CardTitle>
            {/* Change summary badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              {changeStats.totalChanges > 0 ? (
                <>
                  {changeStats.insertions > 0 && (
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                      +{changeStats.insertions} word
                      {changeStats.insertions !== 1 ? 's' : ''} added
                    </span>
                  )}
                  {changeStats.deletions > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                      −{changeStats.deletions} word
                      {changeStats.deletions !== 1 ? 's' : ''} removed
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {changeStats.totalChanges} total change
                    {changeStats.totalChanges !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="text-gray-500 italic">No changes</span>
              )}
            </div>
          </div>

          {/* Navigation controls (if multiple suggestions) */}
          {showNavigation && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={index === 1}
                className="h-8 w-8 p-0"
                aria-label="Previous suggestion"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                {index} of {total}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={index === total}
                className="h-8 w-8 p-0"
                aria-label="Next suggestion"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <SideBySideDiff
          originalText={originalText}
          suggestedText={suggestedText}
        />
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { FeedbackButtons } from './FeedbackButtons';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import { toast } from 'sonner';

export interface SuggestionCardProps {
  /** Unique ID for this suggestion */
  suggestionId: string;

  /** Original text from resume */
  original: string;

  /** Suggested optimized text */
  suggested: string;

  /** Point impact (optional) */
  points?: number;

  /** Keywords incorporated (optional) */
  keywords?: string[];

  /** Metrics added (optional) */
  metrics?: string[];

  /** Section type for styling context */
  sectionType: 'summary' | 'skills' | 'experience';

  /** Additional className */
  className?: string;
}

/**
 * SuggestionCard Component
 *
 * Displays a single optimization suggestion with original vs. suggested text.
 * Uses two-column layout on desktop, tabs on mobile.
 *
 * Story 6.5: Implement Suggestion Display UI
 * Story 7.4: Added feedback buttons
 */
export function SuggestionCard({
  suggestionId,
  original,
  suggested,
  points,
  keywords = [],
  metrics = [],
  sectionType,
  className,
}: SuggestionCardProps) {
  // Get feedback state and actions from store
  const currentFeedback = useOptimizationStore(
    (state: { getFeedbackForSuggestion: (id: string) => boolean | null }) =>
      state.getFeedbackForSuggestion(suggestionId)
  );
  const recordSuggestionFeedback = useOptimizationStore(
    (state: { recordSuggestionFeedback: (id: string, section: 'summary' | 'skills' | 'experience', helpful: boolean | null) => Promise<void> }) =>
      state.recordSuggestionFeedback
  );

  // Handle feedback submission
  const handleFeedback = async (helpful: boolean | null) => {
    await recordSuggestionFeedback(suggestionId, sectionType, helpful);

    // Show toast confirmation
    if (helpful !== null) {
      toast.success('Thanks for the feedback!');
    }
  };

  // Extract index from suggestionId format "sug_{section}_{index}"
  const suggestionIndex = suggestionId.split('_').pop() ?? '0';
  return (
    <Card
      data-section={sectionType}
      aria-label={`${sectionType} suggestion`}
      className={cn('shadow-sm border-gray-200', className)}
    >
      <CardContent className="p-6">
        {/* Point Badge */}
        {points !== undefined && (
          <div className="mb-4">
            <Badge variant="default" className="bg-indigo-600 text-white">
              +{points} pts
            </Badge>
          </div>
        )}

        {/* Desktop: Two-column layout (hidden on mobile) */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Original</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{original}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Suggested</h4>
            <p className="text-sm text-gray-900 leading-relaxed font-medium">
              {suggested}
            </p>
          </div>
        </div>

        {/* Mobile: Tabs layout (hidden on desktop) */}
        <div className="md:hidden">
          <Tabs defaultValue="original">
            <TabsList className="w-full">
              <TabsTrigger value="original" className="flex-1">
                Original
              </TabsTrigger>
              <TabsTrigger value="suggested" className="flex-1">
                Suggested
              </TabsTrigger>
            </TabsList>
            <TabsContent value="original" className="mt-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                {original}
              </p>
            </TabsContent>
            <TabsContent value="suggested" className="mt-3">
              <p className="text-sm text-gray-900 leading-relaxed font-medium">
                {suggested}
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Metadata: Keywords and Metrics */}
        {(keywords.length > 0 || metrics.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-gray-500">
                  Keywords:
                </span>
                {keywords.map((keyword, index) => (
                  <Badge
                    key={`${keyword}-${index}`}
                    variant="outline"
                    className="text-xs"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            {metrics.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-gray-500">
                  Metrics:
                </span>
                {metrics.map((metric, index) => (
                  <Badge
                    key={`${metric}-${index}`}
                    variant="secondary"
                    className="text-xs"
                  >
                    {metric}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Copy and Feedback */}
        <div className="mt-4 flex items-center justify-between gap-4">
          {/* Feedback Buttons */}
          <FeedbackButtons
            suggestionId={suggestionId}
            sectionType={sectionType}
            currentFeedback={currentFeedback}
            onFeedback={handleFeedback}
          />

          {/* Copy Button */}
          <CopyButton
            text={suggested}
            label="Copy suggestion"
            variant="outline"
            size="sm"
            data-testid={`copy-${sectionType}-${suggestionIndex}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

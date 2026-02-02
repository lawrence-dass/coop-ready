'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { FeedbackButtons } from './FeedbackButtons';
import { useOptimizationStore, ExtendedOptimizationStore } from '@/store/useOptimizationStore';
import { toast } from 'sonner';
import { Lightbulb } from 'lucide-react';

/** Impact tier type */
type ImpactTier = 'critical' | 'high' | 'moderate';

/** Impact tier display configuration */
const IMPACT_TIER_CONFIG = {
  critical: {
    label: 'Critical',
    description: 'Required in job description',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
  },
  high: {
    label: 'High',
    description: 'Strongly desired',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
  },
  moderate: {
    label: 'Moderate',
    description: 'Nice-to-have',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
  },
} as const;

export interface SuggestionCardProps {
  /** Unique ID for this suggestion */
  suggestionId: string;

  /** Original text from resume */
  original: string;

  /** Suggested optimized text */
  suggested: string;

  /** Point impact (optional) - deprecated, use impact instead */
  points?: number;

  /** Impact tier (optional) - replaces points for display */
  impact?: ImpactTier;

  /** Keywords incorporated (optional) */
  keywords?: string[];

  /** Metrics added (optional) */
  metrics?: string[];

  /** Section type for styling context */
  sectionType: 'summary' | 'skills' | 'experience' | 'education';

  /** Why this works explanation (optional) */
  explanation?: string;

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
 * Story 14.3: Added "Why this works" explanation section
 */
export function SuggestionCard({
  suggestionId,
  original,
  suggested,
  points,
  impact,
  keywords = [],
  metrics = [],
  sectionType,
  explanation,
  className,
}: SuggestionCardProps) {
  // Get feedback state and actions from store
  const currentFeedback = useOptimizationStore(
    (state: { getFeedbackForSuggestion: (id: string) => boolean | null }) =>
      state.getFeedbackForSuggestion(suggestionId)
  );
  const recordSuggestionFeedback = useOptimizationStore(
    (state: { recordSuggestionFeedback: (id: string, section: 'summary' | 'skills' | 'experience' | 'education', helpful: boolean | null) => Promise<void> }) =>
      state.recordSuggestionFeedback
  );

  // Story 17.2: Track suggestion copies for comparison feature
  const markSuggestionCopied = useOptimizationStore(
    (state: ExtendedOptimizationStore) => state.markSuggestionCopied
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
        {/* Impact Badge - shows tier instead of points for clearer prioritization */}
        {(impact || points !== undefined) && (
          <div className="mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                {impact ? (
                  <Badge
                    variant="default"
                    className={cn(
                      IMPACT_TIER_CONFIG[impact].bgColor,
                      IMPACT_TIER_CONFIG[impact].textColor
                    )}
                    aria-label={`${IMPACT_TIER_CONFIG[impact].label} impact: ${IMPACT_TIER_CONFIG[impact].description}`}
                  >
                    {IMPACT_TIER_CONFIG[impact].label}
                  </Badge>
                ) : (
                  // Fallback to points display for backward compatibility
                  <Badge
                    variant="default"
                    className={cn(
                      'text-white',
                      points! <= 3 && 'bg-gray-500',
                      points! >= 4 && points! <= 7 && 'bg-blue-600',
                      points! >= 8 && 'bg-green-600'
                    )}
                    aria-label={`Estimated ${points} point ATS score improvement`}
                  >
                    +{points} pts
                  </Badge>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {impact
                  ? IMPACT_TIER_CONFIG[impact].description
                  : 'Estimated point gain if you apply this suggestion'
                }
              </TooltipContent>
            </Tooltip>
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

        {/* Explanation: Why this works */}
        {explanation && explanation.trim() !== '' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex gap-2 items-start">
              <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  Why this works
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          </div>
        )}

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
            onCopy={(success) => {
              // Story 17.2: Track when suggestion is copied
              if (success) {
                markSuggestionCopied(suggestionId);
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

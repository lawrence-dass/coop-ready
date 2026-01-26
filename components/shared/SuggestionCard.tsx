'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface SuggestionCardProps {
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
 */
export function SuggestionCard({
  original,
  suggested,
  points,
  keywords = [],
  metrics = [],
  sectionType,
  className,
}: SuggestionCardProps) {
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
      </CardContent>
    </Card>
  );
}

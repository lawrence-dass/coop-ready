'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StructuralSuggestion } from '@/types/suggestions';

interface StructuralSuggestionsBannerProps {
  suggestions: StructuralSuggestion[];
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 1,
  high: 2,
  moderate: 3,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-amber-500 text-white',
  moderate: 'bg-green-500 text-white',
};

const CATEGORY_LABELS: Record<string, string> = {
  section_order: 'Section Order',
  section_heading: 'Section Heading',
  section_presence: 'Section Presence',
};

export function StructuralSuggestionsBanner({ suggestions }: StructuralSuggestionsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Sort by priority: critical → high → moderate
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

  const INITIAL_DISPLAY_COUNT = 3;
  const hasMore = sortedSuggestions.length > INITIAL_DISPLAY_COUNT;
  const displayedSuggestions = isExpanded
    ? sortedSuggestions
    : sortedSuggestions.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = sortedSuggestions.length - INITIAL_DISPLAY_COUNT;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Resume Structure Recommendations
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          These structural changes can improve your resume&apos;s ATS compatibility and readability
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedSuggestions.map((suggestion, index) => (
          <div
            key={suggestion.id || index}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start gap-2 flex-wrap">
              <Badge className={`${PRIORITY_COLORS[suggestion.priority]} font-semibold`}>
                {suggestion.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[suggestion.category] || suggestion.category}
              </Badge>
            </div>

            <p className="text-sm font-medium text-gray-900">
              {suggestion.message}
            </p>

            {suggestion.currentState && (
              <p className="text-xs text-gray-600">
                <span className="font-medium">Current:</span> {suggestion.currentState}
              </p>
            )}

            {suggestion.recommendedAction && (
              <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded p-2">
                <span className="font-medium">Action:</span> {suggestion.recommendedAction}
              </p>
            )}
          </div>
        ))}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2"
          >
            {isExpanded ? 'Show Less' : `Show ${hiddenCount} More`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

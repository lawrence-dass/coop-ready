"use client";

/**
 * SuggestionCard - Individual Suggestion Display
 * Shows before/after comparison with reasoning and action buttons
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SUGGESTION_TYPE_META,
  type DisplaySuggestion,
  type SuggestionType,
} from "@/lib/utils/suggestion-types";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface SuggestionCardProps {
  suggestion: DisplaySuggestion;
  index: number;
}

export function SuggestionCard({
  suggestion,
  index,
}: SuggestionCardProps) {
  const meta =
    SUGGESTION_TYPE_META[
      suggestion.suggestionType as SuggestionType
    ] || SUGGESTION_TYPE_META.format;

  return (
    <div className={`rounded-lg border p-4 ${meta.color}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Badge className={meta.badge}>{meta.label}</Badge>
        <span className="text-xs text-gray-600">#{index + 1}</span>
      </div>

      {/* Before/After */}
      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Before:</p>
          <p className="text-sm text-gray-900 line-clamp-3">
            {suggestion.originalText}
          </p>
        </div>
        {suggestion.suggestedText && (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">After:</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-3">
              {suggestion.suggestedText}
            </p>
          </div>
        )}
      </div>

      {/* Reasoning */}
      {suggestion.reasoning && (
        <div className="mb-3 flex gap-2 text-sm text-gray-700">
          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="line-clamp-2">{suggestion.reasoning}</p>
        </div>
      )}

      {/* Actions (Story 5-7) */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          disabled
          title="Accept/Reject functionality coming in Story 5-7"
        >
          <CheckCircle2 className="h-4 w-4" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          disabled
          title="Accept/Reject functionality coming in Story 5-7"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}

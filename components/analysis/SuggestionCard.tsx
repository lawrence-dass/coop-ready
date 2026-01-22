"use client";

/**
 * SuggestionCard - Individual Suggestion Display
 * Shows before/after comparison with reasoning and action buttons
 *
 * Features:
 * - Status-based visual styling (pending/accepted/rejected)
 * - Accept/reject buttons with optimistic updates
 * - Toast notifications for user feedback
 *
 * @see Story 5.6: Suggestions Display by Section
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  SUGGESTION_TYPE_META,
  type DisplaySuggestion,
  type SuggestionType,
} from "@/lib/utils/suggestion-types";
import { Lightbulb } from "lucide-react";
import { AcceptRejectButtons } from "./AcceptRejectButtons";

interface SuggestionCardProps {
  suggestion: DisplaySuggestion;
  index: number;
  scanId: string;
}

export function SuggestionCard({
  suggestion,
  index,
  scanId,
}: SuggestionCardProps) {
  const meta =
    SUGGESTION_TYPE_META[
      suggestion.suggestionType as SuggestionType
    ] || SUGGESTION_TYPE_META.format;

  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(
    (suggestion.status as "pending" | "accepted" | "rejected") || "pending"
  );

  // Apply visual styling based on status
  const getStatusStyles = () => {
    switch (status) {
      case "accepted":
        return "border-green-200 bg-green-50";
      case "rejected":
        return "border-red-200 bg-red-50";
      default:
        return meta.color;
    }
  };

  const getOriginalTextStyles = () => {
    if (status === "rejected") return "line-through text-gray-500";
    return "text-gray-900";
  };

  return (
    <div className={`rounded-lg border p-4 transition-colors ${getStatusStyles()}`} data-testid="suggestion-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Badge className={meta.badge} data-testid="suggestion-type-badge">{meta.label}</Badge>
        <span className="text-xs text-gray-600">#{index + 1}</span>
      </div>

      {/* Before/After */}
      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Before:</p>
          <p className={`text-sm line-clamp-3 ${getOriginalTextStyles()}`} data-testid="suggestion-original">
            {suggestion.originalText}
          </p>
        </div>
        {suggestion.suggestedText && (
          <div className={status === "rejected" ? "opacity-50" : ""}>
            <p className="text-xs font-semibold text-gray-700 mb-1">After:</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-3" data-testid="suggestion-suggested">
              {suggestion.suggestedText}
            </p>
          </div>
        )}
      </div>

      {/* Reasoning */}
      {suggestion.reasoning && (
        <div className="mb-3 flex gap-2 text-sm text-gray-700" data-testid="suggestion-reasoning">
          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="line-clamp-2">{suggestion.reasoning}</p>
        </div>
      )}

      {/* Actions with Accept/Reject (Story 5-7) */}
      <AcceptRejectButtons
        suggestionId={suggestion.id}
        scanId={scanId}
        currentStatus={status}
        onStatusChange={setStatus}
      />
    </div>
  );
}

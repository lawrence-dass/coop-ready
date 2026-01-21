"use client";

/**
 * SuggestionSection - Collapsible Section Component
 * Displays suggestions for a specific resume section
 *
 * Features:
 * - Collapsible section with count badge
 * - Section-level bulk actions (accept/reject all)
 * - Individual suggestion cards with accept/reject buttons
 * - Empty state when no suggestions
 *
 * @see Story 5.6: Suggestions Display by Section
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { useState, useMemo } from "react";
import {
  ChevronDown,
  CheckCircle2,
  Briefcase,
  BookOpen,
  Code,
  Folder,
  FileText,
} from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { SectionActions } from "./SectionActions";
import {
  SECTION_DISPLAY_NAMES,
  type DisplaySuggestion,
  type ResumeSection,
} from "@/lib/utils/suggestion-types";

// Map section names to actual Lucide icon components
const SECTION_ICON_COMPONENTS: Record<ResumeSection, React.ElementType> = {
  experience: Briefcase,
  education: BookOpen,
  skills: Code,
  projects: Folder,
  format: FileText,
};

interface SuggestionSectionProps {
  section: string;
  suggestions: DisplaySuggestion[];
  scanId: string;
}

export function SuggestionSection({
  section,
  suggestions,
  scanId,
}: SuggestionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const displayName =
    SECTION_DISPLAY_NAMES[section as ResumeSection] || section;
  const IconComponent = SECTION_ICON_COMPONENTS[section as ResumeSection];

  // Calculate if there are pending suggestions in this section
  const hasPendingSuggestions = useMemo(
    () => suggestions.some((s) => s.status === "pending"),
    [suggestions]
  );

  if (suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-900">{displayName}</h3>
          <span className="text-sm text-green-700">
            No suggestions for this section
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {IconComponent && (
            <IconComponent className="h-5 w-5 text-gray-400" />
          )}
          <h3 className="font-semibold text-gray-900">{displayName}</h3>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {suggestions.length}
          </span>
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <>
          <div className="border-t border-gray-200 px-4 py-3 space-y-3">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                index={index}
                scanId={scanId}
              />
            ))}
          </div>

          {/* Section Actions (Accept All / Reject All) */}
          {hasPendingSuggestions && (
            <SectionActions
              scanId={scanId}
              section={section}
              hasPendingSuggestions={hasPendingSuggestions}
            />
          )}
        </>
      )}
    </div>
  );
}

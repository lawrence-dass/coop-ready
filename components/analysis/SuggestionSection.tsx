"use client";

/**
 * SuggestionSection - Collapsible Section Component
 * Displays suggestions for a specific resume section
 */

import { useState } from "react";
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
}

export function SuggestionSection({
  section,
  suggestions,
}: SuggestionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const displayName =
    SECTION_DISPLAY_NAMES[section as ResumeSection] || section;
  const IconComponent = SECTION_ICON_COMPONENTS[section as ResumeSection];

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
        <div className="border-t border-gray-200 px-4 py-3 space-y-3">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

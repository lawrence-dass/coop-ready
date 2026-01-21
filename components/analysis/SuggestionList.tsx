/**
 * SuggestionList - Main Container Component
 * Server Component that fetches and displays suggestions grouped by section
 */

import { fetchSuggestionsBySection } from "@/lib/supabase/suggestions";
import { SuggestionSection } from "./SuggestionSection";
import { SuggestionTypeFilter } from "./SuggestionTypeFilter";
import {
  RESUME_SECTIONS,
  SECTION_DISPLAY_NAMES,
} from "@/lib/utils/suggestion-types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface SuggestionListProps {
  scanId: string;
}

export async function SuggestionList({ scanId }: SuggestionListProps) {
  const suggestionsBySection = await fetchSuggestionsBySection(scanId);

  const totalSuggestions = Object.values(suggestionsBySection).reduce(
    (sum, suggestions) => sum + suggestions.length,
    0
  );

  if (totalSuggestions === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-2" />
        <h3 className="font-semibold text-green-900">
          No suggestions found!
        </h3>
        <p className="text-sm text-green-700 mt-1">
          Your resume is already optimized and follows best practices.
        </p>
      </div>
    );
  }

  const sectionsWithIssues = Object.values(suggestionsBySection).filter(
    (s) => s.length > 0
  ).length;
  const strongSections = Object.values(suggestionsBySection).filter(
    (s) => s.length === 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-900">
            Total Suggestions
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {totalSuggestions}
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-4">
          <div className="text-sm font-medium text-purple-900">
            Sections with Issues
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {sectionsWithIssues}
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-sm font-medium text-green-900">
            Strong Sections
          </div>
          <div className="text-2xl font-bold text-green-600">
            {strongSections}
          </div>
        </div>
      </div>

      {/* Filter */}
      <SuggestionTypeFilter scanId={scanId} />

      {/* Sections */}
      <div className="space-y-4">
        {RESUME_SECTIONS.map((section) => (
          <SuggestionSection
            key={section}
            section={section}
            suggestions={suggestionsBySection[section] || []}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

/**
 * SuggestionListClient - Client-side wrapper for suggestion display
 * Handles filtering and pagination state
 */

import { useState, useMemo } from "react";
import { SuggestionSection } from "./SuggestionSection";
import { SuggestionTypeFilter } from "./SuggestionTypeFilter";
import {
  RESUME_SECTIONS,
  type DisplaySuggestion,
} from "@/lib/utils/suggestion-types";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 20;

interface SuggestionListClientProps {
  suggestionsBySection: Record<string, DisplaySuggestion[]>;
  totalSuggestions: number;
}

export function SuggestionListClient({
  suggestionsBySection,
  totalSuggestions,
}: SuggestionListClientProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter suggestions by selected types
  const filteredBySection = useMemo(() => {
    if (selectedTypes.length === 0) {
      return suggestionsBySection;
    }

    const filtered: Record<string, DisplaySuggestion[]> = {};
    for (const section of RESUME_SECTIONS) {
      filtered[section] = (suggestionsBySection[section] || []).filter(
        (s) => selectedTypes.includes(s.suggestionType)
      );
    }
    return filtered;
  }, [suggestionsBySection, selectedTypes]);

  // Calculate totals for filtered view
  const filteredTotal = useMemo(() => {
    return Object.values(filteredBySection).reduce(
      (sum, suggestions) => sum + suggestions.length,
      0
    );
  }, [filteredBySection]);

  // Pagination logic - flatten, paginate, then re-group
  const paginatedBySection = useMemo(() => {
    // Flatten all suggestions with section info
    const allSuggestions: (DisplaySuggestion & { _section: string })[] = [];
    for (const section of RESUME_SECTIONS) {
      for (const suggestion of filteredBySection[section] || []) {
        allSuggestions.push({ ...suggestion, _section: section });
      }
    }

    // Paginate
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = allSuggestions.slice(startIndex, endIndex);

    // Re-group by section
    const grouped: Record<string, DisplaySuggestion[]> = {};
    for (const section of RESUME_SECTIONS) {
      grouped[section] = [];
    }
    for (const item of paginated) {
      const { _section, ...suggestion } = item;
      grouped[_section].push(suggestion);
    }

    return grouped;
  }, [filteredBySection, currentPage]);

  const totalPages = Math.ceil(filteredTotal / ITEMS_PER_PAGE);

  const sectionsWithIssues = Object.values(filteredBySection).filter(
    (s) => s.length > 0
  ).length;
  const strongSections = Object.values(filteredBySection).filter(
    (s) => s.length === 0
  ).length;

  // Handle filter changes
  const handleFilterChange = (types: string[]) => {
    setSelectedTypes(types);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (totalSuggestions === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-2" />
        <h3 className="font-semibold text-green-900">No suggestions found!</h3>
        <p className="text-sm text-green-700 mt-1">
          Your resume is already optimized and follows best practices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-900">
            {selectedTypes.length > 0 ? "Filtered Suggestions" : "Total Suggestions"}
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {filteredTotal}
            {selectedTypes.length > 0 && (
              <span className="text-sm font-normal text-blue-500 ml-2">
                of {totalSuggestions}
              </span>
            )}
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
      <SuggestionTypeFilter
        selectedTypes={selectedTypes}
        onFilterChange={handleFilterChange}
      />

      {/* Sections */}
      <div className="space-y-4">
        {RESUME_SECTIONS.map((section) => (
          <SuggestionSection
            key={section}
            section={section}
            suggestions={paginatedBySection[section] || []}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredTotal)} of{" "}
            {filteredTotal} suggestions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

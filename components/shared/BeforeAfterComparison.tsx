/**
 * BeforeAfterComparison Container Component
 *
 * Manages multiple section comparisons with collapse/expand functionality.
 * Displays before/after text comparisons for resume sections.
 *
 * Features:
 * - Collapsible container to save vertical space
 * - Tab/accordion view to switch between sections
 * - Navigation between multiple suggestions per section
 * - State management for active section and suggestion
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { ComparisonCard } from './ComparisonCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ComparisonSection {
  /** Section title (e.g., 'Summary', 'Skills', 'Experience') */
  title: string;
  /** Original text from resume */
  original: string;
  /** Array of suggested improvements */
  suggestions: Array<{
    text: string;
    section_name?: string;
  }>;
}

interface BeforeAfterComparisonProps {
  /** Array of sections to compare */
  sections: ComparisonSection[];
  /** Optional CSS class */
  className?: string;
  /** Initial collapsed state (default: false) */
  initialCollapsed?: boolean;
}

/**
 * Container component managing multiple before/after comparisons.
 *
 * Provides tabbed navigation between sections and handles
 * multiple suggestions per section with previous/next controls.
 */
export function BeforeAfterComparison({
  sections,
  className = '',
  initialCollapsed = false,
}: BeforeAfterComparisonProps) {
  const COLLAPSE_KEY = 'submitSmart:comparisonCollapsed';
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored !== null) return stored === 'true';
    }
    return initialCollapsed;
  });
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<
    Record<string, number>
  >({});

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Filter out sections with no suggestions
  const validSections = useMemo(
    () => sections.filter((section) => section.suggestions.length > 0),
    [sections]
  );

  // Handle case where there are no valid sections
  if (validSections.length === 0) {
    return null;
  }

  // Calculate total changes across all sections
  const totalSections = validSections.length;
  const summaryText = `${totalSections} section${totalSections !== 1 ? 's' : ''} with changes`;

  // Get active suggestion for a section (default to first)
  const getActiveSuggestionIndex = (sectionTitle: string): number => {
    return activeSuggestionIndex[sectionTitle] ?? 0;
  };

  // Navigate to previous suggestion
  const handlePrevious = (sectionTitle: string) => {
    const currentIndex = getActiveSuggestionIndex(sectionTitle);
    if (currentIndex > 0) {
      setActiveSuggestionIndex((prev) => ({
        ...prev,
        [sectionTitle]: currentIndex - 1,
      }));
    }
  };

  // Navigate to next suggestion
  const handleNext = (sectionTitle: string, maxIndex: number) => {
    const currentIndex = getActiveSuggestionIndex(sectionTitle);
    if (currentIndex < maxIndex - 1) {
      setActiveSuggestionIndex((prev) => ({
        ...prev,
        [sectionTitle]: currentIndex + 1,
      }));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with collapse/expand */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Before & After Comparison
          </h3>
          {isCollapsed && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {summaryText}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="gap-2"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand comparison' : 'Collapse comparison'}
        >
          {isCollapsed ? (
            <>
              Show Comparison
              <ChevronDown className="h-4 w-4" />
            </>
          ) : (
            <>
              Hide Comparison
              <ChevronUp className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="space-y-4">
          {/* Single section: Show directly without tabs */}
          {validSections.length === 1 ? (
            (() => {
              const section = validSections[0];
              const activeIndex = getActiveSuggestionIndex(section.title);
              const activeSuggestion = section.suggestions[activeIndex];

              return (
                <ComparisonCard
                  sectionTitle={section.title}
                  originalText={section.original}
                  suggestedText={activeSuggestion.text}
                  index={section.suggestions.length > 1 ? activeIndex + 1 : undefined}
                  total={
                    section.suggestions.length > 1
                      ? section.suggestions.length
                      : undefined
                  }
                  onPrevious={
                    section.suggestions.length > 1
                      ? () => handlePrevious(section.title)
                      : undefined
                  }
                  onNext={
                    section.suggestions.length > 1
                      ? () => handleNext(section.title, section.suggestions.length)
                      : undefined
                  }
                />
              );
            })()
          ) : (
            /* Multiple sections: Use tabs */
            <Tabs defaultValue={validSections[0].title} className="w-full">
              <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${validSections.length}, minmax(0, 1fr))` }}>
                {validSections.map((section) => (
                  <TabsTrigger key={section.title} value={section.title}>
                    {section.title}
                    {section.suggestions.length > 1 && (
                      <span className="ml-1.5 text-xs text-gray-500">
                        ({section.suggestions.length})
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {validSections.map((section) => {
                const activeIndex = getActiveSuggestionIndex(section.title);
                const activeSuggestion = section.suggestions[activeIndex];

                return (
                  <TabsContent
                    key={section.title}
                    value={section.title}
                    className="mt-4"
                  >
                    <ComparisonCard
                      sectionTitle={section.title}
                      originalText={section.original}
                      suggestedText={activeSuggestion.text}
                      index={
                        section.suggestions.length > 1 ? activeIndex + 1 : undefined
                      }
                      total={
                        section.suggestions.length > 1
                          ? section.suggestions.length
                          : undefined
                      }
                      onPrevious={
                        section.suggestions.length > 1
                          ? () => handlePrevious(section.title)
                          : undefined
                      }
                      onNext={
                        section.suggestions.length > 1
                          ? () =>
                              handleNext(section.title, section.suggestions.length)
                          : undefined
                      }
                    />
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}

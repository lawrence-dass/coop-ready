'use client';

import { useOptimizationStore } from '@/store/useOptimizationStore';
import { SuggestionSection } from './SuggestionSection';
import { AlertCircle } from 'lucide-react';

export interface SuggestionDisplayProps {
  /** Additional className */
  className?: string;
}

/**
 * SuggestionDisplay Component
 *
 * Main container for displaying all optimization suggestions.
 * Reads from Zustand store and renders SuggestionSection components
 * for each available section (Summary, Skills, Experience).
 *
 * Story 6.5: Implement Suggestion Display UI
 */
export function SuggestionDisplay({ className }: SuggestionDisplayProps) {
  // Get suggestions from Zustand store
  const summarySuggestion = useOptimizationStore(
    (state) => state.summarySuggestion
  );
  const skillsSuggestion = useOptimizationStore(
    (state) => state.skillsSuggestion
  );
  const experienceSuggestion = useOptimizationStore(
    (state) => state.experienceSuggestion
  );

  // Get loading state from store
  const isLoading = useOptimizationStore((state) => state.isLoading);
  const loadingStep = useOptimizationStore((state) => state.loadingStep);

  // Determine if suggestions are being generated
  const isGenerating = isLoading && loadingStep === 'generating-suggestions';

  // Check if any suggestions exist
  const hasSuggestions =
    summarySuggestion !== null ||
    skillsSuggestion !== null ||
    experienceSuggestion !== null;

  // Empty state (not loading and no suggestions)
  if (!hasSuggestions && !isGenerating) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-12 px-6 border border-gray-200 rounded-lg bg-gray-50 ${className ?? ''}`}
      >
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No suggestions available yet
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Upload a resume and job description, then run the analysis to generate
          optimization suggestions.
        </p>
      </div>
    );
  }

  // Render sections that have data (or show loading state during generation)
  return (
    <div className={`space-y-8 ${className ?? ''}`}>
      {(summarySuggestion || isGenerating) && (
        <SuggestionSection
          section="summary"
          suggestion={summarySuggestion}
          sectionLabel="Summary"
          loading={isGenerating && !summarySuggestion}
        />
      )}

      {(skillsSuggestion || isGenerating) && (
        <SuggestionSection
          section="skills"
          suggestion={skillsSuggestion}
          sectionLabel="Skills"
          loading={isGenerating && !skillsSuggestion}
        />
      )}

      {(experienceSuggestion || isGenerating) && (
        <SuggestionSection
          section="experience"
          suggestion={experienceSuggestion}
          sectionLabel="Experience"
          loading={isGenerating && !experienceSuggestion}
        />
      )}
    </div>
  );
}

'use client';

import { useOptimizationStore } from '@/store/useOptimizationStore';
import { SuggestionSection } from './SuggestionSection';
import { AlertCircle } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { regenerateSuggestions } from '@/actions/regenerateSuggestions';

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
 * Story 6.7: Added regenerate functionality
 */
export function SuggestionDisplay({ className }: SuggestionDisplayProps) {
  const [, startTransition] = useTransition();

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

  // Get regenerating state (Story 6.7)
  const isRegeneratingSection = useOptimizationStore((state) => state.isRegeneratingSection) || {};
  const setRegeneratingSection = useOptimizationStore((state) => state.setRegeneratingSection);
  const updateSectionSuggestion = useOptimizationStore((state) => state.updateSectionSuggestion);

  // Get context for regeneration
  const resumeContent = useOptimizationStore((state) => state.resumeContent);
  const jobDescription = useOptimizationStore((state) => state.jobDescription);
  const sessionId = useOptimizationStore((state) => state.sessionId);
  const keywordAnalysis = useOptimizationStore((state) => state.keywordAnalysis);

  // Determine if suggestions are being generated
  const isGenerating = isLoading && loadingStep === 'generating-suggestions';

  /**
   * Handle regeneration for a specific section (Story 6.7)
   */
  const handleRegenerate = async (
    sectionType: 'summary' | 'skills' | 'experience',
    currentContent: string
  ) => {
    // Validate required data
    if (!resumeContent || !jobDescription || !sessionId) {
      toast.error('Missing required data for regeneration');
      return;
    }

    console.log('[SS:ui] Regenerate clicked for section:', sectionType);
    setRegeneratingSection(sectionType, true);
    startTransition(async () => {
      try {
        const result = await regenerateSuggestions({
          currentContent,
          jdContent: jobDescription,
          sectionType,
          sessionId,
          resumeContent: resumeContent?.rawText || undefined,
          keywords: keywordAnalysis?.matched.map((k) => k.keyword),
        });

        if (result.error) {
          toast.error(result.error.message || 'Failed to generate new suggestions');
          return;
        }

        // Update store with new suggestion
        updateSectionSuggestion(sectionType, result.data.suggestion);
        toast.success('New suggestions generated!');
      } catch (error) {
        console.error(`[regenerate-${sectionType}]`, error);
        toast.error('Failed to generate new suggestions');
      } finally {
        setRegeneratingSection(sectionType, false);
      }
    });
  };

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
          regenerating={isRegeneratingSection.summary || false}
          onRegenerate={
            summarySuggestion
              ? () => handleRegenerate('summary', summarySuggestion.original)
              : undefined
          }
        />
      )}

      {(skillsSuggestion || isGenerating) && (
        <SuggestionSection
          section="skills"
          suggestion={skillsSuggestion}
          sectionLabel="Skills"
          loading={isGenerating && !skillsSuggestion}
          regenerating={isRegeneratingSection.skills || false}
          onRegenerate={
            skillsSuggestion
              ? () => handleRegenerate('skills', skillsSuggestion.original)
              : undefined
          }
        />
      )}

      {(experienceSuggestion || isGenerating) && (
        <SuggestionSection
          section="experience"
          suggestion={experienceSuggestion}
          sectionLabel="Experience"
          loading={isGenerating && !experienceSuggestion}
          regenerating={isRegeneratingSection.experience || false}
          onRegenerate={
            experienceSuggestion
              ? () => handleRegenerate('experience', experienceSuggestion.original)
              : undefined
          }
        />
      )}
    </div>
  );
}

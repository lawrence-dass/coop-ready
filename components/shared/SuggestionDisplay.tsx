'use client';

import { useOptimizationStore } from '@/store/useOptimizationStore';
import type { SuggestionSortBy } from '@/store/useOptimizationStore';
import { SuggestionSection } from './SuggestionSection';
import { ScoreComparison } from './ScoreComparison';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import type { ComparisonSection } from './BeforeAfterComparison';
import { calculateCategoryDeltas } from '@/lib/utils/scoreCalculation';
import { AlertCircle, ArrowUpDown } from 'lucide-react';
import { useTransition, useMemo } from 'react';
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

  // Get original ATS score for comparison (Story 11.3)
  const atsScore = useOptimizationStore((state) => state.atsScore);

  // Get regenerating state (Story 6.7)
  const isRegeneratingSection = useOptimizationStore((state) => state.isRegeneratingSection) || {};
  const setRegeneratingSection = useOptimizationStore((state) => state.setRegeneratingSection);
  const updateSectionSuggestion = useOptimizationStore((state) => state.updateSectionSuggestion);

  // Get context for regeneration
  const resumeContent = useOptimizationStore((state) => state.resumeContent);
  const jobDescription = useOptimizationStore((state) => state.jobDescription);
  const sessionId = useOptimizationStore((state) => state.sessionId);
  const keywordAnalysis = useOptimizationStore((state) => state.keywordAnalysis);

  // Sort state (Story 11.1)
  const suggestionSortBy = useOptimizationStore((state) => state.suggestionSortBy);
  const setSuggestionSortBy = useOptimizationStore((state) => state.setSuggestionSortBy);

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

  // Calculate total point value using shared utility
  const categoryDeltas = calculateCategoryDeltas({
    summary: summarySuggestion,
    skills: skillsSuggestion,
    experience: experienceSuggestion,
  });
  const totalPoints = categoryDeltas.summary + categoryDeltas.skills + categoryDeltas.experience;
  const hasTotalPoints = totalPoints > 0;

  // Check if experience bullets have point values (for sort control visibility)
  const hasExperiencePointValues = experienceSuggestion?.experience_entries?.some(
    (entry) => entry.suggested_bullets.some((b) => b.point_value !== undefined)
  ) ?? false;

  // Prepare comparison sections (Story 11.4)
  const comparisonSections = useMemo((): ComparisonSection[] => {
    const sections: ComparisonSection[] = [];

    if (summarySuggestion) {
      sections.push({
        title: 'Summary',
        original: summarySuggestion.original,
        suggestions: [{ text: summarySuggestion.suggested }],
      });
    }

    if (skillsSuggestion) {
      // Build the suggested skills list from existing + additions - removals
      const removalNames = skillsSuggestion.skill_removals.map((r) => r.skill);
      const suggestedSkills = [
        ...skillsSuggestion.existing_skills.filter(
          (s) => !removalNames.includes(s)
        ),
        ...skillsSuggestion.skill_additions,
      ];
      const suggestedText = suggestedSkills.length > 0
        ? suggestedSkills.join(', ')
        : skillsSuggestion.summary || 'Skills optimization available';

      sections.push({
        title: 'Skills',
        original: skillsSuggestion.original,
        suggestions: [{ text: suggestedText }],
      });
    }

    if (experienceSuggestion) {
      // For experience, we can show the full optimized experience or individual bullets
      // For now, we'll create a combined suggested text from all entries
      const suggestedExperience = experienceSuggestion.experience_entries
        .map((entry) => {
          const bullets = entry.suggested_bullets
            .map((b) => `• ${b.suggested}`)
            .join('\n');
          return `${entry.company} - ${entry.role} (${entry.dates})\n${bullets}`;
        })
        .join('\n\n');

      sections.push({
        title: 'Experience',
        original: experienceSuggestion.original,
        suggestions: [{ text: suggestedExperience }],
      });
    }

    return sections;
  }, [summarySuggestion, skillsSuggestion, experienceSuggestion]);

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
    <div className={`space-y-8 ${className ?? ''}`} data-testid="suggestions-display">
      {/* Score Comparison (Story 11.3) */}
      {atsScore && hasSuggestions && (
        <ScoreComparison
          originalScore={atsScore.overall}
          suggestions={{
            summary: summarySuggestion,
            skills: skillsSuggestion,
            experience: experienceSuggestion,
          }}
          isLoading={Object.values(isRegeneratingSection).some(Boolean)}
        />
      )}

      {/* Before/After Text Comparison (Story 11.4) */}
      {hasSuggestions && comparisonSections.length > 0 && (
        <BeforeAfterComparison
          sections={comparisonSections}
          initialCollapsed={false}
        />
      )}

      {/* Total Improvement Banner */}
      {hasTotalPoints && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Total Potential Improvement
              </h3>
              <p className="text-sm text-gray-600">
                Estimated ATS score increase if you apply all suggestions
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">
                +{totalPoints}
              </div>
              <div className="text-sm text-gray-600 font-medium">points</div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Control (Story 11.1) */}
      {hasExperiencePointValues && (
        <div className="flex items-center justify-end gap-2" data-testid="sort-control">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <label htmlFor="suggestion-sort" className="text-sm text-gray-600">
            Sort experience by:
          </label>
          <select
            id="suggestion-sort"
            value={suggestionSortBy}
            onChange={(e) => setSuggestionSortBy(e.target.value as SuggestionSortBy)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            data-testid="sort-select"
          >
            <option value="points-high">Points: High → Low</option>
            <option value="points-low">Points: Low → High</option>
            <option value="relevance">Relevance (LLM order)</option>
          </select>
        </div>
      )}

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
          sortBy={suggestionSortBy}
        />
      )}
    </div>
  );
}

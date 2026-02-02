'use client';

// Story 5.1 + 5.2: Analyze Button Component (Keywords + ATS Score)
// Story 7.3: Added client-side timeout handling
// Story 6.9: Added suggestion generation after analysis
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { analyzeResume } from '@/actions/analyzeResume';
import { generateAllSuggestions } from '@/actions/generateAllSuggestions';
import { useOptimizationStore, ExtendedOptimizationStore } from '@/store';
import { toast } from 'sonner';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/timeoutUtils';

interface AnalyzeButtonProps {
  /** Session ID for the analysis */
  sessionId: string | null;

  /** Whether resume content exists */
  hasResume: boolean;

  /** Whether job description exists */
  hasJobDescription: boolean;
}

/**
 * Button to trigger resume analysis (keywords + ATS score)
 *
 * Visible only when both resume and JD are present.
 * Uses useTransition for loading state with multi-step progress.
 */
export function AnalyzeButton({
  sessionId,
  hasResume,
  hasJobDescription
}: AnalyzeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [loadingStep, setLoadingStep] = useState<string>('');
  const setKeywordAnalysis = useOptimizationStore((state: ExtendedOptimizationStore) => state.setKeywordAnalysis);
  const setATSScore = useOptimizationStore((state: ExtendedOptimizationStore) => state.setATSScore);
  const setGeneralError = useOptimizationStore((state: ExtendedOptimizationStore) => state.setGeneralError);
  const setSummarySuggestion = useOptimizationStore((state: ExtendedOptimizationStore) => state.setSummarySuggestion);
  const setSkillsSuggestion = useOptimizationStore((state: ExtendedOptimizationStore) => state.setSkillsSuggestion);
  const setExperienceSuggestion = useOptimizationStore((state: ExtendedOptimizationStore) => state.setExperienceSuggestion);
  const setEducationSuggestion = useOptimizationStore((state: ExtendedOptimizationStore) => state.setEducationSuggestion);
  const resumeContent = useOptimizationStore((state: ExtendedOptimizationStore) => state.resumeContent);
  const jobDescription = useOptimizationStore((state: ExtendedOptimizationStore) => state.jobDescription);
  const userPreferences = useOptimizationStore((state: ExtendedOptimizationStore) => state.userPreferences);

  // Don't show button if resume or JD is missing
  if (!hasResume || !hasJobDescription) {
    return null;
  }

  // Don't show if no session ID
  if (!sessionId) {
    return null;
  }

  const handleAnalyze = () => {
    startTransition(async () => {
      try {
        // Step 1: Extracting keywords
        console.log('[SS:ui] Analyze button clicked, sessionId:', sessionId);
        setLoadingStep('Analyzing keywords...');

        // Wrap analyzeResume with client-side timeout (Story 7.3)
        // This provides first line of defense before server-side timeout
        const { data, error } = await fetchWithTimeout(
          analyzeResume(sessionId),
          TIMEOUT_MS
        );

        if (error) {
          console.error('[SS:ui] Analysis error:', error.code, '-', error.message);
          setLoadingStep('');

          // Store error in general error state — ErrorDisplay component handles display
          setGeneralError({ code: error.code, message: error.message });
          return;
        }

        // Success - update store with both keyword analysis and score
        console.log('[SS:ui] Analysis result received. Score:', data.atsScore.overall);
        setKeywordAnalysis(data.keywordAnalysis);
        setATSScore(data.atsScore);

        toast.success(`Analysis complete! Your ATS score is ${data.atsScore.overall}`);

        // Clear loading state immediately - don't wait for suggestions
        setLoadingStep('');

        // Story 6.9: Trigger suggestion generation in background (fire-and-forget)
        // The suggestions page already handles loading state via SuggestionsLoadingState
        // which polls every 5 seconds for updates
        if (resumeContent) {
          console.log('[SS:ui] Starting background suggestion generation');

          generateAllSuggestions({
            sessionId,
            resumeSummary: resumeContent.summary || '',
            resumeSkills: resumeContent.skills || '',
            resumeExperience: resumeContent.experience || '',
            resumeEducation: resumeContent.education || '',
            resumeContent: resumeContent.rawText,
            jobDescription: jobDescription || '',
            keywords: data.keywordAnalysis?.matched?.map((k: { keyword: string }) => k.keyword),
            preferences: userPreferences, // Story 11.2: Pass user preferences
          }).then((suggestionsResult) => {
            // Update Zustand store when ready (for users who stay on current page)
            if (suggestionsResult.data) {
              console.log('[SS:ui] Background suggestions completed');
              if (suggestionsResult.data.summary) {
                setSummarySuggestion(suggestionsResult.data.summary);
              }
              if (suggestionsResult.data.skills) {
                setSkillsSuggestion(suggestionsResult.data.skills);
              }
              if (suggestionsResult.data.experience) {
                setExperienceSuggestion(suggestionsResult.data.experience);
              }
              if (suggestionsResult.data.education) {
                setEducationSuggestion(suggestionsResult.data.education);
              }

              // Toast for partial failures
              const { sectionErrors } = suggestionsResult.data;
              const failedSections = Object.keys(sectionErrors).filter(
                (key) => sectionErrors[key as keyof typeof sectionErrors]
              );
              if (failedSections.length > 0) {
                toast.error(`Some suggestions failed: ${failedSections.join(', ')}`);
              }
            } else if (suggestionsResult.error) {
              console.error('[SS:ui] Background suggestion generation failed:', suggestionsResult.error);
              // Don't show toast for background errors - user will see loading state on suggestions page
            }
          }).catch((err) => {
            console.error('[SS:ui] Background suggestion generation error:', err);
            // Don't show toast for background errors - user will see loading state on suggestions page
          });
        }

      } catch (err) {
        setLoadingStep('');

        // Check if this is a timeout error from fetchWithTimeout
        if (err instanceof Error && err.message.includes('Timeout after')) {
          console.error('[AnalyzeButton] Client-side timeout:', err.message);
          setGeneralError({ code: 'LLM_TIMEOUT', message: 'Analysis exceeded 60 second timeout' });
        } else {
          console.error('[AnalyzeButton] Error:', err);
          setGeneralError({ code: 'LLM_ERROR', message: 'Unexpected error occurred' });
        }
      }
    });
  };

  return (
    <Button
      onClick={handleAnalyze}
      disabled={isPending}
      className="w-full bg-primary hover:bg-primary/90"
      data-testid="optimize-button"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingStep || 'Analyzing...'}
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze Resume
        </>
      )}
    </Button>
  );
}

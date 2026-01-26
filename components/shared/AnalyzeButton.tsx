'use client';

// Story 5.1 + 5.2: Analyze Button Component (Keywords + ATS Score)
// Story 7.3: Added client-side timeout handling
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { analyzeResume } from '@/actions/analyzeResume';
import { useOptimizationStore } from '@/store';
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
  const setKeywordAnalysis = useOptimizationStore((state) => state.setKeywordAnalysis);
  const setATSScore = useOptimizationStore((state) => state.setATSScore);
  const setGeneralError = useOptimizationStore((state) => state.setGeneralError);

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

        setLoadingStep('');
        toast.success(`Analysis complete! Your ATS score is ${data.atsScore.overall}`);

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
      className="w-full bg-indigo-600 hover:bg-indigo-700"
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

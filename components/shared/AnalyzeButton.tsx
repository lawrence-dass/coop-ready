'use client';

// Story 5.1 + 5.2: Analyze Button Component (Keywords + ATS Score)
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { analyzeResume } from '@/actions/analyzeResume';
import { useOptimizationStore } from '@/store';
import { toast } from 'sonner';

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

        const { data, error } = await analyzeResume(sessionId);

        if (error) {
          console.error('[SS:ui] Analysis error:', error.code, '-', error.message);
          setLoadingStep('');

          // Handle specific error codes
          if (error.code === 'LLM_TIMEOUT') {
            toast.error('Analysis timed out. Please try again.');
          } else if (error.code === 'LLM_ERROR') {
            toast.error('Analysis failed. Please retry.');
          } else if (error.code === 'SCORE_CALCULATION_ERROR') {
            toast.error('Failed to calculate score. Please try again.');
          } else if (error.code === 'RATE_LIMITED') {
            toast.error('Rate limit exceeded. Please wait and try again.');
          } else {
            toast.error(error.message);
          }
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
        toast.error('Unexpected error occurred. Please try again.');
        console.error('[AnalyzeButton] Error:', err);
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

'use client';

// Story 5.1: Analyze Button Component
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { analyzeKeywords } from '@/actions/analyzeKeywords';
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
 * Button to trigger keyword analysis
 *
 * Visible only when both resume and JD are present.
 * Uses useTransition for loading state.
 */
export function AnalyzeButton({
  sessionId,
  hasResume,
  hasJobDescription
}: AnalyzeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const setKeywordAnalysis = useOptimizationStore((state) => state.setKeywordAnalysis);

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
      const { data, error } = await analyzeKeywords(sessionId);

      if (error) {
        if (error.code === 'LLM_TIMEOUT') {
          toast.error('Analysis timed out. Please try again.');
        } else if (error.code === 'LLM_ERROR') {
          toast.error('Analysis failed. Please retry.');
        } else if (error.code === 'RATE_LIMITED') {
          toast.error('Rate limit exceeded. Please wait and try again.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Success - update store
      setKeywordAnalysis(data);
      toast.success('Analysis complete!');
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
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze Keywords
        </>
      )}
    </Button>
  );
}

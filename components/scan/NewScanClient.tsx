'use client';

/**
 * NewScanClient Component
 *
 * Story 16.3 - Client-side logic for new scan page
 *
 * **Features:**
 * - Resume Upload with validation and library selection
 * - Job Description Input
 * - Preferences Panel (Job Type, Modification Level)
 * - Analyze button with loading state
 * - Error handling and display
 * - Navigation to results page after successful analysis
 *
 * **Flow:**
 * 1. User uploads resume (or selects from library)
 * 2. User enters job description
 * 3. User selects preferences
 * 4. User clicks Analyze
 * 5. Session created in database with resume/JD content
 * 6. /api/optimize called with session_id, resume_content, jd_content, anonymous_id
 * 7. Redirect to /app/scan/[sessionId] on success
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOptimizationStore } from '@/store';
import { ResumeUploader } from '@/components/shared/ResumeUploader';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';
import { PreferencesPanel } from '@/components/scan/PreferencesPanel';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { isJobDescriptionValid } from '@/lib/validations/jobDescription';
import { createScanSession } from '@/actions/scan/create-session';
import type { ActionResponse } from '@/types';

// ============================================================================
// COMPONENT
// ============================================================================

export function NewScanClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Zustand store state
  const resumeContent = useOptimizationStore((state) => state.resumeContent);
  const jobDescription = useOptimizationStore((state) => state.jobDescription);
  const pendingFile = useOptimizationStore((state) => state.pendingFile);
  const fileError = useOptimizationStore((state) => state.fileError);
  const generalError = useOptimizationStore((state) => state.generalError);
  const userPreferences = useOptimizationStore((state) => state.userPreferences);

  // Zustand store actions
  const setPendingFile = useOptimizationStore((state) => state.setPendingFile);
  const setFileError = useOptimizationStore((state) => state.setFileError);
  const setJobDescription = useOptimizationStore((state) => state.setJobDescription);
  const clearJobDescription = useOptimizationStore((state) => state.clearJobDescription);
  const setGeneralError = useOptimizationStore((state) => state.setGeneralError);
  const clearGeneralError = useOptimizationStore((state) => state.clearGeneralError);
  const reset = useOptimizationStore((state) => state.reset);

  // Privacy consent state (Story 15.3)
  const privacyAccepted = useOptimizationStore((state) => state.privacyAccepted);

  // Derived state: can we analyze?
  const hasResume = !!resumeContent;
  const hasValidJD = isJobDescriptionValid(jobDescription || '');
  // Must have resume, valid JD, privacy consent, and not be in pending state
  const canAnalyze = hasResume && hasValidJD && privacyAccepted === true && !isPending;

  // ============================================================================
  // FILE HANDLERS
  // ============================================================================

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    clearGeneralError();
  };

  const handleFileRemove = () => {
    setPendingFile(null);
    setFileError(null);
    clearGeneralError();
  };

  const handleFileError = (error: { code: string; message: string }) => {
    setFileError(error as { code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE'; message: string });
  };

  // ============================================================================
  // JD HANDLERS
  // ============================================================================

  const handleJDChange = (text: string) => {
    setJobDescription(text);
    clearGeneralError();
  };

  const handleJDClear = () => {
    clearJobDescription();
    clearGeneralError();
  };

  // ============================================================================
  // ANALYZE HANDLER
  // ============================================================================

  const handleAnalyze = () => {
    startTransition(async () => {
      try {
        // Step 0: Clear previous session state (AC #4)
        reset();
        clearGeneralError();

        setLoadingStep('Creating session...');

        // Step 1: Create a new session in database with resume and JD content
        // This server action handles auth and creates the session record
        // resumeContent is Resume object with rawText property
        const rawResumeText = typeof resumeContent === 'string'
          ? resumeContent
          : resumeContent?.rawText || '';

        const sessionResult = await createScanSession({
          resumeContent: rawResumeText,
          jobDescription: jobDescription || '',
        });

        if (sessionResult.error) {
          throw new Error(sessionResult.error.message || 'Failed to create session');
        }

        const { sessionId, anonymousId } = sessionResult.data!;

        setLoadingStep('Analyzing resume (this may take up to 60 seconds)...');

        // Step 2: Call /api/optimize with correct field names (snake_case)
        // API expects: resume_content, jd_content, session_id, anonymous_id
        const response = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_content: rawResumeText,
            jd_content: jobDescription,
            session_id: sessionId,
            anonymous_id: anonymousId,
          }),
        });

        // Parse response (API always returns 200 with ActionResponse pattern)
        const result = await response.json() as ActionResponse<{
          keywordAnalysis: unknown;
          atsScore: unknown;
          sessionId: string;
        }>;

        // Check for API-level errors
        if (result.error) {
          throw new Error(result.error.message || 'Analysis failed');
        }

        // Step 3: Store results in Zustand for immediate use on results page
        if (result.data) {
          useOptimizationStore.getState().setSessionId(sessionId);
          useOptimizationStore.getState().setKeywordAnalysis(result.data.keywordAnalysis as import('@/types/analysis').KeywordAnalysisResult);
          useOptimizationStore.getState().setATSScore(result.data.atsScore as import('@/types/analysis').ATSScore);
        }

        // Step 4: Navigate to results page
        setLoadingStep('Redirecting to results...');
        toast.success('Analysis complete!');

        // Navigate to /app/scan/[sessionId]
        router.push(`/app/scan/${sessionId}`);
      } catch (error) {
        setLoadingStep('');

        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';

        // Extract error code from message if available, or infer from content
        let errorCode = 'LLM_ERROR';
        if (errorMessage.toLowerCase().includes('timeout')) {
          errorCode = 'LLM_TIMEOUT';
        } else if (errorMessage.toLowerCase().includes('validation')) {
          errorCode = 'VALIDATION_ERROR';
        } else if (errorMessage.toLowerCase().includes('rate')) {
          errorCode = 'RATE_LIMITED';
        }

        setGeneralError({
          code: errorCode,
          message: errorMessage,
        });

        toast.error('Analysis failed. Please try again.');
      }
    });
  };

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const handleErrorRetry = () => {
    clearGeneralError();
    setFileError(null);
  };

  const displayError = generalError || fileError;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {displayError && (
        <ErrorDisplay
          errorCode={displayError.code}
          message={displayError.message}
          onRetry={handleErrorRetry}
          onDismiss={() => {
            clearGeneralError();
            setFileError(null);
          }}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Resume Upload */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. Upload Resume</h2>
          <ResumeUploader
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            onError={handleFileError}
            selectedFile={
              pendingFile ? { name: pendingFile.name, size: pendingFile.size } : null
            }
          />
        </div>

        {/* Right Column: Job Description + Preferences */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">2. Enter Job Description</h2>
            <JobDescriptionInput
              value={jobDescription || ''}
              onChange={handleJDChange}
              onClear={handleJDClear}
              isDisabled={isPending}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">3. Configure Preferences</h2>
            <PreferencesPanel />
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          size="lg"
          className="w-full max-w-md bg-indigo-600 hover:bg-indigo-700"
          data-testid="analyze-button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {loadingStep || 'Analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyze Resume
            </>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      {!canAnalyze && !isPending && (
        <p className="text-center text-sm text-muted-foreground">
          {!hasResume && 'Upload a resume to get started'}
          {hasResume && !hasValidJD && 'Enter a job description (minimum 50 characters)'}
          {hasResume && hasValidJD && privacyAccepted !== true && 'Accept privacy consent to continue'}
        </p>
      )}
    </div>
  );
}

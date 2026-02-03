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
 * 7. Redirect to /scan/[sessionId] on success
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOptimizationStore, ExtendedOptimizationStore } from '@/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { ResumeUploader } from '@/components/shared/ResumeUploader';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';
import { PreferencesPanel } from '@/components/scan/PreferencesPanel';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { PrivacyConsentDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { isJobDescriptionValid } from '@/lib/validations/jobDescription';
import { createScanSession } from '@/actions/scan/create-session';
import { generateAllSuggestions } from '@/actions/generateAllSuggestions';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';
import { acceptPrivacyConsent } from '@/actions/privacy/accept-privacy-consent';
import type { ActionResponse } from '@/types';
import type { OptimizationPrivacyReport } from '@/types/privacy';
import { ROUTES } from '@/lib/constants/routes';

// ============================================================================
// TIPS & STATS (shown during analysis)
// ============================================================================

const ANALYSIS_TIPS = [
  'Recruiters spend just 7.4 seconds on initial resume scan — make your top third count.',
  'Resumes with 80%+ keyword match get 2.3x more callbacks than those below 70%.',
  'Matching the exact job title increases interview chances by 10.6x - mirror it in your headline.',
  'Customized resumes are 2.6x more likely to land interviews than generic ones.',
  '80% of recruiter attention goes to: job titles, current role, education, and skills section.',
  'Bullets with quantified results get 40% more engagement - add numbers wherever possible.',
  'The average job posting receives 250+ applications - only 4-6 candidates get interviews.',
  '98% of Fortune 500 companies use ATS — formatting for machines matters as much as humans.',
  'Keyword stuffing backfires: 67% rejection rate vs. 34% when keywords flow naturally.',
  'Resumes scoring 85%+ ATS match see ~45% callback rates - aim for that threshold.',
];

// ============================================================================
// COMPONENT
// ============================================================================

export function NewScanClient() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [pendingFileForConsent, setPendingFileForConsent] = useState<File | null>(null);
  const [isPendingConsent, startConsentTransition] = useTransition();
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips while analyzing
  useEffect(() => {
    if (!isPending) {
      setTipIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ANALYSIS_TIPS.length);
    }, 5000); // Change tip every 5 seconds

    return () => clearInterval(interval);
  }, [isPending]);

  // Privacy consent hook
  const { privacyAccepted, refetch: refetchPrivacyConsent } = usePrivacyConsent();

  // Zustand store state
  const resumeContent = useOptimizationStore((state: ExtendedOptimizationStore) => state.resumeContent);
  const jobDescription = useOptimizationStore((state: ExtendedOptimizationStore) => state.jobDescription);
  const pendingFile = useOptimizationStore((state: ExtendedOptimizationStore) => state.pendingFile);
  const fileError = useOptimizationStore((state: ExtendedOptimizationStore) => state.fileError);
  const generalError = useOptimizationStore((state: ExtendedOptimizationStore) => state.generalError);
  const userPreferences = useOptimizationStore((state: ExtendedOptimizationStore) => state.userPreferences);
  const isExtracting = useOptimizationStore((state: ExtendedOptimizationStore) => state.isExtracting);
  const showPrivacyDialog = useOptimizationStore((state: ExtendedOptimizationStore) => state.showPrivacyDialog);

  // Zustand store actions
  const setPendingFile = useOptimizationStore((state: ExtendedOptimizationStore) => state.setPendingFile);
  const setFileError = useOptimizationStore((state: ExtendedOptimizationStore) => state.setFileError);
  const setJobDescription = useOptimizationStore((state: ExtendedOptimizationStore) => state.setJobDescription);
  const clearJobDescription = useOptimizationStore((state: ExtendedOptimizationStore) => state.clearJobDescription);
  const setGeneralError = useOptimizationStore((state: ExtendedOptimizationStore) => state.setGeneralError);
  const clearGeneralError = useOptimizationStore((state: ExtendedOptimizationStore) => state.clearGeneralError);
  const setShowPrivacyDialog = useOptimizationStore((state: ExtendedOptimizationStore) => state.setShowPrivacyDialog);
  const setPrivacyAccepted = useOptimizationStore((state: ExtendedOptimizationStore) => state.setPrivacyAccepted);
  const clearResumeAndResults = useOptimizationStore((state: ExtendedOptimizationStore) => state.clearResumeAndResults);

  // Derived state: can we analyze?
  const hasResume = !!resumeContent;
  const hasValidJD = isJobDescriptionValid(jobDescription || '');
  // Privacy consent: required for authenticated users (true), not required for anonymous (null)
  const hasPrivacyConsent = !isAuthenticated || privacyAccepted === true;
  // Must have resume, valid JD, privacy consent (if authenticated), and not be in pending state
  const canAnalyze = hasResume && hasValidJD && hasPrivacyConsent && !isPending;

  // ============================================================================
  // FILE HANDLERS
  // ============================================================================

  const handleFileSelect = (file: File) => {
    // Privacy consent check for authenticated users (Story 15.3)
    if (isAuthenticated && privacyAccepted === false) {
      setPendingFileForConsent(file);
      setShowPrivacyDialog(true);
      return;
    }

    // CRITICAL: Clear old resume so extraction effect triggers
    clearResumeAndResults();
    setPendingFile(file);
    clearGeneralError();
  };

  // Handle privacy consent acceptance (Story 15.3)
  const handleAcceptConsent = () => {
    startConsentTransition(async () => {
      const { data, error } = await acceptPrivacyConsent();

      if (error) {
        toast.error(error.message || 'Failed to save consent');
        return;
      }

      // Update store with new consent status
      setPrivacyAccepted(data.privacyAccepted, data.privacyAcceptedAt);
      toast.success('Privacy consent accepted');
      setShowPrivacyDialog(false);

      // Now process the pending file
      if (pendingFileForConsent) {
        clearResumeAndResults();
        setPendingFile(pendingFileForConsent);
        setPendingFileForConsent(null);
      }

      // Refetch to ensure we have latest status
      await refetchPrivacyConsent();
    });
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
        // Clear any previous errors but keep inputs visible during analysis
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
          analysisTimeMs?: number;
          privacyReport?: OptimizationPrivacyReport;
        }>;

        // Log analysis timing in browser console
        if (result.data?.analysisTimeMs) {
          const timeInSeconds = (result.data.analysisTimeMs / 1000).toFixed(2);
          console.log(`⏱️  Resume analysis completed in ${result.data.analysisTimeMs}ms (${timeInSeconds}s)`);
        }

        // Check for API-level errors
        if (result.error) {
          throw new Error(result.error.message || 'Analysis failed');
        }

        // Step 3: Store results in Zustand for immediate use on results page
        if (result.data) {
          useOptimizationStore.getState().setSessionId(sessionId);
          useOptimizationStore.getState().setKeywordAnalysis(result.data.keywordAnalysis as import('@/types/analysis').KeywordAnalysisResult);
          useOptimizationStore.getState().setATSScore(result.data.atsScore as import('@/types/analysis').ATSScore);

          // Store privacy report if available
          if (result.data.privacyReport) {
            useOptimizationStore.getState().setPrivacyReport(result.data.privacyReport);
          }
        }

        // Step 3b: Fire-and-forget suggestion generation
        // Suggestions page handles loading state via SuggestionsLoadingState (polls every 5s)
        if (resumeContent && result.data?.keywordAnalysis) {
          const keywordAnalysis = result.data.keywordAnalysis as import('@/types/analysis').KeywordAnalysisResult;

          // Log resume sections for debugging
          console.log('[NewScanClient] Resume sections:', {
            hasSummary: !!resumeContent.summary,
            summaryLength: resumeContent.summary?.length || 0,
            hasSkills: !!resumeContent.skills,
            skillsLength: resumeContent.skills?.length || 0,
            hasExperience: !!resumeContent.experience,
            experienceLength: resumeContent.experience?.length || 0,
          });

          // Start suggestion generation in background - don't await
          console.log('[NewScanClient] Starting background suggestion generation');
          generateAllSuggestions({
            sessionId,
            resumeSummary: resumeContent.summary || '',
            resumeSkills: resumeContent.skills || '',
            resumeExperience: resumeContent.experience || '',
            resumeEducation: resumeContent.education || '',
            resumeContent: rawResumeText,
            jobDescription: jobDescription || '',
            keywords: keywordAnalysis.matched?.map((k: { keyword: string }) => k.keyword),
            preferences: userPreferences,
          }).then((suggestionsResult) => {
            // Update Zustand store when ready (for edge cases where user stays on page)
            if (suggestionsResult.error) {
              console.error('[NewScanClient] Background suggestions failed:', JSON.stringify(suggestionsResult.error));
            } else if (suggestionsResult.data) {
              console.log('[NewScanClient] Background suggestions completed');
              const store = useOptimizationStore.getState();
              if (suggestionsResult.data.summary) {
                store.setSummarySuggestion(suggestionsResult.data.summary);
              }
              if (suggestionsResult.data.skills) {
                store.setSkillsSuggestion(suggestionsResult.data.skills);
              }
              if (suggestionsResult.data.experience) {
                store.setExperienceSuggestion(suggestionsResult.data.experience);
              }
              if (suggestionsResult.data.education) {
                store.setEducationSuggestion(suggestionsResult.data.education);
              }
            }
          }).catch((err) => {
            console.error('[NewScanClient] Background suggestion generation error:', err);
          });
        }

        // Step 4: Navigate to results page immediately (don't wait for suggestions)
        toast.success('Analysis complete!');

        // Navigate to scan results page
        router.push(ROUTES.APP.SCAN.SESSION(sessionId));
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

      {/* Main Content Grid - Resume & Job Description */}
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
          {/* Success Banner - Shows after resume extraction */}
          {resumeContent && !isExtracting && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" data-testid="resume-parsed">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="flex-1">
                Resume extracted successfully ({(resumeContent.rawText?.length || 0).toLocaleString()} characters)
              </p>
              <button
                type="button"
                onClick={clearResumeAndResults}
                className="ml-auto rounded-md p-1 text-green-600 hover:bg-green-100 hover:text-green-800"
                aria-label="Clear extracted resume"
                data-testid="clear-resume-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Job Description */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">2. Enter Job Description</h2>
          <JobDescriptionInput
            value={jobDescription || ''}
            onChange={handleJDChange}
            onClear={handleJDClear}
            isDisabled={isPending}
          />
        </div>
      </div>

      {/* Full-width Preferences Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">3. Configure Preferences</h2>
        <PreferencesPanel />
      </div>

      {/* Analyze Button */}
      <div className="flex flex-col items-center pt-4 gap-4">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          size="lg"
          className="w-full max-w-md bg-primary hover:bg-primary/90"
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

        {/* Tips shown during analysis */}
        {isPending && (
          <p className="text-center text-sm text-muted-foreground max-w-lg animate-fade-in">
            💡 {ANALYSIS_TIPS[tipIndex]}
          </p>
        )}
      </div>

      {/* Helper Text */}
      {!canAnalyze && !isPending && (
        <p className="text-center text-sm text-muted-foreground">
          {!hasResume && 'Upload a resume to get started'}
          {hasResume && !hasValidJD && 'Enter a job description (minimum 50 characters)'}
          {hasResume && hasValidJD && !hasPrivacyConsent && 'Accept privacy consent to continue'}
        </p>
      )}

      {/* Privacy Consent Dialog (Story 15.3) */}
      <PrivacyConsentDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
        onAccept={handleAcceptConsent}
      />
    </div>
  );
}

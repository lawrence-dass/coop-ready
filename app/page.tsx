'use client';

/**
 * Home Page - Resume Optimization Interface
 *
 * Main page where users upload resumes and get optimization suggestions.
 */

import { ResumeUploader, FileValidationError, JobDescriptionInput, AnalyzeButton, KeywordAnalysisDisplay, ATSScoreDisplay, ErrorDisplay, SuggestionDisplay, SignOutButton, PrivacyConsentDialog } from '@/components/shared';
import { SaveResumeButton } from '@/components/resume/SaveResumeButton';
import { SelectResumeButton } from '@/components/resume/SelectResumeButton';
import { PreferencesDialog } from '@/components/shared/PreferencesDialog';
import { useOptimizationStore, selectPendingFile, selectFileError, selectJobDescription, selectKeywordAnalysis, selectATSScore, selectGeneralError, selectRetryCount, selectIsRetrying } from '@/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, History as HistoryIcon, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { getPreferences } from '@/actions/preferences';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';
import { acceptPrivacyConsent } from '@/actions/privacy/accept-privacy-consent';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const pendingFile = useOptimizationStore(selectPendingFile);
  const fileError = useOptimizationStore(selectFileError);
  const resumeContent = useOptimizationStore((state) => state.resumeContent);
  const isExtracting = useOptimizationStore((state) => state.isExtracting);
  const setPendingFile = useOptimizationStore((state) => state.setPendingFile);
  const setFileError = useOptimizationStore((state) => state.setFileError);
  const jobDescription = useOptimizationStore(selectJobDescription);
  const setJobDescription = useOptimizationStore((state) => state.setJobDescription);
  const clearJobDescription = useOptimizationStore((state) => state.clearJobDescription);
  const sessionId = useOptimizationStore((state) => state.sessionId);
  const keywordAnalysis = useOptimizationStore(selectKeywordAnalysis);
  const atsScore = useOptimizationStore(selectATSScore);
  const generalError = useOptimizationStore(selectGeneralError);
  const clearGeneralError = useOptimizationStore((state) => state.clearGeneralError);
  const retryCount = useOptimizationStore(selectRetryCount);
  const isRetrying = useOptimizationStore(selectIsRetrying);
  const retryOptimization = useOptimizationStore((state) => state.retryOptimization);
  const summarySuggestion = useOptimizationStore((state) => state.summarySuggestion);
  const skillsSuggestion = useOptimizationStore((state) => state.skillsSuggestion);
  const experienceSuggestion = useOptimizationStore((state) => state.experienceSuggestion);
  const isLoading = useOptimizationStore((state) => state.isLoading);
  const loadingStep = useOptimizationStore((state) => state.loadingStep);
  const userPreferences = useOptimizationStore((state) => state.userPreferences);
  const setUserPreferences = useOptimizationStore((state) => state.setUserPreferences);
  const clearResumeAndResults = useOptimizationStore((state) => state.clearResumeAndResults);

  // Preferences dialog state
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Privacy consent state (Story 15.3)
  const showPrivacyDialog = useOptimizationStore((state) => state.showPrivacyDialog);
  const setShowPrivacyDialog = useOptimizationStore((state) => state.setShowPrivacyDialog);
  const setPrivacyAccepted = useOptimizationStore((state) => state.setPrivacyAccepted);
  const [isPendingConsent, startConsentTransition] = useTransition();
  const [pendingFileForConsent, setPendingFileForConsent] = useState<File | null>(null);

  // Privacy consent hook
  const { privacyAccepted, refetch: refetchPrivacyConsent } = usePrivacyConsent();

  // Load user preferences on mount (for authenticated users)
  useEffect(() => {
    if (isAuthenticated && !userPreferences) {
      getPreferences().then(({ data }) => {
        if (data) {
          setUserPreferences(data);
        }
      });
    }
  }, [isAuthenticated, userPreferences, setUserPreferences]);

  const handleFileError = (error: { code: string; message: string }) => {
    // Only set file error for known error codes
    if (error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE') {
      setFileError({ code: error.code, message: error.message });
    }
    toast.error(error.message);
  };

  // Handle file selection with privacy consent check (Story 15.3)
  const handleFileSelect = (file: File) => {
    // Check if user is authenticated and hasn't accepted consent
    if (isAuthenticated && privacyAccepted === false) {
      // Store file temporarily and show consent dialog
      setPendingFileForConsent(file);
      setShowPrivacyDialog(true);
      return;
    }

    // User is either anonymous or has already accepted consent - proceed with upload
    setPendingFile(file);
    setFileError(null);
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

      // Close dialog
      setShowPrivacyDialog(false);

      // Now process the pending file
      if (pendingFileForConsent) {
        setPendingFile(pendingFileForConsent);
        setPendingFileForConsent(null);
        setFileError(null);
      }

      // Refetch to ensure we have latest status
      await refetchPrivacyConsent();
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex w-full max-w-3xl flex-col gap-8 p-8">
        {/* Header with Sign Out */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              SubmitSmart
            </h1>
            <p className="text-muted-foreground mt-2">
              Optimize your resume for ATS systems
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsPreferencesOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Preferences
              </Button>
              <Link href="/history" passHref>
                <Button variant="outline" size="sm" className="gap-2">
                  <HistoryIcon className="h-4 w-4" />
                  History
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground" data-testid="user-email">
                {user?.email}
              </span>
              <SignOutButton />
            </div>
          )}
        </div>

        {/* General Error Display - Above all content (Story 7.1 + 7.2) */}
        {generalError && (
          <ErrorDisplay
            errorCode={generalError.code}
            message={generalError.message}
            onDismiss={clearGeneralError}
            onRetry={retryOptimization}
            retryCount={retryCount}
            isRetrying={isRetrying}
          />
        )}

        {/* Retry Loading Indicator (Story 7.2) */}
        {isRetrying && !generalError && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <p>Retrying optimization...</p>
          </div>
        )}

        {/* Resume Upload Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upload Resume</h2>
            {/* Select from Library Button - Only visible when authenticated */}
            {isAuthenticated && (
              <SelectResumeButton
                isAuthenticated={isAuthenticated}
                disabled={isLoading}
              />
            )}
          </div>
          <ResumeUploader
            onFileSelect={handleFileSelect}
            onFileRemove={() => setPendingFile(null)}
            onError={handleFileError}
            selectedFile={
              pendingFile
                ? { name: pendingFile.name, size: pendingFile.size }
                : null
            }
          />
          {fileError && (
            <FileValidationError
              code={fileError.code}
              message={fileError.message}
              onDismiss={() => setFileError(null)}
            />
          )}
          {resumeContent && !isExtracting && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" data-testid="resume-parsed">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="flex-1">
                  Resume extracted successfully ({resumeContent.rawText.length.toLocaleString()} characters)
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
              {/* Save Resume Button - Only visible when authenticated */}
              <div className="flex justify-end">
                <SaveResumeButton
                  resumeContent={resumeContent.rawText}
                  isAuthenticated={isAuthenticated}
                  fileName={resumeContent.filename}
                />
              </div>
            </>
          )}
        </div>

        {/* Job Description Input Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Job Description</h2>
          <JobDescriptionInput
            value={jobDescription || ''}
            onChange={setJobDescription}
            onClear={clearJobDescription}
            isDisabled={isExtracting}
          />
        </div>

        {/* Analysis Section */}
        <div className="flex flex-col gap-4">
          <AnalyzeButton
            sessionId={sessionId}
            hasResume={!!resumeContent}
            hasJobDescription={!!jobDescription && jobDescription.trim().length > 0}
          />
        </div>

        {/* Keyword Analysis Results */}
        {keywordAnalysis && (
          <KeywordAnalysisDisplay analysis={keywordAnalysis} />
        )}

        {/* ATS Score Display */}
        {atsScore && (
          <ATSScoreDisplay score={atsScore} />
        )}

        {/* Suggestion Display (Story 6.9) */}
        {(summarySuggestion || skillsSuggestion || experienceSuggestion ||
          (isLoading && loadingStep === 'generating-suggestions')) && (
          <SuggestionDisplay />
        )}
      </main>

      {/* Preferences Dialog (Story 11.2) */}
      <PreferencesDialog
        open={isPreferencesOpen}
        onOpenChange={setIsPreferencesOpen}
        initialPreferences={userPreferences}
        onSaveSuccess={(prefs) => setUserPreferences(prefs)}
      />

      {/* Privacy Consent Dialog (Story 15.3) */}
      <PrivacyConsentDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
        onAccept={handleAcceptConsent}
      />
    </div>
  );
}

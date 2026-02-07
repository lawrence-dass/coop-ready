'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ATSScoreDisplay } from '@/components/shared/ATSScoreDisplay';
import { KeywordAnalysisDisplay } from '@/components/shared/KeywordAnalysisDisplay';
import { PrivacyReportBadge } from '@/components/shared/PrivacyReportBadge';
import { SaveResumeButton } from '@/components/resume/SaveResumeButton';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOptimizationStore } from '@/store';
import { ROUTES } from '@/lib/constants/routes';
import type { ATSScore, KeywordAnalysisResult } from '@/types/analysis';
import type { OptimizationPrivacyReport } from '@/types/privacy';

interface ScanResultsClientProps {
  sessionId: string;
  score?: ATSScore | null;
  keywordAnalysis?: KeywordAnalysisResult | null;
  privacyReport?: OptimizationPrivacyReport | null;
}

export function ScanResultsClient({
  sessionId,
  score: scoreProp,
  keywordAnalysis: keywordAnalysisProp,
  privacyReport: privacyReportProp,
}: ScanResultsClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const resumeContent = useOptimizationStore((state) => state.resumeContent);
  const privacyReportFromStore = useOptimizationStore((state) => state.privacyReport);
  const scoreFromStore = useOptimizationStore((state) => state.atsScore);
  const keywordAnalysisFromStore = useOptimizationStore((state) => state.keywordAnalysis);

  // Use prop if available (from database), otherwise fall back to Zustand (from fresh optimization)
  const score = scoreProp ?? scoreFromStore;
  const keywordAnalysis = keywordAnalysisProp ?? keywordAnalysisFromStore;
  const privacyReport = privacyReportProp ?? privacyReportFromStore;

  // If neither DB nor Zustand has data, we truly have no analysis
  if (!score || !keywordAnalysis) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div
          className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive/5 p-4"
          role="alert"
          data-testid="error-display"
        >
          <svg
            className="h-5 w-5 text-destructive shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-destructive" data-testid="error-title">
              Analysis Incomplete
            </p>
            <p className="text-sm text-foreground mt-1" data-testid="error-message">
              This session does not have completed analysis data.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Start a new scan to analyze your resume
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
              Error code: ANALYSIS_INCOMPLETE
            </p>
            <a
              href={ROUTES.APP.SCAN.NEW}
              className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start New Scan
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleViewSuggestions = () => {
    router.push(`${ROUTES.APP.SCAN.SESSION(sessionId)}/suggestions`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Optimization Results</h1>
          <p className="mt-2 text-gray-600">
            Review your ATS analysis before viewing suggestions
          </p>
        </div>

        {/* Privacy Report Badge - Show PII redaction statistics */}
        {privacyReport && (
          <section>
            <PrivacyReportBadge report={privacyReport} />
          </section>
        )}

        {/* Section 1: ATS Score Display (includes score breakdown) */}
        <section>
          <ATSScoreDisplay score={score} />
        </section>

        {/* Section 2: Keyword Analysis (includes gap summary) */}
        <section>
          <KeywordAnalysisDisplay analysis={keywordAnalysis} />
        </section>

        {/* Section 3: CTA Buttons - View Suggestions & Save Resume */}
        <section className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Primary CTA */}
            <Button
              onClick={handleViewSuggestions}
              size="lg"
              className="w-full md:w-auto md:min-w-[240px]"
              data-testid="view-suggestions-button"
            >
              View Suggestions
            </Button>

            {/* Secondary CTA - Save to Library */}
            <SaveResumeButton
              resumeContent={resumeContent?.rawText || null}
              isAuthenticated={isAuthenticated}
              fileName="Optimized_Resume.pdf"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

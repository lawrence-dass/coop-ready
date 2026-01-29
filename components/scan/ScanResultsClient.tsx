'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ATSScoreDisplay } from '@/components/shared/ATSScoreDisplay';
import { KeywordAnalysisDisplay } from '@/components/shared/KeywordAnalysisDisplay';
import { ROUTES } from '@/lib/constants/routes';
import type { ATSScore, KeywordAnalysisResult } from '@/types/analysis';

interface ScanResultsClientProps {
  sessionId: string;
  score: ATSScore;
  keywordAnalysis: KeywordAnalysisResult;
}

export function ScanResultsClient({
  sessionId,
  score,
  keywordAnalysis,
}: ScanResultsClientProps) {
  const router = useRouter();

  const handleViewSuggestions = () => {
    router.push(`${ROUTES.APP.SCAN.SESSION(sessionId)}/suggestions`);
  };

  const handleNewScan = () => {
    router.push(ROUTES.APP.SCAN.NEW);
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

        {/* Section 1: ATS Score Display (includes score breakdown) */}
        <section>
          <ATSScoreDisplay score={score} />
        </section>

        {/* Section 2: Keyword Analysis (includes gap summary) */}
        <section>
          <KeywordAnalysisDisplay analysis={keywordAnalysis} />
        </section>

        {/* Section 3: CTA Button - View Suggestions */}
        <section className="pt-4">
          <Button
            onClick={handleViewSuggestions}
            size="lg"
            className="w-full md:w-auto md:min-w-[240px]"
            data-testid="view-suggestions-button"
          >
            View Suggestions
          </Button>
        </section>

        {/* Section 4: Secondary Actions */}
        <section className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleNewScan}
            variant="outline"
            size="default"
            data-testid="new-scan-button"
          >
            New Scan
          </Button>
          <Button
            variant="ghost"
            size="default"
            disabled
            title="PDF report feature coming soon"
            data-testid="download-report-button"
          >
            Download Report (Coming Soon)
          </Button>
        </section>
      </div>
    </div>
  );
}

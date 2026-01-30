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
      </div>
    </div>
  );
}

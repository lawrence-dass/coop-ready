import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSessionById } from '@/lib/scan/queries';
import { ScanResultsClient } from '@/components/scan/ScanResultsClient';
import { ROUTES } from '@/lib/constants/routes';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ScanResultsPage({ params }: PageProps) {
  // Extract sessionId from params
  const { sessionId } = await params;

  // Validate sessionId format (basic UUID check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    notFound();
  }

  // Get authenticated user (protected by layout)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load session from database
  const { data: session, error } = await getSessionById(sessionId, user.id);

  if (error || !session) {
    notFound();
  }

  // Extract analysis data
  if (!session.analysis) {
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
            <Link
              href={ROUTES.APP.SCAN.NEW}
              className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start New Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pass data to client component
  return (
    <ScanResultsClient
      sessionId={session.id}
      score={session.analysis.score}
      keywordAnalysis={session.analysis.keywordAnalysis}
      privacyReport={session.privacyReport}
    />
  );
}

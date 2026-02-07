import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionById } from '@/lib/scan/queries';
import { ScanResultsClient } from '@/components/scan/ScanResultsClient';

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

  // Pass data to client component — if analysis is null (e.g. DB write race condition),
  // ScanResultsClient will fall back to Zustand store data from the fresh optimization
  return (
    <ScanResultsClient
      sessionId={session.id}
      score={session.analysis?.score}
      keywordAnalysis={session.analysis?.keywordAnalysis}
      privacyReport={session.privacyReport}
    />
  );
}

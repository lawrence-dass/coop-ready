import { createClient } from '@/lib/supabase/server';
import { getSessionById } from '@/lib/supabase/sessions';
import { notFound, redirect } from 'next/navigation';
import { ComparisonResultsClient } from '@/components/scan/ComparisonResultsClient';

// UUID regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ComparisonPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  // Validate UUID format
  if (!UUID_REGEX.test(sessionId)) {
    notFound();
  }

  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Load session
  const { data: session, error } = await getSessionById(sessionId, user.id);

  if (error || !session) {
    notFound();
  }

  // Verify comparison exists
  if (!session.comparedAtsScore) {
    // Redirect back to suggestions if no comparison yet
    redirect(`/scan/${sessionId}/suggestions`);
  }

  if (!session.atsScore) {
    // Should not happen but check for safety
    notFound();
  }

  // Type assertion is safe here: compareResume always stores ATSScoreV21
  // and we verified comparedAtsScore exists above
  const comparedScore = session.comparedAtsScore as import('@/lib/scoring/types').ATSScoreV21;

  return (
    <ComparisonResultsClient
      sessionId={session.id}
      originalScore={session.atsScore}
      comparedScore={comparedScore}
    />
  );
}

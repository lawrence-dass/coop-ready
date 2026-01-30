/**
 * History Page (Server Component)
 * Story 16.6: Migrate History and Settings
 *
 * Renders the optimization history list within the dashboard layout.
 * Loads all user sessions server-side with RLS enforcement.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { getOptimizationHistory } from '@/actions/history/get-optimization-history';
import { ClientHistoryPage } from './ClientHistoryPage';

export default async function HistoryPage() {
  // Get authenticated user (already protected by layout, but double-check)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Load all optimization sessions for this user
  const { data: sessions, error } = await getOptimizationHistory();

  // Pass sessions to client component for rendering
  // Error handling is done in client component
  return <ClientHistoryPage sessions={sessions || []} error={error} />;
}

/**
 * Dashboard Page
 * Story 16.2: Implement Dashboard Home Page
 * Story 17.6: Dashboard UI Cleanup
 *
 * Main dashboard home page showing:
 * - Welcome message (first name only, no email)
 * - Progress stats
 * - Recent scans OR getting started guide
 *
 * Note: Quick action cards removed per Story 17.6 - available in sidebar
 */

import { createClient } from '@/lib/supabase/server';
import { getRecentSessions } from '@/lib/dashboard/queries';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { ProgressStatsCard } from '@/components/dashboard/ProgressStatsCard';
import { RecentScansCard } from '@/components/dashboard/RecentScansCard';
import { GettingStartedGuide } from '@/components/dashboard/GettingStartedGuide';
import { ROUTES } from '@/lib/constants/routes';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Redirect if not authenticated (shouldn't happen due to layout protection)
  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Fetch recent sessions
  const { data: sessions, error: sessionsError } = await getRecentSessions();
  const recentSessions = sessions || [];
  const totalScans = recentSessions.length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Welcome Header - Story 17.6: Shows first name only, no email */}
      <WelcomeHeader userEmail={user.email || 'user@example.com'} />

      {/* Progress Stats - Story 17.6: Moved up, now immediately after Welcome */}
      <ProgressStatsCard totalScans={totalScans} />

      {/* Recent Scans OR Getting Started Guide */}
      {sessionsError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Unable to load recent scans. Please try again later.
          </p>
        </div>
      ) : recentSessions.length > 0 ? (
        <RecentScansCard sessions={recentSessions} />
      ) : (
        <GettingStartedGuide />
      )}
    </div>
  );
}

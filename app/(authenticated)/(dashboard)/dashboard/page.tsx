/**
 * Dashboard Page
 * Story 16.2: Implement Dashboard Home Page
 * Story 17.6: Dashboard UI Cleanup
 * Story 17.5: Dashboard Stats Calculation
 *
 * Main dashboard home page showing:
 * - Welcome message (first name only, no email)
 * - Progress stats (with real calculations from all sessions)
 * - Recent scans OR getting started guide
 *
 * Note: Quick action cards removed per Story 17.6 - available in sidebar
 */

import { createClient } from '@/lib/supabase/server';
import { getRecentSessions, getDashboardStats } from '@/lib/dashboard/queries';
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

  // Fetch user's first name from users table
  const { data: userData } = await supabase
    .from('users')
    .select('first_name')
    .eq('user_id', user.id)
    .single();

  // Fetch recent sessions for display
  const { data: sessions, error: sessionsError } = await getRecentSessions();
  const recentSessions = sessions || [];

  // Fetch dashboard stats (replaces inline calculation)
  // Story 17.5: Calculate stats from ALL sessions, not just recent 5
  const { data: stats, error: statsError } = await getDashboardStats();

  // Handle stats error gracefully - use fallback values
  const dashboardStats = stats ?? {
    totalScans: recentSessions.length,
    averageAtsScore: null,
    improvementRate: null,
  };

  if (statsError) {
    console.error('Failed to load dashboard stats:', statsError);
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Welcome Header - Shows user's first name from profile */}
      <WelcomeHeader
        firstName={userData?.first_name}
        userEmail={user.email || 'user@example.com'}
      />

      {/* Progress Stats - Story 17.5: Real stats from all sessions */}
      <ProgressStatsCard
        totalScans={dashboardStats.totalScans}
        averageAtsScore={dashboardStats.averageAtsScore}
        improvementRate={dashboardStats.improvementRate}
      />

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

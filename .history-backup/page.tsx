'use client';

/**
 * History Page - Optimization History View
 *
 * Displays the user's past optimization sessions.
 * Story 10.1: Implement History List View
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { HistoryListView, SignOutButton } from '@/components/shared';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8">
        {/* Header with Back Button and Sign Out */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Optimizer
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground" data-testid="user-email">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Optimization History
          </h1>
          <p className="text-muted-foreground mt-2">
            Review your past resume optimizations
          </p>
        </div>

        {/* History List */}
        <HistoryListView />
      </main>
    </div>
  );
}

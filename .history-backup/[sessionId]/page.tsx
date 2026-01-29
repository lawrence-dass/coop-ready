'use client';

/**
 * Session Detail Page - Individual Optimization Session View
 *
 * Displays the complete details of a specific optimization session.
 * Story 10.2: Implement Session Reload
 * AC #1, #2, #3, #4, #6, #7
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { SessionDetailView } from '@/components/shared/SessionDetailView';
import { SignOutButton } from '@/components/shared';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import { getOptimizationSession } from '@/actions/history/get-session';
import type { OptimizationSession } from '@/types';

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const currentSession = useOptimizationStore((state) => state.currentSession);
  const setCurrentSession = useOptimizationStore((state) => state.setCurrentSession);
  const clearCurrentSession = useOptimizationStore((state) => state.clearCurrentSession);
  const setResumeContent = useOptimizationStore((state) => state.setResumeContent);
  const setJobDescription = useOptimizationStore((state) => state.setJobDescription);

  const sessionId = params.sessionId as string;

  // Validate session ID format (UUID)
  const isValidUUID = (id: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Fetch session data
  useEffect(() => {
    // Don't fetch if not authenticated or still loading auth
    if (!isAuthenticated || isAuthLoading) {
      return;
    }

    // Validate session ID format
    if (!sessionId || !isValidUUID(sessionId)) {
      setError({
        message: 'Invalid session ID format',
        code: 'VALIDATION_ERROR',
      });
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await getOptimizationSession(sessionId);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
        setIsLoading(false);

        // Redirect to history if session not found
        if (fetchError.code === 'SESSION_NOT_FOUND') {
          setTimeout(() => {
            router.push('/history');
          }, 2000);
        }
        return;
      }

      if (data) {
        setCurrentSession(data);
      }

      setIsLoading(false);
    };

    fetchSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, isAuthenticated, isAuthLoading, setCurrentSession, router]);

  // Clear current session on unmount
  useEffect(() => {
    return () => {
      clearCurrentSession();
    };
  }, [clearCurrentSession]);

  // Handle "Optimize Again" - pre-fill form and navigate to optimizer
  const handleOptimizeAgain = () => {
    if (!currentSession) return;

    // Pre-fill resume and job description in store
    if (currentSession.resumeContent) {
      setResumeContent(currentSession.resumeContent);
    }

    if (currentSession.jobDescription) {
      setJobDescription(currentSession.jobDescription);
    }

    // Navigate to main optimizer page
    router.push('/');
  };

  // Handle back to history
  const handleBack = () => {
    router.push('/history');
  };

  // Show loading while checking auth
  if (isAuthLoading) {
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
      <main className="flex w-full max-w-5xl flex-col gap-8 p-8">
        {/* Top Bar with User Info and Sign Out */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground" data-testid="user-email">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>

        {/* Session Detail View */}
        <SessionDetailView
          session={currentSession}
          isLoading={isLoading}
          error={error}
          onOptimizeAgain={handleOptimizeAgain}
          onBack={handleBack}
        />
      </main>
    </div>
  );
}

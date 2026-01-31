/**
 * Session Restoration Hook
 *
 * Restores the user's session from the database on app mount.
 *
 * **Flow:**
 * 1. Wait for auth to provide anonymousId (user ID)
 * 2. Check database for existing session
 * 3. If found → hydrate Zustand store
 * 4. If not found → do nothing (session created by createScanSession when user starts a scan)
 *
 * **Usage:**
 * Call this hook in SessionProvider after auth is ready.
 *
 * @example
 * ```typescript
 * function SessionProvider({ children }) {
 *   const { anonymousId } = useAuth();
 *   const { isRestoring } = useSessionRestore({ anonymousId });
 *
 *   if (isRestoring) return <Loading />;
 *   return <>{children}</>;
 * }
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useOptimizationStore } from '@/store';
import { getSessionByAnonymousId } from '@/lib/supabase/sessions';

interface UseSessionRestoreProps {
  /** Anonymous user ID from auth */
  anonymousId: string | null;
  /** Whether auth is still loading */
  authLoading: boolean;
}

interface UseSessionRestoreReturn {
  /** Whether session restoration is in progress */
  isRestoring: boolean;

  /** Error message if restoration failed */
  error: string | null;
}

/**
 * Hook to restore session from database on mount
 *
 * **Behavior:**
 * - Runs once when anonymousId becomes available
 * - Tries to load existing session
 * - If no session exists, does nothing (session created when user starts a scan)
 * - Hydrates store with session data if found
 * - Handles errors gracefully
 */
export function useSessionRestore({
  anonymousId,
  authLoading,
}: UseSessionRestoreProps): UseSessionRestoreReturn {
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFromSession = useOptimizationStore((state) => state.loadFromSession);

  useEffect(() => {
    // Wait for auth to finish before deciding
    if (authLoading) return;

    // Auth done but no anonymous ID (e.g., anonymous sign-in failed)
    if (!anonymousId) {
      setIsRestoring(false);
      return;
    }

    async function restoreSession() {
      // TypeScript guard - we already checked anonymousId above
      if (!anonymousId) return;

      try {
        setIsRestoring(true);
        setError(null);
        console.log('[SS:session] Restoring session for anonymousId:', anonymousId.slice(0, 8) + '...');

        // Try to get existing session
        const { data: existingSession, error: getError } =
          await getSessionByAnonymousId(anonymousId);

        if (getError) {
          // Failed to query database
          console.log('[SS:session] Failed to fetch session:', getError.message);
          setError(getError.message);
          toast.error(`Failed to restore session: ${getError.message}`);
          setIsRestoring(false);
          return;
        }

        if (existingSession) {
          // Session found - hydrate store
          console.log('[SS:session] Existing session found:', existingSession.id, '| has resume:', !!existingSession.resumeContent, '| has JD:', !!existingSession.jobDescription);
          loadFromSession(existingSession);
          setIsRestoring(false);
          return;
        }

        // No session found - that's fine, one will be created when user starts a scan
        console.log('[SS:session] No existing session found, user will create one when starting a scan');
        setIsRestoring(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error restoring session';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, [anonymousId, authLoading, loadFromSession]);

  return {
    isRestoring,
    error,
  };
}

/**
 * Session Restoration Hook
 *
 * Restores the user's session from the database on app mount.
 *
 * **Flow:**
 * 1. Wait for auth to provide anonymousId
 * 2. Check database for existing session
 * 3. If found → hydrate Zustand store
 * 4. If not found → create new empty session
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
import { getSessionByAnonymousId, createSession } from '@/lib/supabase/sessions';

interface UseSessionRestoreProps {
  /** Anonymous user ID from auth */
  anonymousId: string | null;
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
 * - Creates new session if none exists
 * - Hydrates store with session data
 * - Handles errors gracefully
 */
export function useSessionRestore({
  anonymousId,
}: UseSessionRestoreProps): UseSessionRestoreReturn {
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFromSession = useOptimizationStore((state) => state.loadFromSession);
  const setSessionId = useOptimizationStore((state) => state.setSessionId);

  useEffect(() => {
    // Skip if no anonymous ID yet
    if (!anonymousId) {
      return;
    }

    async function restoreSession() {
      // TypeScript guard - we already checked anonymousId above
      if (!anonymousId) return;

      try {
        setIsRestoring(true);
        setError(null);

        // Try to get existing session
        const { data: existingSession, error: getError } =
          await getSessionByAnonymousId(anonymousId);

        if (getError) {
          // Failed to query database
          setError(getError.message);
          toast.error(`Failed to restore session: ${getError.message}`);
          setIsRestoring(false);
          return;
        }

        if (existingSession) {
          // Session found - hydrate store
          loadFromSession(existingSession);
          setIsRestoring(false);
          return;
        }

        // No session found - create new one
        const { data: newSession, error: createError } =
          await createSession(anonymousId);

        if (createError) {
          // Failed to create session
          setError(createError.message);
          toast.error(`Failed to create session: ${createError.message}`);
          setIsRestoring(false);
          return;
        }

        // Set the new session ID (empty session)
        setSessionId(newSession.id);
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
  }, [anonymousId, loadFromSession, setSessionId]);

  return {
    isRestoring,
    error,
  };
}

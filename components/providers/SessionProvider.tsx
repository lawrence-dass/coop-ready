/**
 * Session Provider
 *
 * Orchestrates session restoration and automatic saving.
 *
 * **Responsibilities:**
 * 1. Wait for auth to complete
 * 2. Restore session from database
 * 3. Enable auto-save for session changes
 * 4. Show loading state during restoration
 *
 * **Usage:**
 * Wrap your app with this provider AFTER AuthProvider.
 *
 * @example
 * ```typescript
 * <AuthProvider>
 *   <SessionProvider>
 *     <YourApp />
 *   </SessionProvider>
 * </AuthProvider>
 * ```
 */

'use client';

import { useAuth } from './AuthProvider';
import { useSessionRestore, useSessionSync } from '@/hooks';

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * Session orchestration provider
 *
 * **Data Flow:**
 * 1. AuthProvider provides anonymousId
 * 2. useSessionRestore loads session from DB
 * 3. useSessionSync enables auto-save
 * 4. Children render after session is ready
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const { anonymousId, isLoading: authLoading } = useAuth();
  const { isRestoring } = useSessionRestore({ anonymousId });

  // Enable auto-save (hook internally guards on sessionId being set)
  useSessionSync();

  // Show loading while auth or session is restoring
  if (authLoading || isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-sm text-gray-600">
            {authLoading ? 'Signing in...' : 'Loading session...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

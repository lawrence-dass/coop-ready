'use client';

/**
 * Authentication Provider
 *
 * Provides auth context to the entire application and handles:
 * 1. Checking for existing sessions on mount
 * 2. Auto-signing in anonymously if no session exists
 * 3. Listening for auth state changes
 * 4. Exposing auth state via useAuth() hook
 *
 * @example
 * ```typescript
 * // In a client component
 * 'use client';
 * import { useAuth } from '@/components/providers/AuthProvider';
 *
 * function MyComponent() {
 *   const { user, isAnonymous, isLoading, error, anonymousId } = useAuth();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <div>User ID: {anonymousId}</div>;
 * }
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';

/**
 * Auth context type exposed to consumers via useAuth()
 */
interface AuthContextType {
  /** Current Supabase user object (null if not authenticated) */
  user: User | null;

  /** Whether the current user is anonymous */
  isAnonymous: boolean;

  /** Whether the user is authenticated with email (not anonymous) */
  isAuthenticated: boolean;

  /** Whether auth is still loading/initializing */
  isLoading: boolean;

  /** Error message if auth failed */
  error: string | null;

  /** The anonymous user's UUID (same as user.id, for convenience) */
  anonymousId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provides authentication context to child components.
 *
 * Automatically signs in users anonymously if they don't have a session.
 * Session persists across page refreshes via cookies.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the Supabase client to prevent recreation on every render
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;

    // Initialize auth state
    async function initAuth() {
      try {
        // Check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          setIsLoading(false);
        } else {
          // Auto sign-in anonymously
          const { data, error: signInError } =
            await supabase.auth.signInAnonymously();

          if (signInError) {
            setError(signInError.message);
          } else if (data.user) {
            setUser(data.user);
          }
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAnonymous: user?.is_anonymous ?? false,
      isAuthenticated: user !== null && !(user.is_anonymous ?? false),
      isLoading,
      error,
      anonymousId: user?.id ?? null,
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 *
 * Must be used within AuthProvider.
 *
 * @returns Auth context with user, loading state, and error
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```typescript
 * const { user, isAnonymous, isLoading, anonymousId } = useAuth();
 *
 * // Check if user is ready
 * if (!isLoading && anonymousId) {
 *   // Safe to make authenticated requests
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

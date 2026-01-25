/**
 * Server Supabase Client
 *
 * This client is used in Server Components, Server Actions, and API routes.
 * It handles session persistence via cookies through Next.js cookies() API.
 *
 * IMPORTANT: This file uses `cookies()` which is async in Next.js 16+.
 *
 * @example
 * ```typescript
 * // In a Server Component or Server Action
 * import { createClient } from '@/lib/supabase/server';
 *
 * const supabase = await createClient();
 * const { data } = await supabase.from('sessions').select();
 * ```
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getClientEnv } from '@/lib/env';

/**
 * Creates a Supabase client for server-side usage.
 *
 * Uses @supabase/ssr with Next.js cookies() for session management.
 * The client is configured with the public Supabase URL and anon key.
 *
 * Note: Uses anon key (not service role) so RLS policies are enforced.
 *
 * @returns Promise<SupabaseClient> - Supabase server client instance
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { supabase } = getClientEnv();

  if (!supabase.url || !supabase.anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient(supabase.url, supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          // Log in development to aid debugging.
          if (process.env.NODE_ENV === 'development') {
            console.debug(
              '[Supabase] Cookie setAll called from Server Component (expected behavior):',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }
      },
    },
  });
}

/**
 * Browser Supabase Client
 *
 * This client is used in client components (marked with 'use client').
 * It handles session persistence via cookies automatically.
 *
 * @example
 * ```typescript
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * const supabase = createClient();
 * const { data } = await supabase.auth.getSession();
 * ```
 */

import { createBrowserClient } from '@supabase/ssr';
import { getClientEnv } from '@/lib/env';

/**
 * Creates a Supabase client for browser/client-side usage.
 *
 * Uses @supabase/ssr for automatic cookie-based session handling.
 * The client is configured with the public Supabase URL and anon key.
 *
 * @returns Supabase browser client instance
 * @throws Error if Supabase environment variables are missing
 *
 * Note: This function throws on missing env vars because it's called during
 * client initialization where ActionResponse pattern doesn't apply.
 * The throw provides clear, immediate feedback during development.
 * In production, env validation should happen at build time via validateEnv().
 */
export function createClient() {
  const { supabase } = getClientEnv();

  // Validate environment variables are present
  // This throw is intentional - missing env vars is a fatal config error
  // that should be caught during development, not handled gracefully at runtime
  if (!supabase.url || !supabase.anonKey) {
    const missing = [];
    if (!supabase.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
        'Please check your .env.local file.'
    );
  }

  return createBrowserClient(supabase.url, supabase.anonKey);
}

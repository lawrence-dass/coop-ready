/**
 * Supabase Service Role Client
 *
 * SECURITY: This client uses the service role key which bypasses RLS policies.
 * ONLY use this for:
 * - Server-side operations requiring admin privileges
 * - Test data management in non-production environments
 *
 * NEVER expose this client to the browser or use in client components.
 *
 * @see project-context.md - Supabase Rules
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with service role privileges.
 * Bypasses RLS policies - use with caution.
 *
 * @returns Supabase client with admin access
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

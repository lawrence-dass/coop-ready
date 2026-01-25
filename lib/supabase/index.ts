/**
 * Supabase Client Barrel Export
 *
 * This file provides a centralized export for all Supabase utilities.
 * Import from '@/lib/supabase' instead of individual files.
 *
 * @example
 * ```typescript
 * import { createBrowserClient, signInAnonymously, getAnonymousId } from '@/lib/supabase';
 * ```
 */

// Client exports with renamed functions for clarity
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';

// Auth functions
export {
  signInAnonymously,
  getSession,
  signOut,
} from './auth';

// Helper functions
export { getAnonymousId } from './helpers';

// Session operations
export {
  createSession,
  getSessionByAnonymousId,
  updateSession,
} from './sessions';

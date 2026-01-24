/**
 * Environment Variables Configuration
 *
 * This file provides typed access to environment variables with runtime validation.
 * Call validateEnv() at app startup to fail fast if config is missing.
 */

/**
 * Get client-side environment variables (safe to use in browser)
 * Returns empty strings if not set - use validateEnv() to check required vars
 */
export function getClientEnv() {
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  } as const;
}

/**
 * Get server-side environment variables (NEVER use in client components)
 * Returns empty strings if not set - use validateEnv() to check required vars
 */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() cannot be called in the browser');
  }
  return {
    supabase: {
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    },
  } as const;
}

/**
 * Validates that all required environment variables are set
 * Call this on server startup to fail fast if config is missing
 */
export function validateEnv(): { valid: true } | { valid: false; missing: string[] } {
  const missing: string[] = [];

  // Check client-side variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Check server-side variables (only on server)
  if (typeof window === 'undefined') {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      missing.push('SUPABASE_SERVICE_ROLE_KEY');
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      missing.push('ANTHROPIC_API_KEY');
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Throws if environment is not properly configured
 * Use at app startup for fail-fast behavior
 */
export function requireValidEnv(): void {
  const result = validateEnv();
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables:\n${result.missing.map((v) => `  - ${v}`).join('\n')}\n\n` +
        'Please copy .env.example to .env.local and fill in the values.'
    );
  }
}

/**
 * Checks if the app is configured for local Supabase
 */
export function isLocalSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.includes('127.0.0.1') || url.includes('localhost');
}

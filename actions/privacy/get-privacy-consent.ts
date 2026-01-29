/**
 * Privacy Consent Server Action - Get Status
 *
 * Story 15.3: Gate Uploads Until Consent Accepted
 *
 * Fetches the current user's privacy consent status from the database.
 * Returns null for anonymous users (no consent needed).
 *
 * @returns ActionResponse<PrivacyConsentStatus | null>
 */

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ActionResponse } from '@/types';
import type { PrivacyConsentStatus } from '@/types/auth';

export async function getPrivacyConsent(): Promise<
  ActionResponse<PrivacyConsentStatus | null>
> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.is_anonymous) {
      // Return null for anonymous users - they don't need consent
      return {
        data: null,
        error: null,
      };
    }

    // Query profiles table for privacy consent status
    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_accepted, privacy_accepted_at')
      .eq('id', user.id)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      };
    }

    // Transform database response to PrivacyConsentStatus
    return {
      data: {
        privacyAccepted: data.privacy_accepted ?? false,
        privacyAcceptedAt: data.privacy_accepted_at
          ? new Date(data.privacy_accepted_at)
          : null,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: String(err),
      },
    };
  }
}

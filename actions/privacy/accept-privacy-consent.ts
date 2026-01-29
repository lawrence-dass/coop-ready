/**
 * Privacy Consent Server Action
 *
 * Story 15.3: Gate Uploads Until Consent Accepted
 *
 * Updates user's privacy consent status in the database.
 * Only authenticated users can accept consent.
 *
 * @returns ActionResponse<PrivacyConsentStatus>
 */

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ActionResponse } from '@/types';
import type { PrivacyConsentStatus } from '@/types/auth';

/**
 * Accept privacy consent for the authenticated user
 *
 * Updates the user's profile with:
 * - privacy_accepted = true
 * - privacy_accepted_at = current timestamp
 *
 * RLS ensures user can only update their own profile
 */
export async function acceptPrivacyConsent(): Promise<
  ActionResponse<PrivacyConsentStatus>
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

    // Get current user (RLS will enforce auth)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      };
    }

    // Update profile with consent status
    const { data, error } = await supabase
      .from('profiles')
      .update({
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('privacy_accepted, privacy_accepted_at')
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

    return {
      data: {
        privacyAccepted: data.privacy_accepted,
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

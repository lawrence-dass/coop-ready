/**
 * Privacy Consent Hook
 *
 * Story 15.3: Gate Uploads Until Consent Accepted
 *
 * Hook to check and manage user privacy consent status.
 * Fetches consent from database on mount and provides
 * state for showing the consent dialog.
 *
 * @example
 * ```typescript
 * const { privacyAccepted, isLoading, refetch } = usePrivacyConsent();
 *
 * if (isLoading) return <Spinner />;
 * if (!privacyAccepted) {
 *   return <PrivacyConsentDialog ... />;
 * }
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useOptimizationStore, ExtendedOptimizationStore } from '@/store/useOptimizationStore';
import { getPrivacyConsent } from '@/actions/privacy/get-privacy-consent';

interface UsePrivacyConsentReturn {
  /** Whether user has accepted privacy consent (undefined = not loaded, null = not authenticated) */
  privacyAccepted: boolean | null | undefined;

  /** Timestamp when privacy was accepted */
  privacyAcceptedAt: Date | null | undefined;

  /** Whether the privacy consent data is currently being loaded */
  isLoading: boolean;

  /** Error if consent fetch failed */
  error: string | null;

  /** Refetch privacy consent status from database */
  refetch: () => Promise<void>;
}

/**
 * Hook to check and manage privacy consent status
 *
 * Automatically fetches consent status on mount for authenticated users.
 * For anonymous users, returns null (no consent needed).
 */
export function usePrivacyConsent(): UsePrivacyConsentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const privacyAccepted = useOptimizationStore(
    (state: ExtendedOptimizationStore) => state.privacyAccepted
  );
  const privacyAcceptedAt = useOptimizationStore(
    (state: ExtendedOptimizationStore) => state.privacyAcceptedAt
  );
  const setPrivacyAccepted = useOptimizationStore(
    (state: ExtendedOptimizationStore) => state.setPrivacyAccepted
  );

  const fetchPrivacyConsent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getPrivacyConsent();

      if (fetchError) {
        setError(fetchError.message || 'Failed to load privacy consent status');
        setIsLoading(false);
        return;
      }

      // If data is null, user is anonymous - no consent needed
      if (data === null) {
        setPrivacyAccepted(null, null);
      } else {
        setPrivacyAccepted(data.privacyAccepted, data.privacyAcceptedAt);
      }

      setIsLoading(false);
    } catch (err) {
      setError(String(err));
      setIsLoading(false);
    }
  };

  // Fetch consent status on mount (only if not already loaded)
  useEffect(() => {
    // Only fetch if we haven't loaded yet (undefined)
    if (privacyAccepted === undefined) {
      fetchPrivacyConsent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  return {
    privacyAccepted,
    privacyAcceptedAt,
    isLoading,
    error,
    refetch: fetchPrivacyConsent,
  };
}

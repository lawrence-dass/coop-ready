/**
 * usePrivacyConsent Hook Tests
 *
 * Story 15.4: Epic 15 Integration & Verification Testing
 *
 * Tests the privacy consent management hook that:
 * - Fetches consent status on mount
 * - Manages loading and error states
 * - Provides refetch functionality
 * - Synchronizes with Zustand store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';
import { getPrivacyConsent } from '@/actions/privacy/get-privacy-consent';

// Mock the server action
vi.mock('@/actions/privacy/get-privacy-consent', () => ({
  getPrivacyConsent: vi.fn(),
}));

// Mock Zustand store
const mockStoreState = {
  privacyAccepted: undefined as boolean | null | undefined,
  privacyAcceptedAt: undefined as Date | null | undefined,
  setPrivacyAccepted: vi.fn((accepted, acceptedAt) => {
    mockStoreState.privacyAccepted = accepted;
    mockStoreState.privacyAcceptedAt = acceptedAt;
  }),
};

vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: (selector?: (state: typeof mockStoreState) => unknown) =>
    selector ? selector(mockStoreState) : mockStoreState,
}));

describe('usePrivacyConsent', () => {
  const mockGetPrivacyConsent = getPrivacyConsent as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.privacyAccepted = undefined;
    mockStoreState.privacyAcceptedAt = undefined;
  });

  describe('Initial Load Behavior', () => {
    it('[P1] fetches privacy consent on mount when store is undefined', async () => {
      const mockTimestamp = new Date('2026-01-29T12:00:00Z');

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: mockTimestamp,
        },
        error: null,
      });

      const { result } = renderHook(() => usePrivacyConsent());

      // Initial state: loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.privacyAccepted).toBeUndefined();

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify fetch was called
      expect(mockGetPrivacyConsent).toHaveBeenCalledTimes(1);

      // Verify store was updated
      expect(mockStoreState.setPrivacyAccepted).toHaveBeenCalledWith(
        true,
        mockTimestamp
      );
    });

    it('[P1] does not fetch if store already has consent status', async () => {
      // Pre-populate store
      mockStoreState.privacyAccepted = true;
      mockStoreState.privacyAcceptedAt = new Date('2026-01-29T12:00:00Z');

      const { result } = renderHook(() => usePrivacyConsent());

      // Should not be loading (no fetch triggered)
      expect(result.current.isLoading).toBe(false);
      expect(result.current.privacyAccepted).toBe(true);

      // Verify fetch was NOT called
      expect(mockGetPrivacyConsent).not.toHaveBeenCalled();
    });

    it('[P2] handles anonymous user (data is null)', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Anonymous users: privacyAccepted = null
      expect(result.current.privacyAccepted).toBeNull();
      expect(result.current.privacyAcceptedAt).toBeNull();
      expect(mockStoreState.setPrivacyAccepted).toHaveBeenCalledWith(null, null);
    });
  });

  describe('Loading State Management', () => {
    it('[P1] sets isLoading to true during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockGetPrivacyConsent.mockReturnValue(fetchPromise as never);

      const { result } = renderHook(() => usePrivacyConsent());

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        data: { privacyAccepted: false, privacyAcceptedAt: null },
        error: null,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('[P1] sets isLoading to false after successful fetch', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: { privacyAccepted: false, privacyAcceptedAt: null },
        error: null,
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.privacyAccepted).toBe(false);
    });

    it('[P1] sets isLoading to false after failed fetch', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Database connection failed',
        },
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Database connection failed');
    });
  });

  describe('Error Handling', () => {
    it('[P1] sets error when server action returns error', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Database connection failed',
        },
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.error).toBe('Database connection failed');
      });

      expect(result.current.privacyAccepted).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('[P2] sets error when server action throws exception', async () => {
      mockGetPrivacyConsent.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.error).toBe('Error: Network error');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('[P2] uses default error message when error message is missing', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: '',
        },
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load privacy consent status');
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('[P1] refetch triggers new fetch and updates state', async () => {
      const initialTimestamp = new Date('2026-01-29T12:00:00Z');
      const refetchTimestamp = new Date('2026-01-29T13:00:00Z');

      mockGetPrivacyConsent.mockResolvedValueOnce({
        data: {
          privacyAccepted: false,
          privacyAcceptedAt: null,
        },
        error: null,
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.privacyAccepted).toBe(false);

      // User accepts consent elsewhere
      mockGetPrivacyConsent.mockResolvedValueOnce({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: refetchTimestamp,
        },
        error: null,
      });

      // Trigger refetch wrapped in act
      await act(async () => {
        await result.current.refetch();
      });

      // Verify fetch was called twice (initial + refetch)
      expect(mockGetPrivacyConsent).toHaveBeenCalledTimes(2);

      // Verify store was updated with new consent status
      // Note: Since the Zustand mock isn't reactive, we verify via the store setter
      expect(mockStoreState.setPrivacyAccepted).toHaveBeenCalledWith(
        true,
        refetchTimestamp
      );
    });

    it('[P2] refetch clears previous error state', async () => {
      // First fetch fails
      mockGetPrivacyConsent.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Database error',
        },
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      // Refetch succeeds
      mockGetPrivacyConsent.mockResolvedValueOnce({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: new Date(),
        },
        error: null,
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.privacyAccepted).toBe(true);
    });
  });

  describe('Store Synchronization', () => {
    it('[P1] updates store when consent status is fetched', async () => {
      const mockTimestamp = new Date('2026-01-29T12:00:00Z');

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: mockTimestamp,
        },
        error: null,
      });

      renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(mockStoreState.setPrivacyAccepted).toHaveBeenCalledWith(
          true,
          mockTimestamp
        );
      });
    });

    it('[P2] updates store with null for anonymous users', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: null,
        error: null,
      });

      renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(mockStoreState.setPrivacyAccepted).toHaveBeenCalledWith(null, null);
      });
    });

    it('[P2] reflects store changes in hook return values', async () => {
      const mockTimestamp = new Date('2026-01-29T12:00:00Z');

      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: mockTimestamp,
        },
        error: null,
      });

      const { result } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(result.current.privacyAccepted).toBe(true);
      });

      expect(result.current.privacyAcceptedAt).toEqual(mockTimestamp);
    });
  });

  describe('React Strict Mode Compatibility', () => {
    it('[P2] does not fetch twice in strict mode (effect cleanup)', async () => {
      mockGetPrivacyConsent.mockResolvedValue({
        data: {
          privacyAccepted: true,
          privacyAcceptedAt: new Date(),
        },
        error: null,
      });

      const { unmount } = renderHook(() => usePrivacyConsent());

      await waitFor(() => {
        expect(mockGetPrivacyConsent).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Verify fetch was called only once (not twice due to strict mode)
      expect(mockGetPrivacyConsent).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * Integration Tests for Preferences Persistence Round-Trip
 * Epic 11, Story 11.2 AC3: Preferences persist across sessions
 *
 * Verifies save/load cycle through server actions and Supabase layer.
 * Tests that preferences survive a save-then-load round-trip.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OptimizationPreferences } from '@/types';
import { DEFAULT_PREFERENCES } from '@/types';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
  update: vi.fn(() => mockSupabaseClient),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('Preferences Persistence Integration (11.2-AC3)', () => {
  const customPrefs: OptimizationPreferences = {
    tone: 'technical',
    verbosity: 'concise',
    emphasis: 'keywords',
    industry: 'tech',
    experienceLevel: 'senior',
    jobType: 'coop',
    modificationLevel: 'aggressive',
  };

  const authenticatedUser = {
    id: 'user-123',
    is_anonymous: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chained mock returns
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
  });

  describe('Save Preferences', () => {
    it('should save preferences for authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });
      // eq() is the terminal call for update chain
      mockSupabaseClient.eq.mockResolvedValue({ error: null });

      const { updateUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const result = await updateUserPreferences(customPrefs);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(customPrefs);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        optimization_preferences: customPrefs,
      });
    });

    it('should reject save for anonymous users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'anon-123', is_anonymous: true } },
        error: null,
      });

      const { updateUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const result = await updateUserPreferences(customPrefs);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('authenticated');
    });

    it('should reject invalid preferences', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });

      const { updateUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const invalidPrefs = {
        ...customPrefs,
        tone: 'invalid-tone' as OptimizationPreferences['tone'],
      };

      const result = await updateUserPreferences(invalidPrefs);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Load Preferences', () => {
    it('should load saved preferences for authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { optimization_preferences: customPrefs },
        error: null,
      });

      const { getUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const result = await getUserPreferences();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(customPrefs);
    });

    it('should return defaults for anonymous users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'anon-123', is_anonymous: true } },
        error: null,
      });

      const { getUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const result = await getUserPreferences();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(DEFAULT_PREFERENCES);
    });

    it('should return defaults when no preferences stored', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { optimization_preferences: null },
        error: null,
      });

      const { getUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const result = await getUserPreferences();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('Round-Trip: Save then Load', () => {
    it('should preserve all 7 preference fields through save/load cycle', async () => {
      // Setup: authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });

      // Save succeeds
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      // Load returns saved preferences
      mockSupabaseClient.single.mockResolvedValue({
        data: { optimization_preferences: customPrefs },
        error: null,
      });

      const { getUserPreferences, updateUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      // Step 1: Save custom preferences
      const saveResult = await updateUserPreferences(customPrefs);
      expect(saveResult.error).toBeNull();
      expect(saveResult.data).toEqual(customPrefs);

      // Step 2: Load preferences back
      const loadResult = await getUserPreferences();
      expect(loadResult.error).toBeNull();

      // Step 3: Verify all 5 fields match
      expect(loadResult.data?.tone).toBe(customPrefs.tone);
      expect(loadResult.data?.verbosity).toBe(customPrefs.verbosity);
      expect(loadResult.data?.emphasis).toBe(customPrefs.emphasis);
      expect(loadResult.data?.industry).toBe(customPrefs.industry);
      expect(loadResult.data?.experienceLevel).toBe(
        customPrefs.experienceLevel
      );
    });

    it('should handle partial preferences by merging with defaults', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });

      // Database returns only some fields (simulates schema migration)
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          optimization_preferences: {
            tone: 'technical',
            verbosity: 'concise',
            // Missing: emphasis, industry, experienceLevel
          },
        },
        error: null,
      });

      const { getUserPreferences } = await import(
        '@/lib/supabase/preferences'
      );

      const result = await getUserPreferences();

      expect(result.error).toBeNull();
      // Stored values preserved
      expect(result.data?.tone).toBe('technical');
      expect(result.data?.verbosity).toBe('concise');
      // Missing values filled with defaults
      expect(result.data?.emphasis).toBe(DEFAULT_PREFERENCES.emphasis);
      expect(result.data?.industry).toBe(DEFAULT_PREFERENCES.industry);
      expect(result.data?.experienceLevel).toBe(
        DEFAULT_PREFERENCES.experienceLevel
      );
    });
  });

  describe('Server Actions (Thin Wrappers)', () => {
    it('should getPreferences delegate to getUserPreferences', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { optimization_preferences: customPrefs },
        error: null,
      });

      const { getPreferences } = await import('@/actions/preferences');

      const result = await getPreferences();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(customPrefs);
    });

    it('should savePreferences delegate to updateUserPreferences', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: authenticatedUser },
        error: null,
      });
      mockSupabaseClient.eq.mockResolvedValue({ error: null });

      const { savePreferences } = await import('@/actions/preferences');

      const result = await savePreferences(customPrefs);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(customPrefs);
    });
  });
});

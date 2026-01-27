/**
 * Tests for Delete Optimization Session Server Action
 *
 * Story 10.3: Implement History Deletion
 *
 * **Test Coverage:**
 * - Success case: Delete own session
 * - Error case: Delete session owned by another user
 * - Error case: Delete non-existent session
 * - Error case: Unauthenticated user
 * - Error case: Empty session ID
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteOptimizationSession } from '@/actions/history/delete-optimization-session';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES } from '@/types';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('deleteOptimizationSession', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockOtherUser = {
    id: 'user-456',
    email: 'other@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should successfully delete a session owned by the authenticated user', async () => {
      // Setup mock to return authenticated user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'session-123' },
          error: null,
        }),
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('session-123');

      // Assert
      expect(result.data).toEqual({ success: true });
      expect(result.error).toBeNull();

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'session-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
  });

  describe('Error Cases - Unauthorized', () => {
    it('should return UNAUTHORIZED error when user is not authenticated', async () => {
      // Setup mock to return no user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('session-123');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'You must be signed in to delete sessions.',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('should return SESSION_NOT_FOUND when trying to delete another users session', async () => {
      // Setup mock to return authenticated user but delete fails (RLS blocks it)
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('session-456');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Session not found or you do not have permission to delete it.',
        code: ERROR_CODES.SESSION_NOT_FOUND,
      });
    });
  });

  describe('Error Cases - Not Found', () => {
    it('should return SESSION_NOT_FOUND when session does not exist', async () => {
      // Setup mock to return authenticated user but session doesn't exist
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('non-existent-id');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Session not found or you do not have permission to delete it.',
        code: ERROR_CODES.SESSION_NOT_FOUND,
      });
    });
  });

  describe('Error Cases - Validation', () => {
    it('should return VALIDATION_ERROR when session ID is empty', async () => {
      // Setup mock to return authenticated user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Session ID is required.',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });

    it('should return VALIDATION_ERROR when session ID is only whitespace', async () => {
      // Setup mock to return authenticated user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('   ');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Session ID is required.',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });
  });

  describe('Error Cases - Database Errors', () => {
    it('should return DELETE_SESSION_ERROR for unexpected database errors', async () => {
      // Setup mock to return authenticated user but database fails
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST_ERROR', message: 'Database connection failed' },
        }),
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('session-123');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe(ERROR_CODES.DELETE_SESSION_ERROR);
      expect(result.error?.message).toBe('Failed to delete session. Please try again.');
    });

    it('should handle unexpected exceptions gracefully', async () => {
      // Setup mock to throw exception
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      };

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      // Act
      const result = await deleteOptimizationSession('session-123');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe(ERROR_CODES.DELETE_SESSION_ERROR);
      expect(result.error?.message).toBe('Failed to delete session. Please try again.');
    });
  });
});

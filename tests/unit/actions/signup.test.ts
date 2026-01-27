import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup } from '@/actions/auth/signup';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock sessions module
vi.mock('@/lib/supabase/sessions', () => ({
  getSessionByAnonymousId: vi.fn(),
  updateSession: vi.fn(),
}));

describe('signup', () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  it('should successfully create a new account', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'anon-123', is_anonymous: true } } },
      error: null,
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockUser,
        session: { user: mockUser },
      },
      error: null,
    });

    // Create properly structured mock chain for Supabase query builder
    // Uses a factory to avoid circular reference issues
    function createMockChain() {
      const chain: Record<string, ReturnType<typeof vi.fn>> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'session-123',
          resume_content: '{"rawText": "test resume"}',
          jd_content: '"test job description"',
        },
        error: null,
      });
      return chain;
    }

    mockSupabase.from.mockImplementation(() => createMockChain());

    const result = await signup('test@example.com', 'Password123!');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      requiresVerification: false,
    });

    // Verify session migration was attempted
    expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
  });

  it('should return error when email already exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'User already registered',
        code: 'user_already_exists',
      },
    });

    const result = await signup('existing@example.com', 'Password123!');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message:
        'An account with this email already exists. Please sign in instead.',
      code: 'USER_EXISTS',
    });
  });

  it('should return validation error for weak password (server-side validation)', async () => {
    // 'weak' fails Zod schema before reaching Supabase
    const result = await signup('test@example.com', 'weak');

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');

    // Supabase should never be called
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('should map Supabase weak_password error correctly', async () => {
    // Password passes Zod but Supabase rejects it
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Password should be at least 8 characters',
        code: 'weak_password',
      },
    });

    const result = await signup('test@example.com', 'Password1!');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message:
        'Password must be at least 8 characters with uppercase, number, and special character.',
      code: 'WEAK_PASSWORD',
    });
  });

  it('should return validation error for invalid email (server-side validation)', async () => {
    // 'not-an-email' fails Zod schema before reaching Supabase
    const result = await signup('not-an-email', 'Password123!');

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('INVALID_EMAIL');

    // Supabase should never be called
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('should map Supabase invalid_email error correctly', async () => {
    // Email passes Zod but Supabase rejects it
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid email',
        code: 'invalid_email',
      },
    });

    const result = await signup('looks-valid@example.com', 'Password123!');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Please enter a valid email address.',
      code: 'INVALID_EMAIL',
    });
  });

  it('should handle generic auth errors', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Network error',
        code: 'network_error',
      },
    });

    const result = await signup('test@example.com', 'Password123!');

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('AUTH_ERROR');
  });

  it('should handle exceptions gracefully', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signUp.mockRejectedValue(
      new Error('Connection failed')
    );

    const result = await signup('test@example.com', 'Password123!');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Signup failed: Connection failed',
      code: 'AUTH_ERROR',
    });
  });

  it('should validate inputs server-side before calling Supabase', async () => {
    // Empty email should fail validation before hitting Supabase
    const result = await signup('', 'Password123!');

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('INVALID_EMAIL');

    // Supabase should never be called
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });
});

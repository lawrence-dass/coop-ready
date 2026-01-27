import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '@/lib/validations/auth';

describe('signupSchema', () => {
  it('should validate a valid signup form', () => {
    const validData = {
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('email');
      expect(result.error.issues[0].message).toContain('valid email');
    }
  });

  it('should reject password shorter than 8 characters', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Pass1!',
      confirmPassword: 'Pass1!',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('password');
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });

  it('should reject password without uppercase letter', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'password123!',
      confirmPassword: 'password123!',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('password');
      expect(result.error.issues[0].message).toContain('uppercase');
    }
  });

  it('should reject password without number', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Password!',
      confirmPassword: 'Password!',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('password');
      expect(result.error.issues[0].message).toContain('number');
    }
  });

  it('should reject password without special character', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('password');
      expect(result.error.issues[0].message).toContain('special character');
    }
  });

  it('should reject when passwords do not match', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPass123!',
      acceptTerms: true,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('confirmPassword');
      expect(result.error.issues[0].message).toContain('do not match');
    }
  });

  it('should reject when terms are not accepted', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: false,
    };

    const result = signupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('acceptTerms');
      expect(result.error.issues[0].message).toContain('accept the terms');
    }
  });
});

describe('loginSchema', () => {
  it('should validate a valid login form', () => {
    const validData = {
      email: 'user@example.com',
      password: 'anypassword',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'anypassword',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('email');
    }
  });

  it('should reject empty password', () => {
    const invalidData = {
      email: 'user@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('password');
    }
  });
});

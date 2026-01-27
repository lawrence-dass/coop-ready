/**
 * Authentication Types
 *
 * Types for email/password and OAuth authentication.
 */

/**
 * User profile returned from signup/login
 */
export interface AuthUser {
  /** User ID from Supabase Auth */
  userId: string;

  /** User's email address */
  email: string;

  /** Whether the user is anonymous */
  isAnonymous: boolean;

  /** Email verification status */
  emailVerified: boolean;
}

/**
 * Signup response data
 */
export interface SignupResult {
  /** User ID from Supabase Auth */
  userId: string;

  /** User's email address */
  email: string;

  /** Whether email verification is required */
  requiresVerification: boolean;
}

/**
 * Login response data
 */
export interface LoginResult {
  /** User ID from Supabase Auth */
  userId: string;

  /** User's email address */
  email: string;

  /** Whether the user is anonymous */
  isAnonymous: boolean;
}

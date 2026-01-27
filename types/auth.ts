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

/**
 * Valid career goal values for onboarding
 */
export type CareerGoal =
  | 'first-job'
  | 'switching-careers'
  | 'advancing'
  | 'promotion'
  | 'returning';

/**
 * Valid experience level values for onboarding
 */
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

/**
 * Valid industry values for onboarding
 */
export type Industry =
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'marketing'
  | 'engineering'
  | 'retail'
  | 'other';

/**
 * Onboarding answers submitted by user
 */
export interface OnboardingAnswers {
  /** User's primary career goal */
  careerGoal: CareerGoal | '';

  /** User's experience level */
  experienceLevel: ExperienceLevel | '';

  /** Industries the user is targeting */
  targetIndustries: Industry[];
}

/**
 * Onboarding save result
 */
export interface OnboardingSaveResult {
  /** Success flag */
  success: boolean;
}

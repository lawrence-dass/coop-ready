/**
 * Job Description Validation Utilities
 *
 * Validation helpers for job description input.
 */

/** Minimum character length for a valid job description */
export const MIN_JD_LENGTH = 50;

/**
 * Validate if a job description meets minimum requirements
 *
 * @param jd - Job description string (or null)
 * @returns true if JD is valid (50+ characters after trimming)
 *
 * @example
 * ```typescript
 * isJobDescriptionValid("Short") // false
 * isJobDescriptionValid("a".repeat(50)) // true
 * isJobDescriptionValid(null) // false
 * ```
 */
export function isJobDescriptionValid(jd: string | null): boolean {
  return jd != null && jd.trim().length >= MIN_JD_LENGTH;
}

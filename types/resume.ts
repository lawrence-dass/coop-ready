/**
 * Resume Library Types
 *
 * Types for the resume library feature (Epic 9)
 */

/**
 * UserResume - Represents a saved resume in a user's library
 *
 * Database table: user_resumes
 * Max resumes per user: 3
 */
export interface UserResume {
  id: string;
  userId: string;
  name: string;
  resumeContent: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * SaveResumeInput - Input for saving a resume to the library
 */
export interface SaveResumeInput {
  resumeContent: string;
  resumeName: string;
  fileName?: string;
}

/**
 * SaveResumeResult - Result of saving a resume
 */
export interface SaveResumeResult {
  id: string;
  name: string;
}

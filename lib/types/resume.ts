/**
 * Resume Data Type Definitions
 * Represents the stored resume structure used throughout the application
 * Story 5.8: Optimized Resume Preview
 */

import type { JobEntry, EducationEntry, Skill } from '@/lib/parsers/types'

/**
 * Complete resume data structure
 * Mirrors the parsed resume but stored in database as JSON
 */
export interface StoredResume {
  contact?: string
  summary?: string
  experience: JobEntry[]
  education: EducationEntry[]
  skills: Skill[]
  projects?: string
  other?: string
  format?: Record<string, any>
}

/**
 * Resume data type (alias for compatibility)
 */
export type ResumeData = StoredResume

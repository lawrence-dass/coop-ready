/**
 * Resume Section Detector
 * Story: 4.4 - Section-Level Score Breakdown
 *
 * Detects which sections exist in a parsed resume to determine which sections to score.
 */

import { ParsedResume } from '@/lib/parsers/types'
import type { ScoredSection } from '@/lib/types/analysis'

// Re-export ScoredSection for backward compatibility
export type { ScoredSection } from '@/lib/types/analysis'

/**
 * Detects which sections exist in a parsed resume
 *
 * @param parsedResume - The parsed resume data structure
 * @returns Array of section names that exist in the resume
 *
 * @example
 * const sections = detectSections(resume)
 * // Returns: ['experience', 'education', 'skills', 'summary']
 */
export function detectSections(parsedResume: ParsedResume): ScoredSection[] {
  const sections: ScoredSection[] = []

  // Experience: exists if array has at least one entry
  if (parsedResume.experience && parsedResume.experience.length > 0) {
    sections.push('experience')
  }

  // Education: exists if array has at least one entry
  if (parsedResume.education && parsedResume.education.length > 0) {
    sections.push('education')
  }

  // Skills: exists if array has at least one entry
  if (parsedResume.skills && parsedResume.skills.length > 0) {
    sections.push('skills')
  }

  // Projects: exists if string is not empty (after trimming)
  if (parsedResume.projects && parsedResume.projects.trim().length > 0) {
    sections.push('projects')
  }

  // Summary: exists if string is not empty (after trimming)
  if (parsedResume.summary && parsedResume.summary.trim().length > 0) {
    sections.push('summary')
  }

  return sections
}

/**
 * Resume Format Analyzer
 * Story: 4.6 - Resume Format Issues Detection
 *
 * Rule-based format checking for ATS compatibility
 */

import type { ParsedResume } from '@/lib/parsers/types'
import type { FormatIssue, FormatIssueSeverity, ExperienceLevel } from '@/lib/types/analysis'

/**
 * Analyze resume format for ATS compatibility issues
 *
 * Performs rule-based checks on resume structure:
 * - Section header presence
 * - Resume length vs experience level
 * - Contact information completeness
 * - Date format consistency
 *
 * @param parsedResume - Parsed resume structure
 * @param experienceLevel - User's experience level (defaults to 'student')
 * @returns Array of format issues sorted by severity (critical > warning > suggestion)
 */
export function analyzeResumeFormat(
  parsedResume: ParsedResume,
  experienceLevel: ExperienceLevel = 'student'
): FormatIssue[] {
  const issues: FormatIssue[] = []

  // Check 1: Section headers
  const sectionHeaderIssue = checkSectionHeaders(parsedResume)
  if (sectionHeaderIssue) {
    issues.push(sectionHeaderIssue)
  }

  // Check 2: Resume length
  const lengthIssue = checkResumeLength(parsedResume, experienceLevel)
  if (lengthIssue) {
    issues.push(lengthIssue)
  }

  // Check 3: Contact information
  const contactIssue = checkContactInfo(parsedResume)
  if (contactIssue) {
    issues.push(contactIssue)
  }

  // Check 4: Date format consistency
  const dateIssue = checkDateFormatConsistency(parsedResume)
  if (dateIssue) {
    issues.push(dateIssue)
  }

  // Sort by severity: critical > warning > suggestion
  return sortIssuesBySeverity(issues)
}

/**
 * Check if resume has standard section headers
 * Critical issue if no standard sections detected
 */
function checkSectionHeaders(resume: ParsedResume): FormatIssue | null {
  const standardSections = ['experience', 'education', 'skills'] as const

  // Check if at least one standard section has content
  const hasSections = standardSections.some((section) => {
    const sectionData = resume[section]
    if (Array.isArray(sectionData)) {
      return sectionData.length > 0
    }
    return false
  })

  if (!hasSections) {
    return {
      type: 'critical',
      message: 'No clear section headers detected',
      detail:
        'ATS systems rely on standard section headers (Experience, Education, Skills) to parse your resume correctly. Add clear headers to improve compatibility and ensure your information is properly categorized.',
      source: 'rule-based',
    }
  }

  return null
}

/**
 * Check resume length against experience level guidelines
 * Warning if student resume exceeds 1 page
 */
function checkResumeLength(
  resume: ParsedResume,
  experienceLevel: ExperienceLevel
): FormatIssue | null {
  const estimatedPages = estimatePageCount(resume)

  // Only flag for students with >1 page resumes
  if (experienceLevel === 'student' && estimatedPages > 1) {
    return {
      type: 'warning',
      message: `Resume is approximately ${estimatedPages} pages`,
      detail:
        'Entry-level resumes are typically 1 page. Consider condensing to 1 page to improve ATS parsing and recruiter experience. Focus on most relevant experiences and achievements.',
      source: 'rule-based',
    }
  }

  return null
}

/**
 * Estimate page count based on content density
 * Uses multiple heuristics: bullet points, sections, and word count
 */
function estimatePageCount(resume: ParsedResume): number {
  let contentScore = 0

  // Count bullet points (major space consumers)
  const totalBullets = resume.experience.reduce((sum, job) => sum + job.bulletPoints.length, 0)
  contentScore += totalBullets * 2 // Each bullet point adds to length

  // Count experience entries
  contentScore += resume.experience.length * 3

  // Count education entries
  contentScore += resume.education.length * 2

  // Count skills
  contentScore += Math.ceil(resume.skills.length / 5) // Every 5 skills ≈ 1 line

  // Add points for summary/projects/other sections
  if (resume.summary && resume.summary.length > 100) {
    contentScore += Math.ceil(resume.summary.length / 200)
  }
  if (resume.projects && resume.projects.length > 100) {
    contentScore += Math.ceil(resume.projects.length / 200)
  }
  if (resume.other && resume.other.length > 100) {
    contentScore += Math.ceil(resume.other.length / 200)
  }

  // Convert score to pages
  // Threshold: >15 points = likely 2+ pages
  if (contentScore > 15) {
    return 2
  }

  return 1
}

/**
 * Check if resume has basic contact information
 * Warning if missing email, phone, or location
 */
function checkContactInfo(resume: ParsedResume): FormatIssue | null {
  const contact = resume.contact?.trim() || ''

  if (contact.length === 0) {
    return {
      type: 'warning',
      message: 'Missing contact information',
      detail:
        'Your resume should include contact information (email, phone, or location) so recruiters can reach you. Add at least an email address or phone number.',
      source: 'rule-based',
    }
  }

  // Check for common contact indicators
  const hasEmail = /@/.test(contact)
  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(contact) // Matches various phone formats
  const hasLocation =
    /,\s*[A-Z]{2}/.test(contact) || // City, ST format
    /\w+,\s*\w+/.test(contact) // Any City, State format

  // If contact section exists but has no recognizable pattern, it's acceptable
  // Only flag if completely empty
  if (!hasEmail && !hasPhone && !hasLocation && contact.length < 10) {
    return {
      type: 'warning',
      message: 'Contact information may be incomplete',
      detail:
        'Include complete contact details (email, phone number) to ensure recruiters can reach you easily.',
      source: 'rule-based',
    }
  }

  return null
}

/**
 * Check if date formats are consistent across resume
 * Suggestion if inconsistent formats detected
 */
function checkDateFormatConsistency(resume: ParsedResume): FormatIssue | null {
  const allDates: string[] = []

  // Collect all dates from experience
  for (const job of resume.experience) {
    if (job.dates) {
      allDates.push(job.dates)
    }
  }

  // Collect all dates from education
  for (const edu of resume.education) {
    if (edu.dates) {
      allDates.push(edu.dates)
    }
  }

  if (allDates.length < 2) {
    // Not enough dates to check consistency
    return null
  }

  // Detect date format patterns
  const formats = allDates.map(detectDateFormat)
  const uniqueFormats = new Set(formats)

  // If more than 2 different formats, flag as inconsistent
  if (uniqueFormats.size > 2) {
    return {
      type: 'suggestion',
      message: 'Inconsistent date formats detected',
      detail:
        'Use consistent date formatting throughout your resume (e.g., "MM/YYYY - MM/YYYY" or "Month YYYY - Month YYYY"). Consistency improves ATS parsing and professional appearance.',
      source: 'rule-based',
    }
  }

  return null
}

/**
 * Detect the format of a date string
 */
function detectDateFormat(dateStr: string): string {
  const trimmed = dateStr.trim()

  // MM/YYYY format
  if (/\d{1,2}\/\d{4}/.test(trimmed)) {
    return 'slash'
  }

  // Month YYYY format (e.g., "January 2020")
  if (/[A-Za-z]+\s+\d{4}/.test(trimmed)) {
    return 'month-year'
  }

  // YYYY-YYYY format (e.g., "2020-2024")
  if (/\d{4}\s*-\s*\d{4}/.test(trimmed)) {
    return 'year-range'
  }

  // YYYY format only
  if (/^\d{4}$/.test(trimmed)) {
    return 'year'
  }

  return 'other'
}

/**
 * Sort issues by severity (critical > warning > suggestion)
 */
function sortIssuesBySeverity(issues: FormatIssue[]): FormatIssue[] {
  const severityOrder: Record<FormatIssueSeverity, number> = {
    critical: 3,
    warning: 2,
    suggestion: 1,
  }

  return issues.sort((a, b) => severityOrder[b.type] - severityOrder[a.type])
}

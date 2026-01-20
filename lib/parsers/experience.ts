/**
 * Experience section parser
 * Story: 3.3 Resume Section Parsing
 */

import type { JobEntry } from './types'

/**
 * Parse experience section into structured job entries
 * Handles various date formats and bullet point styles
 *
 * Typical resume format:
 *   Company Name       <- Line before title
 *   Job Title          <- Line before dates
 *   June 2021 - Present <- Date line
 *   - Bullet point 1
 *   - Bullet point 2
 */
export function parseExperienceSection(text: string): JobEntry[] {
  if (!text || !text.trim()) return []

  const jobs: JobEntry[] = []
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

  let currentJob: Partial<JobEntry> | null = null
  let bulletPoints: string[] = []
  let pendingLines: string[] = [] // Lines before a date that might be company/title

  // Date pattern: matches various formats
  // Examples: "June 2021 - Present", "06/2021-present", "2021-2023", "Jan 2020 - Dec 2021"
  const datePattern = /(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current)/i

  // Bullet point patterns
  const bulletPattern = /^[•\-\*\>]\s+(.+)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if line is a bullet point
    const bulletMatch = line.match(bulletPattern)
    if (bulletMatch) {
      bulletPoints.push(bulletMatch[1])
      // Don't clear pendingLines here - next job's company/title might follow
      continue
    }

    // Check if line contains dates (likely signals job entry info)
    const dateMatch = line.match(datePattern)

    if (dateMatch) {
      // Save previous job if exists
      if (currentJob && (currentJob.company || currentJob.title)) {
        jobs.push({
          company: currentJob.company || 'Unknown Company',
          title: currentJob.title || 'Unknown Title',
          dates: currentJob.dates || '',
          bulletPoints: [...bulletPoints],
        })
        bulletPoints = []
      }

      // Start new job with dates
      currentJob = {
        dates: dateMatch[0],
      }

      // Check if there's text on the same line as the date (could be title)
      const lineWithoutDate = line.replace(datePattern, '').trim()
      if (lineWithoutDate && lineWithoutDate.length > 2) {
        currentJob.title = lineWithoutDate
      }

      // Use pending lines (lines before date) to set company/title
      // Typical order: Company, then Title, then Dates
      if (pendingLines.length >= 2) {
        currentJob.company = pendingLines[pendingLines.length - 2]
        if (!currentJob.title) {
          currentJob.title = pendingLines[pendingLines.length - 1]
        }
      } else if (pendingLines.length === 1) {
        // Only one line before date - could be company or title
        // If title already set (from date line), this is company
        if (currentJob.title) {
          currentJob.company = pendingLines[0]
        } else {
          // Assume it's company, title might come from same line as date
          currentJob.company = pendingLines[0]
        }
      }

      pendingLines = []
      continue
    }

    // Line doesn't have date or bullet - could be part of next job entry
    // Always collect to pendingLines for the next date match to process
    pendingLines.push(line)
  }

  // Save last job
  if (currentJob && (currentJob.company || currentJob.title)) {
    jobs.push({
      company: currentJob.company || 'Unknown Company',
      title: currentJob.title || 'Unknown Title',
      dates: currentJob.dates || '',
      bulletPoints,
    })
  }

  // Handle case where there are pending lines but no dates were found
  // (some resumes list experience without explicit dates)
  if (jobs.length === 0 && pendingLines.length > 0) {
    // Create job entries from pending lines (best effort)
    // If we have collected bullet points, use them for the entry
    if (pendingLines.length >= 2) {
      jobs.push({
        company: pendingLines[0],
        title: pendingLines[1],
        dates: '',
        bulletPoints,
      })
    } else if (pendingLines.length === 1) {
      jobs.push({
        company: pendingLines[0],
        title: '',
        dates: '',
        bulletPoints,
      })
    }
  }

  return jobs
}

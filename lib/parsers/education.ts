/**
 * Education section parser
 * Story: 3.3 Resume Section Parsing
 */

import type { EducationEntry } from './types'

/**
 * Parse education section into structured education entries
 * Handles various degree formats and GPA patterns
 */
export function parseEducationSection(text: string): EducationEntry[] {
  if (!text || !text.trim()) return []

  const entries: EducationEntry[] = []
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

  let currentEntry: Partial<EducationEntry> | null = null

  // Degree patterns - matches various formats
  // Examples: "B.S. Computer Science", "BS in CS", "Bachelor of Science", "MBA", "Ph.D."
  const degreePattern = /\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Bachelor|Master|Associate|Doctorate)[\s\w\.]*\b/i

  // Date patterns - typically graduation year or range
  // Examples: "2019", "2015-2019", "May 2020", "Expected 2024"
  const datePattern = /(\d{4}|(?:expected|graduating|grad)\s+\d{4}|\w+\s+\d{4}(?:\s*-\s*\w+\s+\d{4})?)/i

  // GPA patterns
  // Examples: "3.8", "3.8 GPA", "GPA: 3.8/4.0", "GPA 3.8"
  const gpaPattern = /\b(?:GPA:?\s*)?(\d\.\d{1,2})(?:\s*\/\s*\d\.\d{1,2})?\b/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if line contains a degree (likely new entry)
    const degreeMatch = line.match(degreePattern)

    if (degreeMatch) {
      // Save previous entry if exists (don't require all fields)
      if (currentEntry && (currentEntry.institution || currentEntry.degree)) {
        entries.push({
          institution: currentEntry.institution || 'Unknown Institution',
          degree: currentEntry.degree || 'Unknown Degree',
          dates: currentEntry.dates || '',
          gpa: currentEntry.gpa,
        })
      }

      // Start new entry
      currentEntry = {
        degree: degreeMatch[0],
      }

      // Try to find institution (usually line before degree)
      if (i > 0 && !currentEntry.institution) {
        const prevLine = lines[i - 1]
        // If previous line doesn't contain degree/date/GPA patterns, it's likely the institution
        if (!degreePattern.test(prevLine) && !datePattern.test(prevLine)) {
          currentEntry.institution = prevLine
        }
      }

      // Check if dates are on the same line
      const dateMatch = line.match(datePattern)
      if (dateMatch) {
        currentEntry.dates = dateMatch[0]
      }

      // Check if GPA is on the same line
      const gpaMatch = line.match(gpaPattern)
      if (gpaMatch) {
        currentEntry.gpa = gpaMatch[1]
      }

      continue
    }

    // If no degree found but we have a current entry, check for dates/GPA/institution
    if (currentEntry) {
      if (!currentEntry.dates) {
        const dateMatch = line.match(datePattern)
        if (dateMatch) {
          currentEntry.dates = dateMatch[0]
        }
      }

      if (!currentEntry.gpa) {
        const gpaMatch = line.match(gpaPattern)
        if (gpaMatch) {
          currentEntry.gpa = gpaMatch[1]
        }
      }

      if (!currentEntry.institution && !datePattern.test(line) && !gpaPattern.test(line)) {
        currentEntry.institution = line
      }
    } else {
      // No current entry - might be starting with institution name
      currentEntry = {
        institution: line,
      }
    }
  }

  // Save last entry (don't require all fields - partial data is better than no data)
  if (currentEntry && (currentEntry.institution || currentEntry.degree)) {
    entries.push({
      institution: currentEntry.institution || 'Unknown Institution',
      degree: currentEntry.degree || 'Unknown Degree',
      dates: currentEntry.dates || '',
      gpa: currentEntry.gpa,
    })
  }

  return entries
}

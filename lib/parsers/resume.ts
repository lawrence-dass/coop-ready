/**
 * Resume section parser
 * Story: 3.3 Resume Section Parsing
 */

import type { ResumeSection, ParsedResume } from './types'
import { parseExperienceSection } from './experience'
import { parseEducationSection } from './education'
import { parseSkillsSection } from './skills'

// Section header patterns (case-insensitive)
const SECTION_PATTERNS: Record<ResumeSection, RegExp[]> = {
  contact: [
    /^contact\s*(information)?:?$/i,
    /^phone:?$/i,
    /^email:?$/i,
  ],
  summary: [
    /^(professional\s+)?summary:?$/i,
    /^(professional\s+)?(objective|profile):?$/i,
    /^about(\s+me)?:?$/i,
  ],
  experience: [
    /^(work\s+)?experience:?$/i,
    /^professional\s+experience:?$/i,
    /^employment(\s+history)?:?$/i,
  ],
  education: [
    /^education:?$/i,
    /^academic(\s+background)?:?$/i,
    /^degrees?:?$/i,
  ],
  skills: [
    /^skills:?$/i,
    /^technical\s+skills:?$/i,
    /^core\s+competencies:?$/i,
  ],
  projects: [
    /^projects:?$/i,
    /^portfolio:?$/i,
    /^achievements:?$/i,
  ],
  other: [],
}

// Pattern to detect generic section headers (for "Other" categorization)
// Matches: single/double word titles, ALL CAPS lines, lines ending with colon
const GENERIC_HEADER_PATTERN = /^[A-Z][a-zA-Z\s&]{2,30}:?$/

export interface DetectedSection {
  type: ResumeSection
  startLine: number
  endLine: number
  content: string
  headerName?: string // Original header text for non-standard sections
}

/**
 * Detect sections in resume text by identifying section headers
 * Returns Map of section type to text content
 * Non-standard sections (Certifications, Volunteering, etc.) go to "other"
 */
export function detectSections(text: string): Map<ResumeSection, string> {
  const lines = text.split('\n')
  const sections = new Map<ResumeSection, string>()
  const detectedSections: DetectedSection[] = []
  const otherSections: DetectedSection[] = [] // Track non-standard sections

  // Find all section headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    // Check if line matches any known section pattern
    let matchedKnown = false
    for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
      if (sectionType === 'other') continue // Skip 'other' as it's a catch-all

      const isMatch = patterns.some(pattern => pattern.test(line))

      if (isMatch) {
        detectedSections.push({
          type: sectionType as ResumeSection,
          startLine: i,
          endLine: -1,
          content: '',
        })
        matchedKnown = true
        break
      }
    }

    // If not a known section, check if it looks like a generic header
    // (for non-standard sections like Certifications, Volunteering, Publications)
    if (!matchedKnown && GENERIC_HEADER_PATTERN.test(line)) {
      // Make sure it's not already detected and doesn't look like regular content
      const lineWords = line.replace(/:$/, '').split(/\s+/)
      // Headers are typically 1-3 words, start with capital
      if (lineWords.length <= 4 && lineWords[0][0] === lineWords[0][0].toUpperCase()) {
        otherSections.push({
          type: 'other',
          startLine: i,
          endLine: -1,
          content: '',
          headerName: line.replace(/:$/, ''),
        })
      }
    }
  }

  // Special handling for contact section (usually at start without explicit header)
  if (detectedSections.length === 0 || detectedSections[0].startLine > 5) {
    // First few lines are likely contact info
    detectedSections.unshift({
      type: 'contact',
      startLine: 0,
      endLine: -1,
      content: '',
    })
  }

  // Merge all sections and sort by start line
  const allSections = [...detectedSections, ...otherSections].sort(
    (a, b) => a.startLine - b.startLine
  )

  // Set end lines and extract content
  for (let i = 0; i < allSections.length; i++) {
    const section = allSections[i]
    const nextSection = allSections[i + 1]

    section.endLine = nextSection ? nextSection.startLine - 1 : lines.length - 1

    // Extract content (skip header line)
    const contentLines = lines.slice(section.startLine + 1, section.endLine + 1)
    section.content = contentLines.join('\n').trim()

    // For known sections, set directly
    if (section.type !== 'other') {
      sections.set(section.type, section.content)
    }
  }

  // Combine all "other" sections into one, preserving header names
  const otherContent: string[] = []
  for (const section of allSections) {
    if (section.type === 'other' && section.content) {
      // Include the original header name with the content
      const headerPrefix = section.headerName ? `${section.headerName}\n` : ''
      otherContent.push(headerPrefix + section.content)
    }
  }
  if (otherContent.length > 0) {
    sections.set('other', otherContent.join('\n\n'))
  }

  return sections
}

/**
 * Main parsing orchestrator - parses resume text into structured sections
 * Handles all section types and gracefully handles parsing errors
 */
export function parseResumeText(text: string): ParsedResume {
  // Initialize empty result
  const result: ParsedResume = {
    contact: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: '',
    other: '',
  }

  try {
    // Detect all sections
    const sections = detectSections(text)

    // Parse each section with appropriate parser
    for (const [sectionType, content] of sections.entries()) {
      try {
        switch (sectionType) {
          case 'contact':
            result.contact = content
            break

          case 'summary':
            result.summary = content
            break

          case 'experience':
            result.experience = parseExperienceSection(content)
            break

          case 'education':
            result.education = parseEducationSection(content)
            break

          case 'skills':
            result.skills = parseSkillsSection(content)
            break

          case 'projects':
            result.projects = content
            break

          case 'other':
            result.other = content
            break
        }
      } catch (error) {
        // Log error but continue parsing other sections
        console.error(`[parseResumeText] Error parsing ${sectionType} section:`, error)
        // Keep default empty value for this section
      }
    }

    return result
  } catch (error) {
    // If detection fails, return empty result
    console.error('[parseResumeText] Error detecting sections:', error)
    return result
  }
}

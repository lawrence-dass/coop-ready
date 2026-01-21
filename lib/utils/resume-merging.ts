/**
 * Resume Merging Logic
 * Merges accepted suggestions into resume content with diff tracking
 * Story 5.8: Optimized Resume Preview
 */

import type { StoredResume } from '@/lib/types/resume'
import type { DisplaySuggestion } from '@/lib/utils/suggestion-types'

export interface DiffInfo {
  type: 'unchanged' | 'added' | 'removed'
  text: string
  originalText?: string
}

export interface MergedItem {
  id: string
  content: string
  highlighted: boolean
  diff: DiffInfo[]
}

export interface MergedResumeContent {
  section: string
  items: MergedItem[]
}

/**
 * Merges accepted suggestions into resume content
 * Returns resume structure with diff information for highlighting
 */
export function mergeAcceptedSuggestions(
  originalResume: StoredResume,
  suggestions: DisplaySuggestion[]
): Record<string, MergedResumeContent> {
  const acceptedSuggestions = suggestions.filter((s) => s.status === 'accepted')
  const mergedContent: Record<string, MergedResumeContent> = {}

  // Process each resume section
  const SECTIONS = ['experience', 'education', 'skills', 'projects', 'format'] as const

  for (const section of SECTIONS) {
    const sectionContent = originalResume[section as keyof StoredResume] || []
    const sectionSuggestions = acceptedSuggestions.filter(
      (s) => s.section === section
    )

    // Handle different types of sections
    let mergedItems: MergedItem[] = []

    if (Array.isArray(sectionContent)) {
      mergedItems = (sectionContent as any[]).map((item, itemIndex) => {
        // Find suggestions for this specific item
        const itemSuggestions = sectionSuggestions.filter(
          (s) => s.itemIndex === itemIndex
        )

        if (itemSuggestions.length === 0) {
          // No suggestions for this item
          return {
            id: `${section}-${itemIndex}`,
            content: formatItemContent(section, item),
            highlighted: false,
            diff: [],
          }
        }

        // Apply suggestions to this item
        const mergedText = applyItemSuggestions(
          formatItemContent(section, item),
          itemSuggestions
        )

        return {
          id: `${section}-${itemIndex}`,
          content: mergedText.text,
          highlighted: true,
          diff: mergedText.diff,
        }
      })
    } else if (typeof sectionContent === 'string' || section === 'format') {
      // Handle non-array sections (summary, projects, format)
      const itemSuggestions = sectionSuggestions.filter(
        (s) => s.itemIndex === 0 || s.itemIndex === undefined
      )

      if (itemSuggestions.length === 0) {
        mergedItems = [
          {
            id: `${section}-0`,
            content:
              typeof sectionContent === 'string' ? sectionContent : '',
            highlighted: false,
            diff: [],
          },
        ]
      } else {
        const mergedText = applyItemSuggestions(
          typeof sectionContent === 'string' ? sectionContent : '',
          itemSuggestions
        )
        mergedItems = [
          {
            id: `${section}-0`,
            content: mergedText.text,
            highlighted: true,
            diff: mergedText.diff,
          },
        ]
      }
    }

    mergedContent[section] = {
      section,
      items: mergedItems,
    }
  }

  return mergedContent
}

/**
 * Applies multiple suggestions to a single item, tracking changes
 */
function applyItemSuggestions(
  originalText: string,
  suggestions: DisplaySuggestion[]
): { text: string; diff: DiffInfo[] } {
  let currentText = originalText
  const diff: DiffInfo[] = []

  // Sort suggestions by original text length (longest first) to avoid nested replacements
  const sortedSuggestions = suggestions.sort(
    (a, b) =>
      (b.originalText?.length || 0) - (a.originalText?.length || 0)
  )

  for (const suggestion of sortedSuggestions) {
    if (!suggestion.originalText || !suggestion.suggestedText) continue

    // Replace original with suggested
    if (currentText.includes(suggestion.originalText)) {
      currentText = currentText.replace(
        suggestion.originalText,
        suggestion.suggestedText
      )

      // Track diff - mark removed and added
      diff.push({
        type: 'removed',
        text: suggestion.originalText,
      })
      diff.push({
        type: 'added',
        text: suggestion.suggestedText,
        originalText: suggestion.originalText,
      })
    }
  }

  return { text: currentText, diff }
}

/**
 * Formats item content based on section type
 */
function formatItemContent(section: string, item: any): string {
  switch (section) {
    case 'experience':
      return `${item.title} at ${item.company} (${item.dates})\n${(item.bulletPoints || []).join('\n')}`

    case 'education':
      return `${item.degree} in ${item.degree && item.institution ? 'from ' : ''}${item.institution} (${item.dates})${item.gpa ? ` - GPA: ${item.gpa}` : ''}`

    case 'skills':
      if (Array.isArray(item)) {
        // If item is the skills array itself, format each skill
        return item.map((s: any) => `${s.name}`).join(', ')
      }
      if (item.name) {
        return item.name
      }
      if (item.skillList) {
        return item.skillList.join(', ')
      }
      return ''

    case 'projects':
      return `${item.title}: ${item.description}`

    case 'format':
      return JSON.stringify(item)

    default:
      return typeof item === 'string' ? item : JSON.stringify(item)
  }
}

/**
 * Resume Content Merging Logic
 * Merges accepted suggestions into resume content for export
 * Story 6.1: Resume Content Merging
 */

import type { ParsedResume } from '@/lib/parsers/types'
import {
  applyBulletRewrite,
  applySkillExpansion,
  applyActionVerbChange,
  applyRemoval,
} from './merge-operations'

/**
 * Database suggestion structure
 */
export interface DatabaseSuggestion {
  id: string
  scan_id: string
  section: string
  item_index: number | null
  suggestion_type: string
  original_text: string
  suggested_text: string
  reasoning: string | null
  status: string
  created_at: string
}

/**
 * Result of merge operation with metadata
 */
export interface MergeResult {
  mergedContent: ParsedResume
  appliedCount: number
  skippedCount: number
  warnings: MergeWarning[]
}

/**
 * Warning logged during merge for skipped suggestions
 */
export interface MergeWarning {
  suggestionId: string
  reason: string
}

/**
 * Main entry point for resume content merging
 * Merges all accepted suggestions into the parsed resume data
 *
 * @param resumeData - Original parsed resume structure
 * @param suggestions - All suggestions for this scan (will filter for accepted)
 * @returns Merged resume with all accepted changes applied
 */
export async function mergeResumeContent(
  resumeData: ParsedResume,
  suggestions: DatabaseSuggestion[]
): Promise<MergeResult> {
  // Filter for accepted suggestions only
  const acceptedSuggestions = suggestions.filter((s) => s.status === 'accepted')

  // Sort by created_at for deterministic ordering
  const sortedSuggestions = acceptedSuggestions.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Start with a deep copy of original resume data (immutability)
  let mergedContent: ParsedResume = JSON.parse(JSON.stringify(resumeData))
  const warnings: MergeWarning[] = []
  let appliedCount = 0
  let skippedCount = 0

  // Apply each suggestion in order
  for (const suggestion of sortedSuggestions) {
    try {
      const result = applySuggestion(mergedContent, suggestion)
      mergedContent = result.resumeData
      appliedCount++
    } catch (error) {
      // Log warning and skip this suggestion
      const reason = error instanceof Error ? error.message : 'Unknown error'
      warnings.push({
        suggestionId: suggestion.id,
        reason,
      })
      skippedCount++
      console.warn(`[mergeResumeContent] Skipped suggestion ${suggestion.id}: ${reason}`)
    }
  }

  return {
    mergedContent,
    appliedCount,
    skippedCount,
    warnings,
  }
}

/**
 * Applies a single suggestion to resume data
 * Routes to appropriate handler based on suggestion type
 *
 * @param resumeData - Current resume data
 * @param suggestion - Suggestion to apply
 * @returns Updated resume data
 */
function applySuggestion(
  resumeData: ParsedResume,
  suggestion: DatabaseSuggestion
): { resumeData: ParsedResume } {
  switch (suggestion.suggestion_type) {
    case 'bullet_rewrite':
      return {
        resumeData: applyBulletRewrite(
          resumeData,
          suggestion.section,
          suggestion.item_index,
          suggestion.original_text,
          suggestion.suggested_text
        ),
      }

    case 'skill_expansion':
      return {
        resumeData: applySkillExpansion(
          resumeData,
          suggestion.original_text,
          suggestion.suggested_text
        ),
      }

    case 'action_verb':
      return {
        resumeData: applyActionVerbChange(
          resumeData,
          suggestion.section,
          suggestion.item_index,
          suggestion.original_text,
          suggestion.suggested_text
        ),
      }

    case 'removal':
      return {
        resumeData: applyRemoval(
          resumeData,
          suggestion.section,
          suggestion.item_index,
          suggestion.original_text
        ),
      }

    case 'skill_mapping':
    case 'quantification':
    case 'format':
      // These types modify bullets or skills, treat as bullet rewrite
      return {
        resumeData: applyBulletRewrite(
          resumeData,
          suggestion.section,
          suggestion.item_index,
          suggestion.original_text,
          suggestion.suggested_text
        ),
      }

    default:
      throw new Error(`Unknown suggestion type: ${suggestion.suggestion_type}`)
  }
}

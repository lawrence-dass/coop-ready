/**
 * Merge Operations for Individual Suggestion Types
 * Each function applies a specific type of suggestion to resume data
 * Story 6.1: Resume Content Merging
 */

import type { ParsedResume, JobEntry } from '@/lib/parsers/types'

/**
 * Apply bullet point rewrite suggestion
 * Replaces original bullet text with suggested text in experience section
 *
 * @param resumeData - Original resume data
 * @param section - Section containing the bullet ('experience', 'education', 'projects')
 * @param itemIndex - Index of the job/education/project entry
 * @param originalText - Original bullet text to find
 * @param newText - New bullet text to use
 * @returns Updated resume data
 */
export function applyBulletRewrite(
  resumeData: ParsedResume,
  section: string,
  itemIndex: number | null,
  originalText: string,
  newText: string
): ParsedResume {
  // Deep clone to maintain immutability
  const updated: ParsedResume = JSON.parse(JSON.stringify(resumeData))

  if (section === 'experience') {
    if (itemIndex === null || itemIndex === undefined) {
      throw new Error('Item index required for experience bullet rewrite')
    }

    const job = updated.experience[itemIndex]
    if (!job) {
      throw new Error(`Experience entry at index ${itemIndex} not found`)
    }

    // Find and replace the bullet
    const bulletIndex = job.bulletPoints.findIndex((b) => b.includes(originalText))
    if (bulletIndex === -1) {
      throw new Error(`Bullet not found in experience[${itemIndex}]: "${originalText.substring(0, 50)}..."`)
    }

    // Replace the entire bullet with new text
    job.bulletPoints[bulletIndex] = newText
  } else if (section === 'education') {
    // Education sections typically don't have bullets, but handle it if they do
    throw new Error('Education section does not support bullet rewrites')
  } else if (section === 'projects') {
    // Projects is a string field in current schema
    if (typeof updated.projects === 'string') {
      updated.projects = updated.projects.replace(originalText, newText)
    }
  } else {
    throw new Error(`Unsupported section for bullet rewrite: ${section}`)
  }

  return updated
}

/**
 * Apply skill expansion suggestion
 * Replaces a skill name with an expanded version
 *
 * @param resumeData - Original resume data
 * @param originalSkill - Original skill name (e.g., "Python")
 * @param expandedSkill - Expanded skill (e.g., "Python (Django, Flask, FastAPI)")
 * @returns Updated resume data
 */
export function applySkillExpansion(
  resumeData: ParsedResume,
  originalSkill: string,
  expandedSkill: string
): ParsedResume {
  const updated: ParsedResume = JSON.parse(JSON.stringify(resumeData))

  // Find and replace the skill in skills array
  const skillIndex = updated.skills.findIndex((s) => s.name === originalSkill)
  if (skillIndex === -1) {
    throw new Error(`Skill not found: "${originalSkill}"`)
  }

  // Replace skill name with expanded version
  updated.skills[skillIndex].name = expandedSkill

  return updated
}

/**
 * Apply action verb change suggestion
 * Replaces an action verb in a bullet point
 *
 * @param resumeData - Original resume data
 * @param section - Section containing the bullet
 * @param itemIndex - Index of the job/project entry
 * @param originalText - Original bullet text
 * @param newText - New bullet text with improved action verb
 * @returns Updated resume data
 */
export function applyActionVerbChange(
  resumeData: ParsedResume,
  section: string,
  itemIndex: number | null,
  originalText: string,
  newText: string
): ParsedResume {
  // Action verb changes are effectively bullet rewrites
  return applyBulletRewrite(resumeData, section, itemIndex, originalText, newText)
}

/**
 * Apply removal suggestion
 * Removes flagged content from resume
 *
 * @param resumeData - Original resume data
 * @param section - Section to remove from
 * @param itemIndex - Index of item to remove or modify
 * @param targetText - Text to remove
 * @returns Updated resume data
 */
export function applyRemoval(
  resumeData: ParsedResume,
  section: string,
  itemIndex: number | null,
  targetText: string
): ParsedResume {
  const updated: ParsedResume = JSON.parse(JSON.stringify(resumeData))

  if (section === 'experience') {
    if (itemIndex === null || itemIndex === undefined) {
      throw new Error('Item index required for experience removal')
    }

    const job = updated.experience[itemIndex]
    if (!job) {
      throw new Error(`Experience entry at index ${itemIndex} not found`)
    }

    // Remove the specific bullet point that matches target text
    const bulletIndex = job.bulletPoints.findIndex((b) => b.includes(targetText))
    if (bulletIndex === -1) {
      throw new Error(`Bullet not found for removal in experience[${itemIndex}]: "${targetText.substring(0, 50)}..."`)
    }
    job.bulletPoints.splice(bulletIndex, 1)

    // If all bullets removed, remove the entire job entry
    if (job.bulletPoints.length === 0) {
      updated.experience.splice(itemIndex, 1)
    }
  } else if (section === 'skills') {
    // Remove a specific skill
    const skillIndex = updated.skills.findIndex((s) => s.name.includes(targetText))
    if (skillIndex === -1) {
      throw new Error(`Skill not found for removal: "${targetText}"`)
    }
    updated.skills.splice(skillIndex, 1)
  } else if (section === 'education') {
    if (itemIndex !== null && itemIndex !== undefined) {
      const entry = updated.education[itemIndex]
      if (entry) {
        // Remove entire education entry
        updated.education.splice(itemIndex, 1)
      }
    }
  } else if (section === 'projects') {
    // Remove text from projects string
    if (typeof updated.projects === 'string') {
      updated.projects = updated.projects.replace(targetText, '').trim()
    }
  } else if (section === 'format') {
    // Format removals typically affect string fields
    if (typeof updated.summary === 'string') {
      updated.summary = updated.summary.replace(targetText, '').trim()
    }
  }

  return updated
}


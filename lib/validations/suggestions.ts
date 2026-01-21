/**
 * Suggestions Validation Schemas
 *
 * Zod schemas for validating AI-generated suggestions in Server Actions.
 * Ensures type safety and input validation for bullet point rewrites.
 *
 * @see Story 5.1: Bullet Point Rewrite Generation
 * @see project-context.md - Zod validation required for all Server Actions
 */

import { z } from 'zod'

/**
 * Valid experience levels for rewrite context
 * Extended to support both profile-based and analysis-based levels
 */
export const suggestionExperienceLevelSchema = z.enum(
  ['entry', 'mid', 'senior', 'student', 'experienced'],
  { message: 'Invalid experience level' }
)

/**
 * Valid suggestion types matching database CHECK constraint
 */
export const suggestionTypeSchema = z.enum(
  [
    'bullet_rewrite',
    'skill_mapping',
    'action_verb',
    'quantification',
    'skill_expansion',
    'format',
    'removal',
  ],
  { message: 'Invalid suggestion type' }
)

/**
 * Valid section types matching database CHECK constraint
 */
export const suggestionSectionSchema = z.enum(
  ['experience', 'education', 'projects', 'skills', 'format'],
  { message: 'Invalid section type' }
)

/**
 * Valid suggestion status matching database CHECK constraint
 */
export const suggestionStatusSchema = z.enum(
  ['pending', 'accepted', 'rejected'],
  { message: 'Invalid suggestion status' }
)

/**
 * Schema for generating bullet point rewrites
 */
export const generateBulletRewritesInputSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID'),
  bulletPoints: z.array(z.string()).min(1, 'At least one bullet point is required'),
  experienceLevel: suggestionExperienceLevelSchema,
  targetRole: z.string().min(1, 'Target role is required'),
  isStudent: z.boolean(),
  jdKeywords: z.array(z.string()),
})

/**
 * Schema for a single suggestion to be saved
 */
export const suggestionItemSchema = z.object({
  section: suggestionSectionSchema,
  itemIndex: z.number().int().nonnegative('Item index must be non-negative'),
  originalText: z.string().min(1, 'Original text is required'),
  suggestedText: z.string().min(1, 'Suggested text is required'),
  suggestionType: suggestionTypeSchema,
  reasoning: z.string().optional(),
})

/**
 * Schema for saving suggestions to database
 */
export const saveSuggestionsInputSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID'),
  suggestions: z.array(suggestionItemSchema).min(1, 'At least one suggestion is required'),
})

/**
 * Schema for rewrite result from OpenAI
 */
export const rewriteResultSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  reasoning: z.string(),
})

/**
 * Schema for OpenAI rewrite response
 */
export const rewriteResponseSchema = z.object({
  rewrites: z.array(rewriteResultSchema),
})

// Inferred TypeScript types from schemas
export type SuggestionExperienceLevel = z.infer<typeof suggestionExperienceLevelSchema>
export type SuggestionType = z.infer<typeof suggestionTypeSchema>
export type SuggestionSection = z.infer<typeof suggestionSectionSchema>
export type SuggestionStatus = z.infer<typeof suggestionStatusSchema>
export type GenerateBulletRewritesInput = z.infer<typeof generateBulletRewritesInputSchema>
export type SuggestionItem = z.infer<typeof suggestionItemSchema>
export type SaveSuggestionsInput = z.infer<typeof saveSuggestionsInputSchema>
export type RewriteResult = z.infer<typeof rewriteResultSchema>
export type RewriteResponse = z.infer<typeof rewriteResponseSchema>

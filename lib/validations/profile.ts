/**
 * Profile Validation Schemas
 *
 * Zod schemas for validating user profile data in Server Actions.
 * Ensures type safety and input validation for onboarding flow.
 *
 * @see Story 2.1: Onboarding Flow - Experience Level & Target Role
 * @see project-context.md - Zod validation required for all Server Actions
 */

import { z } from 'zod'

// Experience level validation - must match DB CHECK constraint
export const experienceLevelSchema = z.enum(['student', 'career_changer'])

// Target role validation - accepts predefined roles or custom input
export const targetRoleSchema = z.string().min(1, 'Target role is required').max(100, 'Target role must be less than 100 characters')

// Custom role validation - optional, only when target role is "Other"
export const customRoleSchema = z.string().min(1).max(100).nullable()

// Complete onboarding input schema combining all fields
export const onboardingInputSchema = z.object({
  experienceLevel: experienceLevelSchema,
  targetRole: targetRoleSchema,
  customRole: customRoleSchema.optional(),
})

// Inferred TypeScript types from schemas
export type ExperienceLevelInput = z.infer<typeof experienceLevelSchema>
export type TargetRoleInput = z.infer<typeof targetRoleSchema>
export type OnboardingInput = z.infer<typeof onboardingInputSchema>

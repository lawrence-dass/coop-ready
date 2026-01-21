/**
 * Test Endpoint Validation Schemas
 *
 * Zod schemas for validating test API endpoint requests.
 * Used exclusively in test/development environments for E2E test data management.
 *
 * SECURITY: These endpoints are gated by NODE_ENV !== 'production'
 *
 * @see Story 8.3: Test API Endpoints for Factories
 * @see project-context.md - Zod validation required for all API endpoints
 */

import { z } from 'zod'

// User test endpoint schemas
export const createTestUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  experienceLevel: z.enum(['student', 'career_changer', 'experienced'], {
    message: 'Experience level must be student, career_changer, or experienced',
  }),
})

export type CreateTestUserInput = z.infer<typeof createTestUserSchema>

// Resume test endpoint schemas
export const createTestResumeSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  fileName: z.string().min(1, 'File name is required'),
  textContent: z.string().min(1, 'Text content is required'),
})

export type CreateTestResumeInput = z.infer<typeof createTestResumeSchema>

// Scan test endpoint schemas
export const createTestScanSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  resumeId: z.string().uuid('Invalid resume ID format'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
})

export type CreateTestScanInput = z.infer<typeof createTestScanSchema>

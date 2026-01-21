import { z } from 'zod'

/**
 * Validation schemas for analysis operations
 *
 * @see Story 4.2: ATS Score Calculation
 */

export const analysisInputSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID format'),
})

export type AnalysisInputSchema = z.infer<typeof analysisInputSchema>

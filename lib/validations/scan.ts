import { z } from 'zod'

/**
 * Job Description Validation Schema
 *
 * @see Story 3.5: Job Description Input
 */
export const jobDescriptionSchema = z.object({
  jobDescription: z.string()
    .min(1, 'Please enter a job description')
    .max(5000, 'Job description must be under 5000 characters')
})

export type JobDescriptionInput = z.infer<typeof jobDescriptionSchema>

/**
 * Scan creation input schema
 * Combines resume ID and job description
 */
export const scanInputSchema = z.object({
  resumeId: z.string().uuid('Invalid resume ID'),
  jobDescription: z.string()
    .min(1, 'Please enter a job description')
    .max(5000, 'Job description must be under 5000 characters')
})

export type ScanInput = z.infer<typeof scanInputSchema>

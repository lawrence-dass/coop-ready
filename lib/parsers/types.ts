/**
 * TypeScript types for resume section parsing
 * Story: 3.3 Resume Section Parsing
 */

import { z } from 'zod'

// Resume section types
export type ResumeSection =
  | 'contact'
  | 'summary'
  | 'education'
  | 'experience'
  | 'skills'
  | 'projects'
  | 'other'

// Job entry structure for Experience section
export interface JobEntry {
  company: string
  title: string
  dates: string
  bulletPoints: string[]
}

// Education entry structure for Education section
export interface EducationEntry {
  institution: string
  degree: string
  dates: string
  gpa?: string
}

// Skill with category
export interface Skill {
  name: string
  category: 'technical' | 'soft'
}

// Complete parsed resume structure
export interface ParsedResume {
  contact: string
  summary: string
  experience: JobEntry[]
  education: EducationEntry[]
  skills: Skill[]
  projects: string
  other: string
}

// Zod schemas for validation

export const jobEntrySchema = z.object({
  company: z.string(),
  title: z.string(),
  dates: z.string(),
  bulletPoints: z.array(z.string()),
})

export const educationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  dates: z.string(),
  gpa: z.string().optional(),
})

export const skillSchema = z.object({
  name: z.string(),
  category: z.enum(['technical', 'soft']),
})

export const parsedResumeSchema = z.object({
  contact: z.string(),
  summary: z.string(),
  experience: z.array(jobEntrySchema),
  education: z.array(educationEntrySchema),
  skills: z.array(skillSchema),
  projects: z.string(),
  other: z.string(),
})

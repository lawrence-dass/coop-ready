/**
 * Experience Levels and Target Roles Configuration
 *
 * Defines the available experience levels and target roles for user onboarding.
 * Used in onboarding flow to personalize AI analysis.
 *
 * @see Story 2.1: Onboarding Flow - Experience Level & Target Role
 */

export const EXPERIENCE_LEVELS = [
  {
    id: 'student',
    label: 'Student/Recent Graduate',
    description: 'Currently studying or graduated within the last 2 years. Looking for entry-level positions or internships.',
  },
  {
    id: 'career_changer',
    label: 'Career Changer',
    description: 'Transitioning from another field. Bringing transferable skills to a new industry.',
  },
] as const

export const TARGET_ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Product Manager',
  'UX Designer',
  'Data Scientist',
  'DevOps Engineer',
  'QA Engineer',
  'Business Analyst',
  'Other',
] as const

// TypeScript types for type safety
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]['id']
export type TargetRole = typeof TARGET_ROLES[number]

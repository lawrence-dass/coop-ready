/**
 * Experience Context Builder
 *
 * Creates narrative context for experience-level-aware resume analysis.
 * This context is injected into the AI prompt to personalize feedback based on
 * the candidate's experience level (Student, Career Changer, or Experienced).
 *
 * @see Story 4.5: Experience-Level-Aware Analysis - AC 1-9
 */

/**
 * Build experience-level context narrative for AI prompt
 *
 * Creates a narrative description of how to analyze the resume based on the
 * candidate's experience level. The context instructs the AI on what to emphasize,
 * what not to penalize, and what feedback focus is appropriate.
 *
 * @param experienceLevel - One of: 'student', 'career_changer', 'experienced'
 * @param targetRole - Optional target role to include in context
 * @returns Narrative context string suitable for prompt injection
 *
 * @example
 * const context = buildExperienceContext('student', 'Software Engineer')
 * // Returns narrative about emphasizing academic projects, internships, etc.
 */
export function buildExperienceContext(
  experienceLevel: string,
  targetRole?: string | null
): string {
  const roleContext = targetRole ? ` targeting ${targetRole} roles` : ''

  switch (experienceLevel) {
    case 'student':
      return `This candidate is a student or recent graduate (within 2 years)${roleContext}. When scoring, emphasize the value of academic projects, relevant coursework, and internships. Do not penalize for limited years of professional experience. Instead, translate academic achievements into professional language. Value relevant certifications and school prestige. Focus feedback on helping this candidate bridge from academia to professional tech roles, showing how their academic work demonstrates real-world capability.`

    case 'career_changer':
      return `This candidate is transitioning to tech from a non-tech background${roleContext}. When scoring, focus on identifying and emphasizing transferable skills from their previous career. Value bootcamp training, online certifications, and personal projects that demonstrate tech capability. Map existing experience to tech terminology. The goal is helping them articulate how their unique background strengthens the team while demonstrating genuine tech skills. Highlight learning ability and commitment to the tech field.`

    case 'experienced':
      return `This candidate has 2+ years of tech experience${roleContext}. When scoring, emphasize quantified impact, architectural decisions, and leadership contributions. Look for evidence of growth and scale. The goal is helping them craft a resume that showcases their professional impact and readiness for senior or specialized roles. Focus on metrics, scope of influence, and technical depth.`

    default:
      // Default to student level if unknown
      console.warn(`[buildExperienceContext] Unknown experience level: ${experienceLevel}, defaulting to student`)
      return `This candidate is a student or recent graduate (within 2 years)${roleContext}. When scoring, emphasize the value of academic projects, relevant coursework, and internships. Do not penalize for limited years of professional experience. Instead, translate academic achievements into professional language. Value relevant certifications and school prestige. Focus feedback on helping this candidate bridge from academia to professional tech roles, showing how their academic work demonstrates real-world capability.`
  }
}

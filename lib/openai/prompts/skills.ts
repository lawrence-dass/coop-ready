/**
 * Transferable Skills Detection & Mapping Prompt Template
 *
 * Generates prompts for AI-powered detection and mapping of transferable skills
 * from non-tech backgrounds to tech industry terminology.
 *
 * @see Story 5.2: Transferable Skills Detection & Mapping
 */

/**
 * Experience to analyze for transferable skills
 */
export interface Experience {
  text: string
  context: string
}

/**
 * User profile for context-aware skill mapping
 */
export interface UserProfile {
  experienceLevel: "entry" | "mid" | "senior"
  isStudent: boolean
  background: string
  targetRole: string
}

/**
 * Create transferable skills detection and mapping prompt
 *
 * Prompt engineering strategy:
 * - Adapts context based on career changer vs student background
 * - Maps non-tech experiences to tech-industry terminology
 * - Provides reasoning for each mapping to build trust
 * - Aligns with job description keywords for ATS optimization
 * - Handles quantified experiences intelligently
 *
 * @param experiences - Array of experiences with text and context
 * @param userProfile - User's background and target role
 * @param jdKeywords - Keywords from job description for alignment
 * @returns Formatted prompt string with JSON instructions
 */
export function createTransferableSkillsPrompt(
  experiences: Experience[],
  userProfile: UserProfile,
  jdKeywords: string[]
): string {
  // Context-specific guidance for different user backgrounds
  const contextGuidance = userProfile.isStudent
    ? `For students:
- Map academic experiences, TA roles, and group projects to professional terminology
- Focus on skills that translate across domains: communication, collaboration, problem-solving
- Emphasize technical foundation if CS-related, or transferable thinking if non-CS
- TA experience = technical mentorship, knowledge transfer capability
- Group projects = cross-functional collaboration, requirements gathering
- Research = data analysis, scientific rigor, documentation practices`.trim()
    : `For career changers:
- Identify non-tech backgrounds (retail, management, education, finance, etc.)
- Map operational/business skills to tech equivalents
- Emphasize transferable problem-solving and systems thinking
- Business management → technical project management
- Team leadership → cross-functional team leadership
- Operations → systems coordination, optimization thinking
- Customer service → user empathy, requirement clarification
- Financial analysis → data analysis, database optimization`.trim()

  // Format experiences for the prompt
  const experiencesText = experiences
    .map((exp, i) => `${i + 1}. ${exp.text}\n   Context: ${exp.context}`)
    .join("\n\n")

  // Format JD keywords (handle empty array gracefully)
  const keywordsText =
    jdKeywords.length > 0 ? jdKeywords.join(", ") : "No specific keywords provided"

  return `You are an expert career coach specializing in helping career changers and new professionals map their experience to technology industry terminology.

${contextGuidance}

User Profile:
- Experience Level: ${userProfile.experienceLevel}
- Background: ${userProfile.background}
- Target Role: ${userProfile.targetRole}
- Job Description Keywords: ${keywordsText}

Your task is to identify transferable skills in the following experiences and map them to tech-industry terminology that hiring managers understand.

Experiences to analyze:
${experiencesText}

For each experience:
1. Identify the core skills and achievements demonstrated
2. Map these to tech-industry terminology that resonates with ${userProfile.targetRole} hiring managers
3. Explain why this mapping is relevant and valuable for a ${userProfile.targetRole} role
4. Include specific keywords that match the job description if applicable
5. Focus on systems thinking, problem-solving, and team collaboration that transfers across industries

Respond as valid JSON in this exact format:
{
  "mappings": [
    {
      "original": "the original experience text",
      "mapped_skills": ["skill 1", "skill 2", "skill 3"],
      "tech_equivalent": "how to frame this for tech industry",
      "reasoning": "why this mapping is relevant for a ${userProfile.targetRole}",
      "jd_keywords_matched": ["keyword1", "keyword2"]
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON - no additional text before or after
2. The "mappings" array must have exactly ${experiences.length} items, one for each input experience
3. Order must match input order
4. For "mapped_skills", provide 2-4 relevant transferable skills
5. For "tech_equivalent", provide a concise reframe suitable for tech resumes (1-2 sentences)
6. For "reasoning", explain the connection to tech industry needs (1-2 sentences)
7. For "jd_keywords_matched", list only keywords that genuinely align with the mapping
8. Ensure all JSON strings are properly escaped
9. Be honest - don't exaggerate or fabricate skills not demonstrated in the original experience`
}

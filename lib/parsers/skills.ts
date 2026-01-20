/**
 * Skills section parser
 * Story: 3.3 Resume Section Parsing
 */

import type { Skill } from './types'

// Common technical keywords for categorization
const TECHNICAL_KEYWORDS = new Set([
  // Programming languages
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
  'kotlin', 'php', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'bash', 'shell',

  // Frameworks & libraries
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring',
  'rails', 'laravel', '.net', 'asp.net', 'jquery', 'bootstrap', 'tailwind', 'redux',

  // Databases
  'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'dynamodb', 'cassandra',
  'elasticsearch', 'sql server', 'firestore', 'supabase',

  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'terraform',
  'ansible', 'ci/cd', 'linux', 'unix', 'nginx', 'apache',

  // Tools & Technologies
  'git', 'jira', 'confluence', 'postman', 'figma', 'photoshop', 'illustrator', 'sketch',
  'vs code', 'intellij', 'eclipse', 'xcode', 'android studio',

  // Data & AI
  'machine learning', 'deep learning', 'ai', 'nlp', 'computer vision', 'tensorflow',
  'pytorch', 'pandas', 'numpy', 'scikit-learn', 'jupyter',

  // Other technical
  'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'testing', 'unit testing',
  'integration testing', 'tdd', 'bdd', 'responsive design', 'mobile development',
])

// Common soft skills keywords
const SOFT_SKILLS_KEYWORDS = new Set([
  'communication', 'leadership', 'teamwork', 'collaboration', 'problem-solving',
  'critical thinking', 'analytical', 'creative', 'adaptable', 'flexible',
  'time management', 'organization', 'detail-oriented', 'self-motivated',
  'interpersonal', 'presentation', 'public speaking', 'mentoring', 'coaching',
  'conflict resolution', 'negotiation', 'decision making', 'strategic thinking',
])

/**
 * Categorize a skill as technical or soft based on keywords
 */
function categorizeSkill(skillName: string): 'technical' | 'soft' {
  const normalized = skillName.toLowerCase().trim()

  // Check if it matches any technical keyword
  for (const keyword of TECHNICAL_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return 'technical'
    }
  }

  // Check if it matches any soft skill keyword
  for (const keyword of SOFT_SKILLS_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return 'soft'
    }
  }

  // Default to technical if uncertain (most resumes list technical skills)
  return 'technical'
}

/**
 * Parse skills section into categorized skill list
 * Handles comma/semicolon separation and grouped skills
 */
export function parseSkillsSection(text: string): Skill[] {
  if (!text || !text.trim()) return []

  const skills: Skill[] = []
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

  // Pattern for grouped skills: "Languages: Python, Java, C++"
  const groupPattern = /^([^:]+):\s*(.+)$/

  for (const line of lines) {
    // Check if line has grouped format
    const groupMatch = line.match(groupPattern)

    if (groupMatch) {
      const [, , skillsText] = groupMatch

      // Split by comma, semicolon, pipe, or bullet points
      const individualSkills = skillsText
        .split(/[,;|•·\-]/)
        .map(s => s.trim())
        .filter(Boolean)

      for (const skill of individualSkills) {
        skills.push({
          name: skill,
          category: categorizeSkill(skill),
        })
      }
    } else {
      // No grouping - split by common separators including bullets
      // Also handle lines that start with bullet markers
      const cleanLine = line.replace(/^[•·\-\*>\s]+/, '')
      const individualSkills = cleanLine
        .split(/[,;|•·]/)
        .map(s => s.trim())
        .filter(Boolean)

      for (const skill of individualSkills) {
        // Skip if it looks like a section header
        if (skill.toLowerCase().endsWith(':')) continue

        skills.push({
          name: skill,
          category: categorizeSkill(skill),
        })
      }
    }
  }

  // Remove duplicates (case-insensitive)
  const uniqueSkills = new Map<string, Skill>()
  for (const skill of skills) {
    const key = skill.name.toLowerCase()
    if (!uniqueSkills.has(key)) {
      uniqueSkills.set(key, skill)
    }
  }

  return Array.from(uniqueSkills.values())
}

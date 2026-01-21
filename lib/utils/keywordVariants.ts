/**
 * Keyword Variants Configuration
 *
 * Maps common abbreviations and alternative forms to canonical keywords.
 * This module serves as a reference for the OpenAI prompt engineering.
 *
 * NOTE: Keyword variant recognition is currently handled by OpenAI via the
 * scoring prompt (see lib/openai/prompts/scoring.ts). This module provides:
 * 1. Documentation of supported variants
 * 2. Utility functions for future client-side variant matching
 * 3. Reference for extending variant support
 *
 * @see Story 4.3: Missing Keywords Detection
 *
 * @example
 * "JS" maps to "JavaScript"
 * "TS" maps to "TypeScript"
 */

export const KEYWORD_VARIANTS: Record<string, string[]> = {
  // Programming Languages
  JavaScript: ['JS', 'js', 'javascript', 'ECMAScript'],
  TypeScript: ['TS', 'ts', 'typescript'],
  Python: ['python', 'py'],

  // Frontend Frameworks/Libraries
  React: ['react', 'ReactJS', 'React.js', 'react.js'],
  Vue: ['vue', 'VueJS', 'Vue.js', 'vue.js'],
  Angular: ['angular', 'AngularJS', 'Angular.js'],

  // Backend Technologies
  Node: ['node', 'NodeJS', 'Node.js', 'node.js'],
  Express: ['express', 'ExpressJS', 'Express.js'],

  // Databases
  PostgreSQL: ['postgres', 'pg', 'postgresql', 'Postgres'],
  MySQL: ['mysql', 'My SQL'],
  MongoDB: ['mongo', 'mongodb', 'Mongo DB'],
  Database: ['DB', 'db', 'database'],

  // API Technologies
  REST: ['rest', 'RESTful', 'REST API', 'RESTful API'],
  GraphQL: ['graphql', 'GraphQL API'],
  API: ['api', 'APIs'],

  // Cloud Platforms
  AWS: ['aws', 'Amazon Web Services'],
  GCP: ['gcp', 'Google Cloud Platform', 'Google Cloud'],
  Azure: ['azure', 'Microsoft Azure'],

  // DevOps Tools
  Docker: ['docker', 'containerization'],
  Kubernetes: ['k8s', 'kubernetes', 'K8s'],
  CI_CD: ['CI/CD', 'CI', 'CD', 'Continuous Integration', 'Continuous Deployment'],

  // Version Control
  Git: ['git', 'version control', 'source control'],
  GitHub: ['github', 'Github'],

  // Testing
  Jest: ['jest'],
  Playwright: ['playwright', 'Playwright Test'],
  Testing: ['test', 'testing', 'QA'],

  // General
  SQL: ['sql', 'Structured Query Language'],
  NoSQL: ['nosql', 'NoSQL databases'],
  HTML: ['html', 'HTML5'],
  CSS: ['css', 'CSS3', 'Cascading Style Sheets'],
}

/**
 * Get all variants for a given keyword
 *
 * @param keyword - The canonical keyword to get variants for
 * @returns Array of variant strings, including the canonical form
 */
export function getKeywordVariants(keyword: string): string[] {
  // Find the canonical keyword (case-insensitive)
  const canonicalKey = Object.keys(KEYWORD_VARIANTS).find(
    (key) => key.toLowerCase() === keyword.toLowerCase()
  )

  if (!canonicalKey) {
    return [keyword]
  }

  return [canonicalKey, ...(KEYWORD_VARIANTS[canonicalKey] || [])]
}

/**
 * Find the canonical form of a keyword if it's a known variant
 *
 * @param variant - The variant to look up
 * @returns The canonical keyword, or the original variant if not found
 */
export function getCanonicalKeyword(variant: string): string {
  for (const [canonical, variants] of Object.entries(KEYWORD_VARIANTS)) {
    if (canonical.toLowerCase() === variant.toLowerCase()) {
      return canonical
    }
    if (variants.some((v) => v.toLowerCase() === variant.toLowerCase())) {
      return canonical
    }
  }
  return variant
}

/**
 * Example: Adding new keyword variants at runtime (for future use)
 *
 * If you need to add domain-specific variants, create a new constant
 * rather than mutating KEYWORD_VARIANTS to avoid race conditions:
 *
 * @example
 * const CUSTOM_VARIANTS = {
 *   ...KEYWORD_VARIANTS,
 *   Salesforce: ['SF', 'SFDC', 'salesforce'],
 * }
 */

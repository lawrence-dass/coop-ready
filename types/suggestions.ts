/**
 * Suggestion Types for Content Optimization
 * Story 6.2: Implement Summary Section Suggestions
 * Story 6.3: Implement Skills Section Suggestions
 */

// ============================================================================
// SUMMARY SUGGESTION TYPES
// ============================================================================

/**
 * AI-tell phrase detection result
 * Identifies AI-generated language and provides natural rewrites
 */
export interface AITellRewrite {
  detected: string; // The AI-tell phrase that was found
  rewritten: string; // The more natural replacement
}

/**
 * Summary optimization suggestion
 * Contains original vs optimized summary with details
 */
export interface SummarySuggestion {
  original: string; // User's original summary
  suggested: string; // Optimized version with keywords
  ats_keywords_added: string[]; // Keywords from JD that were incorporated
  ai_tell_phrases_rewritten: AITellRewrite[]; // AI language that was fixed
}

// ============================================================================
// SKILLS SUGGESTION TYPES (Story 6.3)
// ============================================================================

/**
 * Individual skill with metadata
 */
export interface SkillItem {
  skill: string; // The skill name
  reason?: string; // Why this skill is relevant or suggested
}

/**
 * Skills optimization suggestion
 * Contains analysis and recommendations for skills section
 */
export interface SkillsSuggestion {
  /** User's original skills section text */
  original: string;

  /** Skills currently in the resume */
  existing_skills: string[];

  /** Keywords from JD that matched existing skills */
  matched_keywords: string[];

  /** Skills from JD that are missing but relevant based on user's experience */
  missing_but_relevant: SkillItem[];

  /** Recommended skills to add */
  skill_additions: string[];

  /** Skills that might be less relevant for this role */
  skill_removals: SkillItem[];

  /** Summary of the analysis */
  summary: string;
}

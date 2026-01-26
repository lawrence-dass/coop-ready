/**
 * Suggestion Types for Content Optimization
 * Story 6.2: Implement Summary Section Suggestions
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

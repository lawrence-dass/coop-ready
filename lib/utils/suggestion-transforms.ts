/**
 * Suggestion Transform Utilities
 *
 * Pure utility functions for transforming suggestion data between formats.
 * These are NOT server actions - they're synchronous transform functions.
 *
 * @see Story 5.3: Action Verb & Quantification Suggestions
 * @see Story 5.4: Skills Expansion Suggestions
 * @see Story 5.5: Format & Content Removal Suggestions
 */

/**
 * Transform action verb and quantification suggestions to database-compatible format
 *
 * Converts the API response structure to the format expected by saveSuggestions.
 * - Action verb suggestions become suggestion_type: 'action_verb'
 * - Quantification suggestions become suggestion_type: 'quantification'
 * - Both suggestions for the same bullet become separate database records
 *
 * @param suggestions - Array of suggestions from generateActionVerbAndQuantificationSuggestions
 * @returns Array of suggestions in saveSuggestions format
 */
export function transformActionVerbSuggestions(
  suggestions: Array<{
    original: string
    actionVerbSuggestion: {
      improved: string
      alternatives: string[]
      reasoning: string
    } | null
    quantificationSuggestion: {
      prompt: string
      example: string
      metricsToConsider: string[]
    } | null
  }>
): Array<{
  section: string
  itemIndex: number
  originalText: string
  suggestedText: string
  suggestionType: string
  reasoning?: string
}> {
  const transformed: Array<{
    section: string
    itemIndex: number
    originalText: string
    suggestedText: string
    suggestionType: string
    reasoning?: string
  }> = []

  suggestions.forEach((sugg, index) => {
    // Add action verb suggestion
    if (sugg.actionVerbSuggestion) {
      transformed.push({
        section: 'experience',
        itemIndex: index,
        originalText: sugg.original,
        suggestedText: sugg.actionVerbSuggestion.improved,
        suggestionType: 'action_verb',
        reasoning: `${sugg.actionVerbSuggestion.reasoning}\nAlternatives: ${sugg.actionVerbSuggestion.alternatives.join(', ')}`,
      })
    }

    // Add quantification suggestion
    if (sugg.quantificationSuggestion) {
      transformed.push({
        section: 'experience',
        itemIndex: index,
        originalText: sugg.original,
        suggestedText: sugg.quantificationSuggestion.prompt,
        suggestionType: 'quantification',
        reasoning: `${sugg.quantificationSuggestion.prompt}\n\nExample: ${sugg.quantificationSuggestion.example}\n\nMetrics to consider: ${sugg.quantificationSuggestion.metricsToConsider.join(', ')}`,
      })
    }
  })

  return transformed
}

/**
 * Transform skill expansion suggestions to database-compatible format
 *
 * Converts the API response structure to the format expected by saveSuggestions.
 * - Filters out null expansions
 * - Sets section to 'skills'
 * - Sets suggestion_type to 'skill_expansion'
 * - Includes keywords matched in reasoning
 *
 * @param suggestions - Array of suggestions from generateSkillExpansionSuggestions
 * @returns Array of suggestions in saveSuggestions format
 */
export function transformSkillExpansionSuggestions(
  suggestions: Array<{
    original: string
    expansion: string | null
    keywordsMatched: string[]
    reasoning: string
  }>
): Array<{
  section: string
  itemIndex: number
  originalText: string
  suggestedText: string
  suggestionType: string
  reasoning?: string
}> {
  return suggestions
    .filter((sugg) => sugg.expansion !== null)
    .map((sugg, index) => ({
      section: 'skills',
      itemIndex: index,
      originalText: sugg.original,
      suggestedText: sugg.expansion!,
      suggestionType: 'skill_expansion',
      reasoning: `${sugg.reasoning}\n\nKeywords matched: ${sugg.keywordsMatched.join(', ') || 'none'}`,
    }))
}

/**
 * Transform format and removal suggestions to database-compatible format
 *
 * Converts the API response structure to the format expected by saveSuggestions.
 * - Format suggestions have `suggestion_type: 'format'`
 * - Removal suggestions have `suggestion_type: 'removal'`
 * - Both use `section: 'format'` as a meta-section for resume-wide suggestions
 *
 * @param suggestions - Array of suggestions from generateFormatAndRemovalSuggestions
 * @returns Array of suggestions in saveSuggestions format
 */
export function transformFormatAndRemovalSuggestions(
  suggestions: Array<{
    type: 'format' | 'removal'
    original: string
    suggested: string | null
    reasoning: string
    urgency: 'high' | 'medium' | 'low'
  }>
): Array<{
  section: string
  itemIndex: number
  originalText: string
  suggestedText: string
  suggestionType: string
  reasoning?: string
}> {
  return suggestions.map((sugg, index) => ({
    section: 'format',
    itemIndex: index,
    originalText: sugg.original,
    suggestedText: sugg.suggested || 'Remove',
    suggestionType: sugg.type,
    reasoning: `[${sugg.urgency.toUpperCase()}] ${sugg.reasoning}`,
  }))
}

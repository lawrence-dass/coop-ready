/**
 * OpenAI Integration - Main Export
 *
 * Exports all OpenAI utilities for use in Server Actions
 */

export { getOpenAIClient, initializeOpenAI } from './client'
export { parseOpenAIResponse, calculateCost, isValidChatCompletion } from './parseResponse'
export {
  withRetry,
  isRateLimitError,
  isNetworkError,
  isTimeoutError,
  classifyError,
  createOpenAIError,
  getUserFriendlyMessage,
  shouldRetry,
  calculateBackoffDelay,
} from './retry'
export * from './types'

// Prompts (Story 4.2+)
export { createATSScoringPrompt } from './prompts/scoring'
export { parseAnalysisResponse, isValidAnalysisResult } from './prompts/parseAnalysis'

// Keyword Extraction (Story 4.3)
export {
  parseKeywordsResponse,
  toKeywordAnalysis,
  isValidKeywordResult,
} from './prompts/parseKeywords'

// Section Scoring (Story 4.4)
export {
  parseSectionScoresResponse,
  isValidSectionScoresResult,
} from './prompts/parseSectionScores'

// Suggestions (Story 5.1)
export { createBulletRewritePrompt, type UserProfile } from './prompts/suggestions'

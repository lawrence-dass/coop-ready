/**
 * OpenAI Integration Type Definitions
 *
 * Defines types for OpenAI API responses, token usage, and error handling.
 */

/**
 * Token usage information from OpenAI API response
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Parsed OpenAI API response with content and usage metadata
 */
export interface OpenAIResponse {
  content: string
  usage: TokenUsage
  costEstimate: number // Cost in USD
}

/**
 * Error classification for different OpenAI error types
 */
export type OpenAIErrorType =
  | 'rate_limit'    // 429 errors - retry with exponential backoff
  | 'network'       // Connection/DNS errors - retry once
  | 'timeout'       // Request timeout > 30s - do not retry
  | 'config'        // Missing/invalid API key - fatal error
  | 'malformed'     // Unexpected response format
  | 'unknown'       // Unclassified error

/**
 * Structured error for OpenAI operations
 */
export interface OpenAIError {
  type: OpenAIErrorType
  message: string // User-friendly message
  originalError?: unknown // Original error for logging (server-side only)
  retryable: boolean
}

/**
 * Configuration for OpenAI client initialization
 */
export interface OpenAIClientConfig {
  apiKey: string
  timeout: number // milliseconds
}

/**
 * Constants for OpenAI configuration
 */
export const OPENAI_TIMEOUT_MS = 30000 // 30 seconds
export const MAX_RETRIES = 3 // For rate limit errors
export const NETWORK_RETRY_COUNT = 1 // For network errors

// GPT-4o-mini pricing (per 1M tokens) - as of 2026-01-20
export const OPENAI_PRICING = {
  INPUT_PER_MILLION: 0.15,   // $0.15 per 1M input tokens
  OUTPUT_PER_MILLION: 0.60,  // $0.60 per 1M output tokens
} as const

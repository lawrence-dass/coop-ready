/**
 * OpenAI Client with Singleton Pattern
 *
 * Provides a single OpenAI client instance for all API calls.
 * Includes timeout configuration and initialization validation.
 */

import OpenAI from 'openai'
import { OPENAI_TIMEOUT_MS } from './types'

let openaiClient: OpenAI | null = null

/**
 * Initialize the OpenAI client with API key validation
 *
 * Timeout Strategy:
 * - Set explicit 30-second timeout to prevent hanging requests
 * - OpenAI API typically responds within 5-15 seconds for resume analysis
 * - 30 seconds allows buffer for complex requests while preventing indefinite hangs
 */
export function initializeOpenAI(): OpenAI {
  // Return existing client if already initialized
  if (openaiClient) {
    return openaiClient
  }

  const apiKey = process.env.OPENAI_API_KEY

  // Validate API key exists
  if (!apiKey || apiKey.trim() === '') {
    const errorMsg = '[OpenAI] FATAL: Missing OPENAI_API_KEY environment variable'
    console.error(errorMsg)
    throw new Error('OpenAI API key is not configured')
  }

  try {
    // Initialize OpenAI client with timeout
    openaiClient = new OpenAI({
      apiKey,
      timeout: OPENAI_TIMEOUT_MS,
    })

    console.info('[OpenAI] Client initialized successfully', {
      timeout: OPENAI_TIMEOUT_MS,
      timestamp: new Date().toISOString(),
    })

    return openaiClient
  } catch (error) {
    // Log only safe error fields, never the full error object
    console.error('[OpenAI] Client initialization failed', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

/**
 * Get the initialized OpenAI client
 *
 * @throws {Error} If client is not initialized (missing API key)
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    return initializeOpenAI()
  }
  return openaiClient
}

// Default export for convenience
export default getOpenAIClient

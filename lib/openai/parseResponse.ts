/**
 * OpenAI Response Parsing & Token Logging
 *
 * Parses OpenAI API responses and logs token usage for cost monitoring.
 */

import type { ChatCompletion } from 'openai/resources/chat'
import { OPENAI_PRICING } from './types'
import type { OpenAIResponse, TokenUsage } from './types'

/**
 * Calculate cost estimate for API call
 *
 * Formula: (promptTokens * INPUT_PRICE + completionTokens * OUTPUT_PRICE) / 1_000_000
 *
 * @param promptTokens - Number of prompt tokens used
 * @param completionTokens - Number of completion tokens used
 * @returns Cost estimate in USD
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number
): number {
  const inputCost = (promptTokens * OPENAI_PRICING.INPUT_PER_MILLION) / 1_000_000
  const outputCost =
    (completionTokens * OPENAI_PRICING.OUTPUT_PER_MILLION) / 1_000_000
  return inputCost + outputCost
}

/**
 * Parse OpenAI chat completion response
 *
 * Extracts content, token usage, and calculates cost.
 * Logs token usage and cost for monitoring.
 *
 * @param response - OpenAI ChatCompletion response
 * @returns Parsed response with content and usage metadata
 * @throws {Error} If response format is malformed
 */
export function parseOpenAIResponse(response: ChatCompletion): OpenAIResponse {
  try {
    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new Error('Response has no choices')
    }

    const firstChoice = response.choices[0]
    if (!firstChoice.message || !firstChoice.message.content) {
      throw new Error('Response choice has no message content')
    }

    // Extract content
    const content = firstChoice.message.content

    // Validate usage metadata
    if (!response.usage) {
      throw new Error('Response has no usage metadata')
    }

    // Extract token usage
    const promptTokens = response.usage.prompt_tokens
    const completionTokens = response.usage.completion_tokens
    const totalTokens = response.usage.total_tokens

    // Calculate cost
    const costEstimate = calculateCost(promptTokens, completionTokens)

    // Log token usage at DEBUG level
    console.debug('[OpenAI] Token usage', {
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp: new Date().toISOString(),
    })

    // Log cost estimate at DEBUG level
    console.debug('[OpenAI] Cost estimate', {
      costUSD: costEstimate.toFixed(6),
      timestamp: new Date().toISOString(),
    })

    // Create usage object
    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
    }

    // Return parsed response
    return {
      content,
      usage,
      costEstimate,
    }
  } catch (error) {
    // Log only structural info, never content (may contain user data)
    console.error('[OpenAI] Failed to parse response', {
      error: error instanceof Error ? error.message : String(error),
      responseId: response?.id,
      model: response?.model,
      choicesCount: response?.choices?.length ?? 0,
      hasUsage: !!response?.usage,
      timestamp: new Date().toISOString(),
    })

    throw new Error('Malformed OpenAI response')
  }
}

/**
 * Validate that response contains expected fields
 *
 * @param response - Response to validate
 * @returns True if valid, false otherwise
 */
export function isValidChatCompletion(response: unknown): response is ChatCompletion {
  if (!response || typeof response !== 'object') {
    return false
  }

  const r = response as Partial<ChatCompletion>

  // Check for required fields
  return !!(
    r.choices &&
    Array.isArray(r.choices) &&
    r.choices.length > 0 &&
    r.usage &&
    typeof r.usage === 'object'
  )
}

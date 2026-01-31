/**
 * Shared Model Factory
 * Phase 1 Quick Win: Centralized model instances to reduce connection overhead
 *
 * Creates ChatAnthropic instances with consistent configuration.
 * The Anthropic SDK handles connection pooling internally.
 *
 * Model Strategy:
 * - Sonnet: Used for suggestion generation in production (higher quality, user-facing)
 * - Haiku: Used for judge/validation tasks, and all tasks in development (fast, cost-efficient)
 *
 * Environment Variable:
 * - LLM_TIER=production  → Use Sonnet for suggestions (default in production)
 * - LLM_TIER=development → Use Haiku for everything (cheaper for dev/testing)
 */

import { ChatAnthropic } from '@langchain/anthropic';

/**
 * Model configuration options
 */
export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Model configurations
 */
const HAIKU_MODEL = 'claude-3-5-haiku-20241022' as const;
const SONNET_MODEL = 'claude-sonnet-4-20250514' as const;

/**
 * Check if we should use production-tier models (Sonnet for generation)
 * Set LLM_TIER=development to use Haiku for everything (cheaper)
 * Set LLM_TIER=production to use Sonnet for suggestions (better quality)
 *
 * Defaults to 'development' if not set (cost-safe default)
 */
export function isProductionTier(): boolean {
  return process.env.LLM_TIER === 'production';
}

/**
 * Get current LLM tier for logging
 */
export function getLLMTier(): 'production' | 'development' {
  return isProductionTier() ? 'production' : 'development';
}

/**
 * Get a Haiku model instance with specified options
 *
 * Best for: Fast, cost-efficient tasks like validation, keyword extraction, judging
 * Always uses Haiku regardless of LLM_TIER setting
 *
 * @param options - Optional temperature and maxTokens settings
 * @returns ChatAnthropic instance
 */
export function getHaikuModel(options?: ModelOptions): ChatAnthropic {
  return new ChatAnthropic({
    modelName: HAIKU_MODEL,
    temperature: options?.temperature ?? 0,
    maxTokens: options?.maxTokens ?? 2000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Get a Sonnet model instance with specified options
 *
 * Best for: High-quality generation tasks like resume suggestions
 * Only used when LLM_TIER=production, otherwise falls back to Haiku
 *
 * @param options - Optional temperature and maxTokens settings
 * @returns ChatAnthropic instance
 */
export function getSonnetModel(options?: ModelOptions): ChatAnthropic {
  const modelName = isProductionTier() ? SONNET_MODEL : HAIKU_MODEL;

  return new ChatAnthropic({
    modelName,
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 4000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
}

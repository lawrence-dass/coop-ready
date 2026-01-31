/**
 * Shared Model Factory
 * Phase 1 Quick Win: Centralized model instances to reduce connection overhead
 *
 * Creates ChatAnthropic instances with consistent configuration.
 * The Anthropic SDK handles connection pooling internally.
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
 * Default model configuration
 */
const DEFAULT_CONFIG = {
  modelName: 'claude-3-5-haiku-20241022' as const,
};

/**
 * Get a Haiku model instance with specified options
 *
 * Creates a ChatAnthropic instance configured for Claude 3.5 Haiku.
 * The Anthropic SDK handles HTTP connection reuse internally.
 *
 * @param options - Optional temperature and maxTokens settings
 * @returns ChatAnthropic instance
 */
export function getHaikuModel(options?: ModelOptions): ChatAnthropic {
  return new ChatAnthropic({
    ...DEFAULT_CONFIG,
    temperature: options?.temperature ?? 0,
    maxTokens: options?.maxTokens ?? 2000,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
}

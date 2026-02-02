/**
 * LCEL Chain Utilities
 * Phase 2: LangChain Expression Language migration
 *
 * Provides reusable chain composition utilities for the AI pipeline.
 * Uses LCEL patterns for better composability and observability.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda, RunnableParallel } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { AIMessage } from '@langchain/core/messages';
import type { ActionResponse } from '@/types';
import type { ErrorCode } from '@/types/error-codes';

/**
 * Create a JSON output parser that extracts and parses JSON from LLM response
 *
 * Handles common LLM response patterns:
 * - Direct JSON
 * - JSON wrapped in markdown code blocks
 * - JSON with leading/trailing text
 */
export function createJsonParser<T>(): RunnableLambda<AIMessage, T> {
  return RunnableLambda.from(async (message: AIMessage): Promise<T> => {
    const content = message.content.toString().trim();

    // Remove markdown code blocks if present
    let jsonText = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract just the JSON object/array if there's trailing text
    // Look for the first { or [ and find its matching closing bracket
    const firstBrace = jsonText.indexOf('{');
    const firstBracket = jsonText.indexOf('[');

    let startIndex = -1;
    let isObject = false;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      isObject = true;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
      isObject = false;
    }

    if (startIndex !== -1) {
      // Find the matching closing bracket
      let depth = 0;
      const openChar = isObject ? '{' : '[';
      const closeChar = isObject ? '}' : ']';

      for (let i = startIndex; i < jsonText.length; i++) {
        if (jsonText[i] === openChar) depth++;
        if (jsonText[i] === closeChar) {
          depth--;
          if (depth === 0) {
            // Found the matching closing bracket
            jsonText = jsonText.substring(startIndex, i + 1);
            break;
          }
        }
      }
    }

    return JSON.parse(jsonText) as T;
  });
}

/**
 * Wrap an LCEL chain invocation with ActionResponse pattern
 *
 * Converts chain results or errors into consistent ActionResponse format.
 * Never throws - always returns { data, error } tuple.
 *
 * @param chainFn - Async function that invokes the chain
 * @param timeoutMs - Optional timeout in milliseconds
 * @param errorCode - Default error code for failures
 */
export async function invokeWithActionResponse<T>(
  chainFn: () => Promise<T>,
  options: {
    timeoutMs?: number;
    errorCode?: ErrorCode;
    errorMessage?: string;
  } = {}
): Promise<ActionResponse<T>> {
  const { timeoutMs, errorCode = 'LLM_ERROR' as ErrorCode, errorMessage = 'Chain invocation failed' } = options;

  try {
    let result: T;

    if (timeoutMs) {
      result = await Promise.race([
        chainFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        ),
      ]);
    } else {
      result = await chainFn();
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('[LCEL] Chain error:', error);

    // Handle timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        data: null,
        error: { code: 'LLM_TIMEOUT', message: 'Operation timed out' },
      };
    }

    // Handle rate limiting
    if (error instanceof Error && error.message.toLowerCase().includes('rate limit')) {
      return {
        data: null,
        error: { code: 'RATE_LIMITED', message: 'API rate limit exceeded. Please wait and try again.' },
      };
    }

    // Handle parse errors
    if (error instanceof SyntaxError) {
      return {
        data: null,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse LLM response' },
      };
    }

    // Generic error
    return {
      data: null,
      error: {
        code: errorCode,
        message: error instanceof Error ? error.message : errorMessage,
      },
    };
  }
}

/**
 * Create a RunnableParallel from a record of runnables
 *
 * Utility to run multiple operations in parallel and collect results.
 * Use RunnableLambda.from() to wrap async functions before passing.
 *
 * @param runnables - Record of named runnables to execute in parallel
 * @returns RunnableParallel that executes all operations concurrently
 *
 * @example
 * const parallel = createParallelRunner({
 *   summary: RunnableLambda.from(evaluateSummary),
 *   skills: RunnableLambda.from(evaluateSkills),
 * });
 * const results = await parallel.invoke(input);
 */
export function createParallelRunner<TInput>(
  runnables: Record<string, RunnableLambda<TInput, unknown>>
): RunnableParallel<TInput> {
  return RunnableParallel.from(runnables);
}

// Re-export commonly used LCEL primitives
export { ChatPromptTemplate, RunnableLambda, RunnableParallel, JsonOutputParser };

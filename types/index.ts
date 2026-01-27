/**
 * Core Types and ActionResponse Pattern
 *
 * This file exports all shared types used throughout the application.
 * The ActionResponse pattern is MANDATORY for all server actions and API routes.
 */

import type { ErrorCode } from './error-codes';

// ============================================================================
// ACTION RESPONSE PATTERN (MANDATORY)
// ============================================================================

/**
 * ActionResponse<T> - The standard response type for all server actions
 *
 * This discriminated union ensures type-safe error handling:
 * - On success: `{ data: T, error: null }`
 * - On error: `{ data: null, error: { message: string, code: ErrorCode } }`
 *
 * **CRITICAL RULE**: Server actions NEVER throw errors. They ALWAYS return ActionResponse.
 *
 * @example
 * ```typescript
 * // Server action
 * async function uploadResume(file: File): Promise<ActionResponse<string>> {
 *   try {
 *     const text = await parseFile(file);
 *     return { data: text, error: null };
 *   } catch (err) {
 *     return {
 *       data: null,
 *       error: { message: 'Failed to parse resume', code: 'PARSE_ERROR' }
 *     };
 *   }
 * }
 *
 * // Client usage
 * const { data, error } = await uploadResume(file);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // TypeScript knows data is string here
 * console.log(data.length);
 * ```
 */
export type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: ErrorCode } };

// ============================================================================
// RE-EXPORTS
// ============================================================================

export * from './error-codes';
export * from './errors';
export * from './optimization';
export * from './resume';
export * from './store';

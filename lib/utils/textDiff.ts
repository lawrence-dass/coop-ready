/**
 * Text Diffing Utility
 *
 * Provides word-level text comparison for resume content optimization.
 * Uses Myers diff algorithm for efficient computation.
 *
 * Algorithm: Word-level diffing (better readability than character-level)
 * Performance: < 100ms for typical resume content (2000 words)
 *
 * @example
 * ```ts
 * const chunks = diffTexts(
 *   "Led the team to deliver",
 *   "Led a team of 5 to deliver on time"
 * );
 * // Returns: [
 * //   { type: 'equal', value: 'Led ' },
 * //   { type: 'delete', value: 'the ' },
 * //   { type: 'insert', value: 'a team of 5 ' },
 * //   { type: 'equal', value: 'to deliver' },
 * //   { type: 'insert', value: ' on time' }
 * // ]
 * ```
 */

import { diffWords } from 'diff';

/**
 * Represents a chunk of text in a diff comparison.
 *
 * @property type - The type of change: 'equal' (unchanged), 'insert' (added), or 'delete' (removed)
 * @property value - The text content of this chunk
 */
export interface DiffChunk {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

/**
 * Performs word-level text diffing between original and suggested text.
 *
 * Normalizes whitespace and handles edge cases like empty inputs.
 * Uses Myers diff algorithm (via `diff` library) for efficient computation.
 *
 * @param originalText - The original text before changes
 * @param suggestedText - The suggested text after changes
 * @returns Array of diff chunks showing additions, deletions, and unchanged text
 *
 * @remarks
 * - Empty inputs return single chunk with the non-empty text
 * - Identical texts return single 'equal' chunk
 * - Whitespace is normalized (trimmed, collapsed)
 * - Performance: O(n+m) typical, O(n*m) worst case
 */
export function diffTexts(
  originalText: string,
  suggestedText: string
): DiffChunk[] {
  // Normalize: trim and collapse multiple spaces
  const normalizedOriginal = originalText.trim().replace(/\s+/g, ' ');
  const normalizedSuggested = suggestedText.trim().replace(/\s+/g, ' ');

  // Edge case: Both empty
  if (!normalizedOriginal && !normalizedSuggested) {
    return [];
  }

  // Edge case: Only original is empty
  if (!normalizedOriginal && normalizedSuggested) {
    return [{ type: 'insert', value: normalizedSuggested }];
  }

  // Edge case: Only suggested is empty
  if (normalizedOriginal && !normalizedSuggested) {
    return [{ type: 'delete', value: normalizedOriginal }];
  }

  // Edge case: Identical texts
  if (normalizedOriginal === normalizedSuggested) {
    return [{ type: 'equal', value: normalizedOriginal }];
  }

  // Perform word-level diff
  const diff = diffWords(normalizedOriginal, normalizedSuggested);

  // Convert to our DiffChunk format
  return diff.map((part) => ({
    type: part.added ? 'insert' : part.removed ? 'delete' : 'equal',
    value: part.value,
  }));
}

/**
 * Counts the number of changes in a diff result.
 *
 * @param chunks - Array of diff chunks
 * @returns Object with counts of insertions, deletions, and total changes
 */
export function countChanges(chunks: DiffChunk[]): {
  insertions: number;
  deletions: number;
  totalChanges: number;
} {
  let insertions = 0;
  let deletions = 0;

  for (const chunk of chunks) {
    if (chunk.type === 'insert') {
      // Count words (split by whitespace)
      insertions += chunk.value.trim().split(/\s+/).length;
    } else if (chunk.type === 'delete') {
      deletions += chunk.value.trim().split(/\s+/).length;
    }
  }

  return {
    insertions,
    deletions,
    totalChanges: insertions + deletions,
  };
}

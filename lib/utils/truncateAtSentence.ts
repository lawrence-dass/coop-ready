/**
 * Truncate text at a sentence boundary near the target length
 *
 * Used by suggestion API routes to trim JD excerpts for judge context.
 */
export function truncateAtSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );
  return lastSentenceEnd > maxLength * 0.5
    ? truncated.substring(0, lastSentenceEnd + 1)
    : truncated;
}

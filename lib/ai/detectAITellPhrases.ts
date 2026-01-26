/**
 * AI-Tell Phrase Detector
 * Story 6.2: Detect and flag AI-generated language patterns
 *
 * Uses regex-based detection for common AI-generated phrases that sound
 * unnatural or overly formal in professional contexts.
 */

import { AITellRewrite } from '@/types/suggestions';

// ============================================================================
// AI-TELL PATTERNS
// ============================================================================

/**
 * Common AI-generated phrases to detect
 * Each pattern includes regex for detection and suggested natural replacement
 */
const AI_TELL_PATTERNS: Array<{
  pattern: RegExp;
  detected: string;
  rewritten: string;
}> = [
  {
    pattern: /I have the pleasure (of|to)/gi,
    detected: 'I have the pleasure of',
    rewritten: 'I',
  },
  {
    pattern: /I am excited to/gi,
    detected: 'I am excited to',
    rewritten: 'I',
  },
  {
    pattern: /I am committed to/gi,
    detected: 'I am committed to',
    rewritten: 'I',
  },
  {
    pattern: /leverage my expertise/gi,
    detected: 'leverage my expertise',
    rewritten: 'use my skills',
  },
  {
    pattern: /leverage my skills/gi,
    detected: 'leverage my skills',
    rewritten: 'use my skills',
  },
  {
    pattern: /synergize/gi,
    detected: 'synergize',
    rewritten: 'collaborate',
  },
  {
    pattern: /maximize efficiency/gi,
    detected: 'maximize efficiency',
    rewritten: 'improve efficiency',
  },
  {
    pattern: /utilize best practices/gi,
    detected: 'utilize best practices',
    rewritten: 'use best practices',
  },
  {
    pattern: /passionate about/gi,
    detected: 'passionate about',
    rewritten: 'experienced in',
  },
  {
    pattern: /dynamic environment/gi,
    detected: 'dynamic environment',
    rewritten: 'fast-paced environment',
  },
  {
    pattern: /multifaceted approach/gi,
    detected: 'multifaceted approach',
    rewritten: 'comprehensive approach',
  },
  {
    pattern: /results-oriented professional/gi,
    detected: 'results-oriented professional',
    rewritten: 'professional',
  },
  {
    pattern: /proven track record/gi,
    detected: 'proven track record',
    rewritten: 'track record',
  },
];

// ============================================================================
// DETECTION FUNCTION
// ============================================================================

/**
 * Detect AI-tell phrases in text
 *
 * Scans text for common AI-generated patterns and returns
 * detected phrases with suggested natural replacements.
 *
 * @param text - Text to scan for AI-tell phrases
 * @returns Array of detected AI-tell phrases with rewrites
 */
export function detectAITellPhrases(text: string): AITellRewrite[] {
  const detectedPhrases: AITellRewrite[] = [];

  // Scan for each pattern
  for (const { pattern, detected, rewritten } of AI_TELL_PATTERNS) {
    if (pattern.test(text)) {
      detectedPhrases.push({
        detected,
        rewritten,
      });
      // Reset regex lastIndex for next test
      pattern.lastIndex = 0;
    }
  }

  return detectedPhrases;
}

/**
 * Apply AI-tell phrase rewrites to text
 *
 * Replaces detected AI-tell phrases with natural alternatives.
 *
 * @param text - Text to rewrite
 * @returns Rewritten text with AI-tell phrases replaced
 */
export function applyAITellRewrites(text: string): string {
  let rewrittenText = text;

  // Apply each pattern replacement
  for (const { pattern, rewritten } of AI_TELL_PATTERNS) {
    rewrittenText = rewrittenText.replace(pattern, rewritten);
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }

  return rewrittenText;
}

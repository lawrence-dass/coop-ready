/**
 * Bullet Point Extraction for ATS Scoring V2
 *
 * Extracts bullet points from resume text using pattern matching
 * with fallback to newline-based extraction.
 */

import type { ExtractedBullet, BulletExtractionResult } from './types';
import {
  STRONG_ACTION_VERBS,
  WEAK_ACTION_VERBS,
  METRIC_PATTERNS,
} from './constants';

/**
 * Primary bullet pattern - matches common bullet characters
 * Includes various unicode bullets that may appear in PDF-extracted text
 */
const BULLET_PATTERN = /^[\s]*[-•*▪▸►○◦◇·‣⁃✦✧◆◈■□●]\s*(.+)$/gm;

/**
 * Numbered list pattern
 */
const NUMBERED_PATTERN = /^[\s]*\d+[.)]\s*(.+)$/gm;

/**
 * Alternative pattern for lines that look like accomplishments
 * Matches lines starting with past tense verbs (common in resumes)
 */
const ACCOMPLISHMENT_PATTERN = /^[\s]*([A-Z][a-z]+(?:ed|d|t)\s+.{15,})$/gm;

/**
 * Check if text contains a metric/quantification
 */
function hasMetric(text: string): boolean {
  return METRIC_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Extract the first word from a bullet (normalized to lowercase)
 */
function getFirstWord(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^([a-zA-Z]+)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Check if the first word is a strong action verb
 */
function hasStrongVerb(firstWord: string): boolean {
  return STRONG_ACTION_VERBS.has(firstWord);
}

/**
 * Find JD keywords present in a bullet text
 */
function findKeywordsInBullet(bulletText: string, jdKeywords: string[]): string[] {
  const lowerBullet = bulletText.toLowerCase();
  return jdKeywords.filter(keyword =>
    lowerBullet.includes(keyword.toLowerCase())
  );
}

/**
 * Create an ExtractedBullet from raw text
 */
function createExtractedBullet(text: string, jdKeywords: string[]): ExtractedBullet {
  const trimmedText = text.trim();
  const firstWord = getFirstWord(trimmedText);

  return {
    text: trimmedText,
    hasMetric: hasMetric(trimmedText),
    hasStrongVerb: hasStrongVerb(firstWord),
    firstWord,
    keywords: findKeywordsInBullet(trimmedText, jdKeywords),
  };
}

/**
 * Extract bullets using pattern matching
 */
function extractWithPatterns(text: string, jdKeywords: string[]): ExtractedBullet[] {
  const bullets: ExtractedBullet[] = [];
  const seenTexts = new Set<string>();

  // Extract bullet-style points
  const bulletMatches = text.matchAll(BULLET_PATTERN);
  for (const match of bulletMatches) {
    const bulletText = match[1].trim();
    if (bulletText.length > 10 && !seenTexts.has(bulletText)) {
      seenTexts.add(bulletText);
      bullets.push(createExtractedBullet(bulletText, jdKeywords));
    }
  }

  // Extract numbered list items
  const numberedMatches = text.matchAll(NUMBERED_PATTERN);
  for (const match of numberedMatches) {
    const bulletText = match[1].trim();
    if (bulletText.length > 10 && !seenTexts.has(bulletText)) {
      seenTexts.add(bulletText);
      bullets.push(createExtractedBullet(bulletText, jdKeywords));
    }
  }

  // Extract accomplishment-style lines (past tense verb + content)
  const accomplishmentMatches = text.matchAll(ACCOMPLISHMENT_PATTERN);
  for (const match of accomplishmentMatches) {
    const bulletText = match[1].trim();
    if (bulletText.length > 15 && !seenTexts.has(bulletText)) {
      seenTexts.add(bulletText);
      bullets.push(createExtractedBullet(bulletText, jdKeywords));
    }
  }

  return bullets;
}

/**
 * Common past tense verb endings for accomplishment detection
 */
const PAST_TENSE_PATTERN = /^[A-Z][a-z]+(?:ed|d|t|ied|ised|ized)\s/;

/**
 * Extract bullets using newline splitting (fallback)
 *
 * Filters for lines that look like accomplishment statements:
 * - Start with a verb or action
 * - Contain more than just a few words
 * - Don't look like headers or contact info
 */
function extractWithNewlines(text: string, jdKeywords: string[]): ExtractedBullet[] {
  const lines = text.split(/\n/).map(line => line.trim());
  const bullets: ExtractedBullet[] = [];
  const seenTexts = new Set<string>();

  for (const line of lines) {
    // Skip short lines
    if (line.length < 15) continue;

    // Skip obvious non-bullet content
    if (line.match(/^[A-Z\s]{3,}$/)) continue; // All caps headers
    if (line.match(/^[\d\s\-\/]+$/)) continue; // Date-only lines
    if (line.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) continue; // Email
    if (line.match(/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)) continue; // Phone
    if (line.match(/^(linkedin|github|twitter|portfolio)/i)) continue; // Social links
    if (line.match(/^(education|experience|skills|summary|objective|certifications?|awards?|projects?)$/i)) continue;

    // Check if line looks like an accomplishment
    const firstWord = getFirstWord(line);
    const startsWithVerb = STRONG_ACTION_VERBS.has(firstWord) || WEAK_ACTION_VERBS.has(firstWord);
    const startsWithPastTense = PAST_TENSE_PATTERN.test(line);
    const isLongEnough = line.length >= 25;
    const hasMultipleWords = line.split(/\s+/).length >= 4;

    // Accept line if it looks like an accomplishment
    const isAccomplishment = (startsWithVerb || startsWithPastTense) && hasMultipleWords;
    // Also accept longer lines that don't start with articles/pronouns
    const isDescriptive = isLongEnough && !line.match(/^(the|a|an|my|our|i|we|at|in|on)\s/i);

    if ((isAccomplishment || isDescriptive) && !seenTexts.has(line)) {
      seenTexts.add(line);
      bullets.push(createExtractedBullet(line, jdKeywords));
    }
  }

  return bullets;
}

/**
 * Extract bullet points from resume text
 *
 * Strategy:
 * 1. Try pattern-based extraction first (more accurate)
 * 2. If too few bullets found, fall back to newline splitting
 *
 * @param resumeText - Raw resume text
 * @param jdKeywords - Keywords from job description for density analysis
 * @returns BulletExtractionResult with extracted bullets and metadata
 */
export function extractBullets(
  resumeText: string,
  jdKeywords: string[] = []
): BulletExtractionResult {
  // Try pattern-based extraction first
  const patternBullets = extractWithPatterns(resumeText, jdKeywords);

  // If we found a reasonable number of bullets, use pattern extraction
  if (patternBullets.length >= 4) {
    return {
      bullets: patternBullets,
      rawBulletCount: patternBullets.length,
      source: 'pattern',
    };
  }

  // Fall back to newline-based extraction
  const newlineBullets = extractWithNewlines(resumeText, jdKeywords);

  // If newline extraction found more bullets, use it
  if (newlineBullets.length > patternBullets.length) {
    return {
      bullets: newlineBullets,
      rawBulletCount: newlineBullets.length,
      source: 'newline',
    };
  }

  // Otherwise, combine both and dedupe
  const combinedMap = new Map<string, ExtractedBullet>();
  for (const bullet of [...patternBullets, ...newlineBullets]) {
    if (!combinedMap.has(bullet.text)) {
      combinedMap.set(bullet.text, bullet);
    }
  }

  return {
    bullets: Array.from(combinedMap.values()),
    rawBulletCount: combinedMap.size,
    source: patternBullets.length >= newlineBullets.length ? 'pattern' : 'newline',
  };
}

/**
 * Get verb quality classification for a bullet's first word
 */
export function classifyVerb(firstWord: string): 'strong' | 'weak' | 'neutral' {
  const normalized = firstWord.toLowerCase();
  if (STRONG_ACTION_VERBS.has(normalized)) return 'strong';
  if (WEAK_ACTION_VERBS.has(normalized)) return 'weak';
  return 'neutral';
}

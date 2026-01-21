export const WEAK_VERBS = [
  "responsible for",
  "helped with",
  "assisted with",
  "worked on",
  "was involved in",
  "participated in",
  "contributed to",
  "did",
  "made",
  "got",
  "handled",
  "took care of",
  "dealt with",
  "managed to",
  "able to",
];

export const STRONG_VERBS_BY_CATEGORY = {
  leadership: [
    "Led",
    "Directed",
    "Managed",
    "Orchestrated",
    "Supervised",
    "Guided",
    "Mentored",
    "Championed",
    "Spearheaded",
    "Presided",
    "Commanded",
  ],
  technical: [
    "Engineered",
    "Built",
    "Designed",
    "Architected",
    "Developed",
    "Implemented",
    "Deployed",
    "Optimized",
    "Scaled",
    "Refactored",
    "Modernized",
    "Automated",
  ],
  analysis: [
    "Analyzed",
    "Identified",
    "Diagnosed",
    "Evaluated",
    "Assessed",
    "Investigated",
    "Discovered",
    "Determined",
    "Measured",
    "Compared",
    "Reviewed",
  ],
  communication: [
    "Presented",
    "Communicated",
    "Articulated",
    "Conveyed",
    "Explained",
    "Documented",
    "Authored",
    "Wrote",
    "Advised",
    "Briefed",
    "Reported",
  ],
  improvement: [
    "Improved",
    "Enhanced",
    "Increased",
    "Accelerated",
    "Optimized",
    "Streamlined",
    "Simplified",
    "Refined",
    "Elevated",
    "Boosted",
  ],
};

/**
 * Result of verb context extraction
 */
export interface VerbContextResult {
  /** The first word of the text (lowercase), or null if empty/weak verb detected */
  verb: string | null;
  /** Category of the verb if it's a known strong verb, null otherwise */
  category: string | null;
}

/**
 * Check if text contains a weak verb phrase
 *
 * Uses word boundary matching to avoid false positives:
 * - "made" will NOT match "remade" or "handmade"
 * - "made" WILL match "I made changes" or "Made improvements"
 *
 * @param text - Text to check for weak verbs
 * @returns true if text contains a weak verb phrase
 */
export function hasWeakVerb(text: string): boolean {
  const lowerText = text.toLowerCase();
  return WEAK_VERBS.some((verb) => {
    // Use word boundary regex to match whole phrases only
    // Escape special regex characters in verb phrase
    const escapedVerb = verb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedVerb}\\b`, "i");
    return regex.test(lowerText);
  });
}

/**
 * Extract verb context from text for classification
 *
 * Analyzes the first word to determine if it's a known strong verb.
 * Returns null for verb if:
 * - Text is empty
 * - Text contains a weak verb phrase anywhere
 *
 * Note: If the first word is not a recognized strong verb and no weak verb
 * is detected, returns the first word with null category. This allows
 * consumers to handle unknown verbs appropriately.
 *
 * @param text - Text to analyze (typically a resume bullet point)
 * @returns VerbContextResult with verb and optional category
 */
export function extractVerbContext(text: string): VerbContextResult {
  const words = text.split(/\s+/);
  const firstWord = words[0]?.toLowerCase() || "";

  // Check if first word is a strong verb
  for (const [category, verbs] of Object.entries(STRONG_VERBS_BY_CATEGORY)) {
    if (verbs.some((v) => v.toLowerCase() === firstWord)) {
      return { verb: firstWord, category };
    }
  }

  // Check if text contains weak verb
  if (hasWeakVerb(text)) {
    return { verb: null, category: null }; // weak verb detected
  }

  // Otherwise, return the first word with no category
  return { verb: firstWord || null, category: null };
}

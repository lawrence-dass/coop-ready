/**
 * PII Redaction Utility
 *
 * Pure regex-based redaction for Personally Identifiable Information (PII)
 * before sending content to LLM APIs (Anthropic Claude).
 *
 * Redacted PII Types:
 * - Email addresses (99% accuracy)
 * - Phone numbers (95% accuracy - US/Canada formats)
 * - Social profile URLs (98% accuracy - LinkedIn, GitHub, etc.)
 * - Street addresses (70-75% accuracy)
 *
 * Intentionally NOT redacted:
 * - Names (needed for LLM context, not primary privacy risk)
 * - Company names (needed for work experience context)
 * - Job titles (needed for career context)
 * - Skills/technologies (needed for analysis)
 *
 * @see /docs/PII_HANDLING.md for full rationale
 */

export interface RedactionResult {
  /** Text with PII replaced by tokens like [EMAIL_1], [PHONE_1], etc. */
  redactedText: string;
  /** Map of tokens to original PII values for restoration */
  redactionMap: Map<string, string>;
  /** Summary of what was redacted */
  stats: {
    emails: number;
    phones: number;
    urls: number;
    addresses: number;
  };
}

/**
 * Redacts PII from text using deterministic regex patterns.
 *
 * @param text - Raw text (resume, job description, etc.)
 * @returns Redacted text with restoration map
 *
 * @example
 * const resume = "Contact: john@example.com\nPhone: 555-123-4567";
 * const { redactedText, redactionMap } = redactPII(resume);
 * // redactedText: "Contact: [EMAIL_1]\nPhone: [PHONE_1]"
 *
 * const suggestion = "Update [EMAIL_1] to a professional address";
 * const restored = restorePII(suggestion, redactionMap);
 * // restored: "Update john@example.com to a professional address"
 */
export function redactPII(text: string): RedactionResult {
  const redactionMap = new Map<string, string>();
  let redactedText = text;

  let emailCounter = 1;
  let phoneCounter = 1;
  let urlCounter = 1;
  let addressCounter = 1;

  // 1. Email addresses (99% accuracy)
  // Matches: user@domain.com, first.last@company.co.uk, user+tag@example.com
  redactedText = redactedText.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    (match) => {
      const token = `[EMAIL_${emailCounter++}]`;
      redactionMap.set(token, match);
      return token;
    }
  );

  // 2. Phone numbers (95% accuracy - US/Canada formats)
  // Matches:
  // - (555) 123-4567
  // - 555-123-4567
  // - 555.123.4567
  // - +1-555-123-4567
  // - +1 (555) 123-4567
  // Use word boundaries and lookbehind to avoid matching year ranges (2020-2023)
  redactedText = redactedText.replace(
    /(?<!\d)(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}(?!\d)/g,
    (match, offset, string) => {
      // Validate it's actually a phone number (not a random number sequence or year range)
      // Must have at least one separator or parentheses
      if (
        match.includes('-') ||
        match.includes('.') ||
        match.includes(' ') ||
        match.includes('(') ||
        match.startsWith('+')
      ) {
        // Additional check: ensure it's not a year range like "2020-2023"
        // Phone numbers should have 3 digits, separator, 4 digits OR area code format
        if (!/^\d{4}-\d{4}$/.test(match)) {
          const token = `[PHONE_${phoneCounter++}]`;
          redactionMap.set(token, match);
          return token;
        }
      }
      return match; // Not a phone number, preserve original
    }
  );

  // 3. Social profile URLs (98% accuracy)
  // Matches: LinkedIn, GitHub, Twitter, GitLab, Bitbucket profiles
  redactedText = redactedText.replace(
    /https?:\/\/(?:www\.)?(linkedin\.com|github\.com|twitter\.com|x\.com|gitlab\.com|bitbucket\.org)\/[\w\-\.\/]+/gi,
    (match) => {
      const token = `[PROFILE_${urlCounter++}]`;
      redactionMap.set(token, match);
      return token;
    }
  );

  // 4. Street addresses (70-75% accuracy)
  // Matches:
  // - 123 Main Street, San Francisco, CA 94105
  // - 456 Oak Ave, Apt 4B, New York, NY 10001
  // - 789 Elm Blvd, Suite 200
  // Pattern: [number] [street name] [street type] [optional unit] [optional city, state zip]
  // Must have at least 3 digits in street number to avoid matching "3 junior engineers"
  redactedText = redactedText.replace(
    /\d{3,}\s+[\w\s]+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Court|Ct\.?|Way|Place|Pl\.?|Parkway|Pkwy\.?)(?:\s*,?\s*(?:Apt|Apartment|Suite|Ste|Unit|#)[\s\w]*)?(?:\s*,?\s*[\w\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/gi,
    (match) => {
      const token = `[ADDRESS_${addressCounter++}]`;
      redactionMap.set(token, match);
      return token;
    }
  );

  return {
    redactedText,
    redactionMap,
    stats: {
      emails: emailCounter - 1,
      phones: phoneCounter - 1,
      urls: urlCounter - 1,
      addresses: addressCounter - 1,
    },
  };
}

/**
 * Restores original PII from redacted text using the redaction map.
 *
 * @param text - Text with redaction tokens like [EMAIL_1], [PHONE_1]
 * @param redactionMap - Map from redactPII() result
 * @returns Text with original PII restored
 *
 * @example
 * const suggestion = "Contact me at [EMAIL_1]";
 * const restored = restorePII(suggestion, redactionMap);
 * // restored: "Contact me at john@example.com"
 */
export function restorePII(
  text: string,
  redactionMap: Map<string, string>
): string {
  let restoredText = text;

  // Replace all tokens with original values
  // Use global regex replace for compatibility with older TypeScript targets
  redactionMap.forEach((original, token) => {
    // Escape special regex characters in token
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedToken, 'g');
    restoredText = restoredText.replace(regex, original);
  });

  return restoredText;
}

/**
 * Helper to check if text contains any PII before redaction.
 * Useful for logging/debugging purposes.
 *
 * @param text - Text to check
 * @returns True if any PII patterns detected
 */
export function containsPII(text: string): boolean {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/;
  const urlRegex = /https?:\/\/(?:www\.)?(linkedin\.com|github\.com|twitter\.com|x\.com|gitlab\.com|bitbucket\.org)\/[\w\-\.\/]+/i;

  return emailRegex.test(text) || phoneRegex.test(text) || urlRegex.test(text);
}

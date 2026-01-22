/**
 * Quantification Analyzer
 *
 * Detects and measures quantifiable metrics in resume bullet points.
 * Used for calculating quantification density in ATS scoring.
 */

export interface QuantificationAnalysis {
  bulletIndex: number;
  text: string;
  hasMetrics: boolean;
  metricsFound: string[];
  metrics: {
    numbers: string[];
    percentages: string[];
    currency: string[];
    timeUnits: string[];
  };
}

export interface DensityResult {
  totalBullets: number;
  bulletsWithMetrics: number;
  density: number; // 0-100
  byCategory: {
    numbers: number;
    percentages: number;
    currency: number;
    timeUnits: number;
  };
}

/**
 * Regex patterns for detecting metrics
 * Order matters: Check currency and time units before generic numbers to avoid double-counting
 */
const PATTERNS = {
  // Percentages: "25%", "100 %", etc.
  percentages: /\d+(?:\.\d+)?\s*%/g,

  // Currency: "$500,000", "£25,000", "€1.5M", "$50k"
  currency: /[\$£€]\s*\d+(?:[,.]\d+)*(?:[kKmMbB]\+?)?/g,

  // Time units: "3 months", "5 days", "40 hours", "2 years"
  timeUnits: /\d+(?:\.\d+)?\s*(?:days?|weeks?|months?|years?|hours?|minutes?|seconds?)/gi,

  // Numbers: integers and decimals (but exclude those already matched above)
  numbers: /\b\d+(?:\.\d+)?(?:[kKmMbB]\+?)?\b/g,
};

/**
 * Analyzes bullet points for quantification metrics
 *
 * @param bullets - Array of bullet point strings
 * @returns Analysis of each bullet with detected metrics
 */
export function analyzeBulletQuantification(bullets: string[]): QuantificationAnalysis[] {
  return bullets.map((text, index) => {
    // Extract metrics in priority order to avoid double-counting
    const percentages = extractMatches(text, PATTERNS.percentages);
    const currency = extractMatches(text, PATTERNS.currency);
    const timeUnits = extractMatches(text, PATTERNS.timeUnits);

    // Remove parts already matched by higher priority patterns
    let textForNumbers = text;
    percentages.forEach(p => {
      textForNumbers = textForNumbers.replace(p, '');
    });
    currency.forEach(c => {
      textForNumbers = textForNumbers.replace(c, '');
    });
    timeUnits.forEach(t => {
      textForNumbers = textForNumbers.replace(t, '');
    });

    const numbers = extractMatches(textForNumbers, PATTERNS.numbers);

    const metrics = {
      numbers,
      percentages,
      currency,
      timeUnits,
    };

    // Collect all unique metrics found
    const metricsFound = [
      ...numbers,
      ...percentages,
      ...currency,
      ...timeUnits,
    ];

    // Has metrics if any category has matches
    const hasMetrics = metricsFound.length > 0;

    return {
      bulletIndex: index,
      text,
      hasMetrics,
      metricsFound,
      metrics,
    };
  });
}

/**
 * Calculates quantification density across all bullets
 *
 * @param bullets - Array of bullet point strings
 * @returns Density statistics and breakdown by category
 */
export function calculateDensity(bullets: string[]): DensityResult {
  if (bullets.length === 0) {
    return {
      totalBullets: 0,
      bulletsWithMetrics: 0,
      density: 0,
      byCategory: { numbers: 0, percentages: 0, currency: 0, timeUnits: 0 },
    };
  }

  const analyses = analyzeBulletQuantification(bullets);
  const bulletsWithMetrics = analyses.filter(a => a.hasMetrics).length;
  const density = Math.round((bulletsWithMetrics / bullets.length) * 100);

  // Count bullets by metric category
  const byCategory = {
    numbers: analyses.filter(a => a.metrics.numbers.length > 0).length,
    percentages: analyses.filter(a => a.metrics.percentages.length > 0).length,
    currency: analyses.filter(a => a.metrics.currency.length > 0).length,
    timeUnits: analyses.filter(a => a.metrics.timeUnits.length > 0).length,
  };

  return {
    totalBullets: bullets.length,
    bulletsWithMetrics,
    density,
    byCategory,
  };
}

/**
 * Categorizes density into performance bands
 *
 * @param density - Density percentage (0-100)
 * @returns Category: 'low' | 'moderate' | 'strong'
 */
export function getDensityCategory(density: number): 'low' | 'moderate' | 'strong' {
  if (density < 50) return 'low';
  if (density < 80) return 'moderate';
  return 'strong';
}

/**
 * Helper: Extracts all matches from text using a regex pattern
 */
function extractMatches(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern);
  return matches ? Array.from(new Set(matches)) : [];
}

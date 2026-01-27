// Story 5.4: Keyword guidance generation utility
import { ExtractedKeyword, KeywordCategory } from '@/types/analysis';

export interface KeywordGuidance {
  why: string;
  where: string;
  example: string;
}

/**
 * Generates actionable guidance for missing keywords
 *
 * Provides:
 * - Why the keyword matters (based on importance)
 * - Where to add it in the resume (based on category)
 * - Example usage (based on category and keyword)
 */
export function getKeywordGuidance(keyword: ExtractedKeyword): KeywordGuidance {
  const { category, importance } = keyword;

  // Generic guidance by category (using enum values as keys)
  const categoryGuidance: Record<KeywordCategory, Partial<KeywordGuidance>> = {
    [KeywordCategory.SKILLS]: {
      where: 'Add to Skills section or mention in Experience bullet points',
      example: `"Proficient in ${keyword.keyword}" or "Used ${keyword.keyword} to achieve X"`,
    },
    [KeywordCategory.TECHNOLOGIES]: {
      where: 'List in Skills section or demonstrate usage in project descriptions',
      example: `"Built system using ${keyword.keyword}" or "Expert in ${keyword.keyword}"`,
    },
    [KeywordCategory.QUALIFICATIONS]: {
      where: 'Add to Summary or Education section if you have this qualification',
      example: `"Qualified ${keyword.keyword}" or "Certified in ${keyword.keyword}"`,
    },
    [KeywordCategory.EXPERIENCE]: {
      where: 'Weave into Experience bullet points showing years/impact',
      example: `"${keyword.keyword} experience delivering X results"`,
    },
    [KeywordCategory.SOFT_SKILLS]: {
      where: 'Demonstrate through accomplishments in Experience section',
      example: `"Demonstrated ${keyword.keyword} by leading team of X"`,
    },
    [KeywordCategory.CERTIFICATIONS]: {
      where: 'List in Certifications or Education section if you have it',
      example: `"Certified ${keyword.keyword}" or "Holds ${keyword.keyword} certification"`,
    },
  };

  // Importance-based "why"
  const importanceWhy: Record<'high' | 'medium' | 'low', string> = {
    high: 'This is a core requirement for the role. ATS systems heavily weight this keyword.',
    medium: 'This is an important skill that will improve your match score.',
    low: 'This is a nice-to-have that can give you a slight edge.',
  };

  return {
    why: importanceWhy[importance],
    where: categoryGuidance[category].where || 'Add to relevant section',
    example: categoryGuidance[category].example || `Mention "${keyword.keyword}" in context`,
  };
}

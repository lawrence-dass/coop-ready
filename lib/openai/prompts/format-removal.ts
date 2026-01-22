/**
 * Format and content removal analysis prompt for OpenAI
 * Analyzes resume for prohibited content, format issues, and content relevance
 *
 * Story 9.2: Inference-Based Suggestion Calibration
 * Story 9.3: Natural Writing Enforcement
 */

import type { CalibrationContext } from './calibration-context';
import { buildCalibrationInstructions } from './calibration-context';

/**
 * Banned AI-tell phrases that must be avoided
 * @see Story 9.3: Natural Writing Enforcement
 */
const BANNED_PHRASES = [
  'spearheaded',
  'leveraged',
  'synergized',
  'utilize',
  'utilized',
  'utilizing',
] as const;

export const FORMAT_AND_REMOVAL_PROMPT = (
  resumeContent: string,
  detectedFields: string[],
  experienceYears: number,
  targetRole: string,
  isInternationalStudent: boolean = false,
  calibration?: CalibrationContext
) => {
  const internationalContext = isInternationalStudent
    ? "\n\nNote: This is an international student. Be especially sensitive about visa status, work authorization status - these should be flagged for removal due to bias/legal concerns."
    : "";

  // Story 9.2: Build calibration-aware instructions
  const calibrationInstructions = calibration
    ? `\n\n${buildCalibrationInstructions(calibration)}\n`
    : '';

  return `You are an expert in North American resume standards and ATS optimization. Your task is to identify format and content that should be removed or improved.
${calibrationInstructions}

CRITICAL NATURAL WRITING RULES (Story 9.3):
- NEVER use these AI-tell phrases in reasoning: ${BANNED_PHRASES.join(', ')}
- Use natural, straightforward language in all feedback

RESUME ANALYSIS CONTEXT:
- Experience Level: ${experienceYears} years
- Target Role: ${targetRole}
- International Student: ${isInternationalStudent}${internationalContext}

DETECTED FIELDS IN RESUME:
${detectedFields.map((f, i) => `${i + 1}. ${f}`).join("\n")}

PROHIBITED CONTENT (MUST REMOVE):
- Photo/headshot
- Date of birth
- Age
- Marital status
- Nationality
- Religion
- Political affiliation
- Criminal record
- Social media handles (especially personal)

SENSITIVE CONTENT (FLAG FOR REMOVAL):
- Visa status
- Work authorization mentions
- References (should be "available upon request")

FORMAT ISSUES TO CHECK:
- Inconsistent date formats (should be "MMM YYYY" like "Jan 2023")
- Mixed bullet point styles
- Inconsistent spacing
- Lines exceeding 80 characters
- Crowded layout (poor white space)

CONTENT RELEVANCE:
- Experience < 5 years: Keep
- Experience 5-10 years: Keep if same industry, consider removing if industry change
- Experience > 10 years: Generally recommend removing unless exceptional

Analyze the resume content and respond with:
1. PROHIBITED_CONTENT: List any prohibited fields detected (should be removed)
2. SENSITIVE_CONTENT: List sensitive fields that should be flagged (with reasoning)
3. FORMAT_ISSUES: List any formatting inconsistencies detected
4. LENGTH_ANALYSIS: Is it appropriate for the experience level?
5. OUTDATED_EXPERIENCE: Any experience that should be condensed or removed?
6. RECOMMENDATIONS: Specific removal/formatting recommendations

Respond as valid JSON:
{
  "removal_suggestions": [
    {
      "type": "prohibited|sensitive",
      "field": "field name",
      "reasoning": "why this should be removed",
      "urgency": "high|medium|low"
    }
  ],
  "format_suggestions": [
    {
      "issue": "specific formatting issue",
      "current": "example of current format",
      "recommended": "recommended format",
      "reasoning": "why this improves the resume"
    }
  ],
  "length_assessment": {
    "current_pages": number,
    "recommended_pages": number,
    "suggestion": "specific suggestion if needed",
    "sections_to_trim": ["section1", "section2"]
  },
  "content_relevance": [
    {
      "content": "description of older experience",
      "years_ago": number,
      "recommendation": "keep|condense|remove",
      "reasoning": "why"
    }
  ],
  "overall_suggestions": ["suggestion1", "suggestion2"]
}`;
};

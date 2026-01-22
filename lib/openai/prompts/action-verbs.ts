/**
 * Action Verb & Quantification Prompt Template
 *
 * Generates prompts for AI-powered action verb improvements and quantification suggestions.
 *
 * @see Story 5.3: Action Verb & Quantification Suggestions
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

import { STRONG_VERBS_BY_CATEGORY, WEAK_VERBS } from "@/lib/validations/verbs";
import type { CalibrationContext } from './calibration-context';
import { buildCalibrationInstructions } from './calibration-context';

/**
 * Create action verb and quantification analysis prompt
 *
 * Prompt engineering strategy:
 * - Identifies weak verbs and suggests strong alternatives
 * - Detects missing metrics and provides contextual quantification prompts
 * - Categorizes achievements to provide targeted suggestions
 * - Only suggests improvements where needed (AC5)
 * - Story 9.2: Adapts to calibration mode and experience level
 *
 * @param bulletPoints - Array of bullet points to analyze
 * @param achievementTypes - Array of achievement classifications (performance, team, scaling, etc.)
 * @param calibration - Optional calibration context for mode-aware suggestions
 * @returns Formatted prompt string
 */
export function createActionVerbAndQuantificationPrompt(
  bulletPoints: string[],
  achievementTypes: string[],
  calibration?: CalibrationContext
): string {
  const verbCategories = Object.entries(STRONG_VERBS_BY_CATEGORY)
    .map(([category, verbs]) => `${category}: ${verbs.join(", ")}`)
    .join("\n");

  // Story 9.2: Build calibration-aware instructions
  const calibrationInstructions = calibration
    ? `\n\n${buildCalibrationInstructions(calibration)}\n`
    : '';

  return `You are an expert resume writer specializing in action verbs and achievement quantification.
${calibrationInstructions}

Your task is to analyze the following bullet points and provide TWO types of suggestions:
1. ACTION VERB improvements - replace weak verbs with strong alternatives
2. QUANTIFICATION suggestions - identify missing metrics and provide prompts

Strong Verb Categories:
${verbCategories}

Weak Verbs to Replace: ${WEAK_VERBS.map(v => `"${v}"`).join(", ")}

Bullet Points to Analyze:
${bulletPoints.map((bp, i) => `${i + 1}. ${bp}\n   Achievement Type: ${achievementTypes[i] || "general"}`).join("\n\n")}

For each bullet point, respond with:

1. ACTION VERB SUGGESTION (if applicable):
   - Only suggest if the bullet starts with a weak verb
   - If it starts with a strong verb, skip this suggestion
   - Provide 2-3 alternatives from the strong verb categories
   - Choose verbs that match the achievement context

2. QUANTIFICATION SUGGESTION (if applicable):
   - Only suggest if the bullet lacks specific numbers or metrics
   - If it already has metrics, skip this suggestion
   - Provide contextual prompts based on achievement type:
     * performance: "Consider adding: percentage improvement, time saved, users impacted"
     * scaling: "Consider adding: number of users, data volume, deployment scale"
     * savings: "Consider adding: cost savings percentage, time saved per unit"
     * team: "Consider adding: team size, scope, impact"
     * delivery: "Consider adding: timeline, scope, complexity metrics"
     * general: "Consider adding: specific numbers or metrics relevant to this achievement"
   - Explain why the metric matters for impact

Respond as valid JSON:
{
  "suggestions": [
    {
      "original": "the original bullet point",
      "action_verb_suggestion": null or {
        "improved": "improved version with strong verb",
        "alternatives": ["verb1", "verb2"],
        "reasoning": "why this verb is stronger"
      },
      "quantification_suggestion": null or {
        "prompt": "specific prompt for user",
        "example": "example of how to add metrics",
        "metrics_to_consider": ["metric1", "metric2"]
      }
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON - no additional text before or after
2. The "suggestions" array must have exactly ${bulletPoints.length} items, one for each input bullet
3. Order must match input order
4. If a bullet is already strong (strong verb + has metrics), set both suggestions to null
5. action_verb_suggestion should only be provided if bullet starts with a weak verb
6. quantification_suggestion should only be provided if bullet lacks metrics
7. Both suggestions can be provided for the same bullet if needed
8. Ensure all JSON strings are properly escaped`;
}

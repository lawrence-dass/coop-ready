/**
 * Action Verb & Quantification Prompt Template
 *
 * Generates prompts for AI-powered action verb improvements and quantification suggestions.
 *
 * @see Story 5.3: Action Verb & Quantification Suggestions
 * @see Story 9.2: Inference-Based Suggestion Calibration
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import { STRONG_VERBS_BY_CATEGORY, WEAK_VERBS } from "@/lib/validations/verbs";
import type { CalibrationContext } from './calibration-context';
import { buildCalibrationInstructions } from './calibration-context';
import { classifyContext } from '@/lib/utils/contextDetector';
import { getContextPrompt, getMetricTemplate } from '@/lib/data/metricExamples';
import { prioritizeContextByRole, getScaleAdjustmentForRole } from '@/lib/utils/roleToContextMapping';

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
 * @param targetRole - Optional target role for context prioritization (Story 9.4)
 * @returns Formatted prompt string with context-aware metric guidance
 */
export function createActionVerbAndQuantificationPrompt(
  bulletPoints: string[],
  achievementTypes: string[],
  calibration?: CalibrationContext,
  targetRole?: string
): string {
  const verbCategories = Object.entries(STRONG_VERBS_BY_CATEGORY)
    .map(([category, verbs]) => `${category}: ${verbs.join(", ")}`)
    .join("\n");

  // Story 9.2: Build calibration-aware instructions
  const calibrationInstructions = calibration
    ? `\n\n${buildCalibrationInstructions(calibration)}\n`
    : '';

  // Story 9.4: Detect context for each bullet and build context-aware prompts
  // Use targetRole to prioritize context when bullet has no detected context
  const bulletContexts = bulletPoints.map(bp => classifyContext(bp));
  const bulletsWithContext = bulletPoints.map((bp, i) => {
    const bulletContext = bulletContexts[i];
    // Prioritize context based on target role (AC1, AC2 - role-based prioritization)
    const prioritizedContext = targetRole
      ? prioritizeContextByRole(bulletContext.primaryContext, targetRole)
      : bulletContext.primaryContext;

    // Get scale adjustment for metric examples based on role seniority
    const scaleMultiplier = targetRole
      ? getScaleAdjustmentForRole(prioritizedContext, targetRole)
      : 1;

    // Build context prompt with scale-aware guidance
    const contextPrompt = getContextPrompt(prioritizedContext);
    const scaleNote = scaleMultiplier > 1
      ? ` (Use ${scaleMultiplier}x scale for ${targetRole} level metrics)`
      : '';

    return `${i + 1}. ${bp}\n   Achievement Type: ${achievementTypes[i] || "general"}\n   Context: ${prioritizedContext}\n   Metric Guidance: ${contextPrompt}${scaleNote}`;
  }).join("\n\n");

  return `You are an expert resume writer specializing in action verbs and achievement quantification.
${calibrationInstructions}

Your task is to analyze the following bullet points and provide TWO types of suggestions:
1. ACTION VERB improvements - replace weak verbs with strong alternatives
2. QUANTIFICATION suggestions - identify missing metrics and provide prompts

Strong Verb Categories:
${verbCategories}

Weak Verbs to Replace: ${WEAK_VERBS.map(v => `"${v}"`).join(", ")}

Bullet Points to Analyze:
${bulletsWithContext}

For each bullet point, respond with:

1. ACTION VERB SUGGESTION (if applicable):
   - Only suggest if the bullet starts with a weak verb
   - If it starts with a strong verb, skip this suggestion
   - Provide 2-3 alternatives from the strong verb categories
   - Choose verbs that match the achievement context

2. QUANTIFICATION SUGGESTION (if applicable):
   - Only suggest if the bullet lacks specific numbers or metrics
   - If it already has metrics, skip this suggestion
   - Use the context-specific Metric Guidance provided for each bullet
   - The context (financial, tech, leadership, competitive, scale) determines which metrics are most relevant
   - Include specific examples from the Metric Guidance in your suggestions
   - Explain why the metric matters for impact in this specific context

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

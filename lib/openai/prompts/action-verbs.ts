/**
 * Action Verb & Quantification Prompt Template
 *
 * Generates prompts for AI-powered action verb improvements and quantification suggestions.
 *
 * @see Story 5.3: Action Verb & Quantification Suggestions
 * @see Story 9.2: Inference-Based Suggestion Calibration
 * @see Story 9.3: Natural Writing Enforcement
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import { STRONG_VERBS_BY_CATEGORY, WEAK_VERBS } from "@/lib/validations/verbs";
import type { CalibrationContext } from './calibration-context';
import { buildCalibrationInstructions } from './calibration-context';
import { classifyContext } from '@/lib/utils/contextDetector';
import { getContextPrompt, getMetricTemplate } from '@/lib/data/metricExamples';
import { prioritizeContextByRole, getScaleAdjustmentForRole } from '@/lib/utils/roleToContextMapping';

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

CRITICAL NATURAL WRITING RULES (Story 9.3):
- NEVER use these AI-tell phrases: ${BANNED_PHRASES.join(', ')}
- Aim for 20-35 words per bullet point (optimal range)
- Use natural, human-sounding language
- Avoid overused resume buzzwords

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
   - CRITICAL: Do NOT invent or fabricate numbers - the user must provide their real data
   - Use [X] placeholder for numbers the user needs to fill in
   - Add only ONE metric placeholder per bullet
   - The "example" shows WHERE to add a metric, using [X] as placeholder
   - IMPORTANT: Keep the original verb - do NOT change it in the example

Respond as valid JSON:
{
  "suggestions": [
    {
      "original": "the original bullet point",
      "action_verb_suggestion": null or {
        "improved": "the bullet with ONLY the verb changed, nothing else",
        "alternatives": ["verb1", "verb2"],
        "reasoning": "why this verb is stronger"
      },
      "quantification_suggestion": null or {
        "prompt": "question asking user for their specific number",
        "example": "the bullet with [X] placeholder where user should add their metric",
        "metrics_to_consider": ["metric1", "metric2"]
      }
    }
  ]
}

EXAMPLE OUTPUT:
For bullet "Worked in a multi-disciplinary team that leveraged scrum methodologies":
{
  "original": "Worked in a multi-disciplinary team that leveraged scrum methodologies",
  "action_verb_suggestion": {
    "improved": "Collaborated in a multi-disciplinary team that leveraged scrum methodologies",
    "alternatives": ["Led", "Coordinated"],
    "reasoning": "Collaborated conveys active participation"
  },
  "quantification_suggestion": {
    "prompt": "How many people were on your team?",
    "example": "Worked in a multi-disciplinary team of [X] that leveraged scrum methodologies",
    "metrics_to_consider": ["team size"]
  }
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON - no additional text before or after
2. The "suggestions" array must have exactly ${bulletPoints.length} items, one for each input bullet
3. Order must match input order
4. If a bullet is already strong (strong verb + has metrics), set both suggestions to null
5. action_verb_suggestion.improved should ONLY change the verb, keep everything else identical
6. quantification_suggestion.example should use [X] placeholder - NEVER invent numbers like "1,000 users" or "50%"
7. quantification_suggestion.prompt should be a question asking the user for THEIR specific number
8. SKIP skill listings (e.g., "Languages: Python, JavaScript") - set BOTH suggestions to null
9. Ensure all JSON strings are properly escaped`;
}

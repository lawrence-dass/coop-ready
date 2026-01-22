/**
 * Bullet Point Rewrite Prompt Template
 *
 * Generates prompts for AI-powered bullet point rewrites.
 *
 * @see Story 5.1: Bullet Point Rewrite Generation
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

import type { CalibrationContext } from './calibration-context';
import { buildCalibrationInstructions } from './calibration-context';

/**
 * User profile for context-aware rewrite generation
 */
export interface UserProfile {
  experienceLevel: string
  targetRole: string
  isStudent: boolean
}

/**
 * Create bullet point rewrite prompt with context awareness
 *
 * Prompt engineering strategy:
 * - Adapts to user context (Student vs Professional)
 * - Handles vague bullets vs strong bullets differently
 * - Preserves honesty while maximizing impact
 * - Aligns with job description keywords
 * - Provides reasoning for transparency
 * - Story 9.2: Adapts to calibration mode and experience level
 *
 * @param bulletPoints - Array of original bullet points to rewrite
 * @param userProfile - User's experience level and context
 * @param jdKeywords - Keywords from job description for alignment
 * @param calibration - Optional calibration context for mode-aware suggestions
 * @returns Formatted prompt string
 */
export function createBulletRewritePrompt(
  bulletPoints: string[],
  userProfile: UserProfile,
  jdKeywords: string[],
  calibration?: CalibrationContext
): string {
  const contextGuidance = userProfile.isStudent
    ? "For academic projects and coursework, translate academic achievements into professional language that technical hiring managers understand. Frame coursework as practical experience and emphasize technical skills demonstrated."
    : "Focus on business impact, metrics, and technical achievement for a professional audience. Emphasize leadership, scale, and measurable outcomes."

  // Story 9.2: Build calibration-aware instructions
  const calibrationInstructions = calibration
    ? `\n\n${buildCalibrationInstructions(calibration)}\n`
    : '';

  return `You are an expert resume writer specializing in ATS optimization and impact maximization.
${calibrationInstructions}

Given the following experience bullet points, generate improved rewrites that:
1. Add specific metrics, percentages, or quantifiable outcomes (when appropriate)
2. Use strong action verbs appropriate for the context
3. Maintain accuracy and honesty - never fabricate metrics
4. Align with these job description keywords: ${jdKeywords.join(", ")}
5. Match the user's experience level: ${userProfile.experienceLevel}
6. Target role: ${userProfile.targetRole}

Context: ${contextGuidance}

For each bullet point:
- If it's vague or weak, provide a significant improvement with specific details
- If it's already strong, either suggest minor improvements or respond with "No changes recommended"
- Preserve the user's original achievements - enhance presentation, don't fabricate content
- Use industry-standard action verbs (Led, Designed, Implemented, Architected, Optimized, etc.)
- Where metrics exist, preserve them; where missing, suggest realistic metric patterns (e.g., "by X%" without inventing numbers)

Bullet points to rewrite:
${bulletPoints.map((bp, i) => `${i + 1}. ${bp}`).join("\n")}

Respond as valid JSON in this exact format:
{
  "rewrites": [
    {
      "original": "exact original bullet text",
      "suggested": "improved version or 'No changes recommended'",
      "reasoning": "concise explanation of why this rewrite improves impact, clarity, or keyword alignment"
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON - no additional text before or after
2. The "rewrites" array must have exactly ${bulletPoints.length} items, one for each input bullet
3. Order must match input order
4. If a bullet is already excellent, use "No changes recommended" as the suggested text
5. Reasoning should be 1-2 sentences explaining the improvement
6. Never fabricate achievements or metrics - only reframe existing information
7. Keep rewrites concise (1-2 lines typical for bullet points)
8. Ensure all JSON strings are properly escaped`
}

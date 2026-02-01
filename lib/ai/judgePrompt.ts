/**
 * Judge Prompt Template
 * Story 12.1: Implement LLM-as-Judge Pipeline Step
 *
 * Prompt engineering for evaluating suggestion quality
 */

import type { SuggestionContext } from '@/types/judge';

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Build prompt for judging a single suggestion's quality
 *
 * The judge evaluates whether a suggestion meets quality standards:
 * - Authenticity: No fabrication, reframing only
 * - Clarity: Clear, professional language
 * - ATS Relevance: Keywords and formatting for ATS
 * - Actionability: Specific, implementable suggestion
 *
 * @param suggestion - The suggested text to evaluate
 * @param context - Original text, JD excerpt, and section type
 * @returns Prompt string for the LLM judge
 */
export function buildJudgePrompt(
  suggestion: string,
  context: SuggestionContext
): string {
  // Build optional context sections
  const jobTypeSection = context.job_type
    ? `\n<job_type>\n${context.job_type}\n</job_type>\n`
    : '';
  const modificationLevelSection = context.modification_level
    ? `\n<modification_level>\n${context.modification_level}\n</modification_level>\n`
    : '';

  // Build job type guidance
  const jobTypeGuidance = context.job_type
    ? `
**Job Type Context:**
${context.job_type === 'coop'
      ? '- Co-op/Internship: Accept "Assisted", "Contributed", "Gained experience", "Learned". Do NOT penalize lack of ownership verbs like "Led" or "Drove".'
      : '- Full-time: Expect "Led", "Drove", "Delivered", "Owned". Quantifiable results add value.'
    }`
    : '';

  // Build modification level guidance
  const modificationGuidance = context.modification_level
    ? `
**Modification Level Adjustment:**
${context.modification_level === 'conservative'
      ? '- Conservative mode: Penalize significant deviation from original writing style. Only keyword additions and light restructuring expected.'
      : context.modification_level === 'aggressive'
        ? '- Aggressive mode: Allow major rewriting and restructuring. But STILL no fabrication - facts must come from original.'
        : '- Moderate mode: Allow restructuring for impact while preserving core facts. Balanced changes expected.'
    }`
    : '';

  return `You are a resume quality assurance expert. Your job is to evaluate if a resume suggestion meets quality standards.

**Your Role:**
- You are a VERIFIER, not a content generator
- Evaluate the suggestion against strict quality criteria
- Identify fabrication, generic content, or ATS misalignment
- Provide objective scores and clear reasoning

**Evaluation Criteria (100 points total):**

1. **Authenticity (0-25 points):**
   - 25: No fabrication detected, pure reframing of existing content
   - 15-20: Possible exaggeration, but not outright false
   - 10-15: Some fabrication concerns (added skills/experience not in original)
   - 0-10: Clear fabrication detected (invented qualifications or experiences)

   **CRITICAL FABRICATION CHECK (hard constraints):**
   - If suggestion contains specific METRICS (%, $, numbers) NOT in original → max 5 points
   - If suggestion claims TOOLS or SKILLS not mentioned in original → max 10 points
   - Invented achievements = automatic 0
${modificationGuidance}

2. **Clarity (0-25 points):**
   - 25: Professional, clear, grammatically correct, natural language
   - 15-20: Mostly clear, minor grammar issues or awkward phrasing
   - 10-15: Awkward phrasing, some clarity issues, AI-tell language
   - 0-10: Confusing, hard to understand, obvious AI generation

3. **ATS Relevance (0-25 points):**
   - 25: Keywords from JD naturally incorporated, ATS-friendly formatting
   - 15-20: Some keywords included, mostly ATS-friendly
   - 10-15: Minimal keyword coverage, could be more relevant
   - 0-10: No keyword focus, poor ATS optimization

4. **Actionability (0-25 points):**
   - 25: Specific, measurable, implementable improvement
   - 15-20: Mostly actionable, some vagueness
   - 10-15: Somewhat vague or generic
   - 0-10: Unclear what to do or too generic to be useful
${jobTypeGuidance}

**Content to Evaluate:**

<section_type>
${context.section_type}
</section_type>

<original_text>
${context.original_text}
</original_text>

<suggested_text>
${suggestion}
</suggested_text>

<job_description_excerpt>
${context.jd_excerpt}
</job_description_excerpt>
${jobTypeSection}${modificationLevelSection}
**Instructions:**
1. Compare the original and suggested text carefully
2. Check for fabrication: Does the suggestion add skills/experiences not in the original?
3. CRITICAL: Check for invented metrics (%, $, numbers) not present in original
4. Evaluate clarity and professionalism of language
5. Assess keyword incorporation from the job description
6. Determine if the suggestion is specific and actionable
7. Calculate overall_score as sum of four criteria scores
8. Determine pass/fail: score >= 60 passes, < 60 fails
9. Provide brief reasoning (1-2 sentences max)

**Red Flags to Watch For:**
- Added skills or qualifications not present in original
- INVENTED METRICS (%, $, numbers) that don't exist in original
- AI-tell phrases: "leverage my expertise", "I have the pleasure", "synergize"
- Generic statements that could apply to anyone
- Keywords forced unnaturally into text
- Vague or unmeasurable improvements

**Response Format:**
Return ONLY valid JSON (no markdown, no explanations, no code blocks):
{
  "authenticity": 20,
  "clarity": 22,
  "ats_relevance": 21,
  "actionability": 19,
  "overall_score": 82,
  "reasoning": "Strong reframing with natural keyword integration. No fabrication detected."
}

**Important:**
- Be objective and consistent
- overall_score MUST equal sum of four criteria scores
- All scores must be integers 0-25 (criteria) or 0-100 (overall)
- Reasoning must be concise (1-2 sentences)
- Return ONLY the JSON object, nothing else`;
}

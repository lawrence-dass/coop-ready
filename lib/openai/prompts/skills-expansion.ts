/**
 * OpenAI Prompt for Skills Expansion Suggestions
 *
 * Story 5.4: Skills Expansion Suggestions
 *
 * Generates prompt for AI to analyze skills and suggest expansions
 * that include commonly-used libraries, frameworks, and tools.
 */

export const SKILL_EXPANSION_PROMPT = (
  skills: string[],
  jdContent?: string,
  jdKeywords?: string[]
) => {
  const keywordContext = jdKeywords?.length
    ? `\n\nJob Description Keywords: ${jdKeywords.join(", ")}\n\nPrioritize expansions that include these keywords.`
    : "";

  const jdContext = jdContent
    ? `\n\nJob Description excerpt: "${jdContent.substring(0, 500)}..."`
    : "";

  return `You are an expert ATS and resume optimization specialist.

Your task is to analyze the following skills and suggest specific expansions that will help the resume match ATS keyword searches and job descriptions more effectively.

Skills to analyze:
${skills.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${keywordContext}
${jdContext}

For EACH skill, respond with:
1. CAN_EXPAND: true/false (is this skill expandable with commonly used libraries/frameworks/tools?)
2. EXPANSION: if true, provide the expanded version with commonly-used libraries/frameworks/tools
3. KEYWORDS_MATCHED: list of JD keywords this expansion would help match
4. REASONING: brief explanation of why these specific technologies are paired with this skill

IMPORTANT RULES:
- Only suggest expansions that are technically accurate and honest
- Include only tools/libraries/frameworks commonly used with this skill
- Do NOT make up technologies or create false associations
- If the skill cannot be meaningfully expanded (e.g., "Communication", "Leadership"), set CAN_EXPAND to false
- Generic skills like "Problem Solving" don't expand
- Base expansions on industry standards and actual usage patterns

Respond as valid JSON:
{
  "suggestions": [
    {
      "original": "original skill name",
      "can_expand": true/false,
      "expansion": null or "expanded skill (with specific tools/libraries)",
      "keywords_matched": ["keyword1", "keyword2"],
      "reasoning": "brief explanation"
    }
  ]
}`;
};

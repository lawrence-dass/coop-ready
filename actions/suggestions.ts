'use server'

import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { withRetry } from '@/lib/openai/retry'
import { parseOpenAIResponse } from '@/lib/openai'
import { createBulletRewritePrompt, type UserProfile } from '@/lib/openai/prompts/suggestions'
import { createTransferableSkillsPrompt } from '@/lib/openai/prompts/skills'
import { createActionVerbAndQuantificationPrompt } from '@/lib/openai/prompts/action-verbs'
import { SKILL_EXPANSION_PROMPT } from '@/lib/openai/prompts/skills-expansion'
import { FORMAT_AND_REMOVAL_PROMPT } from '@/lib/openai/prompts/format-removal'
import { findSkillExpansion } from '@/lib/validations/skills'
import {
  getMaxPagesRecommendation,
  isProhibitedField,
  isSensitiveField,
} from '@/lib/validations/resume-standards'
import { z } from 'zod'

/**
 * Server Actions for AI-Generated Suggestions
 *
 * @see Story 5.1: Bullet Point Rewrite Generation
 * @see Story 5.2: Transferable Skills Detection & Mapping
 * @see Story 5.3: Action Verb & Quantification Suggestions
 * @see Story 5.4: Skills Expansion Suggestions
 */

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

/**
 * Rewrite result from OpenAI
 */
interface RewriteResult {
  original: string
  suggested: string
  reasoning: string
}

/**
 * Valid experience levels matching user profile options
 */
const experienceLevelEnum = z.enum(['entry', 'mid', 'senior', 'student', 'experienced'])

/**
 * Valid suggestion types matching database constraint
 */
const suggestionTypeEnum = z.enum([
  'bullet_rewrite',
  'skill_mapping',
  'action_verb',
  'quantification',
  'skill_expansion',
  'format',
  'removal',
])

/**
 * Input validation schema for generateBulletRewrites
 */
const generateBulletRewritesSchema = z.object({
  scanId: z.string().uuid(),
  bulletPoints: z.array(z.string()).min(1),
  experienceLevel: experienceLevelEnum,
  targetRole: z.string(),
  isStudent: z.boolean(),
  jdKeywords: z.array(z.string()),
})

/**
 * Input validation schema for generateSkillMappings
 */
const generateSkillMappingsSchema = z.object({
  scanId: z.string().uuid(),
  experiences: z
    .array(
      z.object({
        text: z.string(),
        context: z.string(),
        section: z.enum(['experience', 'education', 'projects']),
      })
    )
    .min(1),
  experienceLevel: experienceLevelEnum,
  isStudent: z.boolean(),
  background: z.string(),
  targetRole: z.string(),
  jdKeywords: z.array(z.string()),
})

/**
 * Input validation schema for generateActionVerbAndQuantificationSuggestions
 */
const generateActionVerbAndQuantificationSchema = z.object({
  scanId: z.string().uuid(),
  bulletPoints: z.array(z.string()).min(1),
  achievementTypes: z.array(z.string()).optional(), // defaults to 'general'
})

/**
 * Input validation schema for generateSkillExpansionSuggestions
 */
const generateSkillExpansionSchema = z.object({
  scanId: z.string().uuid(),
  skills: z.array(z.string()).min(1),
  jdKeywords: z.array(z.string()).optional(),
  jdContent: z.string().optional(),
})

/**
 * Input validation schema for generateFormatAndRemovalSuggestions
 */
const generateFormatAndRemovalSchema = z.object({
  scanId: z.string().uuid(),
  resumeContent: z.string(),
  detectedFields: z.array(z.string()),
  experienceYears: z.number().min(0),
  targetRole: z.string(),
  isInternationalStudent: z.boolean().optional(),
  resumePages: z.number().min(1).optional(),
})

/**
 * Input validation schema for saveSuggestions
 */
const saveSuggestionsSchema = z.object({
  scanId: z.string().uuid(),
  suggestions: z.array(
    z.object({
      section: z.enum(['experience', 'education', 'projects', 'skills', 'format']),
      itemIndex: z.number().int().nonnegative(),
      originalText: z.string(),
      suggestedText: z.string(),
      suggestionType: suggestionTypeEnum,
      reasoning: z.string().optional(),
    })
  ),
})

/**
 * Generate AI-powered bullet point rewrites
 *
 * Process:
 * 1. Validate input parameters
 * 2. Build context-aware prompt with user profile
 * 3. Call OpenAI API with retry logic
 * 4. Parse and validate JSON response
 * 5. Return rewrites with original, suggested, and reasoning
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - OpenAI API failure: Return GENERATION_ERROR
 * - JSON parse failure: Return PARSE_ERROR
 *
 * @param input - Scan ID, bullet points, user context, and JD keywords
 * @returns ActionResponse with rewrites array or error
 */
export async function generateBulletRewrites(
  input: z.infer<typeof generateBulletRewritesSchema>
): Promise<
  ActionResponse<{
    scanId: string
    rewrites: RewriteResult[]
  }>
> {
  console.log('[generateBulletRewrites] ====== ENTRY ======', {
    scanId: input.scanId,
    bulletCount: input.bulletPoints?.length,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = generateBulletRewritesSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[generateBulletRewrites] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  const { scanId, bulletPoints, experienceLevel, targetRole, isStudent, jdKeywords } =
    parsed.data

  try {
    // Build user profile for context
    const userProfile: UserProfile = {
      experienceLevel,
      targetRole,
      isStudent,
    }

    console.log('[generateBulletRewrites] Building prompt with context:', {
      experienceLevel,
      targetRole,
      isStudent,
      keywordCount: jdKeywords.length,
    })

    // Create prompt
    const prompt = createBulletRewritePrompt(bulletPoints, userProfile, jdKeywords)

    console.log('[generateBulletRewrites] Calling OpenAI API...')

    // Call OpenAI with retry logic
    const openai = getOpenAIClient()
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    }, 'generateBulletRewrites')

    console.log('[generateBulletRewrites] OpenAI response received')

    // Parse OpenAI response (may throw if malformed)
    let parsedResponse
    try {
      parsedResponse = parseOpenAIResponse(response)
    } catch (parseError) {
      console.error('[generateBulletRewrites] Failed to parse OpenAI response structure:', parseError)
      return {
        data: null,
        error: { message: 'Malformed OpenAI response', code: 'PARSE_ERROR' },
      }
    }
    const content = parsedResponse.content

    // Parse JSON from content
    let rewritesData: { rewrites: RewriteResult[] }
    try {
      rewritesData = JSON.parse(content)
    } catch (parseError) {
      console.error('[generateBulletRewrites] Failed to parse JSON from AI response:', content)
      return {
        data: null,
        error: { message: 'Failed to parse AI response', code: 'PARSE_ERROR' },
      }
    }

    const { rewrites } = rewritesData

    // Validate rewrites array
    if (!Array.isArray(rewrites) || rewrites.length !== bulletPoints.length) {
      console.error(
        '[generateBulletRewrites] Invalid rewrites array:',
        rewrites?.length,
        'expected:',
        bulletPoints.length
      )
      return {
        data: null,
        error: {
          message: 'AI returned invalid number of rewrites',
          code: 'PARSE_ERROR',
        },
      }
    }

    console.log('[generateBulletRewrites] ====== SUCCESS ======', {
      rewriteCount: rewrites.length,
    })

    return {
      data: { scanId, rewrites },
      error: null,
    }
  } catch (e) {
    console.error('[generateBulletRewrites] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to generate rewrites',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

/**
 * Generate AI-powered transferable skill mappings
 *
 * Process:
 * 1. Validate input parameters
 * 2. Build context-aware prompt based on user background (career changer vs student)
 * 3. Call OpenAI API with retry logic
 * 4. Parse and validate JSON response with skill mappings
 * 5. Return mappings with original experience, mapped skills, tech equivalent, and reasoning
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - OpenAI API failure: Return GENERATION_ERROR
 * - JSON parse failure: Return PARSE_ERROR
 *
 * @param input - Scan ID, experiences with context, user profile, and JD keywords
 * @returns ActionResponse with skill mappings array or error
 */
export async function generateSkillMappings(
  input: z.infer<typeof generateSkillMappingsSchema>
): Promise<
  ActionResponse<{
    scanId: string
    mappings: Array<{
      original: string
      mapped_skills: string[]
      tech_equivalent: string
      reasoning: string
      jd_keywords_matched: string[]
    }>
  }>
> {
  console.log('[generateSkillMappings] ====== ENTRY ======', {
    scanId: input.scanId,
    experienceCount: input.experiences?.length,
    isStudent: input.isStudent,
    background: input.background,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = generateSkillMappingsSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[generateSkillMappings] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  const { scanId, experiences, experienceLevel, isStudent, background, targetRole, jdKeywords } =
    parsed.data

  try {
    // Normalize experience level for prompt (student/experienced -> entry for prompt purposes)
    const normalizedLevel: 'entry' | 'mid' | 'senior' =
      experienceLevel === 'student' || experienceLevel === 'experienced'
        ? 'entry'
        : experienceLevel

    // Build user profile for context
    const userProfile = {
      experienceLevel: normalizedLevel,
      isStudent,
      background,
      targetRole,
    }

    console.log('[generateSkillMappings] Building prompt with context:', {
      experienceLevel,
      isStudent,
      background,
      targetRole,
      keywordCount: jdKeywords.length,
    })

    // Create prompt using transferable skills template
    const prompt = createTransferableSkillsPrompt(
      experiences.map((exp) => ({ text: exp.text, context: exp.context })),
      userProfile,
      jdKeywords
    )

    console.log('[generateSkillMappings] Calling OpenAI API...')

    // Call OpenAI with retry logic
    const openai = getOpenAIClient()
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    }, 'generateSkillMappings')

    console.log('[generateSkillMappings] OpenAI response received')

    // Parse OpenAI response (this may throw if malformed)
    let parsedResponse
    try {
      parsedResponse = parseOpenAIResponse(response)
    } catch (parseError) {
      console.error('[generateSkillMappings] Failed to parse OpenAI response structure:', parseError)
      return {
        data: null,
        error: { message: 'Malformed OpenAI response', code: 'PARSE_ERROR' },
      }
    }

    const content = parsedResponse.content

    // Parse JSON from content
    let mappingsData: {
      mappings: Array<{
        original: string
        mapped_skills: string[]
        tech_equivalent: string
        reasoning: string
        jd_keywords_matched: string[]
      }>
    }
    try {
      mappingsData = JSON.parse(content)
    } catch (parseError) {
      console.error('[generateSkillMappings] Failed to parse JSON from AI response:', content)
      return {
        data: null,
        error: { message: 'Failed to parse AI response', code: 'PARSE_ERROR' },
      }
    }

    const { mappings } = mappingsData

    // Validate mappings array exists and has correct length
    if (!Array.isArray(mappings) || mappings.length !== experiences.length) {
      console.error(
        '[generateSkillMappings] Invalid mappings array:',
        mappings?.length,
        'expected:',
        experiences.length
      )
      return {
        data: null,
        error: {
          message: 'AI returned invalid number of mappings',
          code: 'PARSE_ERROR',
        },
      }
    }

    // Validate each mapping has required structure
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i]
      if (
        typeof mapping.original !== 'string' ||
        !Array.isArray(mapping.mapped_skills) ||
        typeof mapping.tech_equivalent !== 'string' ||
        typeof mapping.reasoning !== 'string' ||
        !Array.isArray(mapping.jd_keywords_matched)
      ) {
        console.error('[generateSkillMappings] Invalid mapping structure at index', i, mapping)
        return {
          data: null,
          error: {
            message: `AI returned invalid mapping structure at index ${i}`,
            code: 'PARSE_ERROR',
          },
        }
      }
    }

    console.log('[generateSkillMappings] ====== SUCCESS ======', {
      mappingCount: mappings.length,
    })

    return {
      data: { scanId, mappings },
      error: null,
    }
  } catch (e) {
    console.error('[generateSkillMappings] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to generate skill mappings',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

/**
 * Generate AI-powered action verb and quantification suggestions
 *
 * Process:
 * 1. Validate input parameters
 * 2. Build context-aware prompt for action verb and quantification analysis
 * 3. Call OpenAI API with retry logic
 * 4. Parse and validate JSON response
 * 5. Return suggestions with action verb improvements and quantification prompts
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - OpenAI API failure: Return GENERATION_ERROR
 * - JSON parse failure: Return PARSE_ERROR
 *
 * @param input - Scan ID, bullet points, and optional achievement type classifications
 * @returns ActionResponse with action verb and quantification suggestions or error
 * @see Story 5.3: Action Verb & Quantification Suggestions
 */
export async function generateActionVerbAndQuantificationSuggestions(
  input: z.infer<typeof generateActionVerbAndQuantificationSchema>
): Promise<
  ActionResponse<{
    scanId: string
    suggestions: Array<{
      original: string
      actionVerbSuggestion: {
        improved: string
        alternatives: string[]
        reasoning: string
      } | null
      quantificationSuggestion: {
        prompt: string
        example: string
        metricsToConsider: string[]
      } | null
    }>
  }>
> {
  console.log('[generateActionVerbAndQuantificationSuggestions] ====== ENTRY ======', {
    scanId: input.scanId,
    bulletCount: input.bulletPoints?.length,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = generateActionVerbAndQuantificationSchema.safeParse(input)
  if (!parsed.success) {
    console.error(
      '[generateActionVerbAndQuantificationSuggestions] Validation failed:',
      parsed.error
    )
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  const { scanId, bulletPoints, achievementTypes = [] } = parsed.data

  try {
    // Pad achievement types with 'general' if not enough provided
    const types = [
      ...achievementTypes,
      ...Array(bulletPoints.length - achievementTypes.length).fill('general'),
    ]

    console.log('[generateActionVerbAndQuantificationSuggestions] Building prompt...')

    // Create prompt using action verb and quantification template
    const prompt = createActionVerbAndQuantificationPrompt(bulletPoints, types)

    console.log('[generateActionVerbAndQuantificationSuggestions] Calling OpenAI API...')

    // Call OpenAI with retry logic
    const openai = getOpenAIClient()
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    }, 'generateActionVerbAndQuantificationSuggestions')

    console.log('[generateActionVerbAndQuantificationSuggestions] OpenAI response received')

    // Parse OpenAI response (this may throw if malformed)
    let parsedResponse
    try {
      parsedResponse = parseOpenAIResponse(response)
    } catch (parseError) {
      console.error(
        '[generateActionVerbAndQuantificationSuggestions] Failed to parse OpenAI response structure:',
        parseError
      )
      return {
        data: null,
        error: { message: 'Malformed OpenAI response', code: 'PARSE_ERROR' },
      }
    }

    const content = parsedResponse.content

    // Parse JSON from content
    let suggestionsData: {
      suggestions: Array<{
        original: string
        action_verb_suggestion: {
          improved: string
          alternatives: string[]
          reasoning: string
        } | null
        quantification_suggestion: {
          prompt: string
          example: string
          metrics_to_consider: string[]
        } | null
      }>
    }
    try {
      suggestionsData = JSON.parse(content)
    } catch (jsonParseError) {
      console.error(
        '[generateActionVerbAndQuantificationSuggestions] Failed to parse JSON from AI response:',
        content,
        jsonParseError
      )
      return {
        data: null,
        error: { message: 'Failed to parse AI response', code: 'PARSE_ERROR' },
      }
    }

    const { suggestions } = suggestionsData

    // Validate suggestions array exists and has correct length
    if (!Array.isArray(suggestions) || suggestions.length !== bulletPoints.length) {
      console.error(
        '[generateActionVerbAndQuantificationSuggestions] Invalid suggestions array:',
        suggestions?.length,
        'expected:',
        bulletPoints.length
      )
      return {
        data: null,
        error: {
          message: 'AI returned invalid number of suggestions',
          code: 'PARSE_ERROR',
        },
      }
    }

    // Transform snake_case API response to camelCase for TypeScript
    const transformedSuggestions = suggestions.map((s) => ({
      original: s.original,
      actionVerbSuggestion: s.action_verb_suggestion
        ? {
            improved: s.action_verb_suggestion.improved,
            alternatives: s.action_verb_suggestion.alternatives,
            reasoning: s.action_verb_suggestion.reasoning,
          }
        : null,
      quantificationSuggestion: s.quantification_suggestion
        ? {
            prompt: s.quantification_suggestion.prompt,
            example: s.quantification_suggestion.example,
            metricsToConsider: s.quantification_suggestion.metrics_to_consider,
          }
        : null,
    }))

    console.log('[generateActionVerbAndQuantificationSuggestions] ====== SUCCESS ======', {
      suggestionCount: transformedSuggestions.length,
      actionVerbCount: transformedSuggestions.filter((s) => s.actionVerbSuggestion).length,
      quantificationCount: transformedSuggestions.filter((s) => s.quantificationSuggestion).length,
    })

    return {
      data: { scanId, suggestions: transformedSuggestions },
      error: null,
    }
  } catch (e) {
    console.error('[generateActionVerbAndQuantificationSuggestions] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to generate action verb and quantification suggestions',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

/**
 * Transform action verb and quantification suggestions to database-compatible format
 *
 * Converts the API response structure to the format expected by saveSuggestions.
 * - Action verb suggestions become suggestion_type: 'action_verb'
 * - Quantification suggestions become suggestion_type: 'quantification'
 * - Both suggestions for the same bullet become separate database records
 *
 * @param suggestions - Array of suggestions from generateActionVerbAndQuantificationSuggestions
 * @returns Array of suggestions in saveSuggestions format
 */
export function transformActionVerbSuggestions(
  suggestions: Array<{
    original: string
    actionVerbSuggestion: {
      improved: string
      alternatives: string[]
      reasoning: string
    } | null
    quantificationSuggestion: {
      prompt: string
      example: string
      metricsToConsider: string[]
    } | null
  }>
): Array<{
  section: string
  itemIndex: number
  originalText: string
  suggestedText: string
  suggestionType: string
  reasoning?: string
}> {
  const transformed: Array<{
    section: string
    itemIndex: number
    originalText: string
    suggestedText: string
    suggestionType: string
    reasoning?: string
  }> = []

  suggestions.forEach((sugg, index) => {
    // Add action verb suggestion
    if (sugg.actionVerbSuggestion) {
      transformed.push({
        section: 'experience',
        itemIndex: index,
        originalText: sugg.original,
        suggestedText: sugg.actionVerbSuggestion.improved,
        suggestionType: 'action_verb',
        reasoning: `${sugg.actionVerbSuggestion.reasoning}\nAlternatives: ${sugg.actionVerbSuggestion.alternatives.join(', ')}`,
      })
    }

    // Add quantification suggestion
    if (sugg.quantificationSuggestion) {
      transformed.push({
        section: 'experience',
        itemIndex: index,
        originalText: sugg.original,
        suggestedText: sugg.quantificationSuggestion.prompt,
        suggestionType: 'quantification',
        reasoning: `${sugg.quantificationSuggestion.prompt}\n\nExample: ${sugg.quantificationSuggestion.example}\n\nMetrics to consider: ${sugg.quantificationSuggestion.metricsToConsider.join(', ')}`,
      })
    }
  })

  return transformed
}

/**
 * Save suggestions to database
 *
 * Process:
 * 1. Validate input parameters
 * 2. Get authenticated Supabase client
 * 3. Transform suggestions to database format (snake_case)
 * 4. Insert suggestions with RLS security
 * 5. Return count of saved suggestions
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - Database error: Return SAVE_ERROR
 * - RLS violation: Return UNAUTHORIZED
 *
 * @param input - Scan ID and array of suggestions to save
 * @returns ActionResponse with saved count or error
 */
export async function saveSuggestions(
  input: z.infer<typeof saveSuggestionsSchema>
): Promise<ActionResponse<{ savedCount: number }>> {
  console.log('[saveSuggestions] ====== ENTRY ======', {
    scanId: input.scanId,
    suggestionCount: input.suggestions?.length,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = saveSuggestionsSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[saveSuggestions] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  const { scanId, suggestions } = parsed.data

  try {
    const client = await createClient()

    // Transform to database format (snake_case)
    const data = suggestions.map((s) => ({
      scan_id: scanId,
      section: s.section,
      item_index: s.itemIndex,
      original_text: s.originalText,
      suggested_text: s.suggestedText,
      suggestion_type: s.suggestionType,
      reasoning: s.reasoning || null,
      status: 'pending',
    }))

    console.log('[saveSuggestions] Inserting suggestions to database...')

    // Insert suggestions and get count
    const { data: insertedData, error } = await client
      .from('suggestions')
      .insert(data)
      .select('id')

    if (error) {
      console.error('[saveSuggestions] Database error:', error)
      throw error
    }

    const savedCount = insertedData?.length ?? 0

    console.log('[saveSuggestions] ====== SUCCESS ======', {
      savedCount,
    })

    return { data: { savedCount }, error: null }
  } catch (e) {
    console.error('[saveSuggestions] ====== ERROR ======', e)
    return {
      data: null,
      error: { message: 'Failed to save suggestions', code: 'SAVE_ERROR' },
    }
  }
}

/**
 * Generate AI-powered skill expansion suggestions
 *
 * Process:
 * 1. Validate input parameters
 * 2. Try local skill expansion mappings first for known skills (optimization)
 * 3. For unknown skills, build prompt and call OpenAI API
 * 4. Parse and validate JSON response
 * 5. Filter matched keywords from JD if provided
 * 6. Return only expandable skills with their expansions
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - OpenAI API failure: Return GENERATION_ERROR
 * - JSON parse failure: Return PARSE_ERROR
 *
 * @param input - Scan ID, skills array, optional JD keywords and content
 * @returns ActionResponse with skill expansion suggestions or error
 * @see Story 5.4: Skills Expansion Suggestions
 */
export async function generateSkillExpansionSuggestions(
  input: z.infer<typeof generateSkillExpansionSchema>
): Promise<
  ActionResponse<{
    scanId: string
    suggestions: Array<{
      original: string
      expansion: string | null
      keywordsMatched: string[]
      reasoning: string
    }>
  }>
> {
  console.log('[generateSkillExpansionSuggestions] ====== ENTRY ======', {
    scanId: input.scanId,
    skillsCount: input.skills?.length,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = generateSkillExpansionSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[generateSkillExpansionSuggestions] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const { scanId, skills, jdKeywords, jdContent } = parsed.data

    // First, try local skill expansion mappings for known skills
    const localExpansions = new Map<
      string,
      ReturnType<typeof findSkillExpansion>
    >()
    const unknownSkills: string[] = []

    for (const skill of skills) {
      const expansion = findSkillExpansion(skill)
      if (expansion) {
        localExpansions.set(skill, expansion)
      } else {
        unknownSkills.push(skill)
      }
    }

    console.log('[generateSkillExpansionSuggestions] Skill classification:', {
      totalSkills: skills.length,
      knownSkills: localExpansions.size,
      unknownSkills: unknownSkills.length,
    })

    // If all skills are known, use local mappings
    let suggestions: Array<{
      original: string
      expansion: string | null
      keywordsMatched: string[]
      reasoning: string
    }> = []

    if (unknownSkills.length === 0) {
      // Use local mappings for all skills
      suggestions = skills.map((skill) => {
        const expansion = localExpansions.get(skill)
        if (expansion) {
          // Match keywords bidirectionally: JD keyword contains related skill OR related skill contains JD keyword
          const matchedKeywords = jdKeywords
            ? expansion.relatedSkills.filter((rs) =>
                jdKeywords.some((kw) => {
                  const kwLower = kw.toLowerCase()
                  const rsLower = rs.toLowerCase()
                  return kwLower.includes(rsLower) || rsLower.includes(kwLower)
                })
              )
            : [...expansion.relatedSkills]
          return {
            original: skill,
            expansion: expansion.expandTo,
            keywordsMatched: Array.from(matchedKeywords),
            reasoning: `Expanded to include commonly-used libraries and frameworks: ${expansion.relatedSkills.join(', ')}`,
          }
        }
        return {
          original: skill,
          expansion: null,
          keywordsMatched: [],
          reasoning: 'Cannot be meaningfully expanded',
        }
      })
    } else {
      // Use AI for unknown skills
      console.log('[generateSkillExpansionSuggestions] Calling OpenAI for unknown skills...')

      const prompt = SKILL_EXPANSION_PROMPT(unknownSkills, jdContent, jdKeywords)

      const openai = getOpenAIClient()
      const response = await withRetry(async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })
      }, 'generateSkillExpansionSuggestions')

      console.log('[generateSkillExpansionSuggestions] OpenAI response received')

      // Parse OpenAI response
      let parsedResponse
      try {
        parsedResponse = parseOpenAIResponse(response)
      } catch (parseError) {
        console.error(
          '[generateSkillExpansionSuggestions] Failed to parse OpenAI response structure:',
          parseError
        )
        return {
          data: null,
          error: { message: 'Malformed OpenAI response', code: 'PARSE_ERROR' },
        }
      }

      const content = parsedResponse.content

      // Type for AI-generated skill expansion suggestions
      interface AiSkillSuggestion {
        original: string
        can_expand: boolean
        expansion: string | null
        keywords_matched: string[]
        reasoning: string
      }

      let aiSuggestions: AiSkillSuggestion[] | undefined
      try {
        const parsed = JSON.parse(content) as { suggestions: AiSkillSuggestion[] }
        aiSuggestions = parsed.suggestions
      } catch (jsonParseError) {
        console.error(
          '[generateSkillExpansionSuggestions] Failed to parse JSON from AI response',
          content,
          jsonParseError
        )
        return {
          data: null,
          error: { message: 'Failed to parse AI response', code: 'PARSE_ERROR' },
        }
      }

      // Combine local and AI suggestions
      suggestions = skills.map((skill) => {
        const localExpansion = localExpansions.get(skill)
        if (localExpansion) {
          // Match keywords bidirectionally: JD keyword contains related skill OR related skill contains JD keyword
          const matchedKeywords = jdKeywords
            ? localExpansion.relatedSkills.filter((rs) =>
                jdKeywords.some((kw) => {
                  const kwLower = kw.toLowerCase()
                  const rsLower = rs.toLowerCase()
                  return kwLower.includes(rsLower) || rsLower.includes(kwLower)
                })
              )
            : [...localExpansion.relatedSkills]
          return {
            original: skill,
            expansion: localExpansion.expandTo,
            keywordsMatched: Array.from(matchedKeywords),
            reasoning: `Expanded to include commonly-used libraries and frameworks: ${localExpansion.relatedSkills.join(', ')}`,
          }
        }

        // Find AI suggestion for this skill
        const aiSugg = aiSuggestions?.find(
          (s) => s.original.toLowerCase() === skill.toLowerCase()
        )
        if (aiSugg && aiSugg.can_expand && aiSugg.expansion) {
          return {
            original: skill,
            expansion: aiSugg.expansion,
            keywordsMatched: aiSugg.keywords_matched || [],
            reasoning: aiSugg.reasoning,
          }
        }

        return {
          original: skill,
          expansion: null,
          keywordsMatched: [],
          reasoning: 'Cannot be meaningfully expanded',
        }
      })
    }

    // Filter to only suggestions where expansion was found
    const expandedSuggestions = suggestions.filter((s) => s.expansion !== null)

    console.log('[generateSkillExpansionSuggestions] ====== SUCCESS ======', {
      totalSuggestions: expandedSuggestions.length,
    })

    return {
      data: { scanId, suggestions: expandedSuggestions },
      error: null,
    }
  } catch (e) {
    console.error('[generateSkillExpansionSuggestions] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to generate skill expansion suggestions',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

/**
 * Transform skill expansion suggestions to database-compatible format
 *
 * Converts the API response structure to the format expected by saveSuggestions.
 * - Filters out null expansions
 * - Sets section to 'skills'
 * - Sets suggestion_type to 'skill_expansion'
 * - Includes keywords matched in reasoning
 *
 * @param suggestions - Array of suggestions from generateSkillExpansionSuggestions
 * @returns Array of suggestions in saveSuggestions format
 */
export function transformSkillExpansionSuggestions(
  suggestions: Array<{
    original: string
    expansion: string | null
    keywordsMatched: string[]
    reasoning: string
  }>
): Array<{
  section: string
  itemIndex: number
  originalText: string
  suggestedText: string
  suggestionType: string
  reasoning?: string
}> {
  return suggestions
    .filter((sugg) => sugg.expansion !== null)
    .map((sugg, index) => ({
      section: 'skills',
      itemIndex: index,
      originalText: sugg.original,
      suggestedText: sugg.expansion!,
      suggestionType: 'skill_expansion',
      reasoning: `${sugg.reasoning}\n\nKeywords matched: ${sugg.keywordsMatched.join(', ') || 'none'}`,
    }))
}

/**
 * Generate AI-powered format and content removal suggestions
 *
 * Process:
 * 1. Validate input parameters
 * 2. Perform local analysis for prohibited/sensitive fields
 * 3. Call OpenAI API for detailed format and content analysis
 * 4. Parse and validate JSON response
 * 5. Combine local and AI suggestions, deduplicating
 * 6. Return suggestions organized by urgency (high, medium, low)
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - OpenAI API failure: Continue with local suggestions only
 * - JSON parse failure: Return local suggestions only
 *
 * @param input - Scan ID, resume content, user context, and experience level
 * @returns ActionResponse with format and removal suggestions or error
 * @see Story 5.5: Format & Content Removal Suggestions
 */
export async function generateFormatAndRemovalSuggestions(
  input: z.infer<typeof generateFormatAndRemovalSchema>
): Promise<
  ActionResponse<{
    scanId: string
    suggestions: Array<{
      type: 'format' | 'removal'
      original: string
      suggested: string | null
      reasoning: string
      urgency: 'high' | 'medium' | 'low'
    }>
  }>
> {
  console.log('[generateFormatAndRemovalSuggestions] ====== ENTRY ======', {
    scanId: input.scanId,
    detectedFieldsCount: input.detectedFields?.length,
    experienceYears: input.experienceYears,
    isInternationalStudent: input.isInternationalStudent,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = generateFormatAndRemovalSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[generateFormatAndRemovalSuggestions] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const {
      scanId,
      resumeContent,
      detectedFields,
      experienceYears,
      targetRole,
      isInternationalStudent = false,
      resumePages = 1,
    } = parsed.data

    // First, do local analysis for obvious issues
    const localSuggestions: Array<{
      type: 'format' | 'removal'
      original: string
      suggested: string | null
      reasoning: string
      urgency: 'high' | 'medium' | 'low'
    }> = []

    console.log('[generateFormatAndRemovalSuggestions] Performing local analysis...')

    // Check for prohibited fields
    for (const field of detectedFields) {
      if (isProhibitedField(field)) {
        localSuggestions.push({
          type: 'removal',
          original: field,
          suggested: null,
          reasoning: `${field} is not expected on North American resumes and may cause bias`,
          urgency: 'high',
        })
      } else if (isSensitiveField(field)) {
        const urgency = isInternationalStudent ? 'high' : 'medium'
        localSuggestions.push({
          type: 'removal',
          original: field,
          suggested: null,
          reasoning: `Remove ${field} - may raise legal or bias concerns`,
          urgency,
        })
      }
    }

    // Check resume length
    const recommendation = getMaxPagesRecommendation(experienceYears)
    if (resumePages > recommendation.maxPages) {
      localSuggestions.push({
        type: 'format',
        original: `Resume is ${resumePages} pages`,
        suggested: `Condense to ${recommendation.maxPages} page(s)`,
        reasoning: recommendation.reasoning,
        urgency: 'medium',
      })
    }

    console.log('[generateFormatAndRemovalSuggestions] Local analysis complete:', {
      localSuggestionCount: localSuggestions.length,
    })

    // Use AI for detailed analysis
    const prompt = FORMAT_AND_REMOVAL_PROMPT(
      resumeContent.substring(0, 2000), // Limit content to first 2000 chars
      detectedFields,
      experienceYears,
      targetRole,
      isInternationalStudent
    )

    console.log('[generateFormatAndRemovalSuggestions] Calling OpenAI API...')

    const openai = getOpenAIClient()
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5, // Lower temp for more consistent removal suggestions
        max_tokens: 2000,
      })
    }, 'generateFormatAndRemovalSuggestions')

    console.log('[generateFormatAndRemovalSuggestions] OpenAI response received')

    // Parse OpenAI response
    let parsedResponse
    try {
      parsedResponse = parseOpenAIResponse(response)
    } catch (parseError) {
      console.error(
        '[generateFormatAndRemovalSuggestions] Failed to parse OpenAI response structure:',
        parseError
      )
      // Return local suggestions even if parsing fails
      return {
        data: { scanId, suggestions: localSuggestions },
        error: null,
      }
    }

    const content = parsedResponse.content

    // Parse JSON from content
    interface AiAnalysis {
      removal_suggestions?: Array<{
        type: string
        field: string
        reasoning: string
        urgency?: string
      }>
      format_suggestions?: Array<{
        issue: string
        current: string
        recommended: string
        reasoning: string
      }>
      length_assessment?: {
        current_pages: number
        recommended_pages: number
        suggestion: string
        sections_to_trim: string[]
      }
      content_relevance?: Array<{
        content: string
        years_ago: number
        recommendation: string
        reasoning: string
      }>
    }

    let aiAnalysis: AiAnalysis
    try {
      aiAnalysis = JSON.parse(content)
    } catch {
      console.error(
        '[generateFormatAndRemovalSuggestions] Failed to parse JSON from OpenAI response',
        content
      )
      // Return local suggestions even if AI parsing fails
      return {
        data: { scanId, suggestions: localSuggestions },
        error: null,
      }
    }

    // Combine local and AI suggestions
    const allSuggestions: Array<{
      type: 'format' | 'removal'
      original: string
      suggested: string | null
      reasoning: string
      urgency: 'high' | 'medium' | 'low'
    }> = [...localSuggestions]

    // Helper to validate urgency from AI response
    const validUrgencies = ['high', 'medium', 'low'] as const
    const validateUrgency = (urgency: string | undefined): 'high' | 'medium' | 'low' => {
      if (urgency && validUrgencies.includes(urgency as typeof validUrgencies[number])) {
        return urgency as 'high' | 'medium' | 'low'
      }
      return 'medium' // Default to medium if invalid or missing
    }

    // Add removal suggestions from AI
    if (aiAnalysis.removal_suggestions?.length) {
      for (const aiSugg of aiAnalysis.removal_suggestions) {
        // Avoid duplicates
        if (
          !localSuggestions.some(
            (s) => s.original.toLowerCase() === aiSugg.field.toLowerCase()
          )
        ) {
          allSuggestions.push({
            type: 'removal',
            original: aiSugg.field,
            suggested: null,
            reasoning: aiSugg.reasoning,
            urgency: validateUrgency(aiSugg.urgency),
          })
        }
      }
    }

    // Add format suggestions from AI
    if (aiAnalysis.format_suggestions?.length) {
      for (const formatSugg of aiAnalysis.format_suggestions) {
        allSuggestions.push({
          type: 'format',
          original: formatSugg.issue,
          suggested: formatSugg.recommended,
          reasoning: formatSugg.reasoning,
          urgency: 'low',
        })
      }
    }

    // Add content relevance suggestions
    if (aiAnalysis.content_relevance?.length) {
      for (const relevance of aiAnalysis.content_relevance) {
        if (relevance.recommendation === 'remove') {
          allSuggestions.push({
            type: 'removal',
            original: relevance.content,
            suggested: null,
            reasoning: `${relevance.reasoning} (${relevance.years_ago} years ago)`,
            urgency: 'low',
          })
        } else if (relevance.recommendation === 'condense') {
          allSuggestions.push({
            type: 'format',
            original: relevance.content,
            suggested: 'Consider condensing this section',
            reasoning: relevance.reasoning,
            urgency: 'low',
          })
        }
      }
    }

    console.log('[generateFormatAndRemovalSuggestions] ====== SUCCESS ======', {
      totalSuggestions: allSuggestions.length,
      highUrgency: allSuggestions.filter((s) => s.urgency === 'high').length,
      mediumUrgency: allSuggestions.filter((s) => s.urgency === 'medium').length,
      lowUrgency: allSuggestions.filter((s) => s.urgency === 'low').length,
    })

    return {
      data: { scanId, suggestions: allSuggestions },
      error: null,
    }
  } catch (e) {
    console.error('[generateFormatAndRemovalSuggestions] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to generate format and removal suggestions',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

/**
 * Transform format and removal suggestions to database-compatible format
 *
 * Converts the API response structure to the format expected by saveSuggestions.
 * - Format suggestions have `suggestion_type: 'format'`
 * - Removal suggestions have `suggestion_type: 'removal'`
 * - Both use `section: 'format'` as a meta-section for resume-wide suggestions
 *
 * @param suggestions - Array of suggestions from generateFormatAndRemovalSuggestions
 * @returns Array of suggestions in saveSuggestions format
 */
export function transformFormatAndRemovalSuggestions(
  suggestions: Array<{
    type: 'format' | 'removal'
    original: string
    suggested: string | null
    reasoning: string
    urgency: 'high' | 'medium' | 'low'
  }>
): Array<{
  section: string
  itemIndex: number
  originalText: string
  suggestedText: string
  suggestionType: string
  reasoning?: string
}> {
  return suggestions.map((sugg, index) => ({
    section: 'format',
    itemIndex: index,
    originalText: sugg.original,
    suggestedText: sugg.suggested || 'Remove',
    suggestionType: sugg.type,
    reasoning: `[${sugg.urgency.toUpperCase()}] ${sugg.reasoning}`,
  }))
}

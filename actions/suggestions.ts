'use server'

import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { withRetry } from '@/lib/openai/retry'
import { parseOpenAIResponse } from '@/lib/openai'
import { createBulletRewritePrompt, type UserProfile } from '@/lib/openai/prompts/suggestions'
import { createTransferableSkillsPrompt } from '@/lib/openai/prompts/skills'
import { z } from 'zod'

/**
 * Server Actions for AI-Generated Suggestions
 *
 * @see Story 5.1: Bullet Point Rewrite Generation
 * @see Story 5.2: Transferable Skills Detection & Mapping
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

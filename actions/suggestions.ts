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

// Import transform utilities for internal use
// Note: Tests should import directly from '@/lib/utils/suggestion-transforms'
import {
  transformActionVerbSuggestions,
  transformSkillExpansionSuggestions,
  transformFormatAndRemovalSuggestions,
} from '@/lib/utils/suggestion-transforms'

// Story 9.2: Inference-Based Suggestion Calibration
import { calibrateSuggestions, getFocusAreasByExperience, type CalibrationSignals, type ExperienceLevel } from '@/lib/utils/suggestionCalibrator'
import { calculateQuantificationDensity } from '@/lib/utils/quantificationAnalyzer'
import type { InferenceSignals } from '@/lib/types/suggestions'
import type { SuggestionMode } from '@/lib/utils/suggestionCalibrator'
import type { CalibrationContext } from '@/lib/openai/prompts/calibration-context'

// Story 10.1: Import helpers for suggestion context extraction
import {
  extractSkillsFromParsedSections,
  extractDetectedFields,
  mapExperienceLevelToYears,
} from '@/actions/analysis'

// Story 9.3: Natural Writing Enforcement
import { runNaturalWritingChecks } from '@/lib/utils/naturalWritingChecker'

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
  targetRole: z.string().optional(), // Story 9.4: target role for context prioritization
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
 * Extract calibration signals from scan and user data
 *
 * Story 9.2: Task 3 - Extract calibration context
 *
 * @param scanId - Scan ID to get analysis data from
 * @param resumeText - Optional resume text for quantification analysis (defaults to 50% if not provided)
 * @returns Calibration signals or null if data unavailable
 */
async function extractCalibrationSignals(
  scanId: string,
  resumeText?: string
): Promise<{
  signals: CalibrationSignals | null
  inferenceSignals: InferenceSignals | null
  suggestionMode: SuggestionMode | null
}> {
  try {
    const supabase = await createClient()

    // Get scan with analysis results
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('ats_score, keywords_missing, user_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.log('[extractCalibrationSignals] Scan not found, calibration unavailable')
      return { signals: null, inferenceSignals: null, suggestionMode: null }
    }

    // Get user profile for experience level
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('experience_level')
      .eq('user_id', scan.user_id)
      .single()

    if (profileError || !profile) {
      console.log('[extractCalibrationSignals] User profile not found, calibration unavailable')
      return { signals: null, inferenceSignals: null, suggestionMode: null }
    }

    // Extract signals
    const atsScore = scan.ats_score ?? 50 // Default to 50 if not available
    const missingKeywordsCount = Array.isArray(scan.keywords_missing)
      ? scan.keywords_missing.length
      : 0

    // Map experience level (handle different formats)
    let experienceLevel: ExperienceLevel
    const profileLevel = profile.experience_level?.toLowerCase()
    if (profileLevel === 'student' || profileLevel === 'entry') {
      experienceLevel = 'student'
    } else if (profileLevel === 'career_changer' || profileLevel === 'mid') {
      experienceLevel = 'career_changer'
    } else {
      experienceLevel = 'experienced'
    }

    // Calculate quantification density (default to 50% if no resume text provided)
    const quantificationDensity = resumeText
      ? calculateQuantificationDensity(resumeText)
      : 50

    // Count total bullets for context (default to 10 if no resume text)
    const totalBullets = resumeText
      ? resumeText.split(/\n|•|●|○/).filter(line => line.trim().length > 15).length
      : 10

    const calibrationSignals: CalibrationSignals = {
      atsScore,
      experienceLevel,
      missingKeywordsCount,
      quantificationDensity,
      totalBullets: Math.max(totalBullets, 1)
    }

    // Run calibration
    const calibration = calibrateSuggestions(calibrationSignals)

    // Create inference signals for metadata
    const inferenceSignals: InferenceSignals = {
      atsScore,
      experienceLevel,
      missingKeywordsCount,
      quantificationDensity
    }

    console.log('[extractCalibrationSignals] Calibration complete:', {
      mode: calibration.mode,
      targetCount: calibration.suggestionsTargetCount,
      reasoning: calibration.reasoning
    })

    return {
      signals: calibrationSignals,
      inferenceSignals,
      suggestionMode: calibration.mode
    }
  } catch (e) {
    console.error('[extractCalibrationSignals] Error extracting signals:', e)
    return { signals: null, inferenceSignals: null, suggestionMode: null }
  }
}

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
        max_tokens: 4000, // Increased to handle large resumes
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
    let content = parsedResponse.content

    // Strip markdown code fences if present
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

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
        max_tokens: 4000, // Increased to handle large resumes
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

    let content = parsedResponse.content

    // Strip markdown code fences if present
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

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

  const { scanId, bulletPoints, achievementTypes = [], targetRole } = parsed.data

  try {
    // Pad achievement types with 'general' if not enough provided
    const types = [
      ...achievementTypes,
      ...Array(bulletPoints.length - achievementTypes.length).fill('general'),
    ]

    // Story 9.2: Extract calibration signals for mode-aware suggestions
    const { signals, suggestionMode } = await extractCalibrationSignals(scanId)
    let calibrationContext: CalibrationContext | undefined
    if (signals && suggestionMode) {
      calibrationContext = {
        mode: suggestionMode,
        experienceLevel: signals.experienceLevel,
        focusAreas: getFocusAreasByExperience(signals.experienceLevel),
        urgencyBoosts: {
          keyword: signals.missingKeywordsCount >= 5 ? 2 : signals.missingKeywordsCount >= 2 ? 1 : 0,
          quantification: signals.quantificationDensity < 30 ? 2 : signals.quantificationDensity < 50 ? 1 : 0,
          experience: suggestionMode === 'Transformation' ? 1 : suggestionMode === 'Improvement' ? 0 : -1
        }
      }
      console.log('[generateActionVerbAndQuantificationSuggestions] Using calibration:', {
        mode: suggestionMode,
        experienceLevel: signals.experienceLevel
      })
    }

    console.log('[generateActionVerbAndQuantificationSuggestions] Building prompt...')

    // Create prompt using action verb and quantification template (with optional calibration)
    // Story 9.4: Pass targetRole for context-aware metric prioritization
    const prompt = createActionVerbAndQuantificationPrompt(bulletPoints, types, calibrationContext, targetRole)

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
        max_tokens: 4000, // Increased from 2000 to handle large resumes with many bullets
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

    let content = parsedResponse.content

    // Strip markdown code fences if present (AI sometimes wraps JSON in ```json...```)
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

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

    // Story 9.2: Extract calibration signals for mode-aware suggestions
    const { signals, suggestionMode } = await extractCalibrationSignals(scanId)
    let calibrationContext: CalibrationContext | undefined
    if (signals && suggestionMode) {
      calibrationContext = {
        mode: suggestionMode,
        experienceLevel: signals.experienceLevel,
        focusAreas: getFocusAreasByExperience(signals.experienceLevel),
        urgencyBoosts: {
          keyword: signals.missingKeywordsCount >= 5 ? 2 : signals.missingKeywordsCount >= 2 ? 1 : 0,
          quantification: signals.quantificationDensity < 30 ? 2 : signals.quantificationDensity < 50 ? 1 : 0,
          experience: suggestionMode === 'Transformation' ? 1 : suggestionMode === 'Improvement' ? 0 : -1
        }
      }
      console.log('[generateSkillExpansionSuggestions] Using calibration:', {
        mode: suggestionMode,
        experienceLevel: signals.experienceLevel
      })
    }

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

      // Pass calibration context to prompt for mode-aware suggestions
      const prompt = SKILL_EXPANSION_PROMPT(unknownSkills, jdContent, jdKeywords, calibrationContext)

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
          max_tokens: 4000, // Increased to handle large resumes
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

      let content = parsedResponse.content

      // Strip markdown code fences if present
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }

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
        max_tokens: 4000, // Increased to handle large resumes
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

    let content = parsedResponse.content

    // Strip markdown code fences if present
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

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
 * Generate natural writing suggestions from pre-AI checks
 *
 * Story 9.3: Task 3 - Integrate Natural Writing Checks
 *
 * Runs natural writing checks BEFORE AI generation to catch obvious issues:
 * - Banned AI-tell phrases (spearheaded, leveraged, synergized, utilize)
 * - Word count validation (optimal: 20-35 words)
 * - Verb diversity (flags verbs used 3+ times)
 *
 * @param bullets - Array of bullet points to check
 * @returns Array of suggestions in standard format
 */
export async function generateNaturalWritingSuggestions(bullets: string[]): Promise<Array<{
  type: string
  section: string
  originalText: string
  suggestedText: string | null
  reasoning: string
  urgency: string
}>> {
  const suggestions: Array<{
    type: string
    section: string
    originalText: string
    suggestedText: string | null
    reasoning: string
    urgency: string
  }> = []

  if (!bullets || bullets.length === 0) {
    return suggestions
  }

  // Run all natural writing checks
  const checkResults = runNaturalWritingChecks(bullets)

  // Process each bullet's check results
  for (const result of checkResults) {
    // 1. Banned phrase suggestions
    if (result.bannedPhrases.hasBannedPhrases) {
      for (const banned of result.bannedPhrases.bannedPhrases) {
        suggestions.push({
          type: 'action_verb',
          section: 'experience',
          originalText: result.bullet,
          suggestedText: banned.alternatives[0], // First alternative as primary suggestion
          reasoning: `Replace AI-flagged verb "${banned.phrase}" for natural tone. Alternatives: ${banned.alternatives.join(', ')}`,
          urgency: 'high',
        })
      }
    }

    // 2. Word count suggestions
    if (!result.wordCount.isValid && result.wordCount.message) {
      suggestions.push({
        type: 'format',
        section: 'experience',
        originalText: result.bullet,
        suggestedText: null,
        reasoning: result.wordCount.message,
        urgency: 'low',
      })
    }

    // 3. Verb diversity suggestions (only add once for repeated verbs)
    if (result.verbDiversity.hasIssues) {
      for (const repeatedVerb of result.verbDiversity.repeatedVerbs) {
        // Only create suggestion if this bullet starts with the repeated verb
        const firstWord = result.bullet.trim().split(/\s+/)[0]?.toLowerCase()
        if (firstWord === repeatedVerb.verb) {
          suggestions.push({
            type: 'action_verb',
            section: 'experience',
            originalText: result.bullet,
            suggestedText: repeatedVerb.alternatives[0], // First alternative
            reasoning: `Vary action verbs for stronger impact. "${repeatedVerb.verb}" used ${repeatedVerb.count} times. Try: ${repeatedVerb.alternatives.join(', ')}`,
            urgency: 'medium',
          })
        }
      }
    }
  }

  return suggestions
}

/**
 * Generate ALL suggestions with calibration metadata
 *
 * Story 9.2: Task 3 - Update Suggestion Generation Action
 * Story 9.3: Task 3 - Integrate Natural Writing Checks
 *
 * This is the main entry point for generating calibrated suggestions.
 * It orchestrates all suggestion types and adds calibration metadata.
 *
 * Process:
 * 1. Run natural writing checks FIRST (Story 9.3)
 * 2. Extract calibration signals from scan and user data (Story 9.2)
 * 3. Generate suggestions from all generators
 * 4. Add calibration metadata (suggestionMode, inferenceSignals) to each
 * 5. Return enriched suggestions
 *
 * @param input - Scan ID and resume context
 * @returns ActionResponse with calibrated suggestions
 */
export async function generateAllSuggestionsWithCalibration(input: {
  scanId: string
  resumeText: string
  bulletPoints: string[]
  skills: string[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'student' | 'experienced'
  targetRole: string
  isStudent: boolean
  jdKeywords: string[]
  jdContent: string
  detectedFields: string[]
  experienceYears: number
  isInternationalStudent?: boolean
  resumePages?: number
}): Promise<
  ActionResponse<{
    scanId: string
    suggestions: Array<{
      type: string
      section: string
      originalText: string
      suggestedText: string | null
      reasoning: string
      urgency: string
      suggestionMode: SuggestionMode | null
      inferenceSignals: InferenceSignals | null
    }>
    calibration: {
      mode: SuggestionMode | null
      targetCount: number
      focusAreas: string[]
      reasoning: string
    } | null
  }>
> {
  console.log('[generateAllSuggestionsWithCalibration] ====== ENTRY ======', {
    scanId: input.scanId,
    bulletCount: input.bulletPoints.length,
    timestamp: new Date().toISOString(),
  })

  try {
    // Extract calibration signals first (needed for enrichment)
    const { signals, inferenceSignals, suggestionMode } = await extractCalibrationSignals(
      input.scanId,
      input.resumeText
    )

    let calibrationResult = null
    if (signals) {
      calibrationResult = calibrateSuggestions(signals)
    }

    // Helper to enrich suggestions with calibration metadata (Task 3.7-3.10)
    const enrichSuggestion = <T extends object>(suggestion: T) => ({
      ...suggestion,
      suggestionMode: suggestionMode,
      inferenceSignals: inferenceSignals,
    })

    // Story 9.3: Run natural writing checks FIRST (before AI generation)
    console.log('[generateAllSuggestionsWithCalibration] Running natural writing checks...')
    const naturalWritingSuggestions = await generateNaturalWritingSuggestions(input.bulletPoints)
    console.log('[generateAllSuggestionsWithCalibration] Natural writing checks complete:', {
      suggestionCount: naturalWritingSuggestions.length,
    })

    // Generate all suggestions using individual generators
    const allSuggestions: Array<{
      type: string
      section: string
      originalText: string
      suggestedText: string | null
      reasoning: string
      urgency: string
      suggestionMode: SuggestionMode | null
      inferenceSignals: InferenceSignals | null
    }> = []

    // Add natural writing suggestions first (with calibration metadata)
    for (const nwSuggestion of naturalWritingSuggestions) {
      allSuggestions.push(enrichSuggestion(nwSuggestion))
    }

    console.log('[generateAllSuggestionsWithCalibration] Generating AI suggestions...')

    // 1. Generate action verb and quantification suggestions (if bulletPoints provided)
    if (input.bulletPoints.length > 0) {
      console.log('[generateAllSuggestionsWithCalibration] Generating action verb suggestions...')
      const actionVerbResult = await generateActionVerbAndQuantificationSuggestions({
        scanId: input.scanId,
        bulletPoints: input.bulletPoints,
      })

      if (actionVerbResult.data) {
        for (const s of actionVerbResult.data.suggestions) {
          // Story 10.1: Keep action verb and quantification as SEPARATE suggestions
          // - Action verb: shows verb change only
          // - Quantification: shows [X] placeholder for user to fill in their real number
          // These are distinct improvements and should not be combined

          if (s.actionVerbSuggestion) {
            allSuggestions.push(enrichSuggestion({
              type: 'action_verb',
              section: 'experience',
              originalText: s.original,
              suggestedText: s.actionVerbSuggestion.improved,
              reasoning: s.actionVerbSuggestion.reasoning,
              urgency: calibrationResult?.mode === 'Transformation' ? 'high' : 'medium',
            }))
          }
          if (s.quantificationSuggestion) {
            allSuggestions.push(enrichSuggestion({
              type: 'quantification',
              section: 'experience',
              originalText: s.original,
              suggestedText: s.quantificationSuggestion.example,
              reasoning: s.quantificationSuggestion.prompt,
              urgency: calibrationResult?.priorityBoosts?.quantification === 2 ? 'critical' :
                       calibrationResult?.priorityBoosts?.quantification === 1 ? 'high' : 'medium',
            }))
          }
        }
      }
    }

    // 2. Generate skill expansion suggestions (if skills provided)
    if (input.skills.length > 0) {
      console.log('[generateAllSuggestionsWithCalibration] Generating skill expansion suggestions...')
      const skillResult = await generateSkillExpansionSuggestions({
        scanId: input.scanId,
        skills: input.skills,
        jdKeywords: input.jdKeywords,
        jdContent: input.jdContent,
      })

      if (skillResult.data) {
        for (const s of skillResult.data.suggestions) {
          if (s.expansion) {
            allSuggestions.push(enrichSuggestion({
              type: 'skill_expansion',
              section: 'skills',
              originalText: s.original,
              suggestedText: s.expansion,
              reasoning: s.reasoning,
              urgency: s.keywordsMatched.length > 0 ? 'high' : 'medium',
            }))
          }
        }
      }
    }

    // 3. Generate format and removal suggestions (if detectedFields provided)
    if (input.detectedFields.length > 0) {
      console.log('[generateAllSuggestionsWithCalibration] Generating format suggestions...')
      const formatResult = await generateFormatAndRemovalSuggestions({
        scanId: input.scanId,
        resumeContent: input.resumeText,
        detectedFields: input.detectedFields,
        experienceYears: input.experienceYears,
        targetRole: input.targetRole,
        isInternationalStudent: input.isInternationalStudent,
        resumePages: input.resumePages,
      })

      if (formatResult.data) {
        for (const s of formatResult.data.suggestions) {
          allSuggestions.push(enrichSuggestion({
            type: s.type,
            section: 'format',
            originalText: s.original,
            suggestedText: s.suggested,
            reasoning: s.reasoning,
            urgency: s.urgency,
          }))
        }
      }
    }

    console.log('[generateAllSuggestionsWithCalibration] ====== SUCCESS ======', {
      suggestionCount: allSuggestions.length,
      mode: suggestionMode,
    })

    return {
      data: {
        scanId: input.scanId,
        suggestions: allSuggestions,
        calibration: calibrationResult ? {
          mode: calibrationResult.mode,
          targetCount: calibrationResult.suggestionsTargetCount,
          focusAreas: calibrationResult.focusAreas,
          reasoning: calibrationResult.reasoning
        } : null
      },
      error: null,
    }
  } catch (e) {
    console.error('[generateAllSuggestionsWithCalibration] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to generate calibrated suggestions',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

/**
 * Input validation schema for updateSuggestionStatus
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
const updateSuggestionStatusSchema = z.object({
  suggestionId: z.string().uuid(),
  scanId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'rejected']),
})

/**
 * Input validation schema for acceptAllInSection
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
const acceptAllInSectionSchema = z.object({
  scanId: z.string().uuid(),
  section: z.string(),
})

/**
 * Update a single suggestion's status
 *
 * Process:
 * 1. Validate input parameters
 * 2. Verify user has access to this scan via RLS
 * 3. Update suggestion status
 * 4. Return updated suggestion ID and status
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - Scan not found: Return NOT_FOUND
 * - Database error: Return UPDATE_ERROR
 *
 * @param input - Suggestion ID, scan ID, and new status
 * @returns ActionResponse with updated suggestion ID or error
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
export async function updateSuggestionStatus(
  input: z.infer<typeof updateSuggestionStatusSchema>
): Promise<ActionResponse<{ suggestionId: string; status: string }>> {
  console.log('[updateSuggestionStatus] ====== ENTRY ======', {
    suggestionId: input.suggestionId,
    scanId: input.scanId,
    status: input.status,
    timestamp: new Date().toISOString(),
  })

  const parsed = updateSuggestionStatusSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[updateSuggestionStatus] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const { suggestionId, scanId, status } = parsed.data
    const supabase = await createClient()

    // Verify user has access to this scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('user_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('[updateSuggestionStatus] Scan not found:', scanError)
      return {
        data: null,
        error: { message: 'Scan not found', code: 'NOT_FOUND' },
      }
    }

    // Update suggestion status
    const { error: updateError } = await supabase
      .from('suggestions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', suggestionId)
      .eq('scan_id', scanId)

    if (updateError) {
      console.error('[updateSuggestionStatus] Update error:', updateError)
      return {
        data: null,
        error: {
          message: 'Failed to update suggestion',
          code: 'UPDATE_ERROR',
        },
      }
    }

    console.log('[updateSuggestionStatus] ====== SUCCESS ======', {
      suggestionId,
      status,
    })

    return {
      data: { suggestionId, status },
      error: null,
    }
  } catch (e) {
    console.error('[updateSuggestionStatus] ====== ERROR ======', e)
    return {
      data: null,
      error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    }
  }
}

/**
 * Accept all suggestions in a section
 *
 * Process:
 * 1. Validate input parameters
 * 2. Verify user has access to this scan
 * 3. Update all pending suggestions in section to accepted
 * 4. Return count of updated suggestions
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - Scan not found: Return NOT_FOUND
 * - Database error: Return UPDATE_ERROR
 *
 * @param input - Scan ID and section name
 * @returns ActionResponse with updated count or error
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
export async function acceptAllInSection(
  input: z.infer<typeof acceptAllInSectionSchema>
): Promise<
  ActionResponse<{
    scanId: string
    section: string
    count: number
  }>
> {
  console.log('[acceptAllInSection] ====== ENTRY ======', {
    scanId: input.scanId,
    section: input.section,
    timestamp: new Date().toISOString(),
  })

  const parsed = acceptAllInSectionSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[acceptAllInSection] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const { scanId, section } = parsed.data
    const supabase = await createClient()

    // Verify user has access to this scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('user_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('[acceptAllInSection] Scan not found:', scanError)
      return {
        data: null,
        error: { message: 'Scan not found', code: 'NOT_FOUND' },
      }
    }

    // Update all pending suggestions in section to accepted
    const { data: updated, error: updateError } = await supabase
      .from('suggestions')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('scan_id', scanId)
      .eq('section', section)
      .eq('status', 'pending')
      .select('id')

    if (updateError) {
      console.error('[acceptAllInSection] Update error:', updateError)
      return {
        data: null,
        error: {
          message: 'Failed to accept suggestions',
          code: 'UPDATE_ERROR',
        },
      }
    }

    const count = updated?.length || 0

    console.log('[acceptAllInSection] ====== SUCCESS ======', {
      section,
      count,
    })

    return {
      data: { scanId, section, count },
      error: null,
    }
  } catch (e) {
    console.error('[acceptAllInSection] ====== ERROR ======', e)
    return {
      data: null,
      error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    }
  }
}

/**
 * Reject all suggestions in a section
 *
 * Process:
 * 1. Validate input parameters
 * 2. Verify user has access to this scan
 * 3. Update all pending suggestions in section to rejected
 * 4. Return count of updated suggestions
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - Scan not found: Return NOT_FOUND
 * - Database error: Return UPDATE_ERROR
 *
 * @param input - Scan ID and section name
 * @returns ActionResponse with updated count or error
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
export async function rejectAllInSection(
  input: z.infer<typeof acceptAllInSectionSchema>
): Promise<
  ActionResponse<{
    scanId: string
    section: string
    count: number
  }>
> {
  console.log('[rejectAllInSection] ====== ENTRY ======', {
    scanId: input.scanId,
    section: input.section,
    timestamp: new Date().toISOString(),
  })

  const parsed = acceptAllInSectionSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[rejectAllInSection] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const { scanId, section } = parsed.data
    const supabase = await createClient()

    // Verify user has access to this scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('user_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('[rejectAllInSection] Scan not found:', scanError)
      return {
        data: null,
        error: { message: 'Scan not found', code: 'NOT_FOUND' },
      }
    }

    // Update all pending suggestions in section to rejected
    const { data: updated, error: updateError } = await supabase
      .from('suggestions')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('scan_id', scanId)
      .eq('section', section)
      .eq('status', 'pending')
      .select('id')

    if (updateError) {
      console.error('[rejectAllInSection] Update error:', updateError)
      return {
        data: null,
        error: {
          message: 'Failed to reject suggestions',
          code: 'UPDATE_ERROR',
        },
      }
    }

    const count = updated?.length || 0

    console.log('[rejectAllInSection] ====== SUCCESS ======', {
      section,
      count,
    })

    return {
      data: { scanId, section, count },
      error: null,
    }
  } catch (e) {
    console.error('[rejectAllInSection] ====== ERROR ======', e)
    return {
      data: null,
      error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    }
  }
}

/**
 * Input validation schema for skipAllPending
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
const skipAllPendingSchema = z.object({
  scanId: z.string().uuid(),
})

/**
 * Skip (reject) all pending suggestions across ALL sections
 *
 * Process:
 * 1. Validate input parameters
 * 2. Verify user has access to this scan
 * 3. Update ALL pending suggestions to rejected status
 * 4. Return count of updated suggestions
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - Scan not found: Return NOT_FOUND
 * - Database error: Return UPDATE_ERROR
 *
 * @param input - Scan ID
 * @returns ActionResponse with updated count or error
 * @see Story 5.7: Accept/Reject Individual Suggestions (AC6 - Skip All)
 */
export async function skipAllPending(
  input: z.infer<typeof skipAllPendingSchema>
): Promise<ActionResponse<{ scanId: string; count: number }>> {
  console.log('[skipAllPending] ====== ENTRY ======', {
    scanId: input.scanId,
    timestamp: new Date().toISOString(),
  })

  const parsed = skipAllPendingSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[skipAllPending] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const { scanId } = parsed.data
    const supabase = await createClient()

    // Verify user has access to this scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('user_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('[skipAllPending] Scan not found:', scanError)
      return {
        data: null,
        error: { message: 'Scan not found', code: 'NOT_FOUND' },
      }
    }

    // Update ALL pending suggestions to rejected (no section filter)
    const { data: updated, error: updateError } = await supabase
      .from('suggestions')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('scan_id', scanId)
      .eq('status', 'pending')
      .select('id')

    if (updateError) {
      console.error('[skipAllPending] Update error:', updateError)
      return {
        data: null,
        error: {
          message: 'Failed to skip suggestions',
          code: 'UPDATE_ERROR',
        },
      }
    }

    const count = updated?.length || 0

    console.log('[skipAllPending] ====== SUCCESS ======', {
      count,
    })

    return {
      data: { scanId, count },
      error: null,
    }
  } catch (e) {
    console.error('[skipAllPending] ====== ERROR ======', e)
    return {
      data: null,
      error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    }
  }
}

/**
 * Input validation schema for getSuggestionSummary
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
const getSuggestionSummarySchema = z.object({
  scanId: z.string().uuid(),
})

/**
 * Get summary counts of suggestions by status for a scan
 *
 * Process:
 * 1. Validate scan ID
 * 2. Query suggestions table for given scan ID
 * 3. Count by status (pending, accepted, rejected)
 * 4. Return summary with totals
 *
 * Error handling:
 * - Invalid input: Return VALIDATION_ERROR
 * - Database error: Return QUERY_ERROR
 *
 * @param scanId - The scan ID to get summary for
 * @returns ActionResponse with summary counts or error
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */
export async function getSuggestionSummary(
  scanId: string
): Promise<
  ActionResponse<{
    total: number
    accepted: number
    rejected: number
    pending: number
  }>
> {
  console.log('[getSuggestionSummary] ====== ENTRY ======', {
    scanId,
    timestamp: new Date().toISOString(),
  })

  const parsed = getSuggestionSummarySchema.safeParse({ scanId })
  if (!parsed.success) {
    console.error('[getSuggestionSummary] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('suggestions')
      .select('status')
      .eq('scan_id', scanId)

    if (error) {
      console.error('[getSuggestionSummary] Query error:', error)
      return {
        data: null,
        error: { message: 'Failed to fetch summary', code: 'QUERY_ERROR' },
      }
    }

    const summary = {
      total: data?.length || 0,
      accepted: data?.filter((s) => s.status === 'accepted').length || 0,
      rejected: data?.filter((s) => s.status === 'rejected').length || 0,
      pending: data?.filter((s) => s.status === 'pending').length || 0,
    }

    console.log('[getSuggestionSummary] ====== SUCCESS ======', summary)

    return {
      data: summary,
      error: null,
    }
  } catch (e) {
    console.error('[getSuggestionSummary] ====== ERROR ======', e)
    return {
      data: null,
      error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    }
  }
}

/**
 * Retry suggestion generation for a scan
 * Story 10.1: Task 4 - Add retry mechanism
 *
 * This function regenerates suggestions by calling the same flow
 * that happens during analysis. It requires loading the scan context
 * and calling generateAllSuggestionsWithCalibration.
 */
const retrySuggestionGenerationSchema = z.object({
  scanId: z.string().uuid(),
})

export async function retrySuggestionGeneration(
  input: z.infer<typeof retrySuggestionGenerationSchema>
): Promise<ActionResponse<{ suggestionsCount: number }>> {
  console.log('[retrySuggestionGeneration] ====== ENTRY ======', {
    scanId: input.scanId,
    timestamp: new Date().toISOString(),
  })

  // Validate input
  const parsed = retrySuggestionGenerationSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[retrySuggestionGeneration] Validation failed:', parsed.error)
    return {
      data: null,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    }
  }

  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      }
    }

    // Load scan with resume and user info
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select(`
        id,
        user_id,
        job_description,
        resume_id,
        resumes (
          extracted_text,
          parsed_sections
        )
      `)
      .eq('id', parsed.data.scanId)
      .eq('user_id', user.id)
      .single()

    if (scanError || !scan) {
      console.error('[retrySuggestionGeneration] Scan not found', scanError)
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // Get user profile (using correct table name: user_profiles)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('experience_level, target_role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[retrySuggestionGeneration] Profile not found', profileError)
      return {
        data: null,
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
        },
      }
    }

    // Get scan analysis data for keywords
    const { data: scanData, error: scanDataError } = await supabase
      .from('scans')
      .select('keywords_found, keywords_missing')
      .eq('id', parsed.data.scanId)
      .single()

    if (scanDataError || !scanData) {
      console.error('[retrySuggestionGeneration] Scan data not found', scanDataError)
      return {
        data: null,
        error: {
          message: 'Analysis data not found',
          code: 'DATA_NOT_FOUND',
        },
      }
    }

    // Story 10.1: Use imported helper functions from analysis.ts (no more duplication)
    // Extract bullets from resume text (local helper - not exported from analysis)
    function extractBulletsFromText(text: string): string[] {
      const lines = text.split('\n')
      const bullets: string[] = []
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.match(/^[•\-\*●]/) || trimmed.match(/^\d+\./)) {
          bullets.push(trimmed.replace(/^[•\-\*●]\s*/, '').replace(/^\d+\.\s*/, ''))
        }
      }
      return bullets
    }

    // Build context using imported helpers (async since they're exported from 'use server' file)
    const resume = Array.isArray(scan.resumes) ? scan.resumes[0] : scan.resumes
    const bullets = extractBulletsFromText(resume?.extracted_text || '')
    const skills = await extractSkillsFromParsedSections(resume?.parsed_sections)
    const detectedFields = await extractDetectedFields(resume?.parsed_sections)
    const experienceYears = await mapExperienceLevelToYears(profile.experience_level)

    const mappedExperienceLevel = profile.experience_level === 'career_changer' ? 'mid' :
                                   profile.experience_level === 'experienced' ? 'senior' :
                                   profile.experience_level as 'entry' | 'mid' | 'senior' | 'student'

    const keywordsFound = (scanData.keywords_found as any[]) || []
    const keywordsMissing = (scanData.keywords_missing as any[]) || []

    const suggestionContext = {
      scanId: parsed.data.scanId,
      resumeText: resume?.extracted_text || '',
      bulletPoints: bullets,
      skills,
      experienceLevel: mappedExperienceLevel,
      targetRole: profile.target_role || 'Software Engineer',
      isStudent: profile.experience_level === 'student',
      jdKeywords: [...keywordsFound, ...keywordsMissing],
      jdContent: scan.job_description,
      detectedFields,
      experienceYears,
      isInternationalStudent: false,
      resumePages: 1,
    }

    // Generate suggestions
    const suggestionsResult = await generateAllSuggestionsWithCalibration(suggestionContext)

    if (suggestionsResult.error) {
      console.error('[retrySuggestionGeneration] Generation failed', suggestionsResult.error)
      return {
        data: null,
        error: suggestionsResult.error,
      }
    }

    // Delete existing suggestions for this scan
    const { error: deleteError } = await supabase
      .from('suggestions')
      .delete()
      .eq('scan_id', parsed.data.scanId)

    if (deleteError) {
      console.warn('[retrySuggestionGeneration] Failed to delete old suggestions', deleteError)
      // Continue anyway
    }

    // Save new suggestions
    if (suggestionsResult.data) {
      const transformedSuggestions = suggestionsResult.data.suggestions.map((s, index) => ({
        section: s.section as 'experience' | 'education' | 'projects' | 'skills' | 'format',
        itemIndex: index,
        originalText: s.originalText,
        suggestedText: s.suggestedText || '',
        suggestionType: s.type as 'bullet_rewrite' | 'skill_mapping' | 'action_verb' | 'quantification' | 'skill_expansion' | 'format' | 'removal',
        reasoning: s.reasoning,
      }))

      const saveResult = await saveSuggestions({
        scanId: parsed.data.scanId,
        suggestions: transformedSuggestions,
      })

      if (saveResult.error) {
        console.error('[retrySuggestionGeneration] Failed to save suggestions', saveResult.error)
        return {
          data: null,
          error: saveResult.error,
        }
      }

      console.log('[retrySuggestionGeneration] ====== SUCCESS ======', {
        suggestionsCount: saveResult.data?.savedCount || 0,
      })

      return {
        data: {
          suggestionsCount: saveResult.data?.savedCount || 0,
        },
        error: null,
      }
    }

    return {
      data: { suggestionsCount: 0 },
      error: null,
    }
  } catch (e) {
    console.error('[retrySuggestionGeneration] ====== ERROR ======', e)
    return {
      data: null,
      error: {
        message: 'Failed to regenerate suggestions',
        code: 'GENERATION_ERROR',
      },
    }
  }
}

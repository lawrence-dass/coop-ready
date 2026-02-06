/**
 * Generate All Suggestions Server Action
 * Story 6.9: Wire Analysis-to-Suggestion Pipeline
 *
 * Orchestrates parallel generation of all 4 suggestion sections (summary, skills, experience, education).
 * Uses Promise.allSettled() so individual section failures don't block others.
 *
 * **ActionResponse Pattern:**
 * - Never throws errors
 * - Always returns { data: T; error: null } | { data: null; error: ErrorObject }
 */

'use server';

import type { ActionResponse, OptimizationPreferences } from '@/types';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  EducationSuggestion,
  ProjectsSuggestion,
} from '@/types/suggestions';
import type { SuggestionContext, JudgeResult, JudgeCriteriaScores } from '@/types/judge';
import type { KeywordAnalysisResult } from '@/types/analysis';
import type { ATSScoreV21 } from '@/lib/scoring/types';
import { generateSummarySuggestion } from '@/lib/ai/generateSummarySuggestion';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import { generateEducationSuggestion } from '@/lib/ai/generateEducationSuggestion';
import { generateProjectsSuggestion } from '@/lib/ai/generateProjectsSuggestion';
import { judgeSuggestion } from '@/lib/ai/judgeSuggestion';
import { getLLMTier } from '@/lib/ai/models';
import { truncateAtSentence } from '@/lib/utils/truncateAtSentence';
import { collectQualityMetrics } from '@/lib/metrics/qualityMetrics';
import { logQualityMetrics } from '@/lib/metrics/metricsLogger';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/supabase/user-context';
import {
  buildSectionATSContext,
  type SectionATSContext,
} from '@/lib/ai/buildSectionATSContext';

// ============================================================================
// TYPES
// ============================================================================

interface GenerateAllRequest {
  /** Session ID for persistence */
  sessionId: string;
  /** Resume summary section content */
  resumeSummary: string;
  /** Resume skills section content */
  resumeSkills: string;
  /** Resume experience section content */
  resumeExperience: string;
  /** Resume education section content (for co-op/internship context) */
  resumeEducation?: string;
  /** Resume projects section content (Story 18.5) */
  resumeProjects?: string;
  /** Full resume raw text for context */
  resumeContent: string;
  /** Job description text */
  jobDescription: string;
  /** Pre-extracted keywords for summary context */
  keywords?: string[];
  /** User optimization preferences (Story 11.2) */
  preferences?: OptimizationPreferences | null;
}

export interface GenerateAllResult {
  summary: SummarySuggestion | null;
  skills: SkillsSuggestion | null;
  experience: ExperienceSuggestion | null;
  education: EducationSuggestion | null;
  projects: ProjectsSuggestion | null;
  /** Errors for individual sections that failed */
  sectionErrors: {
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
    projects?: string;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateRequest(
  request: Partial<GenerateAllRequest>
): ActionResponse<GenerateAllRequest> {
  if (!request.sessionId || request.sessionId.trim().length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
    };
  }

  if (!request.jobDescription || request.jobDescription.trim().length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Job description is required' },
    };
  }

  if (!request.resumeContent || request.resumeContent.trim().length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Resume content is required' },
    };
  }

  return {
    data: request as GenerateAllRequest,
    error: null,
  };
}

// ============================================================================
// JUDGE HELPER
// ============================================================================

/**
 * Judge a section suggestion and return the result
 * Gracefully handles failures (returns null instead of throwing)
 */
async function judgeSectionSuggestion(
  sectionType: 'summary' | 'skills' | 'experience' | 'education' | 'projects', // Story 18.5: Added projects
  suggestedText: string,
  originalText: string,
  jdContent: string,
  sessionId: string,
  jobType?: 'coop' | 'fulltime',
  modificationLevel?: 'conservative' | 'moderate' | 'aggressive'
): Promise<JudgeResult | null> {
  try {
    const context: SuggestionContext = {
      original_text: truncateAtSentence(originalText, 500),
      suggested_text: suggestedText,
      jd_excerpt: truncateAtSentence(jdContent, 500),
      section_type: sectionType,
      job_type: jobType,
      modification_level: modificationLevel,
    };

    const result = await judgeSuggestion(
      suggestedText,
      context,
      `${sectionType}-${sessionId.substring(0, 8)}`
    );

    return result.data ?? null;
  } catch (error) {
    console.warn(`[SS:generateAll] Judge failed for ${sectionType}:`, error);
    return null;
  }
}

// ============================================================================
// ATS CONTEXT HELPER
// ============================================================================

/**
 * Check if ATS score is V21 format
 */
function isATSScoreV21(score: unknown): score is ATSScoreV21 {
  return (
    score !== null &&
    typeof score === 'object' &&
    'metadata' in score &&
    (score as { metadata?: { version?: string } }).metadata?.version === 'v2.1'
  );
}

/**
 * Fetch ATS context from session and build section-specific contexts
 * Returns null if ATS data is not available (graceful degradation)
 */
async function fetchATSContextsForSession(
  sessionId: string,
  resumeText: string
): Promise<{
  summary: SectionATSContext | undefined;
  skills: SectionATSContext | undefined;
  experience: SectionATSContext | undefined;
  education: SectionATSContext | undefined;
  projects: SectionATSContext | undefined; // Story 18.5: Added, but undefined until 18.9 wires gapAddressability
}> {
  const emptyResult = {
    summary: undefined,
    skills: undefined,
    experience: undefined,
    education: undefined,
    projects: undefined, // Story 18.5: Not yet wired to gapAddressability
  };

  try {
    const supabase = await createClient();

    // Fetch session with ATS data
    const { data: session, error } = await supabase
      .from('sessions')
      .select('ats_score, keyword_analysis')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !session) {
      console.log('[SS:generateAll] Could not fetch session for ATS context:', error?.message || 'not found');
      return emptyResult;
    }

    const atsScore = session.ats_score;
    const keywordAnalysis = session.keyword_analysis as KeywordAnalysisResult | null;

    if (!atsScore || !keywordAnalysis) {
      console.log('[SS:generateAll] No ATS score or keyword analysis in session');
      return emptyResult;
    }

    if (!isATSScoreV21(atsScore)) {
      console.log('[SS:generateAll] ATS score is not V21 format, skipping context');
      return emptyResult;
    }

    console.log('[SS:generateAll] Building ATS context for all sections');

    // Build context for each section
    const contextInput = {
      atsScore,
      keywordAnalysis,
      resumeText,
    };

    return {
      summary: buildSectionATSContext('summary', contextInput),
      skills: buildSectionATSContext('skills', contextInput),
      experience: buildSectionATSContext('experience', contextInput),
      education: buildSectionATSContext('education', contextInput),
      projects: undefined, // Story 18.5: gapAddressability.SectionType doesn't include 'projects' yet (Story 18.9)
    };
  } catch (error) {
    console.error('[SS:generateAll] Error fetching ATS context:', error);
    return emptyResult;
  }
}

// ============================================================================
// MAIN ACTION
// ============================================================================

/**
 * Generate suggestions for all 3 sections in parallel
 *
 * Uses Promise.allSettled() so partial success is possible —
 * if skills fails, summary and experience still return.
 *
 * @param request - Generation request with resume data and JD
 * @returns ActionResponse with per-section results (partial success allowed)
 */
export async function generateAllSuggestions(
  request: Partial<GenerateAllRequest>
): Promise<ActionResponse<GenerateAllResult>> {
  try {
    const validation = validateRequest(request);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    const {
      sessionId,
      resumeSummary,
      resumeSkills,
      resumeExperience,
      resumeEducation,
      resumeProjects, // Story 18.5
      resumeContent,
      jobDescription,
      keywords,
      preferences,
    } = validation.data;

    // Fallback to full resume text if individual sections weren't parsed
    // This handles cases where the resume format wasn't recognized during parsing
    const effectiveSummary = (resumeSummary && resumeSummary.trim().length > 0) ? resumeSummary : resumeContent;
    const effectiveSkills = (resumeSkills && resumeSkills.trim().length > 0) ? resumeSkills : resumeContent;
    const effectiveExperience = (resumeExperience && resumeExperience.trim().length > 0) ? resumeExperience : resumeContent;

    // Education: Try to extract from resumeContent if not explicitly provided
    // This is critical for co-op/internship candidates where education is primary credential
    let effectiveEducation: string | null = null;
    if (resumeEducation && resumeEducation.trim().length > 0) {
      effectiveEducation = resumeEducation;
      console.log('[SS:generateAll] Education section provided:', resumeEducation.length, 'chars, preview:', resumeEducation.substring(0, 100));
    } else {
      // Try to extract education from full resume content
      const educationMatch = resumeContent.match(/(?:EDUCATION|Education|ACADEMIC|Academic)[\s\S]*?(?=(?:EXPERIENCE|Experience|SKILLS|Skills|PROJECTS|Projects|CERTIFICATIONS|$))/i);
      if (educationMatch) {
        effectiveEducation = educationMatch[0].trim();
        console.log('[SS:generateAll] Education extracted from resume:', effectiveEducation.length, 'chars, preview:', effectiveEducation.substring(0, 100));
      } else {
        console.log('[SS:generateAll] No education section found in resume. resumeEducation was:', resumeEducation ? `"${resumeEducation.substring(0, 50)}..."` : 'null/undefined');
      }
    }

    // Projects: Try to extract from resumeContent if not explicitly provided (Story 18.5)
    // Critical for co-op candidates where projects are primary experience
    let effectiveProjects: string | null = null;
    if (resumeProjects && resumeProjects.trim().length > 0) {
      effectiveProjects = resumeProjects;
      console.log('[SS:generateAll] Projects section provided:', resumeProjects.length, 'chars, preview:', resumeProjects.substring(0, 100));
    } else {
      // Try to extract projects from full resume content
      const projectsMatch = resumeContent.match(/(?:PROJECTS|PROJECT EXPERIENCE|Project Experience)[\s\S]*?(?=(?:EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|REFERENCES|ACTIVITIES|VOLUNTEER|AWARDS|PUBLICATIONS|INTERESTS|$))/i);
      if (projectsMatch) {
        effectiveProjects = projectsMatch[0].trim();
        console.log('[SS:generateAll] Projects extracted from resume:', effectiveProjects.length, 'chars, preview:', effectiveProjects.substring(0, 100));
      } else {
        console.log('[SS:generateAll] No projects section found in resume. resumeProjects was:', resumeProjects ? `"${resumeProjects.substring(0, 50)}..."` : 'null/undefined');
      }
    }

    const usedFallback = effectiveSummary === resumeContent || effectiveSkills === resumeContent || effectiveExperience === resumeContent;

    // Fetch user context for LLM personalization (gracefully handles missing data)
    const userContextResult = await getUserContext();
    const userContext = userContextResult.data ?? {};

    // Fetch ATS context from session for gap-aware suggestions
    // This ensures suggestions address REQUIRED keywords before PREFERRED
    const atsContexts = await fetchATSContextsForSession(sessionId, resumeContent);
    const hasATSContext = !!(atsContexts.summary || atsContexts.skills || atsContexts.experience || atsContexts.education);

    console.log(
      '[SS:generateAll] Starting suggestion generation for session:',
      sessionId.slice(0, 8) + '...',
      `[LLM_TIER=${getLLMTier()}]`,
      preferences ? `with preferences (tone: ${preferences.tone})` : 'with default preferences',
      userContext.careerGoal ? `goal=${userContext.careerGoal}` : 'no goal',
      userContext.targetIndustries?.length ? `industries=${userContext.targetIndustries.join(',')}` : 'no industries',
      usedFallback ? '(using full resume as fallback for missing sections)' : '',
      hasATSContext ? '[ATS context: LOADED]' : '[ATS context: not available]'
    );

    if (hasATSContext && atsContexts.skills) {
      console.log('[SS:generateAll] ATS context for skills:', {
        terminologyFixes: atsContexts.skills.terminologyFixes.length,
        potentialAdditions: atsContexts.skills.potentialAdditions.length,
        opportunities: atsContexts.skills.opportunities.length,
      });
    }

    // Fire all 5 generation calls in parallel (Story 11.2: pass preferences, userContext; Story 18.5: added projects)
    // Pass resumeEducation for co-op/internship context awareness
    // Pass atsContext for gap-aware suggestions (REQUIRED keywords prioritized over PREFERRED)
    // Education and projects are only generated if their sections exist in resume
    const [summaryResult, skillsResult, experienceResult, educationResult, projectsResult] =
      await Promise.allSettled([
        generateSummarySuggestion(effectiveSummary, jobDescription, keywords, preferences, userContext, resumeEducation, atsContexts.summary),
        generateSkillsSuggestion(effectiveSkills, jobDescription, resumeContent, preferences, userContext, resumeEducation, atsContexts.skills),
        generateExperienceSuggestion(effectiveExperience, jobDescription, resumeContent, preferences, userContext, resumeEducation, atsContexts.experience),
        // Only generate education suggestions if education section exists
        effectiveEducation
          ? generateEducationSuggestion(effectiveEducation, jobDescription, resumeContent, preferences, userContext, atsContexts.education)
          : Promise.resolve({ data: null, error: null }),
        // Story 18.5: Only generate projects suggestions if projects section exists
        effectiveProjects
          ? generateProjectsSuggestion(effectiveProjects, jobDescription, resumeContent, preferences, userContext, resumeEducation, atsContexts.projects)
          : Promise.resolve({ data: null, error: null }),
      ]);

    // Extract results from settled promises
    const result: GenerateAllResult = {
      summary: null,
      skills: null,
      experience: null,
      education: null,
      projects: null,
      sectionErrors: {},
    };

    // Process summary
    if (summaryResult.status === 'fulfilled') {
      if (summaryResult.value.data) {
        result.summary = summaryResult.value.data;
      } else if (summaryResult.value.error) {
        result.sectionErrors.summary = summaryResult.value.error.message;
      }
    } else {
      result.sectionErrors.summary = summaryResult.reason?.message || 'Summary generation failed';
    }

    // Process skills
    if (skillsResult.status === 'fulfilled') {
      if (skillsResult.value.data) {
        result.skills = skillsResult.value.data;
      } else if (skillsResult.value.error) {
        result.sectionErrors.skills = skillsResult.value.error.message;
      }
    } else {
      result.sectionErrors.skills = skillsResult.reason?.message || 'Skills generation failed';
    }

    // Process experience
    if (experienceResult.status === 'fulfilled') {
      if (experienceResult.value.data) {
        result.experience = experienceResult.value.data;
      } else if (experienceResult.value.error) {
        result.sectionErrors.experience = experienceResult.value.error.message;
      }
    } else {
      result.sectionErrors.experience = experienceResult.reason?.message || 'Experience generation failed';
    }

    // Process education (only if education section was present)
    if (effectiveEducation && educationResult.status === 'fulfilled') {
      if (educationResult.value.data) {
        result.education = educationResult.value.data;
      } else if (educationResult.value.error) {
        result.sectionErrors.education = educationResult.value.error.message;
      }
    } else if (effectiveEducation && educationResult.status === 'rejected') {
      result.sectionErrors.education = educationResult.reason?.message || 'Education generation failed';
    }

    // Process projects (Story 18.5: only if projects section was present)
    if (effectiveProjects && projectsResult.status === 'fulfilled') {
      if (projectsResult.value.data) {
        result.projects = projectsResult.value.data;
      } else if (projectsResult.value.error) {
        result.sectionErrors.projects = projectsResult.value.error.message;
      }
    } else if (effectiveProjects && projectsResult.status === 'rejected') {
      result.sectionErrors.projects = projectsResult.reason?.message || 'Projects generation failed';
    }

    // =========================================================================
    // JUDGE PHASE
    // Judge all individual suggestions in parallel
    // =========================================================================
    console.log('[SS:generateAll] Starting judge phase...');

    // Extract preferences for judge context
    const jobType = preferences?.jobType;
    const modificationLevel = preferences?.modificationLevel;

    interface JudgeTask {
      section: 'summary' | 'skills' | 'experience' | 'education' | 'projects'; // Story 18.5: Added projects
      target: unknown; // The object to augment with judge data
      suggestedText: string;
      originalText: string;
    }

    const judgeTasks: JudgeTask[] = [];

    // Summary (single suggestion)
    if (result.summary) {
      judgeTasks.push({
        section: 'summary',
        target: result.summary,
        suggestedText: result.summary.suggested,
        originalText: effectiveSummary,
      });
    }

    // Skills (each missing_but_relevant skill)
    if (result.skills?.missing_but_relevant) {
      for (const skillItem of result.skills.missing_but_relevant) {
        judgeTasks.push({
          section: 'skills',
          target: skillItem,
          suggestedText: `Add skill: ${skillItem.skill}. ${skillItem.reason || ''}`,
          originalText: effectiveSkills,
        });
      }
    }

    // Experience (each suggested bullet)
    if (result.experience?.experience_entries) {
      for (const entry of result.experience.experience_entries) {
        for (const bullet of entry.suggested_bullets) {
          judgeTasks.push({
            section: 'experience',
            target: bullet,
            suggestedText: bullet.suggested,
            originalText: bullet.original,
          });
        }
      }
    }

    // Education (each suggested bullet)
    if (result.education?.education_entries) {
      for (const entry of result.education.education_entries) {
        for (const bullet of entry.suggested_bullets) {
          judgeTasks.push({
            section: 'education',
            target: bullet,
            suggestedText: bullet.suggested,
            originalText: bullet.original || '',
          });
        }
      }
    }

    // Projects (Story 18.5: each suggested bullet)
    if (result.projects?.project_entries) {
      for (const entry of result.projects.project_entries) {
        for (const bullet of entry.suggested_bullets) {
          judgeTasks.push({
            section: 'projects',
            target: bullet,
            suggestedText: bullet.suggested,
            originalText: bullet.original,
          });
        }
      }
    }

    // Execute all judge calls in parallel
    const judgeResults = await Promise.allSettled(
      judgeTasks.map(async (task, index) => {
        const judgeResult = await judgeSectionSuggestion(
          task.section,
          task.suggestedText,
          task.originalText,
          jobDescription,
          sessionId,
          jobType,
          modificationLevel
        );
        return { index, judgeResult };
      })
    );

    // Augment suggestions with judge data
    const allJudgeResults: JudgeResult[] = [];

    for (const settled of judgeResults) {
      if (settled.status === 'fulfilled' && settled.value.judgeResult) {
        const { index, judgeResult } = settled.value;
        const task = judgeTasks[index];
        allJudgeResults.push(judgeResult);

        // Augment the target object with judge data
        const target = task.target as {
          judge_score?: number;
          judge_passed?: boolean;
          judge_reasoning?: string;
          judge_criteria?: JudgeCriteriaScores;
        };
        target.judge_score = judgeResult.quality_score;
        target.judge_passed = judgeResult.passed;
        target.judge_reasoning = judgeResult.reasoning;
        target.judge_criteria = judgeResult.criteria_breakdown;
      }
    }

    // Log quality metrics (graceful degradation)
    if (allJudgeResults.length > 0) {
      try {
        const passCount = allJudgeResults.filter(r => r.passed).length;
        console.log(`[SS:generateAll] Judge results: ${passCount}/${allJudgeResults.length} passed`);

        const metrics = collectQualityMetrics(allJudgeResults, 'all', sessionId);
        await logQualityMetrics(metrics);
      } catch (metricsError) {
        console.error('[SS:generateAll] Metrics collection failed:', metricsError);
      }
    }

    // =========================================================================
    // COMPUTE JUDGE STATISTICS
    // Aggregate stats for easier querying (following ats_score pattern)
    // =========================================================================
    interface SectionStats {
      count: number;
      passed: number;
      avg_score: number;
    }

    function computeSectionStats(section: 'summary' | 'skills' | 'experience' | 'education' | 'projects'): SectionStats {
      const sectionResults = judgeResults
        .filter((r, i) => r.status === 'fulfilled' && r.value?.judgeResult && judgeTasks[i].section === section)
        .map(r => (r as PromiseFulfilledResult<{ index: number; judgeResult: JudgeResult | null }>).value.judgeResult!)
        .filter((r): r is JudgeResult => r !== null);

      if (sectionResults.length === 0) {
        return { count: 0, passed: 0, avg_score: 0 };
      }

      return {
        count: sectionResults.length,
        passed: sectionResults.filter(r => r.passed).length,
        avg_score: Math.round(sectionResults.reduce((sum, r) => sum + r.quality_score, 0) / sectionResults.length),
      };
    }

    const judgeStats = allJudgeResults.length > 0 ? {
      total_count: allJudgeResults.length,
      passed_count: allJudgeResults.filter(r => r.passed).length,
      pass_rate: Math.round((allJudgeResults.filter(r => r.passed).length / allJudgeResults.length) * 100) / 100,
      average_score: Math.round(allJudgeResults.reduce((sum, r) => sum + r.quality_score, 0) / allJudgeResults.length),
      has_failures: allJudgeResults.some(r => !r.passed),
      failed_sections: [...new Set(
        judgeTasks
          .filter((_, i) => {
            const r = judgeResults[i];
            return r.status === 'fulfilled' &&
              (r as PromiseFulfilledResult<{ index: number; judgeResult: JudgeResult | null }>).value?.judgeResult &&
              !(r as PromiseFulfilledResult<{ index: number; judgeResult: JudgeResult | null }>).value.judgeResult!.passed;
          })
          .map(t => t.section)
      )],
      by_section: {
        summary: computeSectionStats('summary'),
        skills: computeSectionStats('skills'),
        experience: computeSectionStats('experience'),
        education: computeSectionStats('education'),
        projects: computeSectionStats('projects'), // Story 18.5
      },
    } : null;

    // Save successful suggestions to session using server client (for proper auth context)
    const dbUpdate: Record<string, unknown> = {};
    if (result.summary) dbUpdate.summary_suggestion = result.summary;
    if (result.skills) dbUpdate.skills_suggestion = result.skills;
    if (result.experience) dbUpdate.experience_suggestion = result.experience;
    if (result.education) dbUpdate.education_suggestion = result.education;
    // Story 18.5: projects_suggestion column added in Story 18.7 migration - graceful fail until then
    if (result.projects) dbUpdate.projects_suggestion = result.projects;
    if (judgeStats) dbUpdate.judge_stats = judgeStats;

    if (Object.keys(dbUpdate).length > 0) {
      try {
        const supabase = await createClient();
        let { error: saveError } = await supabase
          .from('sessions')
          .update(dbUpdate)
          .eq('id', sessionId);

        // If judge_stats column doesn't exist yet (migration not applied), retry without it
        if (saveError?.message?.includes('judge_stats') && dbUpdate.judge_stats) {
          console.warn('[SS:generateAll] judge_stats column not found, saving without it (run migration to enable)');
          const dbUpdateWithoutStats = { ...dbUpdate };
          delete dbUpdateWithoutStats.judge_stats;

          const retryResult = await supabase
            .from('sessions')
            .update(dbUpdateWithoutStats)
            .eq('id', sessionId);
          saveError = retryResult.error;
        }

        if (saveError) {
          console.error('[SS:generateAll] Session save failed:', saveError.message);
          // Continue — user still gets suggestions in the UI
        } else {
          console.log('[SS:generateAll] Suggestions saved to session');
        }
      } catch (err) {
        console.error('[SS:generateAll] Session save error:', err);
      }
    }

    // Check if ALL sections failed (education and projects are optional, so not required for success)
    const hasAnyResult = result.summary || result.skills || result.experience || result.education || result.projects;
    if (!hasAnyResult) {
      console.error('[SS:generateAll] All sections failed:', result.sectionErrors);
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'All suggestion sections failed to generate. Please try again.',
        },
      };
    }

    console.log(
      '[SS:generateAll] Generation complete.',
      'Summary:', result.summary ? 'OK' : 'FAILED',
      'Skills:', result.skills ? 'OK' : 'FAILED',
      'Experience:', result.experience ? 'OK' : 'FAILED',
      'Education:', effectiveEducation ? (result.education ? 'OK' : 'FAILED') : 'SKIPPED',
      'Projects:', effectiveProjects ? (result.projects ? 'OK' : 'FAILED') : 'SKIPPED'
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('[SS:generateAll] Unexpected error:', error);

    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      return {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Suggestion generation timed out. Please try again.',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate suggestions',
      },
    };
  }
}

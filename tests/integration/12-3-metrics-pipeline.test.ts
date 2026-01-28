/**
 * Metrics Pipeline Integration Tests
 * Story 12.3: Task 5 - Verify metrics collection and logging in suggestion routes
 *
 * Tests that all 3 suggestion routes properly collect and log quality metrics
 * after judge evaluation without blocking the pipeline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as summaryPOST } from '@/app/api/suggestions/summary/route';
import { POST as skillsPOST } from '@/app/api/suggestions/skills/route';
import { POST as experiencePOST } from '@/app/api/suggestions/experience/route';
import { NextRequest } from 'next/server';
import type { SummarySuggestion, SkillsSuggestion, ExperienceSuggestion } from '@/types/suggestions';

// Mock dependencies
vi.mock('@/lib/ai/generateSummarySuggestion', () => ({
  generateSummarySuggestion: vi.fn().mockResolvedValue({
    data: {
      original: 'Senior software engineer',
      suggested: 'Senior full-stack software engineer with React and Node.js',
      ats_keywords_added: ['React', 'Node.js'],
      ai_tell_phrases_rewritten: [],
      point_value: 8,
    },
    error: null,
  }),
}));

vi.mock('@/lib/ai/generateSkillsSuggestion', () => ({
  generateSkillsSuggestion: vi.fn().mockResolvedValue({
    data: {
      original: 'JavaScript, HTML, CSS',
      existing_skills: ['JavaScript', 'HTML', 'CSS'],
      matched_keywords: ['JavaScript'],
      missing_but_relevant: [
        { skill: 'React', reason: 'Required in JD', point_value: 10 },
        { skill: 'Docker', reason: 'Mentioned in JD', point_value: 8 },
      ],
      skill_additions: ['React', 'Docker'],
      skill_removals: [],
      summary: 'Add React and Docker skills',
      total_point_value: 18,
    },
    error: null,
  }),
}));

vi.mock('@/lib/ai/generateExperienceSuggestion', () => ({
  generateExperienceSuggestion: vi.fn().mockResolvedValue({
    data: {
      original: 'Worked on web applications',
      experience_entries: [
        {
          company: 'Tech Corp',
          role: 'Software Engineer',
          dates: '2020-2023',
          original_bullets: ['Built features'],
          suggested_bullets: [
            {
              original: 'Built features',
              suggested: 'Built React features improving performance by 30%',
              metrics_added: ['30%'],
              keywords_incorporated: ['React'],
              point_value: 12,
            },
          ],
        },
      ],
      summary: 'Enhanced experience bullets',
      total_point_value: 12,
    },
    error: null,
  }),
}));

vi.mock('@/lib/ai/judgeSuggestion', () => ({
  judgeSuggestion: vi.fn().mockResolvedValue({
    data: {
      suggestion_id: 'test-id',
      quality_score: 75,
      passed: true,
      reasoning: 'Good quality suggestion',
      criteria_breakdown: {
        authenticity: 20,
        clarity: 19,
        ats_relevance: 18,
        actionability: 18,
      },
      recommendation: 'accept',
    },
    error: null,
  }),
}));

vi.mock('@/lib/supabase/sessions', () => ({
  updateSession: vi.fn().mockResolvedValue({
    data: { id: 'test-session' },
    error: null,
  }),
}));

// Mock metrics collection and logging
vi.mock('@/lib/metrics/qualityMetrics', () => ({
  collectQualityMetrics: vi.fn().mockImplementation((judgeResults, section, optimizationId) => ({
    timestamp: new Date().toISOString(),
    optimization_id: optimizationId,
    section,
    total_evaluated: judgeResults.length,
    passed: judgeResults.filter((r: { passed: boolean }) => r.passed).length,
    failed: 0,
    pass_rate: 100,
    avg_score: 75,
    score_distribution: {
      range_0_20: 0,
      range_20_40: 0,
      range_40_60: 0,
      range_60_80: judgeResults.length,
      range_80_100: 0,
    },
    criteria_avg: {
      authenticity: 20,
      clarity: 19,
      ats_relevance: 18,
      actionability: 18,
    },
    failure_breakdown: {
      authenticity_failures: 0,
      clarity_failures: 0,
      ats_failures: 0,
      actionability_failures: 0,
    },
    common_failures: [],
  })),
}));

vi.mock('@/lib/metrics/metricsLogger', () => ({
  logQualityMetrics: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/metrics/judgeTrace', () => ({
  logJudgeBatchTrace: vi.fn(),
  logJudgeTrace: vi.fn(),
}));

vi.mock('@/lib/utils/truncateAtSentence', () => ({
  truncateAtSentence: vi.fn((text) => text.substring(0, 500)),
}));

describe('Metrics Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Summary Route Metrics Integration', () => {
    it('should call collectQualityMetrics and logQualityMetrics after judge', async () => {
      const { collectQualityMetrics } = await import('@/lib/metrics/qualityMetrics');
      const { logQualityMetrics } = await import('@/lib/metrics/metricsLogger');

      const requestBody = {
        session_id: 'test-session',
        anonymous_id: 'test-anon',
        resume_content: 'Full resume content',
        jd_content: 'Job description content',
        current_summary: 'Senior software engineer',
      };

      const request = new NextRequest('http://localhost/api/suggestions/summary', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await summaryPOST(request);
      const json = await response.json();

      expect(json.data).toBeDefined();
      expect(json.error).toBeNull();

      // Verify metrics collection was called
      expect(collectQualityMetrics).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            quality_score: 75,
            passed: true,
          }),
        ]),
        'summary',
        'test-session'
      );

      // Verify metrics logging was called
      expect(logQualityMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          section: 'summary',
          optimization_id: 'test-session',
        })
      );
    });

    it('should return suggestion even if metrics logging fails', async () => {
      const { logQualityMetrics } = await import('@/lib/metrics/metricsLogger');

      // Mock metrics logging to fail
      (logQualityMetrics as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Logging failed'));

      const requestBody = {
        session_id: 'test-session',
        anonymous_id: 'test-anon',
        resume_content: 'Full resume content',
        jd_content: 'Job description content',
        current_summary: 'Senior software engineer',
      };

      const request = new NextRequest('http://localhost/api/suggestions/summary', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await summaryPOST(request);
      const json = await response.json();

      // Suggestion should still be returned (graceful degradation)
      expect(json.data).toBeDefined();
      expect(json.error).toBeNull();

      const suggestion = json.data as SummarySuggestion;
      expect(suggestion.suggested).toBeDefined();
    });
  });

  describe('Skills Route Metrics Integration', () => {
    it('should call collectQualityMetrics and logQualityMetrics after judge', async () => {
      const { collectQualityMetrics } = await import('@/lib/metrics/qualityMetrics');
      const { logQualityMetrics } = await import('@/lib/metrics/metricsLogger');

      const requestBody = {
        session_id: 'test-session',
        anonymous_id: 'test-anon',
        resume_content: 'Full resume content',
        jd_content: 'Job description content',
        current_skills: 'JavaScript, HTML, CSS',
      };

      const request = new NextRequest('http://localhost/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await skillsPOST(request);
      const json = await response.json();

      expect(json.data).toBeDefined();
      expect(json.error).toBeNull();

      // Verify metrics collection was called (should include all skill items)
      expect(collectQualityMetrics).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            quality_score: 75,
            passed: true,
          }),
        ]),
        'skills',
        'test-session'
      );

      // Verify metrics logging was called
      expect(logQualityMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          section: 'skills',
          optimization_id: 'test-session',
        })
      );
    });

    it('should call logJudgeBatchTrace for parallel judge results', async () => {
      const { logJudgeBatchTrace } = await import('@/lib/metrics/judgeTrace');

      const requestBody = {
        session_id: 'test-session',
        anonymous_id: 'test-anon',
        resume_content: 'Full resume content',
        jd_content: 'Job description content',
        current_skills: 'JavaScript, HTML, CSS',
      };

      const request = new NextRequest('http://localhost/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await skillsPOST(request);
      const json = await response.json();

      expect(json.data).toBeDefined();

      // Verify batch trace logging was called
      expect(logJudgeBatchTrace).toHaveBeenCalledWith(
        expect.any(Array),
        'skills'
      );
    });
  });

  describe('Experience Route Metrics Integration', () => {
    it('should call collectQualityMetrics and logQualityMetrics after judge', async () => {
      const { collectQualityMetrics } = await import('@/lib/metrics/qualityMetrics');
      const { logQualityMetrics } = await import('@/lib/metrics/metricsLogger');

      const requestBody = {
        session_id: 'test-session',
        anonymous_id: 'test-anon',
        resume_content: 'Full resume content',
        jd_content: 'Job description content',
        current_experience: 'Worked on web applications',
      };

      const request = new NextRequest('http://localhost/api/suggestions/experience', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await experiencePOST(request);
      const json = await response.json();

      expect(json.data).toBeDefined();
      expect(json.error).toBeNull();

      // Verify metrics collection was called (should include all bullets)
      expect(collectQualityMetrics).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            quality_score: 75,
            passed: true,
          }),
        ]),
        'experience',
        'test-session'
      );

      // Verify metrics logging was called
      expect(logQualityMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          section: 'experience',
          optimization_id: 'test-session',
        })
      );
    });

    it('should call logJudgeBatchTrace for parallel judge results', async () => {
      const { logJudgeBatchTrace } = await import('@/lib/metrics/judgeTrace');

      const requestBody = {
        session_id: 'test-session',
        anonymous_id: 'test-anon',
        resume_content: 'Full resume content',
        jd_content: 'Job description content',
        current_experience: 'Worked on web applications',
      };

      const request = new NextRequest('http://localhost/api/suggestions/experience', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await experiencePOST(request);
      const json = await response.json();

      expect(json.data).toBeDefined();

      // Verify batch trace logging was called
      expect(logJudgeBatchTrace).toHaveBeenCalledWith(
        expect.any(Array),
        'experience'
      );
    });
  });
});

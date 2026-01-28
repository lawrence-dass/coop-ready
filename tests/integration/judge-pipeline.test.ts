/**
 * Judge Pipeline Integration Tests
 * Story 12.1: Test judge integration with suggestion generation
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

// Mock metrics collection and logging (Story 12.2)
vi.mock('@/lib/metrics/qualityMetrics', () => ({
  collectQualityMetrics: vi.fn().mockImplementation((judgeResults, section, optimizationId) => {
    const passed = judgeResults.filter((r: { passed: boolean }) => r.passed).length;
    const avgScore = judgeResults.reduce((sum: number, r: { quality_score: number }) => sum + r.quality_score, 0) / judgeResults.length;

    return {
      timestamp: new Date().toISOString(),
      optimization_id: optimizationId,
      section,
      total_evaluated: judgeResults.length,
      passed,
      failed: judgeResults.length - passed,
      pass_rate: (passed / judgeResults.length) * 100,
      avg_score: avgScore,
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
    };
  }),
}));

vi.mock('@/lib/metrics/metricsLogger', () => ({
  logQualityMetrics: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/metrics/judgeTrace', () => ({
  logJudgeBatchTrace: vi.fn(),
}));

vi.mock('@/lib/utils/truncateAtSentence', () => ({
  truncateAtSentence: vi.fn((text) => text.substring(0, 500)),
}));

describe('Judge Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Summary Suggestion with Judge', () => {
    it('should return suggestion with judge scores', async () => {
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

      const suggestion = json.data as SummarySuggestion;
      expect(suggestion.judge_score).toBe(75);
      expect(suggestion.judge_passed).toBe(true);
      expect(suggestion.judge_reasoning).toBe('Good quality suggestion');
      expect(suggestion.judge_criteria).toBeDefined();
      expect(suggestion.judge_criteria?.authenticity).toBe(20);
    });
  });

  describe('Skills Suggestion with Judge', () => {
    it('should return skills with judge scores on individual items', async () => {
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

      const suggestion = json.data as SkillsSuggestion;
      expect(suggestion.missing_but_relevant).toBeDefined();
      expect(suggestion.missing_but_relevant.length).toBeGreaterThan(0);

      // Check that skills have judge scores
      const firstSkill = suggestion.missing_but_relevant[0];
      expect(firstSkill.judge_score).toBeDefined();
      expect(firstSkill.judge_passed).toBeDefined();
      expect(firstSkill.judge_reasoning).toBeDefined();
    });
  });

  describe('Experience Suggestion with Judge', () => {
    it('should return experience bullets with judge scores', async () => {
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

      const suggestion = json.data as ExperienceSuggestion;
      expect(suggestion.experience_entries).toBeDefined();
      expect(suggestion.experience_entries.length).toBeGreaterThan(0);

      // Check that bullets have judge scores
      const firstEntry = suggestion.experience_entries[0];
      expect(firstEntry.suggested_bullets).toBeDefined();
      expect(firstEntry.suggested_bullets.length).toBeGreaterThan(0);

      const firstBullet = firstEntry.suggested_bullets[0];
      expect(firstBullet.judge_score).toBeDefined();
      expect(firstBullet.judge_passed).toBeDefined();
      expect(firstBullet.judge_reasoning).toBeDefined();
      expect(firstBullet.judge_criteria).toBeDefined();
    });
  });

  describe('Judge Failure Handling', () => {
    it('should return suggestion without judge scores if judge fails', async () => {
      const { judgeSuggestion } = await import('@/lib/ai/judgeSuggestion');
      (judgeSuggestion as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Judge failed' },
      });

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
      // Judge scores may be undefined or not set
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with suggestions that have no judge fields', async () => {
      const suggestionWithoutJudge: SummarySuggestion = {
        original: 'Senior software engineer',
        suggested: 'Senior full-stack software engineer',
        ats_keywords_added: ['React'],
        ai_tell_phrases_rewritten: [],
        point_value: 8,
        // No judge fields
      };

      // This should not throw or cause errors
      expect(suggestionWithoutJudge.judge_score).toBeUndefined();
      expect(suggestionWithoutJudge.judge_passed).toBeUndefined();
    });
  });
});

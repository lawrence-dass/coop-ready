// Unit Tests for ATS Score Calculation
// Story 5.2: Implement ATS Score Calculation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateATSScore } from '@/lib/ai/calculateATSScore';
import * as judgeModule from '@/lib/ai/judgeContentQuality';
import type { KeywordAnalysisResult } from '@/types/analysis';
import type { Resume } from '@/types/optimization';

// Mock the judgeContentQuality function
vi.mock('@/lib/ai/judgeContentQuality');

describe('calculateATSScore', () => {
  const mockJD = 'Software Engineer position requiring Python, React, and AWS experience.';

  const mockParsedResume: Resume = {
    rawText: 'Full resume text here',
    summary: 'Experienced software engineer',
    skills: 'Python, React, AWS, Docker',
    experience: 'Led development of web applications using React and Python'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Keyword Score Calculation', () => {
    it('[P0] should calculate keyword score from match rate - 100% match', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      // Mock quality judge to return 80
      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 80,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.breakdown.keywordScore).toBe(100);
    });

    it('[P0] should calculate keyword score from match rate - 50% match', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 50,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 75,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.keywordScore).toBe(50);
    });

    it('[P1] should calculate keyword score from match rate - 0% match', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 0,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 60,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.keywordScore).toBe(0);
    });
  });

  describe('Section Coverage Score Calculation', () => {
    it('[P0] should score 100 when all required sections present', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 80,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 85,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.sectionCoverageScore).toBe(100);
    });

    it('[P1] should score 67 when one section missing (2/3)', async () => {
      const resumeMissingSkills: Resume = {
        rawText: 'Resume text',
        summary: 'Summary here',
        skills: undefined, // Missing
        experience: 'Experience here'
      };

      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 75,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 80,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, resumeMissingSkills, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.sectionCoverageScore).toBe(67); // Rounded 2/3
    });

    it('[P1] should score 33 when two sections missing (1/3)', async () => {
      const resumeMinimal: Resume = {
        rawText: 'Resume text',
        summary: undefined,
        skills: 'Python, React',
        experience: undefined
      };

      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 60,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 70,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, resumeMinimal, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.sectionCoverageScore).toBe(33); // Rounded 1/3
    });

    it('[P2] should score 0 when all sections missing', async () => {
      const resumeEmpty: Resume = {
        rawText: 'Some raw text',
        summary: undefined,
        skills: undefined,
        experience: undefined
      };

      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 40,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 50,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, resumeEmpty, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.sectionCoverageScore).toBe(0);
    });

    it('[P2] should ignore empty string sections', async () => {
      const resumeEmptyStrings: Resume = {
        rawText: 'Resume text',
        summary: '',
        skills: '   ', // Whitespace only
        experience: 'Experience section'
      };

      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 70,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 75,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, resumeEmptyStrings, mockJD);

      expect(result.error).toBeNull();
      // Only experience is present, so 1/3 = 33
      expect(result.data!.breakdown.sectionCoverageScore).toBe(33);
    });
  });

  describe('Content Quality Score Integration', () => {
    it('[P0] should use quality score from LLM judge', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 85,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 92,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.contentQualityScore).toBe(92);
    });

    it('[P1] should set quality score to 0 when LLM judge returns 0', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 60,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 0,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.contentQualityScore).toBe(0);
    });
  });

  describe('Weighted Score Combination', () => {
    it('[P0] should calculate correct weighted overall score', async () => {
      // Keyword: 80, Section: 100, Quality: 90
      // Overall = (80 * 0.50) + (100 * 0.25) + (90 * 0.25)
      //         = 40 + 25 + 22.5 = 87.5 → 88 (rounded)
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 80,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 90,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.keywordScore).toBe(80);
      expect(result.data!.breakdown.sectionCoverageScore).toBe(100);
      expect(result.data!.breakdown.contentQualityScore).toBe(90);
      expect(result.data!.overall).toBe(88); // Rounded from 87.5
    });

    it('[P0] should handle perfect score (100)', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 100,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.overall).toBe(100);
    });

    it('[P1] should handle low scores correctly', async () => {
      // Keyword: 20, Section: 33, Quality: 40
      // Overall = (20 * 0.50) + (33 * 0.25) + (40 * 0.25)
      //         = 10 + 8.25 + 10 = 28.25 → 28 (rounded)
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 20,
        analyzedAt: new Date().toISOString()
      };

      const resumeMinimal: Resume = {
        rawText: 'Resume text',
        summary: undefined,
        skills: 'Python',
        experience: undefined
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 40,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, resumeMinimal, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.overall).toBe(28);
    });
  });

  describe('Fallback Scoring (Quality Judge Fails)', () => {
    it('[P1] should use fallback scoring when quality judge times out', async () => {
      // Keyword: 70, Section: 100, Quality: timeout
      // Fallback: (70 * 0.67) + (100 * 0.33) = 46.9 + 33 = 79.9 → 80 (rounded)
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 70,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Quality evaluation timed out'
        }
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.keywordScore).toBe(70);
      expect(result.data!.breakdown.sectionCoverageScore).toBe(100);
      expect(result.data!.breakdown.contentQualityScore).toBe(0); // Indicates unavailable
      expect(result.data!.overall).toBe(80); // Fallback calculation
    });

    it('[P1] should use fallback scoring when quality judge returns error', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 60,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'LLM failed'
        }
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.contentQualityScore).toBe(0);
      // Fallback: (60 * 0.67) + (100 * 0.33) = 73
      expect(result.data!.overall).toBe(73);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('[P0] should return error when keyword analysis is missing', async () => {
      const result = await calculateATSScore(
        null as any,
        mockParsedResume,
        mockJD
      );

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Keyword analysis is required');
    });

    it('[P0] should return error when parsed resume is missing', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 75,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScore(
        keywordAnalysis,
        null as any,
        mockJD
      );

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Parsed resume is required');
    });

    it('[P0] should return error when resume has no rawText', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 75,
        analyzedAt: new Date().toISOString()
      };

      const invalidResume: Resume = {
        rawText: '',
        summary: 'Summary'
      };

      const result = await calculateATSScore(
        keywordAnalysis,
        invalidResume,
        mockJD
      );

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('VALIDATION_ERROR');
    });

    it('[P0] should return error when JD content is empty', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 75,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScore(
        keywordAnalysis,
        mockParsedResume,
        ''
      );

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('VALIDATION_ERROR');
      expect(result.error!.message).toContain('Job description is required');
    });

    it('[P2] should include calculatedAt timestamp', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 80,
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 85,
        error: null
      });

      const beforeCall = new Date().getTime();
      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);
      const afterCall = new Date().getTime();

      expect(result.error).toBeNull();
      expect(result.data!.calculatedAt).toBeDefined();

      const calculatedTime = new Date(result.data!.calculatedAt).getTime();
      expect(calculatedTime).toBeGreaterThanOrEqual(beforeCall);
      expect(calculatedTime).toBeLessThanOrEqual(afterCall + 1000); // 1s buffer
    });

    it('[P2] should return scores in range 0-100', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 99.7, // Edge case: non-integer
        analyzedAt: new Date().toISOString()
      };

      vi.mocked(judgeModule.judgeContentQuality).mockResolvedValue({
        data: 99.4,
        error: null
      });

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.overall).toBeGreaterThanOrEqual(0);
      expect(result.data!.overall).toBeLessThanOrEqual(100);
      expect(result.data!.breakdown.keywordScore).toBeGreaterThanOrEqual(0);
      expect(result.data!.breakdown.keywordScore).toBeLessThanOrEqual(100);
      expect(result.data!.breakdown.sectionCoverageScore).toBeGreaterThanOrEqual(0);
      expect(result.data!.breakdown.sectionCoverageScore).toBeLessThanOrEqual(100);
      expect(result.data!.breakdown.contentQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.data!.breakdown.contentQualityScore).toBeLessThanOrEqual(100);
    });
  });
});

/**
 * Unit Tests for ATS Score Calculation
 * Story 5.2: Implement ATS Score Calculation
 *
 * Updated for V2 deterministic scoring (no LLM dependency)
 */

import { describe, it, expect } from 'vitest';
import { calculateATSScore, calculateATSScoreV2Full } from '@/lib/ai/calculateATSScore';
import type { KeywordAnalysisResult, MatchedKeyword, ExtractedKeyword } from '@/types/analysis';
import { KeywordCategory } from '@/types/analysis';
import type { Resume } from '@/types/optimization';

describe('calculateATSScore (V2)', () => {
  const mockJD = 'Software Engineer position requiring Python, React, and AWS experience.';

  const createMatchedKeyword = (
    keyword: string,
    matchType: 'exact' | 'fuzzy' | 'semantic' = 'exact'
  ): MatchedKeyword => ({
    keyword,
    category: KeywordCategory.SKILLS,
    found: true,
    matchType,
  });

  const createMissingKeyword = (
    keyword: string,
    importance: 'high' | 'medium' | 'low' = 'medium'
  ): ExtractedKeyword => ({
    keyword,
    category: KeywordCategory.SKILLS,
    importance,
  });

  // Well-structured resume for testing
  const mockParsedResume: Resume = {
    rawText: `John Doe
john.doe@example.com | (555) 123-4567

SUMMARY
Experienced software engineer with 8 years of experience building scalable web applications.
Proven track record of leading cross-functional teams and delivering complex projects.

SKILLS
Python, React, AWS, Docker, Kubernetes, TypeScript, JavaScript, Node.js

EXPERIENCE
Senior Software Engineer | Tech Company | Jan 2020 - Present
• Led development of microservices architecture reducing latency by 40%
• Built scalable API handling 1M requests daily using Python and AWS
• Drove adoption of React frontend reducing page load time by 50%
• Delivered features ahead of schedule increasing user engagement by 25%
• Mentored team of 5 junior developers on best practices
• Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
• Designed distributed database architecture supporting 10x traffic growth
• Created automated testing framework achieving 90% code coverage`,
    summary: 'Experienced software engineer with 8 years of experience building scalable web applications. Proven track record of leading cross-functional teams and delivering complex projects.',
    skills: 'Python, React, AWS, Docker, Kubernetes, TypeScript, JavaScript, Node.js',
    experience: `Senior Software Engineer | Tech Company | Jan 2020 - Present
• Led development of microservices architecture reducing latency by 40%
• Built scalable API handling 1M requests daily using Python and AWS
• Drove adoption of React frontend reducing page load time by 50%
• Delivered features ahead of schedule increasing user engagement by 25%
• Mentored team of 5 junior developers on best practices
• Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
• Designed distributed database architecture supporting 10x traffic growth
• Created automated testing framework achieving 90% code coverage`
  };

  describe('V2 Deterministic Scoring', () => {
    it('[P0] should return a valid score object', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python'),
          createMatchedKeyword('React'),
          createMatchedKeyword('AWS'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.overall).toBeGreaterThanOrEqual(0);
      expect(result.data!.overall).toBeLessThanOrEqual(100);
      expect(result.data!.breakdown).toBeDefined();
      expect(result.data!.calculatedAt).toBeDefined();
    });

    it('[P0] should include V1 compatible breakdown', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.breakdown.keywordScore).toBeDefined();
      expect(result.data!.breakdown.sectionCoverageScore).toBeDefined();
      expect(result.data!.breakdown.contentQualityScore).toBeDefined();
    });

    it('[P0] should be fully deterministic (no LLM variance)', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python'),
          createMatchedKeyword('React'),
        ],
        missing: [createMissingKeyword('AWS', 'medium')],
        matchRate: 67,
        analyzedAt: new Date().toISOString()
      };

      // Run multiple times and verify same result
      const result1 = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);
      const result2 = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);
      const result3 = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      expect(result1.data!.overall).toBe(result2.data!.overall);
      expect(result2.data!.overall).toBe(result3.data!.overall);
      expect(result1.data!.breakdown.keywordScore).toBe(result2.data!.breakdown.keywordScore);
    });
  });

  describe('Keyword Score Impact', () => {
    it('[P0] should score higher with more keyword matches', async () => {
      const fewMatches: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [
          createMissingKeyword('React', 'high'),
          createMissingKeyword('AWS', 'high'),
        ],
        matchRate: 33,
        analyzedAt: new Date().toISOString()
      };

      const manyMatches: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python'),
          createMatchedKeyword('React'),
          createMatchedKeyword('AWS'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const fewResult = await calculateATSScore(fewMatches, mockParsedResume, mockJD);
      const manyResult = await calculateATSScore(manyMatches, mockParsedResume, mockJD);

      expect(manyResult.data!.overall).toBeGreaterThan(fewResult.data!.overall);
    });

    it('[P0] should score lower with semantic matches vs exact', async () => {
      const semanticMatches: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python', 'semantic'),
          createMatchedKeyword('React', 'semantic'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const exactMatches: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python', 'exact'),
          createMatchedKeyword('React', 'exact'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const semanticResult = await calculateATSScore(semanticMatches, mockParsedResume, mockJD);
      const exactResult = await calculateATSScore(exactMatches, mockParsedResume, mockJD);

      expect(exactResult.data!.breakdown.keywordScore).toBeGreaterThan(
        semanticResult.data!.breakdown.keywordScore
      );
    });
  });

  describe('Section Score Impact', () => {
    it('[P0] should score higher with complete sections', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      // Resume with all sections
      const completeResult = await calculateATSScore(keywordAnalysis, mockParsedResume, mockJD);

      // Resume missing sections
      const incompleteResume: Resume = {
        rawText: 'Some text',
        summary: undefined,
        skills: 'Python',
        experience: undefined
      };
      const incompleteResult = await calculateATSScore(keywordAnalysis, incompleteResume, mockJD);

      expect(completeResult.data!.breakdown.sectionCoverageScore).toBeGreaterThan(
        incompleteResult.data!.breakdown.sectionCoverageScore
      );
    });
  });

  describe('V2 Full Response', () => {
    it('[P0] should return V2 extended fields', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScoreV2Full(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data!.tier).toBeDefined();
      expect(result.data!.breakdownV2).toBeDefined();
      expect(result.data!.actionItems).toBeDefined();
      expect(result.data!.metadata.version).toBe('v2');
      expect(result.data!.metadata.algorithmHash).toBeDefined();
      expect(result.data!.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('[P0] should include role context', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScoreV2Full(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.data!.roleContext).toBeDefined();
      expect(result.data!.roleContext.roleType).toBeDefined();
      expect(result.data!.roleContext.seniorityLevel).toBeDefined();
      expect(result.data!.roleContext.weights).toBeDefined();
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
        matched: [createMatchedKeyword('Python')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

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

  describe('Calibration', () => {
    it('[P0] well-optimized resume should score strong or excellent tier', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python', 'exact'),
          createMatchedKeyword('React', 'exact'),
          createMatchedKeyword('AWS', 'exact'),
          createMatchedKeyword('Docker', 'exact'),
          createMatchedKeyword('Kubernetes', 'exact'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      };

      const result = await calculateATSScoreV2Full(keywordAnalysis, mockParsedResume, mockJD);

      expect(result.error).toBeNull();
      // Well-optimized resume should be at least strong tier (70+)
      expect(result.data!.overall).toBeGreaterThanOrEqual(70);
      expect(['strong', 'excellent']).toContain(result.data!.tier);
    });

    it('[P0] weak resume should score moderate or weak tier', async () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python', 'semantic')],
        missing: [
          createMissingKeyword('React', 'high'),
          createMissingKeyword('AWS', 'high'),
          createMissingKeyword('Docker', 'medium'),
        ],
        matchRate: 25,
        analyzedAt: new Date().toISOString()
      };

      const weakResume: Resume = {
        rawText: 'Developer. Worked on projects.',
        summary: 'Developer',
        skills: 'Python',
        experience: 'Worked on projects'
      };

      const result = await calculateATSScoreV2Full(keywordAnalysis, weakResume, mockJD);

      expect(result.error).toBeNull();
      // Weak resume should be below 70 (moderate or weak tier)
      expect(result.data!.overall).toBeLessThan(70);
      expect(['moderate', 'weak']).toContain(result.data!.tier);
    });
  });
});

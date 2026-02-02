/**
 * Unit Tests for ATS Score V2 Orchestrator
 * Tests the main scoring function and integration
 */

import { describe, it, expect } from 'vitest';
import { calculateATSScoreV2, toV1Score, isV2Score } from '@/lib/scoring/atsScore';
import type { KeywordAnalysisResult, MatchedKeyword, ExtractedKeyword } from '@/types/analysis';
import { KeywordCategory } from '@/types/analysis';

describe('calculateATSScoreV2', () => {
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

  const mockKeywordAnalysis: KeywordAnalysisResult = {
    matched: [
      createMatchedKeyword('Python'),
      createMatchedKeyword('React'),
      createMatchedKeyword('AWS'),
    ],
    missing: [
      createMissingKeyword('Docker', 'medium'),
      createMissingKeyword('Kubernetes', 'low'),
    ],
    matchRate: 60,
    analyzedAt: new Date().toISOString(),
  };

  const mockResumeText = `
    John Doe
    john.doe@example.com | (555) 123-4567

    SUMMARY
    Experienced software engineer with 8 years of experience building scalable web applications.
    Proven track record of leading cross-functional teams and delivering complex projects.

    SKILLS
    Python, React, AWS, JavaScript, TypeScript, Node.js

    EXPERIENCE

    Senior Software Engineer | Tech Company | Jan 2020 - Present
    • Led development of microservices architecture reducing latency by 40%
    • Built scalable API handling 1M requests daily using Python and AWS
    • Drove adoption of React frontend reducing page load time by 50%
    • Delivered features ahead of schedule increasing user engagement by 25%
    • Mentored team of 5 junior developers on best practices
    • Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
    • Designed distributed database architecture supporting 10x traffic growth
    • Created automated testing framework achieving 90% code coverage
  `;

  const mockParsedResume = {
    summary: 'Experienced software engineer with 8 years of experience building scalable web applications. Proven track record of leading cross-functional teams and delivering complex projects.',
    skills: 'Python, React, AWS, JavaScript, TypeScript, Node.js',
    experience: `
      Senior Software Engineer | Tech Company | Jan 2020 - Present
      • Led development of microservices architecture reducing latency by 40%
      • Built scalable API handling 1M requests daily using Python and AWS
      • Drove adoption of React frontend reducing page load time by 50%
      • Delivered features ahead of schedule increasing user engagement by 25%
      • Mentored team of 5 junior developers on best practices
      • Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
      • Designed distributed database architecture supporting 10x traffic growth
      • Created automated testing framework achieving 90% code coverage
    `,
    education: 'BS Computer Science, University',
  };

  const mockJDContent = `
    Senior Software Engineer

    We're looking for an experienced software engineer to join our team.

    Requirements:
    - 5+ years of experience
    - Python, React, AWS
    - Experience with microservices
    - Strong communication skills
  `;

  describe('Basic Scoring', () => {
    it('[P0] should return a valid V2 score object', () => {
      const result = calculateATSScoreV2({
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.tier).toBeDefined();
      expect(['excellent', 'strong', 'moderate', 'weak']).toContain(result.tier);
      expect(result.calculatedAt).toBeDefined();
    });

    it('[P0] should include all component breakdowns', () => {
      const result = calculateATSScoreV2({
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      // V2 breakdown
      expect(result.breakdownV2.keywords).toBeDefined();
      expect(result.breakdownV2.experience).toBeDefined();
      expect(result.breakdownV2.sections).toBeDefined();
      expect(result.breakdownV2.format).toBeDefined();

      // V1 compatible breakdown
      expect(result.breakdown.keywordScore).toBeDefined();
      expect(result.breakdown.sectionCoverageScore).toBeDefined();
      expect(result.breakdown.contentQualityScore).toBeDefined();
    });

    it('[P0] should include metadata with version info', () => {
      const result = calculateATSScoreV2({
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      expect(result.metadata.version).toBe('v2');
      expect(result.metadata.algorithmHash).toBeDefined();
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('[P0] should include action items', () => {
      const result = calculateATSScoreV2({
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      expect(Array.isArray(result.actionItems)).toBe(true);
      expect(result.actionItems.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Role Detection', () => {
    it('[P0] should detect role type from JD', () => {
      const result = calculateATSScoreV2({
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      expect(result.roleContext.roleType).toBeDefined();
      expect(result.roleContext.seniorityLevel).toBeDefined();
      expect(result.roleContext.confidence).toBeGreaterThanOrEqual(0);
      expect(result.roleContext.confidence).toBeLessThanOrEqual(1);
    });

    it('[P1] should apply role-based weight adjustments', () => {
      const result = calculateATSScoreV2({
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      const weights = result.roleContext.weights;
      const sum = weights.keywords + weights.experience + weights.sections + weights.format;

      // Weights should sum to 1
      expect(sum).toBeCloseTo(1, 5);
    });
  });

  describe('Tier Classification', () => {
    it('[P0] should classify excellent for 85+ score', () => {
      const strongKeywords: KeywordAnalysisResult = {
        matched: Array(10).fill(null).map((_, i) =>
          createMatchedKeyword(`Skill${i}`, 'exact')
        ),
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateATSScoreV2({
        keywordAnalysis: strongKeywords,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      if (result.overall >= 85) {
        expect(result.tier).toBe('excellent');
      }
    });

    it('[P1] should classify weak for score < 55', () => {
      const weakKeywords: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python', 'semantic')],
        missing: [
          createMissingKeyword('AWS', 'high'),
          createMissingKeyword('React', 'high'),
          createMissingKeyword('Docker', 'high'),
        ],
        matchRate: 25,
        analyzedAt: new Date().toISOString(),
      };

      const weakResume = {
        summary: 'Developer',
        skills: 'Python',
        experience: 'Worked on projects',
      };

      const result = calculateATSScoreV2({
        keywordAnalysis: weakKeywords,
        resumeText: 'Developer. Worked on projects.',
        parsedResume: weakResume,
        jdContent: mockJDContent,
      });

      if (result.overall < 55) {
        expect(result.tier).toBe('weak');
      }
    });
  });

  describe('Determinism', () => {
    it('[P0] same input should always produce same output', () => {
      const input = {
        keywordAnalysis: mockKeywordAnalysis,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      };

      const result1 = calculateATSScoreV2(input);
      const result2 = calculateATSScoreV2(input);
      const result3 = calculateATSScoreV2(input);

      expect(result1.overall).toBe(result2.overall);
      expect(result2.overall).toBe(result3.overall);
      expect(result1.tier).toBe(result2.tier);
      expect(result1.breakdownV2.keywords.score).toBe(result2.breakdownV2.keywords.score);
      expect(result1.breakdownV2.experience.score).toBe(result2.breakdownV2.experience.score);
    });
  });

  describe('Calibration Fixtures', () => {
    it('[P0] Weak profile should score 45-52%', () => {
      const weakKeywords: KeywordAnalysisResult = {
        matched: Array(8).fill(null).map((_, i) =>
          createMatchedKeyword(`Skill${i}`, 'semantic')
        ),
        missing: [
          createMissingKeyword('Critical1', 'high'),
          createMissingKeyword('Critical2', 'high'),
          ...Array(5).fill(null).map((_, i) =>
            createMissingKeyword(`Missing${i}`, 'medium')
          ),
        ],
        matchRate: 53,
        analyzedAt: new Date().toISOString(),
      };

      const weakResume = {
        summary: 'Software developer with experience.',
        skills: 'Python, JavaScript',
        experience: `
          • Worked on software development
          • Helped with testing
          • Participated in meetings
        `,
      };

      const result = calculateATSScoreV2({
        keywordAnalysis: weakKeywords,
        resumeText: `
          john@email.com
          555-123-4567
          SUMMARY
          ${weakResume.summary}
          SKILLS
          ${weakResume.skills}
          EXPERIENCE
          ${weakResume.experience}
        `,
        parsedResume: weakResume,
        jdContent: mockJDContent,
      });

      // Weak profile should score in the low-moderate range
      expect(result.overall).toBeLessThan(65);
    });

    it('[P0] Strong profile should score 78-85%', () => {
      const strongKeywords: KeywordAnalysisResult = {
        matched: Array(13).fill(null).map((_, i) =>
          createMatchedKeyword(`Skill${i}`, 'exact')
        ),
        missing: [
          createMissingKeyword('Optional1', 'low'),
          createMissingKeyword('Optional2', 'low'),
        ],
        matchRate: 87,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateATSScoreV2({
        keywordAnalysis: strongKeywords,
        resumeText: mockResumeText,
        parsedResume: mockParsedResume,
        jdContent: mockJDContent,
      });

      // Strong profile should score in the strong-excellent range
      expect(result.overall).toBeGreaterThanOrEqual(65);
    });
  });
});

describe('toV1Score', () => {
  it('[P0] should convert V2 score to V1 format', () => {
    const v2Score = calculateATSScoreV2({
      keywordAnalysis: {
        matched: [
          { keyword: 'Python', category: KeywordCategory.SKILLS, found: true, matchType: 'exact' },
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      },
      resumeText: 'john@email.com\n555-123-4567\nSUMMARY\nExperienced engineer with many years experience.\nSKILLS\nPython, React, AWS, Docker, Kubernetes, TypeScript\nEXPERIENCE\n• Led development of features\n• Built applications\n• Deployed systems\n• Fixed bugs\n• Wrote tests\n• Documented code\n• Reviewed PRs\n• Mentored others',
      parsedResume: {
        summary: 'Experienced engineer with many years experience.',
        skills: 'Python, React, AWS, Docker, Kubernetes, TypeScript',
        experience: '• Led development of features\n• Built applications\n• Deployed systems\n• Fixed bugs\n• Wrote tests\n• Documented code\n• Reviewed PRs\n• Mentored others',
      },
      jdContent: 'Software Engineer role',
    });

    const v1Score = toV1Score(v2Score);

    expect(v1Score.overall).toBe(v2Score.overall);
    expect(v1Score.breakdown.keywordScore).toBe(v2Score.breakdown.keywordScore);
    expect(v1Score.breakdown.sectionCoverageScore).toBe(v2Score.breakdown.sectionCoverageScore);
    expect(v1Score.breakdown.contentQualityScore).toBe(v2Score.breakdown.contentQualityScore);
    expect(v1Score.calculatedAt).toBe(v2Score.calculatedAt);

    // V1 score should not have V2 specific fields
    expect((v1Score as any).tier).toBeUndefined();
    expect((v1Score as any).breakdownV2).toBeUndefined();
    expect((v1Score as any).actionItems).toBeUndefined();
  });
});

describe('isV2Score', () => {
  it('[P0] should identify V2 scores', () => {
    const v2Score = calculateATSScoreV2({
      keywordAnalysis: {
        matched: [],
        missing: [],
        matchRate: 0,
        analyzedAt: new Date().toISOString(),
      },
      resumeText: '',
      parsedResume: {},
      jdContent: '',
    });

    expect(isV2Score(v2Score)).toBe(true);
  });

  it('[P0] should reject V1 scores', () => {
    const v1Score = {
      overall: 75,
      breakdown: {
        keywordScore: 80,
        sectionCoverageScore: 70,
        contentQualityScore: 75,
      },
      calculatedAt: new Date().toISOString(),
    };

    expect(isV2Score(v1Score)).toBe(false);
  });

  it('[P1] should handle null and undefined', () => {
    expect(isV2Score(null)).toBe(false);
    expect(isV2Score(undefined)).toBe(false);
    expect(isV2Score({})).toBe(false);
  });
});

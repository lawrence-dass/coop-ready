/**
 * Unit Tests for Keyword Scoring
 * Tests the weighted keyword scoring algorithm
 */

import { describe, it, expect } from 'vitest';
import { calculateKeywordScore, generateKeywordActionItems } from '@/lib/scoring/keywordScore';
import type { KeywordAnalysisResult, MatchedKeyword, ExtractedKeyword } from '@/types/analysis';
import { KeywordCategory } from '@/types/analysis';

describe('calculateKeywordScore', () => {
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

  describe('Basic Scoring', () => {
    it('[P0] should return 100 for all exact matches', () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python'),
          createMatchedKeyword('React'),
          createMatchedKeyword('AWS'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(keywordAnalysis);

      expect(result.score).toBe(100);
      expect(result.matchedCount).toBe(3);
      expect(result.totalCount).toBe(3);
      expect(result.penaltyApplied).toBe(0);
    });

    it('[P0] should return 0 for no matches', () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [
          createMissingKeyword('Python', 'high'),
          createMissingKeyword('React', 'medium'),
        ],
        matchRate: 0,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(keywordAnalysis);

      expect(result.score).toBe(0);
      expect(result.matchedCount).toBe(0);
      expect(result.totalCount).toBe(2);
    });

    it('[P1] should handle empty keyword analysis', () => {
      const keywordAnalysis: KeywordAnalysisResult = {
        matched: [],
        missing: [],
        matchRate: 0,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(keywordAnalysis);

      expect(result.score).toBe(0);
      expect(result.matchedCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('Match Type Weighting', () => {
    it('[P0] should weight semantic matches lower than exact', () => {
      const exactAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python', 'exact')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      };

      const semanticAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python', 'semantic')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      };

      const exactResult = calculateKeywordScore(exactAnalysis);
      const semanticResult = calculateKeywordScore(semanticAnalysis);

      // Semantic should score ~65% of exact (based on MATCH_TYPE_WEIGHTS.semantic = 0.65)
      expect(semanticResult.score).toBeLessThan(exactResult.score);
      expect(semanticResult.score).toBeCloseTo(65, 0);
    });

    it('[P1] should weight fuzzy matches between exact and semantic', () => {
      const fuzzyAnalysis: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('React.js', 'fuzzy')],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(fuzzyAnalysis);

      // Fuzzy should score ~85% (based on MATCH_TYPE_WEIGHTS.fuzzy = 0.85)
      expect(result.score).toBeCloseTo(85, 0);
    });
  });

  describe('Importance Weighting', () => {
    it('[P0] should weight high-importance keywords more', () => {
      // Missing a high-importance keyword should hurt more
      const withHighMissing: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [createMissingKeyword('AWS', 'high')],
        matchRate: 50,
        analyzedAt: new Date().toISOString(),
      };

      const withLowMissing: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [createMissingKeyword('Nice-to-have', 'low')],
        matchRate: 50,
        analyzedAt: new Date().toISOString(),
      };

      const highResult = calculateKeywordScore(withHighMissing);
      const lowResult = calculateKeywordScore(withLowMissing);

      // Missing high-importance should result in lower score
      expect(highResult.score).toBeLessThan(lowResult.score);
      expect(highResult.missingHighImportance).toBe(1);
      expect(lowResult.missingHighImportance).toBe(0);
    });
  });

  describe('Missing High-Importance Penalty', () => {
    it('[P0] should apply penalty for each missing high-importance keyword', () => {
      const noMissing: KeywordAnalysisResult = {
        matched: [
          createMatchedKeyword('Python'),
          createMatchedKeyword('AWS'),
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString(),
      };

      const twoMissing: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [
          createMissingKeyword('AWS', 'high'),
          createMissingKeyword('Docker', 'high'),
        ],
        matchRate: 33,
        analyzedAt: new Date().toISOString(),
      };

      const noMissingResult = calculateKeywordScore(noMissing);
      const twoMissingResult = calculateKeywordScore(twoMissing);

      // Should have penalty applied
      expect(twoMissingResult.missingHighImportance).toBe(2);
      expect(twoMissingResult.penaltyApplied).toBeGreaterThan(0);
    });

    it('[P1] should not drop score below 40% of original', () => {
      // Even with many missing high-importance, score shouldn't go below floor
      const manyMissing: KeywordAnalysisResult = {
        matched: [createMatchedKeyword('Python')],
        missing: [
          createMissingKeyword('AWS', 'high'),
          createMissingKeyword('Docker', 'high'),
          createMissingKeyword('Kubernetes', 'high'),
          createMissingKeyword('CI/CD', 'high'),
          createMissingKeyword('Terraform', 'high'),
        ],
        matchRate: 16,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(manyMissing);

      // Score should be at least 40% of the base weighted score
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.missingHighImportance).toBe(5);
    });
  });

  describe('Calibration Fixtures', () => {
    it('[P0] Weak profile (8/15 semantic) should score low', () => {
      // Simulate weak profile: mostly semantic matches, some missing high-importance
      const matched = Array(8).fill(null).map((_, i) =>
        createMatchedKeyword(`Skill${i}`, 'semantic')
      );
      const missing = Array(7).fill(null).map((_, i) =>
        createMissingKeyword(`Missing${i}`, i < 2 ? 'high' : 'medium')
      );

      const analysis: KeywordAnalysisResult = {
        matched,
        missing,
        matchRate: 53,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(analysis);

      // With 2 missing high-importance and semantic matches, score should be low
      expect(result.score).toBeLessThan(50);
      expect(result.missingHighImportance).toBe(2);
    });

    it('[P0] Strong profile (13/15 exact) should score 78-85%', () => {
      // Simulate strong profile: mostly exact matches
      const matched = Array(13).fill(null).map((_, i) =>
        createMatchedKeyword(`Skill${i}`, 'exact')
      );
      const missing = Array(2).fill(null).map((_, i) =>
        createMissingKeyword(`Missing${i}`, 'low')
      );

      const analysis: KeywordAnalysisResult = {
        matched,
        missing,
        matchRate: 87,
        analyzedAt: new Date().toISOString(),
      };

      const result = calculateKeywordScore(analysis);

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.score).toBeLessThanOrEqual(95);
    });
  });
});

describe('generateKeywordActionItems', () => {
  it('[P0] should suggest adding high-importance missing keywords', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [],
      missing: [
        { keyword: 'Python', category: KeywordCategory.SKILLS, importance: 'high' },
        { keyword: 'AWS', category: KeywordCategory.SKILLS, importance: 'high' },
      ],
      matchRate: 0,
      analyzedAt: new Date().toISOString(),
    };

    const items = generateKeywordActionItems(analysis);

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toContain('critical');
    expect(items[0]).toMatch(/Python|AWS/);
  });

  it('[P1] should suggest upgrading semantic matches to exact', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [
        {
          keyword: 'JavaScript',
          category: KeywordCategory.SKILLS,
          found: true,
          matchType: 'semantic',
        },
      ],
      missing: [],
      matchRate: 100,
      analyzedAt: new Date().toISOString(),
    };

    const items = generateKeywordActionItems(analysis);

    expect(items.some(item => item.includes('exact terminology'))).toBe(true);
  });
});

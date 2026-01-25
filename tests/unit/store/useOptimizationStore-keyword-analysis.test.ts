// Story 5.1: Tests for Keyword Analysis Store Integration
import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizationStore, selectKeywordAnalysis } from '@/store/useOptimizationStore';
import { KeywordCategory } from '@/types/analysis';
import type { KeywordAnalysisResult } from '@/types/analysis';

describe('Task 5: Keyword Analysis Store Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  it('should initialize with null keyword analysis', () => {
    const state = useOptimizationStore.getState();
    expect(state.keywordAnalysis).toBeNull();
  });

  it('should set keyword analysis results', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [
        {
          keyword: 'Python',
          category: KeywordCategory.TECHNOLOGIES,
          found: true,
          context: 'Developed using Python',
          matchType: 'exact'
        }
      ],
      missing: [
        {
          keyword: 'Docker',
          category: KeywordCategory.TECHNOLOGIES,
          importance: 'medium'
        }
      ],
      matchRate: 50,
      analyzedAt: new Date().toISOString()
    };

    useOptimizationStore.getState().setKeywordAnalysis(analysis);

    const state = useOptimizationStore.getState();
    expect(state.keywordAnalysis).toEqual(analysis);
    expect(state.error).toBeNull();
  });

  it('should clear keyword analysis', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [],
      missing: [],
      matchRate: 0,
      analyzedAt: new Date().toISOString()
    };

    useOptimizationStore.getState().setKeywordAnalysis(analysis);
    expect(useOptimizationStore.getState().keywordAnalysis).not.toBeNull();

    useOptimizationStore.getState().clearKeywordAnalysis();
    expect(useOptimizationStore.getState().keywordAnalysis).toBeNull();
  });

  it('should clear error when setting keyword analysis', () => {
    useOptimizationStore.getState().setError({ message: 'Previous error', code: 'LLM_ERROR' });
    expect(useOptimizationStore.getState().error).toEqual({ message: 'Previous error', code: 'LLM_ERROR' });

    const analysis: KeywordAnalysisResult = {
      matched: [],
      missing: [],
      matchRate: 0,
      analyzedAt: new Date().toISOString()
    };

    useOptimizationStore.getState().setKeywordAnalysis(analysis);
    expect(useOptimizationStore.getState().error).toBeNull();
  });

  it('should reset keyword analysis when calling reset()', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [],
      missing: [],
      matchRate: 50,
      analyzedAt: new Date().toISOString()
    };

    useOptimizationStore.getState().setKeywordAnalysis(analysis);
    expect(useOptimizationStore.getState().keywordAnalysis).not.toBeNull();

    useOptimizationStore.getState().reset();
    expect(useOptimizationStore.getState().keywordAnalysis).toBeNull();
  });

  it('should load keyword analysis from session', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [
        {
          keyword: 'AWS',
          category: KeywordCategory.TECHNOLOGIES,
          found: true,
          context: 'AWS experience',
          matchType: 'exact'
        }
      ],
      missing: [],
      matchRate: 100,
      analyzedAt: new Date().toISOString()
    };

    const session = {
      id: 'test-session-id',
      anonymousId: 'test-anon-id',
      resumeContent: null,
      jobDescription: null,
      analysisResult: null,
      suggestions: null,
      keywordAnalysis: analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    useOptimizationStore.getState().loadFromSession(session);

    const state = useOptimizationStore.getState();
    expect(state.keywordAnalysis).toEqual(analysis);
    expect(state.sessionId).toBe('test-session-id');
  });

  it('should provide selectKeywordAnalysis selector', () => {
    const analysis: KeywordAnalysisResult = {
      matched: [],
      missing: [],
      matchRate: 0,
      analyzedAt: new Date().toISOString()
    };

    useOptimizationStore.getState().setKeywordAnalysis(analysis);

    const selected = selectKeywordAnalysis(useOptimizationStore.getState());
    expect(selected).toEqual(analysis);
  });

  it('should handle null keyword analysis in loadFromSession', () => {
    const session = {
      id: 'test-session-id',
      anonymousId: 'test-anon-id',
      resumeContent: null,
      jobDescription: null,
      analysisResult: null,
      suggestions: null,
      keywordAnalysis: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    useOptimizationStore.getState().loadFromSession(session);

    const state = useOptimizationStore.getState();
    expect(state.keywordAnalysis).toBeNull();
  });
});

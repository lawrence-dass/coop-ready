// Unit Tests for Zustand Store ATS Score State
// Story 5.2: Implement ATS Score Calculation

import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizationStore, selectATSScore, selectOverallScore, selectScoreBreakdown } from '@/store/useOptimizationStore';
import type { ATSScore } from '@/types/analysis';

describe('useOptimizationStore - ATS Score State', () => {
  // Reset store before each test
  beforeEach(() => {
    useOptimizationStore.getState().reset();
  });

  describe('setATSScore Action', () => {
    it('[P0] should store ATS score in state', () => {
      const atsScore: ATSScore = {
        overall: 85,
        breakdown: {
          keywordScore: 80,
          sectionCoverageScore: 100,
          contentQualityScore: 90
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);

      const state = useOptimizationStore.getState();
      expect(state.atsScore).toEqual(atsScore);
      expect(state.error).toBeNull();
    });

    it('[P1] should clear error when setting score', () => {
      // Set an error first
      useOptimizationStore.getState().setError('Previous error');

      const atsScore: ATSScore = {
        overall: 75,
        breakdown: {
          keywordScore: 70,
          sectionCoverageScore: 67,
          contentQualityScore: 85
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);

      const state = useOptimizationStore.getState();
      expect(state.atsScore).toEqual(atsScore);
      expect(state.error).toBeNull(); // Error cleared
    });

    it('[P1] should allow setting atsScore to null', () => {
      // Set a score first
      const atsScore: ATSScore = {
        overall: 90,
        breakdown: {
          keywordScore: 90,
          sectionCoverageScore: 100,
          contentQualityScore: 85
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);
      expect(useOptimizationStore.getState().atsScore).not.toBeNull();

      // Clear the score
      useOptimizationStore.getState().setATSScore(null);
      expect(useOptimizationStore.getState().atsScore).toBeNull();
    });
  });

  describe('selectATSScore Selector', () => {
    it('[P0] should return atsScore from state', () => {
      const atsScore: ATSScore = {
        overall: 88,
        breakdown: {
          keywordScore: 85,
          sectionCoverageScore: 100,
          contentQualityScore: 90
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);

      const selectedScore = selectATSScore(useOptimizationStore.getState());
      expect(selectedScore).toEqual(atsScore);
    });

    it('[P1] should return null when no score set', () => {
      const selectedScore = selectATSScore(useOptimizationStore.getState());
      expect(selectedScore).toBeNull();
    });
  });

  describe('selectOverallScore Selector', () => {
    it('[P0] should return overall score number', () => {
      const atsScore: ATSScore = {
        overall: 92,
        breakdown: {
          keywordScore: 95,
          sectionCoverageScore: 100,
          contentQualityScore: 85
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);

      const overallScore = selectOverallScore(useOptimizationStore.getState());
      expect(overallScore).toBe(92);
    });

    it('[P1] should return null when no score set', () => {
      const overallScore = selectOverallScore(useOptimizationStore.getState());
      expect(overallScore).toBeNull();
    });

    it('[P1] should return null when atsScore is null', () => {
      useOptimizationStore.getState().setATSScore(null);

      const overallScore = selectOverallScore(useOptimizationStore.getState());
      expect(overallScore).toBeNull();
    });
  });

  describe('selectScoreBreakdown Selector', () => {
    it('[P0] should return score breakdown object', () => {
      const atsScore: ATSScore = {
        overall: 87,
        breakdown: {
          keywordScore: 85,
          sectionCoverageScore: 100,
          contentQualityScore: 83
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);

      const breakdown = selectScoreBreakdown(useOptimizationStore.getState());
      expect(breakdown).toEqual({
        keywordScore: 85,
        sectionCoverageScore: 100,
        contentQualityScore: 83
      });
    });

    it('[P1] should return null when no score set', () => {
      const breakdown = selectScoreBreakdown(useOptimizationStore.getState());
      expect(breakdown).toBeNull();
    });

    it('[P1] should return null when atsScore is null', () => {
      useOptimizationStore.getState().setATSScore(null);

      const breakdown = selectScoreBreakdown(useOptimizationStore.getState());
      expect(breakdown).toBeNull();
    });
  });

  describe('reset Action', () => {
    it('[P0] should clear atsScore on reset', () => {
      const atsScore: ATSScore = {
        overall: 80,
        breakdown: {
          keywordScore: 75,
          sectionCoverageScore: 100,
          contentQualityScore: 78
        },
        calculatedAt: new Date().toISOString()
      };

      useOptimizationStore.getState().setATSScore(atsScore);
      expect(useOptimizationStore.getState().atsScore).not.toBeNull();

      useOptimizationStore.getState().reset();
      expect(useOptimizationStore.getState().atsScore).toBeNull();
    });
  });

  describe('loadFromSession Action', () => {
    it('[P0] should hydrate atsScore from session', () => {
      const atsScore: ATSScore = {
        overall: 91,
        breakdown: {
          keywordScore: 90,
          sectionCoverageScore: 100,
          contentQualityScore: 88
        },
        calculatedAt: new Date().toISOString()
      };

      const mockSession = {
        id: 'session-123',
        anonymousId: 'anon-456',
        userId: null,
        resumeContent: null,
        jobDescription: null,
        analysisResult: null,
        suggestions: null,
        keywordAnalysis: null,
        atsScore: atsScore,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const state = useOptimizationStore.getState();
      expect(state.atsScore).toEqual(atsScore);
      expect(state.sessionId).toBe('session-123');
    });

    it('[P1] should handle null atsScore in session', () => {
      const mockSession = {
        id: 'session-123',
        anonymousId: 'anon-456',
        userId: null,
        resumeContent: null,
        jobDescription: null,
        analysisResult: null,
        suggestions: null,
        keywordAnalysis: null,
        atsScore: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const state = useOptimizationStore.getState();
      expect(state.atsScore).toBeNull();
    });

    it('[P1] should handle undefined atsScore in session', () => {
      const mockSession = {
        id: 'session-123',
        anonymousId: 'anon-456',
        userId: null,
        resumeContent: null,
        jobDescription: null,
        analysisResult: null,
        suggestions: null,
        keywordAnalysis: null,
        atsScore: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const state = useOptimizationStore.getState();
      expect(state.atsScore).toBeNull(); // undefined → null conversion
    });
  });

  describe('Initial State', () => {
    it('[P0] should initialize atsScore as null', () => {
      const state = useOptimizationStore.getState();
      expect(state.atsScore).toBeNull();
    });
  });
});

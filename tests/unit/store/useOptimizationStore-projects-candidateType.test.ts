/**
 * Story 18.7: Store Projects, Candidate Type & Structural Suggestions Tests
 * Tests for new store fields: projectsSuggestion, candidateType, structuralSuggestions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import type { ProjectsSuggestion, StructuralSuggestion } from '@/types/suggestions';
import type { CandidateType } from '@/lib/scoring/types';
import type { OptimizationSession } from '@/types/optimization';

// ============================================================================
// TEST FIXTURES - Matching actual type definitions from types/suggestions.ts
// ============================================================================

function createMockProjectsSuggestion(overrides?: Partial<ProjectsSuggestion>): ProjectsSuggestion {
  return {
    original: 'Original projects section text',
    project_entries: [
      {
        title: 'E-commerce Platform',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        dates: 'Fall 2025',
        original_bullets: ['Built a shopping cart feature'],
        suggested_bullets: [
          {
            original: 'Built a shopping cart feature',
            suggested: 'Engineered full-stack shopping cart with React and Node.js, reducing checkout abandonment by 15%',
            keywords_incorporated: ['React', 'Node.js', 'full-stack'],
          },
        ],
      },
    ],
    total_point_value: 8,
    summary: 'Optimized project bullets with quantified impact and keyword alignment',
    ...overrides,
  };
}

function createMockStructuralSuggestion(overrides?: Partial<StructuralSuggestion>): StructuralSuggestion {
  return {
    id: 'rule-coop-edu-before-exp',
    priority: 'high',
    category: 'section_order',
    message: 'Move Education before Experience for co-op candidates',
    currentState: 'Experience appears before Education',
    recommendedAction: 'Reorder sections: Education → Projects → Experience',
    ...overrides,
  };
}

describe('useOptimizationStore - Projects, CandidateType & Structural Suggestions (Story 18.7)', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  // ============================================================================
  // INITIAL STATE TESTS
  // ============================================================================

  describe('[P0] Initial State', () => {
    it('11.2: should initialize projectsSuggestion as null', () => {
      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toBeNull();
    });

    it('11.2: should initialize candidateType as null', () => {
      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBeNull();
    });

    it('11.2: should initialize structuralSuggestions as empty array', () => {
      const { structuralSuggestions } = useOptimizationStore.getState();
      expect(structuralSuggestions).toEqual([]);
    });
  });

  // ============================================================================
  // SETTER TESTS
  // ============================================================================

  describe('[P0] Setters', () => {
    it('11.3: setProjectsSuggestion should set projectsSuggestion', () => {
      const mock = createMockProjectsSuggestion();

      useOptimizationStore.getState().setProjectsSuggestion(mock);

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toEqual(mock);
      expect(projectsSuggestion?.original).toBe('Original projects section text');
      expect(projectsSuggestion?.project_entries).toHaveLength(1);
    });

    it('11.3: setProjectsSuggestion should clear projectsSuggestion when passed null', () => {
      const mock = createMockProjectsSuggestion();

      useOptimizationStore.getState().setProjectsSuggestion(mock);
      useOptimizationStore.getState().setProjectsSuggestion(null);

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toBeNull();
    });

    it('11.4: setCandidateType should set candidateType to coop', () => {
      useOptimizationStore.getState().setCandidateType('coop');

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBe('coop');
    });

    it('11.4: setCandidateType should set candidateType to fulltime', () => {
      useOptimizationStore.getState().setCandidateType('fulltime');

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBe('fulltime');
    });

    it('11.4: setCandidateType should set candidateType to career_changer', () => {
      useOptimizationStore.getState().setCandidateType('career_changer');

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBe('career_changer');
    });

    it('11.4: setCandidateType should clear candidateType when passed null', () => {
      useOptimizationStore.getState().setCandidateType('coop');
      useOptimizationStore.getState().setCandidateType(null);

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBeNull();
    });

    it('11.5: setStructuralSuggestions should set array of structural suggestions', () => {
      const mockSuggestions: StructuralSuggestion[] = [
        createMockStructuralSuggestion(),
        createMockStructuralSuggestion({
          id: 'rule-coop-add-projects',
          priority: 'moderate',
          category: 'section_presence',
          message: 'Add Projects section to showcase hands-on skills',
          currentState: 'No Projects section found',
          recommendedAction: 'Add a Projects section after Experience',
        }),
      ];

      useOptimizationStore.getState().setStructuralSuggestions(mockSuggestions);

      const { structuralSuggestions } = useOptimizationStore.getState();
      expect(structuralSuggestions).toEqual(mockSuggestions);
      expect(structuralSuggestions).toHaveLength(2);
    });
  });

  // ============================================================================
  // RESET TESTS
  // ============================================================================

  describe('[P0] reset()', () => {
    it('11.6: should clear projectsSuggestion', () => {
      useOptimizationStore.getState().setProjectsSuggestion(createMockProjectsSuggestion());
      useOptimizationStore.getState().reset();

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toBeNull();
    });

    it('11.6: should clear candidateType', () => {
      useOptimizationStore.getState().setCandidateType('coop');
      useOptimizationStore.getState().reset();

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBeNull();
    });

    it('11.6: should clear structuralSuggestions', () => {
      useOptimizationStore.getState().setStructuralSuggestions([createMockStructuralSuggestion()]);
      useOptimizationStore.getState().reset();

      const { structuralSuggestions } = useOptimizationStore.getState();
      expect(structuralSuggestions).toEqual([]);
    });
  });

  // ============================================================================
  // CLEAR RESUME AND RESULTS TESTS
  // ============================================================================

  describe('[P0] clearResumeAndResults()', () => {
    it('11.7: should clear projectsSuggestion', () => {
      useOptimizationStore.getState().setProjectsSuggestion(createMockProjectsSuggestion());
      useOptimizationStore.getState().clearResumeAndResults();

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toBeNull();
    });

    it('11.7: should clear candidateType', () => {
      useOptimizationStore.getState().setCandidateType('fulltime');
      useOptimizationStore.getState().clearResumeAndResults();

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBeNull();
    });

    it('11.7: should clear structuralSuggestions', () => {
      useOptimizationStore.getState().setStructuralSuggestions([createMockStructuralSuggestion()]);
      useOptimizationStore.getState().clearResumeAndResults();

      const { structuralSuggestions } = useOptimizationStore.getState();
      expect(structuralSuggestions).toEqual([]);
    });
  });

  // ============================================================================
  // LOAD FROM SESSION TESTS
  // ============================================================================

  describe('[P0] loadFromSession()', () => {
    it('11.8: should hydrate projectsSuggestion from session', () => {
      const mock = createMockProjectsSuggestion();

      const mockSession: OptimizationSession = {
        id: 'sess-456',
        anonymousId: 'anon-123',
        projectsSuggestion: mock,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toEqual(mock);
      expect(projectsSuggestion?.project_entries[0].title).toBe('E-commerce Platform');
    });

    it('11.8: should hydrate candidateType from session', () => {
      const mockSession: OptimizationSession = {
        id: 'sess-456',
        anonymousId: 'anon-123',
        candidateType: 'career_changer' as CandidateType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBe('career_changer');
    });

    it('11.8: should hydrate structuralSuggestions from session', () => {
      const mockSuggestions: StructuralSuggestion[] = [
        createMockStructuralSuggestion({ id: 'rule-from-db' }),
      ];

      const mockSession: OptimizationSession = {
        id: 'sess-456',
        anonymousId: 'anon-123',
        structuralSuggestions: mockSuggestions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const { structuralSuggestions } = useOptimizationStore.getState();
      expect(structuralSuggestions).toEqual(mockSuggestions);
      expect(structuralSuggestions[0].category).toBe('section_order');
    });

    it('[P1] 11.13: should handle undefined projectsSuggestion gracefully', () => {
      const mockSession: OptimizationSession = {
        id: 'sess-456',
        anonymousId: 'anon-123',
        // projectsSuggestion is undefined
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toBeNull();
    });

    it('[P1] 11.13: should handle undefined candidateType gracefully', () => {
      const mockSession: OptimizationSession = {
        id: 'sess-456',
        anonymousId: 'anon-123',
        // candidateType is undefined
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const { candidateType } = useOptimizationStore.getState();
      expect(candidateType).toBeNull();
    });

    it('[P1] 11.13: should handle undefined structuralSuggestions gracefully', () => {
      const mockSession: OptimizationSession = {
        id: 'sess-456',
        anonymousId: 'anon-123',
        // structuralSuggestions is undefined
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useOptimizationStore.getState().loadFromSession(mockSession);

      const { structuralSuggestions } = useOptimizationStore.getState();
      expect(structuralSuggestions).toEqual([]);
    });
  });

  // ============================================================================
  // REGENERATING SECTION TESTS
  // ============================================================================

  describe('[P0] isRegeneratingSection', () => {
    it('11.9: setRegeneratingSection should set projects regenerating flag', () => {
      useOptimizationStore.getState().setRegeneratingSection('projects', true);

      const { isRegeneratingSection } = useOptimizationStore.getState();
      expect(isRegeneratingSection.projects).toBe(true);
    });

    it('11.9: setRegeneratingSection should clear projects regenerating flag', () => {
      useOptimizationStore.getState().setRegeneratingSection('projects', true);
      useOptimizationStore.getState().setRegeneratingSection('projects', false);

      const { isRegeneratingSection } = useOptimizationStore.getState();
      expect(isRegeneratingSection.projects).toBe(false);
    });
  });

  // ============================================================================
  // UPDATE SECTION SUGGESTION TESTS
  // ============================================================================

  describe('[P0] updateSectionSuggestion', () => {
    it('11.10: should set projectsSuggestion when section is projects', () => {
      const mock = createMockProjectsSuggestion({ summary: 'Via updateSectionSuggestion' });

      useOptimizationStore.getState().updateSectionSuggestion('projects', mock);

      const { projectsSuggestion } = useOptimizationStore.getState();
      expect(projectsSuggestion).toEqual(mock);
      expect(projectsSuggestion?.summary).toBe('Via updateSectionSuggestion');
    });

    it('11.10: should clear error and generalError when updating projects suggestion', () => {
      // Set errors first
      useOptimizationStore.getState().setFileError({ code: 'INVALID_FILE_TYPE', message: 'Test error' });
      useOptimizationStore.getState().setGeneralError({ code: 'TEST_ERROR', message: 'Test general error' });

      const mock = createMockProjectsSuggestion();

      useOptimizationStore.getState().updateSectionSuggestion('projects', mock);

      const { error, generalError } = useOptimizationStore.getState();
      expect(error).toBeNull();
      expect(generalError).toBeNull();
    });
  });
});

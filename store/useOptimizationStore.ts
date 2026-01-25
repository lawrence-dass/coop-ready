/**
 * Optimization Zustand Store
 *
 * This store manages the application's optimization state including:
 * - Resume content
 * - Job description
 * - Analysis results
 * - Suggestions
 * - Session synchronization
 *
 * **Session Integration:**
 * - `sessionId` tracks the current database session
 * - `loadFromSession()` hydrates store from database data
 * - Changes trigger auto-save via useSessionSync hook
 *
 * @example
 * ```typescript
 * // In a component
 * import { useOptimizationStore } from '@/store';
 *
 * function MyComponent() {
 *   const resumeContent = useOptimizationStore((state) => state.resumeContent);
 *   const setResumeContent = useOptimizationStore((state) => state.setResumeContent);
 *
 *   // Use selectors for better performance
 *   const resume = useOptimizationStore(storeSelectors.resume);
 * }
 * ```
 */

import { create } from 'zustand';
import type { OptimizationStore } from '@/types/store';
import type { OptimizationSession } from '@/types/optimization';

// ============================================================================
// EXTENDED STORE INTERFACE
// ============================================================================

/**
 * Extended store interface with session tracking
 */
interface ExtendedOptimizationStore extends OptimizationStore {
  /** Current session ID from database (null if no session) */
  sessionId: string | null;

  /** Pending file awaiting parsing (Story 3.1 - not yet parsed) */
  pendingFile: File | null;

  /** Set the session ID */
  setSessionId: (id: string | null) => void;

  /** Set pending file before parsing */
  setPendingFile: (file: File | null) => void;

  /** Hydrate store from database session */
  loadFromSession: (session: OptimizationSession) => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

/**
 * Global optimization store
 *
 * **State Flow:**
 * 1. User signs in → Session restored → Store hydrated via loadFromSession()
 * 2. User makes changes → Store updated → Auto-saved to DB
 * 3. User refreshes → Session restored → Store hydrated again
 */
export const useOptimizationStore = create<ExtendedOptimizationStore>(
  (set) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================

    resumeContent: null,
    jobDescription: null,
    analysisResult: null,
    suggestions: null,
    isLoading: false,
    loadingStep: null,
    error: null,
    sessionId: null,
    pendingFile: null,

    // ============================================================================
    // DATA ACTIONS
    // ============================================================================

    setResumeContent: (resume) =>
      set({ resumeContent: resume, error: null }),

    setJobDescription: (jd) =>
      set({ jobDescription: jd, error: null }),

    setAnalysisResult: (result) =>
      set({ analysisResult: result, error: null }),

    setSuggestions: (suggestions) =>
      set({ suggestions, error: null }),

    // ============================================================================
    // UI STATE ACTIONS
    // ============================================================================

    setLoading: (loading, step) =>
      set({ isLoading: loading, loadingStep: step ?? null }),

    setError: (error) =>
      set({ error, isLoading: false, loadingStep: null }),

    // ============================================================================
    // SESSION ACTIONS
    // ============================================================================

    setSessionId: (id) =>
      set({ sessionId: id }),

    setPendingFile: (file) =>
      set({ pendingFile: file, error: null }),

    /**
     * Hydrate store from database session
     *
     * Called after session restoration on page load
     */
    loadFromSession: (session) =>
      set({
        sessionId: session.id,
        resumeContent: session.resumeContent ?? null,
        jobDescription: session.jobDescription ?? null,
        analysisResult: session.analysisResult ?? null,
        suggestions: session.suggestions ?? null,
        error: null,
      }),

    // ============================================================================
    // RESET ACTION
    // ============================================================================

    /**
     * Reset store to initial state
     *
     * **Use cases:**
     * - User signs out
     * - Starting a new optimization session
     * - Clearing all data
     */
    reset: () =>
      set({
        resumeContent: null,
        jobDescription: null,
        analysisResult: null,
        suggestions: null,
        isLoading: false,
        loadingStep: null,
        error: null,
        sessionId: null,
        pendingFile: null,
      }),
  })
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Memoized selectors for better performance
 *
 * Using selectors prevents unnecessary re-renders when only specific
 * parts of the store change.
 *
 * @example
 * ```typescript
 * const resume = useOptimizationStore(selectResume);
 * const isLoading = useOptimizationStore(selectIsLoading);
 * ```
 */

export const selectResume = (state: ExtendedOptimizationStore) =>
  state.resumeContent;

export const selectJobDescription = (state: ExtendedOptimizationStore) =>
  state.jobDescription;

export const selectAnalysisResult = (state: ExtendedOptimizationStore) =>
  state.analysisResult;

export const selectSuggestions = (state: ExtendedOptimizationStore) =>
  state.suggestions;

export const selectIsLoading = (state: ExtendedOptimizationStore) =>
  state.isLoading;

export const selectLoadingStep = (state: ExtendedOptimizationStore) =>
  state.loadingStep;

export const selectError = (state: ExtendedOptimizationStore) => state.error;

export const selectSessionId = (state: ExtendedOptimizationStore) =>
  state.sessionId;

export const selectPendingFile = (state: ExtendedOptimizationStore) =>
  state.pendingFile;

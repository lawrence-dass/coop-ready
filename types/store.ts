/**
 * Zustand Store Interface
 *
 * This defines the contract for the optimization store.
 * The actual store implementation will be in /store/useOptimizationStore.ts
 *
 * **Naming Conventions:**
 * - `isLoading` - Boolean loading states
 * - `loadingStep` - Multi-step progress indicator
 * - `isPending` - React useTransition states (in components, not store)
 */

import type {
  Resume,
  JobDescription,
  AnalysisResult,
  SuggestionSet,
  LoadingStep,
} from './optimization';
import type { ErrorCode } from './index';

// ============================================================================
// OPTIMIZATION STORE INTERFACE
// ============================================================================

/**
 * State shape for the optimization Zustand store
 *
 * **State Organization:**
 * - Data properties (nouns): resumeContent, jobDescription, etc.
 * - UI state: isLoading, loadingStep, error
 * - Actions (verbs): setResumeContent, setLoading, etc.
 *
 * @example
 * ```typescript
 * // Implementation (in /store/useOptimizationStore.ts)
 * import { create } from 'zustand';
 * import type { OptimizationStore } from '@/types/store';
 *
 * export const useOptimizationStore = create<OptimizationStore>((set) => ({
 *   // Initial state
 *   resumeContent: null,
 *   jobDescription: null,
 *   isLoading: false,
 *   loadingStep: null,
 *   error: null,
 *   analysisResult: null,
 *   suggestions: null,
 *
 *   // Actions
 *   setResumeContent: (resume) => set({ resumeContent: resume }),
 *   setJobDescription: (jd) => set({ jobDescription: jd }),
 *   setLoading: (loading, step) => set({ isLoading: loading, loadingStep: step }),
 *   setError: (error) => set({ error }),
 *   setAnalysisResult: (result) => set({ analysisResult: result }),
 *   setSuggestions: (suggestions) => set({ suggestions }),
 *   reset: () => set({
 *     resumeContent: null,
 *     jobDescription: null,
 *     isLoading: false,
 *     loadingStep: null,
 *     error: null,
 *     analysisResult: null,
 *     suggestions: null,
 *   }),
 * }));
 * ```
 */
export interface OptimizationStore {
  // ============================================================================
  // STATE PROPERTIES
  // ============================================================================

  /** Parsed resume content (null if not uploaded yet) */
  resumeContent: Resume | null;

  /** Job description content (null if not entered yet) - Epic 4 uses string */
  jobDescription: string | null;

  /** Keyword analysis results (null until analyzed) */
  analysisResult: AnalysisResult | null;

  /** Generated optimization suggestions (null until generated) */
  suggestions: SuggestionSet | null;

  /** Whether any async operation is in progress */
  isLoading: boolean;

  /** Current step in multi-step process (null when not loading) */
  loadingStep: LoadingStep;

  /** Error state (null if no error) */
  error: {
    message: string;
    code: ErrorCode;
  } | null;

  // ============================================================================
  // ACTION METHODS
  // ============================================================================

  /**
   * Set the resume content
   * Call after successful file parsing
   */
  setResumeContent: (resume: Resume | null) => void;

  /**
   * Set the job description content
   * Call after user enters or edits JD (Epic 4 uses string)
   */
  setJobDescription: (jd: string | null) => void;

  /**
   * Clear the job description content
   * Call when user wants to reset the JD field
   */
  clearJobDescription: () => void;

  /**
   * Set the analysis result
   * Call after keyword analysis completes
   */
  setAnalysisResult: (result: AnalysisResult | null) => void;

  /**
   * Set the optimization suggestions
   * Call after LLM generates suggestions
   */
  setSuggestions: (suggestions: SuggestionSet | null) => void;

  /**
   * Set loading state with optional step indicator
   *
   * @example
   * ```typescript
   * setLoading(true, 'parsing');  // Start parsing
   * setLoading(true, 'analyzing'); // Switch to analyzing
   * setLoading(false, null);      // Done
   * ```
   */
  setLoading: (loading: boolean, step?: LoadingStep) => void;

  /**
   * Set error state
   *
   * @example
   * ```typescript
   * setError({ message: 'File too large', code: 'FILE_TOO_LARGE' });
   * setError(null); // Clear error
   * ```
   */
  setError: (error: { message: string; code: ErrorCode } | null) => void;

  /**
   * Reset the entire store to initial state
   * Call when starting a new optimization session
   */
  reset: () => void;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Type-safe selector for accessing store state
 *
 * @example
 * ```typescript
 * const resume = useOptimizationStore(selectResume);
 * ```
 */
export type StoreSelector<T> = (state: OptimizationStore) => T;

/**
 * Common store selectors for convenience
 */
export const storeSelectors = {
  resume: (state: OptimizationStore) => state.resumeContent,
  jobDescription: (state: OptimizationStore) => state.jobDescription,
  isLoading: (state: OptimizationStore) => state.isLoading,
  loadingStep: (state: OptimizationStore) => state.loadingStep,
  error: (state: OptimizationStore) => state.error,
  analysisResult: (state: OptimizationStore) => state.analysisResult,
  suggestions: (state: OptimizationStore) => state.suggestions,
} as const;

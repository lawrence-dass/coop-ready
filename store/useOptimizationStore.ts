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
import type { KeywordAnalysisResult, ATSScore } from '@/types/analysis';
import { calculateBackoffDelay, delay, MAX_RETRY_ATTEMPTS } from '@/lib/retryUtils';
import { analyzeResume } from '@/actions/analyzeResume';

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

  /** File validation error (Story 3.2) */
  fileError: { code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE'; message: string } | null;

  /** Extracting state for PDF/DOCX parsing (Story 3.3/3.4) */
  isExtracting: boolean;

  /** Parsing state for resume section parsing (Story 3.5) */
  isParsing: boolean;

  /** Keyword analysis results (Story 5.1) */
  keywordAnalysis: KeywordAnalysisResult | null;

  /** ATS compatibility score (Story 5.2) */
  atsScore: ATSScore | null;

  /** Summary section suggestion (Story 6.2) */
  summarySuggestion: import('@/types/suggestions').SummarySuggestion | null;

  /** Skills section suggestion (Story 6.3) */
  skillsSuggestion: import('@/types/suggestions').SkillsSuggestion | null;

  /** Experience section suggestion (Story 6.4) */
  experienceSuggestion: import('@/types/suggestions').ExperienceSuggestion | null;

  /** Per-section regenerating state (Story 6.7) */
  isRegeneratingSection: {
    summary?: boolean;
    skills?: boolean;
    experience?: boolean;
  };

  /** General application error (Story 7.1) - for non-file-specific errors */
  generalError: { code: string; message?: string } | null;

  /** Retry state (Story 7.2) */
  retryCount: number;
  isRetrying: boolean;
  lastError: string | null;

  /** Set the session ID */
  setSessionId: (id: string | null) => void;

  /** Set pending file before parsing */
  setPendingFile: (file: File | null) => void;

  /** Set file validation error */
  setFileError: (error: { code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE'; message: string } | null) => void;

  /** Set extracting state */
  setIsExtracting: (extracting: boolean) => void;

  /** Set parsing state */
  setIsParsing: (parsing: boolean) => void;

  /** Set keyword analysis results (Story 5.1) */
  setKeywordAnalysis: (analysis: KeywordAnalysisResult | null) => void;

  /** Clear keyword analysis results (Story 5.1) */
  clearKeywordAnalysis: () => void;

  /** Set ATS score (Story 5.2) */
  setATSScore: (score: ATSScore | null) => void;

  /** Set summary suggestion (Story 6.2) */
  setSummarySuggestion: (suggestion: import('@/types/suggestions').SummarySuggestion | null) => void;

  /** Set skills suggestion (Story 6.3) */
  setSkillsSuggestion: (suggestion: import('@/types/suggestions').SkillsSuggestion | null) => void;

  /** Set experience suggestion (Story 6.4) */
  setExperienceSuggestion: (suggestion: import('@/types/suggestions').ExperienceSuggestion | null) => void;

  /** Set regenerating state for a specific section (Story 6.7) */
  setRegeneratingSection: (section: 'summary' | 'skills' | 'experience', isLoading: boolean) => void;

  /** Update suggestion for a specific section (Story 6.7) */
  updateSectionSuggestion: (
    section: 'summary' | 'skills' | 'experience',
    suggestion: import('@/types/suggestions').SummarySuggestion | import('@/types/suggestions').SkillsSuggestion | import('@/types/suggestions').ExperienceSuggestion
  ) => void;

  /** Set general error (Story 7.1) - for non-file-specific errors */
  setGeneralError: (error: { code: string; message?: string } | null) => void;

  /** Clear general error (Story 7.1) */
  clearGeneralError: () => void;

  /** Increment retry count (Story 7.2) */
  incrementRetryCount: () => void;

  /** Reset retry count to 0 (Story 7.2) */
  resetRetryCount: () => void;

  /** Set isRetrying state (Story 7.2) */
  setIsRetrying: (isRetrying: boolean) => void;

  /** Set last error code (Story 7.2) */
  setLastError: (errorCode: string | null) => void;

  /** Retry optimization with same inputs (Story 7.2) */
  retryOptimization: () => Promise<void>;

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
    fileError: null,
    isExtracting: false,
    isParsing: false,
    keywordAnalysis: null,
    atsScore: null,
    summarySuggestion: null,
    skillsSuggestion: null,
    experienceSuggestion: null,
    isRegeneratingSection: {},
    generalError: null,
    retryCount: 0,
    isRetrying: false,
    lastError: null,

    // ============================================================================
    // DATA ACTIONS
    // ============================================================================

    setResumeContent: (resume) =>
      set({ resumeContent: resume, error: null, retryCount: 0 }),

    setJobDescription: (jd) =>
      set({ jobDescription: jd, error: null, retryCount: 0 }),

    clearJobDescription: () =>
      set({ jobDescription: null, error: null }),

    setAnalysisResult: (result) =>
      set({ analysisResult: result, error: null, generalError: null, retryCount: 0 }),

    setSuggestions: (suggestions) =>
      set({ suggestions, error: null, generalError: null }),

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
      set({ pendingFile: file, error: null, fileError: null }),

    setFileError: (error) =>
      set({ fileError: error }),

    setIsExtracting: (extracting) =>
      set({ isExtracting: extracting }),

    setIsParsing: (parsing) =>
      set({ isParsing: parsing }),

    setKeywordAnalysis: (analysis) =>
      set({ keywordAnalysis: analysis, error: null }),

    clearKeywordAnalysis: () =>
      set({ keywordAnalysis: null }),

    setATSScore: (score) =>
      set({ atsScore: score, error: null }),

    setSummarySuggestion: (suggestion) =>
      set({ summarySuggestion: suggestion, error: null }),

    setSkillsSuggestion: (suggestion) =>
      set({ skillsSuggestion: suggestion, error: null }),

    setExperienceSuggestion: (suggestion) =>
      set({ experienceSuggestion: suggestion, error: null }),

    setRegeneratingSection: (section, isLoading) =>
      set((state) => ({
        isRegeneratingSection: {
          ...state.isRegeneratingSection,
          [section]: isLoading,
        },
      })),

    updateSectionSuggestion: (section, suggestion) => {
      if (section === 'summary') {
        set({ summarySuggestion: suggestion as import('@/types/suggestions').SummarySuggestion, error: null, generalError: null });
      } else if (section === 'skills') {
        set({ skillsSuggestion: suggestion as import('@/types/suggestions').SkillsSuggestion, error: null, generalError: null });
      } else if (section === 'experience') {
        set({ experienceSuggestion: suggestion as import('@/types/suggestions').ExperienceSuggestion, error: null, generalError: null });
      }
    },

    setGeneralError: (error) =>
      set({ generalError: error, isLoading: false, loadingStep: null }),

    clearGeneralError: () =>
      set({ generalError: null }),

    incrementRetryCount: () =>
      set((state) => ({ retryCount: state.retryCount + 1 })),

    resetRetryCount: () =>
      set({ retryCount: 0 }),

    setIsRetrying: (isRetrying) =>
      set({ isRetrying }),

    setLastError: (errorCode) =>
      set({ lastError: errorCode }),

    retryOptimization: async () => {
      const state = useOptimizationStore.getState();

      // Guard: prevent retries beyond max limit
      if (state.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.warn('[retryOptimization] Max retry attempts reached');
        return;
      }

      // Validate session ID exists
      if (!state.sessionId) {
        console.error('[retryOptimization] No session ID available');
        return;
      }

      const sessionId = state.sessionId;

      try {
        // Increment retry count and read fresh value
        state.incrementRetryCount();
        const currentRetryCount = useOptimizationStore.getState().retryCount;

        // Calculate exponential backoff delay
        const backoffDelay = calculateBackoffDelay(currentRetryCount);
        console.log(`[retryOptimization] Attempt ${currentRetryCount}, waiting ${backoffDelay}ms before retry`);

        // Set retrying state and clear old error
        state.setIsRetrying(true);
        state.clearGeneralError();

        // Wait for backoff delay
        await delay(backoffDelay);

        // Call analyze action with same session
        const result = await analyzeResume(sessionId);

        // Handle result
        if (result.error) {
          // Retry failed - update error
          console.error('[retryOptimization] Retry failed:', result.error.code);
          useOptimizationStore.getState().setGeneralError({ code: result.error.code, message: result.error.message });
          useOptimizationStore.getState().setLastError(result.error.code);
        } else {
          // Retry succeeded - clear error and update results
          console.log('[retryOptimization] Retry succeeded');
          const freshState = useOptimizationStore.getState();
          freshState.setKeywordAnalysis(result.data.keywordAnalysis);
          freshState.setATSScore(result.data.atsScore);
          freshState.clearGeneralError();
          freshState.resetRetryCount();
          freshState.setLastError(null);
        }
      } catch (error) {
        console.error('[retryOptimization] Unexpected error:', error);
        useOptimizationStore.getState().setGeneralError({
          code: 'LLM_ERROR',
          message: error instanceof Error ? error.message : 'Retry failed',
        });
      } finally {
        // Always clear retrying state
        useOptimizationStore.getState().setIsRetrying(false);
      }
    },

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
        keywordAnalysis: session.keywordAnalysis ?? null,
        atsScore: session.atsScore ?? null,
        summarySuggestion: session.summarySuggestion ?? null,
        skillsSuggestion: session.skillsSuggestion ?? null,
        experienceSuggestion: session.experienceSuggestion ?? null,
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
        fileError: null,
        isExtracting: false,
        isParsing: false,
        keywordAnalysis: null,
        atsScore: null,
        summarySuggestion: null,
        skillsSuggestion: null,
        experienceSuggestion: null,
        isRegeneratingSection: {},
        generalError: null,
        retryCount: 0,
        isRetrying: false,
        lastError: null,
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

export const selectFileError = (state: ExtendedOptimizationStore) =>
  state.fileError;

export const selectIsExtracting = (state: ExtendedOptimizationStore) =>
  state.isExtracting;

export const selectIsParsing = (state: ExtendedOptimizationStore) =>
  state.isParsing;

export const selectKeywordAnalysis = (state: ExtendedOptimizationStore) =>
  state.keywordAnalysis;

export const selectATSScore = (state: ExtendedOptimizationStore) =>
  state.atsScore;

export const selectOverallScore = (state: ExtendedOptimizationStore) =>
  state.atsScore?.overall ?? null;

export const selectScoreBreakdown = (state: ExtendedOptimizationStore) =>
  state.atsScore?.breakdown ?? null;

export const selectSummarySuggestion = (state: ExtendedOptimizationStore) =>
  state.summarySuggestion;

export const selectSkillsSuggestion = (state: ExtendedOptimizationStore) =>
  state.skillsSuggestion;

export const selectExperienceSuggestion = (state: ExtendedOptimizationStore) =>
  state.experienceSuggestion;

export const selectIsRegeneratingSection = (state: ExtendedOptimizationStore) =>
  state.isRegeneratingSection;

export const selectGeneralError = (state: ExtendedOptimizationStore) =>
  state.generalError;

export const selectRetryCount = (state: ExtendedOptimizationStore) =>
  state.retryCount;

export const selectIsRetrying = (state: ExtendedOptimizationStore) =>
  state.isRetrying;

export const selectLastError = (state: ExtendedOptimizationStore) =>
  state.lastError;

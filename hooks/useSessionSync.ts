/**
 * Session Auto-Save Hook
 *
 * Automatically saves store changes to the database with debouncing
 * to prevent excessive writes.
 *
 * **Features:**
 * - Debounced saves (500ms delay)
 * - State hash comparison (skip unchanged saves)
 * - Graceful error handling (toast notification)
 * - Cleanup on unmount
 *
 * **Usage:**
 * Call this hook in SessionProvider to enable auto-save globally.
 *
 * @example
 * ```typescript
 * function SessionProvider({ children }) {
 *   useSessionSync(); // Enable auto-save
 *   return <>{children}</>;
 * }
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  useOptimizationStore,
  selectSessionId,
  selectResume,
  selectJobDescription,
  selectAnalysisResult,
  selectSuggestions,
} from '@/store';
import { updateSession } from '@/lib/supabase/sessions';

/**
 * Hook to automatically save store changes to database
 *
 * **How it works:**
 * 1. Watches for changes to resume, JD, analysis, suggestions
 * 2. Compares state hash to skip unchanged data
 * 3. Debounces saves by 500ms to batch rapid changes
 * 4. Saves to database using updateSession()
 * 5. Shows toast on error, doesn't block user
 */
export function useSessionSync() {
  const sessionId = useOptimizationStore(selectSessionId);

  // Select individual fields to avoid object reference issues
  const resumeContent = useOptimizationStore(selectResume);
  const jobDescription = useOptimizationStore(selectJobDescription);
  const analysisResult = useOptimizationStore(selectAnalysisResult);
  const suggestions = useOptimizationStore(selectSuggestions);

  // Track last saved state to avoid duplicate saves
  const lastSavedHashRef = useRef<string | null>(null);

  // Debounce timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if component is mounted to prevent post-unmount state updates
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if no session ID (not ready yet)
    if (!sessionId) {
      return;
    }

    // Create session data object from individual fields
    const sessionData = {
      resumeContent,
      jobDescription,
      analysisResult,
      suggestions,
    };

    // Create hash of current state for comparison
    const currentHash = JSON.stringify(sessionData);

    // Skip if data hasn't changed
    if (currentHash === lastSavedHashRef.current) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce the save (500ms delay)
    saveTimerRef.current = setTimeout(async () => {
      // Check if still mounted before async operation
      if (!isMountedRef.current) {
        return;
      }

      try {
        console.log('[SS:sync] Auto-saving session:', sessionId.slice(0, 8) + '...');
        const { error } = await updateSession(sessionId, sessionData);

        // Check again after async operation
        if (!isMountedRef.current) {
          return;
        }

        if (error) {
          // Show error toast but don't block user
          console.log('[SS:sync] Auto-save failed:', error.message);
          toast.error(`Failed to auto-save: ${error.message}`);
          return;
        }

        // Update last saved hash on success
        console.log('[SS:sync] Auto-save successful');
        lastSavedHashRef.current = currentHash;
      } catch (err) {
        // Catch unexpected errors (only show if still mounted)
        if (isMountedRef.current) {
          toast.error('Failed to auto-save session');
          console.error('Session sync error:', err);
        }
      }
    }, 500);

    // Cleanup function
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [sessionId, resumeContent, jobDescription, analysisResult, suggestions]);
}

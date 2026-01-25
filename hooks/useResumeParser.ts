import { useCallback, useTransition, useRef, useEffect } from 'react';
import { useOptimizationStore } from '@/store';
import { parseResumeText } from '@/actions/parseResumeText';
import { toast } from 'sonner';
import type { Resume } from '@/types/optimization';

interface UseResumeParserOptions {
  onSuccess?: (resume: Resume) => void;
  onError?: (error: { code: string; message: string }) => void;
}

/**
 * Hook for parsing extracted resume text into structured sections
 *
 * This hook orchestrates the LLM-based parsing of raw resume text,
 * handles loading states, shows notifications, and stores the result.
 *
 * @param options - Optional callbacks for success/error handling
 * @returns Object with parse function and isPending state
 *
 * @example
 * ```tsx
 * const { parse, isPending } = useResumeParser({
 *   onSuccess: (resume) => console.log('Parsed:', resume),
 *   onError: (error) => console.error('Parse failed:', error)
 * });
 *
 * // Call parse with extracted text
 * parse(extractedText);
 * ```
 */
export function useResumeParser(options: UseResumeParserOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const store = useOptimizationStore();

  // Use refs for callbacks to avoid stale closure issues and prevent
  // unnecessary re-creation of the parse callback when options object changes
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  // Keep refs updated
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  const parse = useCallback(
    (rawText: string) => {
      // Validate input
      if (!rawText || rawText.trim().length === 0) {
        toast.error('Cannot parse empty resume text');
        return;
      }

      startTransition(async () => {
        // Call server action to parse resume sections
        const { data, error } = await parseResumeText(rawText);

        if (error) {
          toast.error(error.message);
          onErrorRef.current?.(error);
          return;
        }

        // Store parsed resume in Zustand
        const parsedResume = data!;
        store.setResumeContent(parsedResume);

        // Build success message showing which sections were found
        const sections = [
          parsedResume.summary ? 'Summary' : null,
          parsedResume.skills ? 'Skills' : null,
          parsedResume.experience ? 'Experience' : null,
          parsedResume.education ? 'Education' : null,
        ]
          .filter(Boolean)
          .join(', ');

        toast.success(`Parsed resume sections: ${sections}`);
        onSuccessRef.current?.(parsedResume);
      });
    },
    [store]
  );

  return { parse, isPending };
}

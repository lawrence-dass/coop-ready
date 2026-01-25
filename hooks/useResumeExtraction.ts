import { useCallback, useTransition, useRef, useEffect } from 'react';
import { useOptimizationStore } from '@/store';
import { extractPdfText } from '@/actions/extractPdfText';
import { toast } from 'sonner';

/** Maximum extraction time before showing slow warning (AC: 3 seconds) */
const EXTRACTION_TIMEOUT_MS = 3000;

interface UseResumeExtractionOptions {
  onSuccess?: (text: string, pageCount: number) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export function useResumeExtraction(options: UseResumeExtractionOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const store = useOptimizationStore();

  // Use refs for callbacks to avoid stale closure issues (H2 fix)
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  // Keep refs updated
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  const extract = useCallback(
    (file: File) => {
      // Server action validates file type, so we just start extraction
      store.setIsExtracting(true);

      // Timeout warning for slow extractions (AC: 3 second requirement)
      const timeoutId = setTimeout(() => {
        toast.info('This file is taking longer than expected...');
      }, EXTRACTION_TIMEOUT_MS);

      startTransition(async () => {
        const { data, error } = await extractPdfText(file);

        clearTimeout(timeoutId);
        store.setIsExtracting(false);

        if (error) {
          toast.error(error.message);
          onErrorRef.current?.(error);
          return;
        }

        if (data) {
          // Store extracted text
          store.setResumeContent(data.text);
          store.setPendingFile(null); // Clear pending file
          toast.success(`Extracted ${data.pageCount} page(s) from PDF`);
          onSuccessRef.current?.(data.text, data.pageCount);
        }
      });
    },
    [store]
  );

  return { extract, isPending };
}

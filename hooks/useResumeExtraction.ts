import { useCallback, useTransition, useRef, useEffect } from 'react';
import { useOptimizationStore } from '@/store';
import { extractPdfText } from '@/actions/extractPdfText';
import { extractDocxText } from '@/actions/extractDocxText';
import { toast } from 'sonner';

/** Maximum extraction time before showing slow warning (AC: 3 seconds) */
const EXTRACTION_TIMEOUT_MS = 3000;

/** MIME type constants for supported file types */
export const MIME_TYPE_PDF = 'application/pdf';
export const MIME_TYPE_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface UseResumeExtractionOptions {
  onSuccess?: (text: string, itemCount: number) => void;
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
      // Detect file type using constants
      const isPdf = file.type === MIME_TYPE_PDF;
      const isDocx = file.type === MIME_TYPE_DOCX;

      // Validate supported file types
      if (!isPdf && !isDocx) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }

      // Server action validates file type, so we just start extraction
      store.setIsExtracting(true);

      // Timeout warning for slow extractions (AC: 3 second requirement)
      const timeoutId = setTimeout(() => {
        toast.info('This file is taking longer than expected...');
      }, EXTRACTION_TIMEOUT_MS);

      startTransition(async () => {
        // Route to appropriate extraction function based on file type
        // Handle PDF extraction
        if (isPdf) {
          const { data, error } = await extractPdfText(file);

          clearTimeout(timeoutId);
          store.setIsExtracting(false);

          if (error) {
            toast.error(error.message);
            onErrorRef.current?.(error);
            return;
          }

          if (data) {
            store.setResumeContent(data.text);
            store.setPendingFile(null);
            toast.success(`Extracted ${data.pageCount} page(s) from PDF`);
            onSuccessRef.current?.(data.text, data.pageCount);
          }
        } else {
          // Handle DOCX extraction
          const { data, error } = await extractDocxText(file);

          clearTimeout(timeoutId);
          store.setIsExtracting(false);

          if (error) {
            toast.error(error.message);
            onErrorRef.current?.(error);
            return;
          }

          if (data) {
            store.setResumeContent(data.text);
            store.setPendingFile(null);
            toast.success(`Extracted ${data.paragraphCount} paragraph(s) from DOCX`);
            onSuccessRef.current?.(data.text, data.paragraphCount);
          }
        }
      });
    },
    [store]
  );

  return { extract, isPending };
}

import { useCallback, useTransition, useRef, useEffect } from 'react';
import { useOptimizationStore } from '@/store';
import { extractPdfText } from '@/actions/extractPdfText';
import { extractDocxText } from '@/actions/extractDocxText';
import { parseResumeText } from '@/actions/parseResumeText';
import { toast } from 'sonner';
import type { Resume } from '@/types/optimization';

/** Maximum extraction time before showing slow warning (AC: 3 seconds) */
const EXTRACTION_TIMEOUT_MS = 3000;

/** MIME type for PDF files */
export const MIME_TYPE_PDF = 'application/pdf';

/** MIME type for DOCX (Office Open XML) files */
export const MIME_TYPE_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface UseResumeExtractionOptions {
  onSuccess?: (text: string, itemCount: number) => void;
  onError?: (error: { code: string; message: string }) => void;
}

/**
 * Build a human-readable list of parsed resume sections
 */
function formatParsedSections(resume: Resume): string {
  const sections = [
    resume.summary ? 'Summary' : null,
    resume.skills ? 'Skills' : null,
    resume.experience ? 'Experience' : null,
    resume.education ? 'Education' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return sections || 'No sections found';
}

export function useResumeExtraction(options: UseResumeExtractionOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const store = useOptimizationStore();

  // Use refs for callbacks to avoid stale closure issues
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  // Keep refs updated
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  /**
   * Parse extracted text into structured Resume sections
   * Shared logic for both PDF and DOCX extraction flows
   */
  const parseAndStoreResume = async (
    text: string,
    file: File,
    itemCount: number
  ): Promise<boolean> => {
    store.setIsParsing(true);
    console.log('[SS:parse] Parsing resume sections...');
    toast.info('Parsing resume sections...');

    const parseResult = await parseResumeText(text, {
      filename: file.name,
      fileSize: file.size,
    });

    store.setIsParsing(false);

    if (parseResult.error) {
      toast.error(parseResult.error.message);
      onErrorRef.current?.(parseResult.error);
      return false;
    }

    // Store parsed Resume object with metadata
    const parsedResume = parseResult.data!;
    console.log('[SS:parse] Resume parsed:', { summary: !!parsedResume.summary, skills: !!parsedResume.skills, experience: !!parsedResume.experience, education: !!parsedResume.education });
    store.setResumeContent(parsedResume);
    store.setPendingFile(null);

    // Show success message with parsed sections
    toast.success(`Parsed resume sections: ${formatParsedSections(parsedResume)}`);
    onSuccessRef.current?.(text, itemCount);
    return true;
  };

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
      console.log('[SS:extract] Starting extraction:', file.name, `(${file.type}, ${(file.size / 1024).toFixed(1)}KB)`);
      store.setIsExtracting(true);

      // Timeout warning for slow extractions (AC: 3 second requirement)
      const timeoutId = setTimeout(() => {
        toast.info('This file is taking longer than expected...');
      }, EXTRACTION_TIMEOUT_MS);

      startTransition(async () => {
        // Route to appropriate extraction function based on file type
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
            console.log('[SS:extract] PDF extracted:', data.pageCount, 'pages,', data.text.length, 'chars');
            toast.success(`Extracted ${data.pageCount} page(s) from PDF`);
            await parseAndStoreResume(data.text, file, data.pageCount);
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
            console.log('[SS:extract] DOCX extracted:', data.paragraphCount, 'paragraphs,', data.text.length, 'chars');
            toast.success(`Extracted ${data.paragraphCount} paragraph(s) from DOCX`);
            await parseAndStoreResume(data.text, file, data.paragraphCount);
          }
        }
      });
    },
    [store, parseAndStoreResume]
  );

  return { extract, isPending };
}

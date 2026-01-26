'use server';

import { extractText } from 'unpdf';
import type { ActionResponse } from '@/types';

export async function extractPdfText(
  file: File
): Promise<ActionResponse<{ text: string; pageCount: number }>> {
  try {
    console.log('[SS:pdf] Extracting text from PDF:', file.name, `(${(file.size / 1024).toFixed(1)}KB)`);
    // Validate file type
    if (file.type !== 'application/pdf') {
      return {
        data: null,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File is not a PDF'
        }
      };
    }

    // Convert to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using unpdf with mergePages: true to get a single string
    const result = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });

    // Check if extraction returned any text
    if (!result || !result.text || result.text.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'This appears to be a scanned PDF with no extractable text. Please use an editable PDF.'
        }
      };
    }

    // Return extracted text
    console.log('[SS:pdf] Extraction complete:', result.totalPages || 1, 'pages,', result.text.length, 'chars');
    return {
      data: {
        text: result.text,
        pageCount: result.totalPages || 1
      },
      error: null
    };
  } catch (error) {
    // Handle specific error cases
    const message = error instanceof Error ? error.message : 'Unknown error';

    let errorMessage = 'Failed to extract text from PDF. Please try a different file.';

    if (message.includes('password') || message.includes('encrypted')) {
      errorMessage = 'This PDF is password protected. Please provide an unprotected version.';
    } else if (message.includes('Invalid PDF')) {
      errorMessage = 'Unable to parse this PDF. It may be corrupted or in an unsupported format.';
    }

    return {
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: errorMessage
      }
    };
  }
}

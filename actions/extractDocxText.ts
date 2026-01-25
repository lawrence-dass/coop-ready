'use server';

import mammoth from 'mammoth';
import type { ActionResponse } from '@/types';

export async function extractDocxText(
  file: File
): Promise<ActionResponse<{ text: string; paragraphCount: number }>> {
  try {
    // Validate file type
    if (
      file.type !==
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return {
        data: null,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File is not a DOCX document'
        }
      };
    }

    // Convert to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });

    // Check if extraction returned any text
    if (!result.value || result.value.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'This DOCX file appears to be empty. Please use a file with content.'
        }
      };
    }

    // Count paragraphs (rough estimate: split by newlines, filter non-empty)
    const paragraphCount = result.value
      .split('\n')
      .filter((p) => p.trim().length > 0).length;

    return {
      data: {
        text: result.value,
        paragraphCount
      },
      error: null
    };
  } catch (error) {
    // Handle specific error cases
    const message = error instanceof Error ? error.message : 'Unknown error';

    let errorMessage = 'Failed to extract text from DOCX. Please try a different file.';

    if (message.includes('password') || message.includes('encrypted')) {
      errorMessage =
        'This DOCX file is password protected. Please provide an unprotected version.';
    } else if (message.includes('zip') || message.includes('corrupt')) {
      errorMessage =
        'This file appears to be corrupted. Please try a different DOCX file.';
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

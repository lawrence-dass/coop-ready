import { describe, test, expect, vi, beforeEach } from 'vitest';
import { extractPdfText } from '@/actions/extractPdfText';
import { extractText } from 'unpdf';

/**
 * Story 3.3: PDF Text Extraction Unit Tests
 *
 * Tests server action for PDF text extraction including:
 * - Successful text extraction
 * - File type validation
 * - Error handling (encrypted, corrupted, scanned PDFs)
 * - Edge cases (empty text, whitespace only)
 *
 * Priority Distribution:
 * - P0: Core extraction and validation
 * - P1: Error cases and edge handling
 */

// Mock unpdf
vi.mock('unpdf', () => ({
  extractText: vi.fn()
}));

const mockExtractText = vi.mocked(extractText);

describe('Story 3.3: extractPdfText Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 3.3-UNIT-001: should successfully extract text from a valid PDF', async () => {
    // GIVEN: A valid PDF file
    const mockText = 'John Doe\nSoftware Engineer\nSkills: JavaScript, TypeScript';
    const mockFile = new File(['pdf content'], 'resume.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockResolvedValue({
      text: mockText,
      totalPages: 2
    });

    // WHEN: Extracting text from the PDF
    const result = await extractPdfText(mockFile);

    // THEN: Text should be extracted successfully
    expect(result.data).toEqual({
      text: mockText,
      pageCount: 2
    });
    expect(result.error).toBeNull();
    expect(mockExtractText).toHaveBeenCalledWith(expect.any(Uint8Array));
  });

  test('[P0] 3.3-UNIT-002: should return INVALID_FILE_TYPE error for non-PDF files', async () => {
    // GIVEN: A non-PDF file
    const mockFile = new File(['content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // WHEN: Attempting to extract text
    const result = await extractPdfText(mockFile);

    // THEN: Should return file type error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'INVALID_FILE_TYPE',
      message: 'File is not a PDF'
    });
    expect(mockExtractText).not.toHaveBeenCalled();
  });

  test('[P0] 3.3-UNIT-003: should return PARSE_ERROR for scanned PDFs with no text', async () => {
    // GIVEN: A scanned PDF with no extractable text
    const mockFile = new File(['pdf content'], 'scanned.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockResolvedValue({
      text: '',
      totalPages: 1
    });

    // WHEN: Attempting to extract text
    const result = await extractPdfText(mockFile);

    // THEN: Should return parse error for scanned PDF
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'This appears to be a scanned PDF with no extractable text. Please use an editable PDF.'
    });
  });

  test('[P0] 3.3-UNIT-004: should return PARSE_ERROR for password-protected PDFs', async () => {
    // GIVEN: A password-protected PDF
    const mockFile = new File(['pdf content'], 'encrypted.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockRejectedValue(new Error('PDF is password protected'));

    // WHEN: Attempting to extract text
    const result = await extractPdfText(mockFile);

    // THEN: Should return parse error for encrypted PDF
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'This PDF is password protected. Please provide an unprotected version.'
    });
  });

  test('[P1] 3.3-UNIT-005: should return PARSE_ERROR for corrupted PDFs', async () => {
    // GIVEN: A corrupted PDF file
    const mockFile = new File(['invalid content'], 'corrupted.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockRejectedValue(new Error('Invalid PDF structure'));

    // WHEN: Attempting to extract text
    const result = await extractPdfText(mockFile);

    // THEN: Should return parse error for corrupted PDF
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'Unable to parse this PDF. It may be corrupted or in an unsupported format.'
    });
  });

  test('[P1] 3.3-UNIT-006: should handle generic extraction errors', async () => {
    // GIVEN: A PDF that causes an unexpected error
    const mockFile = new File(['pdf content'], 'error.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockRejectedValue(new Error('Unexpected error'));

    // WHEN: Attempting to extract text
    const result = await extractPdfText(mockFile);

    // THEN: Should return generic parse error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'Failed to extract text from PDF. Please try a different file.'
    });
  });

  test('[P1] 3.3-UNIT-007: should default to pageCount 1 if totalPages is not provided', async () => {
    // GIVEN: A PDF where totalPages is undefined
    const mockFile = new File(['pdf content'], 'resume.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockResolvedValue({
      text: 'Some text',
      totalPages: undefined
    });

    // WHEN: Extracting text
    const result = await extractPdfText(mockFile);

    // THEN: Should default to pageCount 1
    expect(result.data).toEqual({
      text: 'Some text',
      pageCount: 1
    });
    expect(result.error).toBeNull();
  });

  test('[P1] 3.3-UNIT-008: should handle PDFs with only whitespace text', async () => {
    // GIVEN: A PDF with only whitespace
    const mockFile = new File(['pdf content'], 'whitespace.pdf', {
      type: 'application/pdf'
    });

    mockExtractText.mockResolvedValue({
      text: '   \n\n   ',
      totalPages: 1
    });

    // WHEN: Attempting to extract text
    const result = await extractPdfText(mockFile);

    // THEN: Should treat as scanned PDF with no text
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'This appears to be a scanned PDF with no extractable text. Please use an editable PDF.'
    });
  });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { extractDocxText } from '@/actions/extractDocxText';
import mammoth from 'mammoth';

/**
 * Story 3.4: DOCX Text Extraction Unit Tests
 *
 * Tests server action for DOCX text extraction including:
 * - Successful text extraction
 * - File type validation
 * - Error handling (encrypted, corrupted, empty DOCX files)
 * - Edge cases (empty text, whitespace only)
 *
 * Priority Distribution:
 * - P0: Core extraction and validation
 * - P1: Error cases and edge handling
 */

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn()
  }
}));

const mockExtractRawText = vi.mocked(mammoth.extractRawText);

describe('Story 3.4: extractDocxText Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 3.4-UNIT-001: should successfully extract text from a valid DOCX', async () => {
    // GIVEN: A valid DOCX file
    const mockText = 'John Doe\n\nSoftware Engineer\n\nSkills: JavaScript, TypeScript, React';
    const mockFile = new File(['docx content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockResolvedValue({
      value: mockText,
      messages: []
    });

    // WHEN: Extracting text from the DOCX
    const result = await extractDocxText(mockFile);

    // THEN: Text should be extracted successfully
    expect(result.data).toEqual({
      text: mockText,
      paragraphCount: 3 // 3 non-empty lines
    });
    expect(result.error).toBeNull();
    expect(mockExtractRawText).toHaveBeenCalledWith({
      buffer: expect.any(Buffer)
    });
  });

  test('[P0] 3.4-UNIT-002: should return INVALID_FILE_TYPE error for non-DOCX files', async () => {
    // GIVEN: A non-DOCX file
    const mockFile = new File(['content'], 'resume.pdf', {
      type: 'application/pdf'
    });

    // WHEN: Attempting to extract text
    const result = await extractDocxText(mockFile);

    // THEN: Should return file type error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'INVALID_FILE_TYPE',
      message: 'File is not a DOCX document'
    });
    expect(mockExtractRawText).not.toHaveBeenCalled();
  });

  test('[P0] 3.4-UNIT-003: should return PARSE_ERROR for empty DOCX files', async () => {
    // GIVEN: An empty DOCX file
    const mockFile = new File(['docx content'], 'empty.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockResolvedValue({
      value: '',
      messages: []
    });

    // WHEN: Attempting to extract text
    const result = await extractDocxText(mockFile);

    // THEN: Should return parse error for empty DOCX
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'This DOCX file appears to be empty. Please use a file with content.'
    });
  });

  test('[P0] 3.4-UNIT-004: should return PARSE_ERROR for password-protected DOCX', async () => {
    // GIVEN: A password-protected DOCX file
    const mockFile = new File(['docx content'], 'encrypted.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockRejectedValue(
      new Error('File is password protected')
    );

    // WHEN: Attempting to extract text
    const result = await extractDocxText(mockFile);

    // THEN: Should return parse error for encrypted DOCX
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message:
        'This DOCX file is password protected. Please provide an unprotected version.'
    });
  });

  test('[P1] 3.4-UNIT-005: should return PARSE_ERROR for corrupted DOCX', async () => {
    // GIVEN: A corrupted DOCX file
    const mockFile = new File(['invalid content'], 'corrupted.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockRejectedValue(
      new Error('Invalid zip file structure')
    );

    // WHEN: Attempting to extract text
    const result = await extractDocxText(mockFile);

    // THEN: Should return parse error for corrupted DOCX
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message:
        'This file appears to be corrupted. Please try a different DOCX file.'
    });
  });

  test('[P1] 3.4-UNIT-006: should handle generic extraction errors', async () => {
    // GIVEN: A DOCX that causes an unexpected error
    const mockFile = new File(['docx content'], 'error.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockRejectedValue(new Error('Unexpected error'));

    // WHEN: Attempting to extract text
    const result = await extractDocxText(mockFile);

    // THEN: Should return generic parse error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'Failed to extract text from DOCX. Please try a different file.'
    });
  });

  test('[P1] 3.4-UNIT-007: should handle DOCX with only whitespace text', async () => {
    // GIVEN: A DOCX with only whitespace
    const mockFile = new File(['docx content'], 'whitespace.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockResolvedValue({
      value: '   \n\n   ',
      messages: []
    });

    // WHEN: Attempting to extract text
    const result = await extractDocxText(mockFile);

    // THEN: Should treat as empty DOCX
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'PARSE_ERROR',
      message: 'This DOCX file appears to be empty. Please use a file with content.'
    });
  });

  test('[P1] 3.4-UNIT-008: should correctly count paragraphs in DOCX', async () => {
    // GIVEN: A DOCX with multiple paragraphs
    const mockText = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3\n\n\nParagraph 4';
    const mockFile = new File(['docx content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockResolvedValue({
      value: mockText,
      messages: []
    });

    // WHEN: Extracting text
    const result = await extractDocxText(mockFile);

    // THEN: Should correctly count non-empty paragraphs
    expect(result.data).toEqual({
      text: mockText,
      paragraphCount: 4 // 4 non-empty lines
    });
    expect(result.error).toBeNull();
  });

  test('[P1] 3.4-UNIT-009: should handle DOCX with warnings from mammoth', async () => {
    // GIVEN: A DOCX that triggers mammoth warnings
    const mockText = 'Resume content with unsupported formatting';
    const mockFile = new File(['docx content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    mockExtractRawText.mockResolvedValue({
      value: mockText,
      messages: [
        {
          type: 'warning',
          message: 'Unsupported style encountered'
        }
      ]
    });

    // WHEN: Extracting text
    const result = await extractDocxText(mockFile);

    // THEN: Should still extract text successfully (warnings don't prevent extraction)
    expect(result.data).toEqual({
      text: mockText,
      paragraphCount: 1
    });
    expect(result.error).toBeNull();
  });
});

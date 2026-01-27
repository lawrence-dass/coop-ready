/**
 * Tests for useResumeExtraction hook (Story 3.3/3.4)
 *
 * Verifies the extraction orchestration hook correctly:
 * - Routes PDF vs DOCX to correct extraction action
 * - Rejects unsupported file types
 * - Manages store extraction/parsing state
 * - Chains extraction → parsing flow
 * - Handles errors from both extraction and parsing
 * - Fires callbacks and toasts appropriately
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies BEFORE imports
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(),
}));

vi.mock('@/actions/extractPdfText', () => ({
  extractPdfText: vi.fn(),
}));

vi.mock('@/actions/extractDocxText', () => ({
  extractDocxText: vi.fn(),
}));

vi.mock('@/actions/parseResumeText', () => ({
  parseResumeText: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

const mockStore = {
  setIsExtracting: vi.fn(),
  setIsParsing: vi.fn(),
  setResumeContent: vi.fn(),
  setPendingFile: vi.fn(),
};

vi.mock('@/store', () => ({
  useOptimizationStore: () => mockStore,
}));

// Import after mocks
import {
  useResumeExtraction,
  MIME_TYPE_PDF,
  MIME_TYPE_DOCX,
} from '@/hooks/useResumeExtraction';
import { extractPdfText } from '@/actions/extractPdfText';
import { extractDocxText } from '@/actions/extractDocxText';
import { parseResumeText } from '@/actions/parseResumeText';

const mockExtractPdfText = vi.mocked(extractPdfText);
const mockExtractDocxText = vi.mocked(extractDocxText);
const mockParseResumeText = vi.mocked(parseResumeText);

function createMockFile(name: string, type: string, size = 1024): File {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('useResumeExtraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('[P0] 3.3-HOOK-001: should return extract function and isPending state', () => {
    const { result } = renderHook(() => useResumeExtraction());

    expect(result.current.extract).toBeDefined();
    expect(typeof result.current.extract).toBe('function');
    expect(result.current.isPending).toBe(false);
  });

  it('[P0] 3.3-HOOK-002: should reject unsupported file types', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useResumeExtraction());

    const txtFile = createMockFile('resume.txt', 'text/plain');

    act(() => {
      result.current.extract(txtFile);
    });

    expect(toast.error).toHaveBeenCalledWith('Please upload a PDF or DOCX file');
    expect(mockStore.setIsExtracting).not.toHaveBeenCalled();
  });

  it('[P0] 3.3-HOOK-003: should call extractPdfText for PDF files', async () => {
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);

    mockExtractPdfText.mockResolvedValue({
      data: { text: 'Resume content', pageCount: 2 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: {
        summary: 'Summary text',
        skills: 'Skills text',
        experience: 'Experience text',
        education: 'Education text',
      },
      error: null,
    });

    const { result } = renderHook(() => useResumeExtraction());

    await act(async () => {
      result.current.extract(pdfFile);
      // Flush startTransition
      await vi.runAllTimersAsync();
    });

    expect(mockStore.setIsExtracting).toHaveBeenCalledWith(true);
    expect(mockExtractPdfText).toHaveBeenCalledWith(pdfFile);
  });

  it('[P0] 3.4-HOOK-001: should call extractDocxText for DOCX files', async () => {
    const docxFile = createMockFile('resume.docx', MIME_TYPE_DOCX);

    mockExtractDocxText.mockResolvedValue({
      data: { text: 'Resume content', paragraphCount: 5 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: {
        summary: 'Summary text',
        skills: 'Skills text',
        experience: null,
        education: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useResumeExtraction());

    await act(async () => {
      result.current.extract(docxFile);
      await vi.runAllTimersAsync();
    });

    expect(mockStore.setIsExtracting).toHaveBeenCalledWith(true);
    expect(mockExtractDocxText).toHaveBeenCalledWith(docxFile);
  });

  it('[P0] 3.3-HOOK-004: should handle PDF extraction errors', async () => {
    const { toast } = await import('sonner');
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);
    const onError = vi.fn();

    mockExtractPdfText.mockResolvedValue({
      data: null,
      error: { code: 'PARSE_ERROR', message: 'Failed to extract PDF' },
    });

    const { result } = renderHook(() => useResumeExtraction({ onError }));

    await act(async () => {
      result.current.extract(pdfFile);
      await vi.runAllTimersAsync();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to extract PDF');
    expect(mockStore.setIsExtracting).toHaveBeenCalledWith(false);
    expect(onError).toHaveBeenCalledWith({
      code: 'PARSE_ERROR',
      message: 'Failed to extract PDF',
    });
  });

  it('[P0] 3.4-HOOK-002: should handle DOCX extraction errors', async () => {
    const { toast } = await import('sonner');
    const docxFile = createMockFile('resume.docx', MIME_TYPE_DOCX);
    const onError = vi.fn();

    mockExtractDocxText.mockResolvedValue({
      data: null,
      error: { code: 'PARSE_ERROR', message: 'Failed to extract DOCX' },
    });

    const { result } = renderHook(() => useResumeExtraction({ onError }));

    await act(async () => {
      result.current.extract(docxFile);
      await vi.runAllTimersAsync();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to extract DOCX');
    expect(mockStore.setIsExtracting).toHaveBeenCalledWith(false);
    expect(onError).toHaveBeenCalledWith({
      code: 'PARSE_ERROR',
      message: 'Failed to extract DOCX',
    });
  });

  it('[P1] 3.3-HOOK-005: should chain parsing after successful PDF extraction', async () => {
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);

    mockExtractPdfText.mockResolvedValue({
      data: { text: 'Full resume text', pageCount: 3 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: {
        summary: 'Professional summary',
        skills: 'JavaScript, TypeScript',
        experience: 'Senior Dev',
        education: 'CS Degree',
      },
      error: null,
    });

    const { result } = renderHook(() => useResumeExtraction());

    await act(async () => {
      result.current.extract(pdfFile);
      await vi.runAllTimersAsync();
    });

    // Verify parsing was called with extracted text and metadata
    expect(mockParseResumeText).toHaveBeenCalledWith('Full resume text', {
      filename: 'resume.pdf',
      fileSize: 1024,
    });
    expect(mockStore.setIsParsing).toHaveBeenCalledWith(true);
    expect(mockStore.setIsParsing).toHaveBeenCalledWith(false);
  });

  it('[P1] 3.3-HOOK-006: should store parsed resume and clear pending file on success', async () => {
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);
    const parsedResume = {
      summary: 'Summary',
      skills: 'Skills',
      experience: 'Experience',
      education: 'Education',
    };

    mockExtractPdfText.mockResolvedValue({
      data: { text: 'Resume text', pageCount: 1 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: parsedResume,
      error: null,
    });

    const { result } = renderHook(() => useResumeExtraction());

    await act(async () => {
      result.current.extract(pdfFile);
      await vi.runAllTimersAsync();
    });

    expect(mockStore.setResumeContent).toHaveBeenCalledWith(parsedResume);
    expect(mockStore.setPendingFile).toHaveBeenCalledWith(null);
  });

  it('[P1] 3.5-HOOK-001: should handle parsing errors after successful extraction', async () => {
    const { toast } = await import('sonner');
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);
    const onError = vi.fn();

    mockExtractPdfText.mockResolvedValue({
      data: { text: 'Resume text', pageCount: 1 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: null,
      error: { code: 'PARSE_ERROR', message: 'Failed to parse resume sections' },
    });

    const { result } = renderHook(() => useResumeExtraction({ onError }));

    await act(async () => {
      result.current.extract(pdfFile);
      await vi.runAllTimersAsync();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to parse resume sections');
    expect(onError).toHaveBeenCalledWith({
      code: 'PARSE_ERROR',
      message: 'Failed to parse resume sections',
    });
    expect(mockStore.setIsParsing).toHaveBeenCalledWith(false);
  });

  it('[P1] 3.3-HOOK-007: should call onSuccess callback with extracted text', async () => {
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);
    const onSuccess = vi.fn();

    mockExtractPdfText.mockResolvedValue({
      data: { text: 'Resume text', pageCount: 2 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: {
        summary: 'Summary',
        skills: null,
        experience: null,
        education: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useResumeExtraction({ onSuccess }));

    await act(async () => {
      result.current.extract(pdfFile);
      await vi.runAllTimersAsync();
    });

    expect(onSuccess).toHaveBeenCalledWith('Resume text', 2);
  });

  it('[P1] 3.3-HOOK-008: should show success toast with parsed section names', async () => {
    const { toast } = await import('sonner');
    const pdfFile = createMockFile('resume.pdf', MIME_TYPE_PDF);

    mockExtractPdfText.mockResolvedValue({
      data: { text: 'text', pageCount: 1 },
      error: null,
    });
    mockParseResumeText.mockResolvedValue({
      data: {
        summary: 'Summary',
        skills: 'Skills',
        experience: null,
        education: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useResumeExtraction());

    await act(async () => {
      result.current.extract(pdfFile);
      await vi.runAllTimersAsync();
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Parsed resume sections: Summary, Skills'
    );
  });

  it('[P0] 3.3-HOOK-009: should export MIME type constants', () => {
    expect(MIME_TYPE_PDF).toBe('application/pdf');
    expect(MIME_TYPE_DOCX).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });
});

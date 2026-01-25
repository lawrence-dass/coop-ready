/**
 * Tests for useResumeParser hook
 *
 * These tests verify that the parsing orchestration hook correctly:
 * - Calls parseResumeText server action
 * - Handles loading states
 * - Shows toast notifications
 * - Stores parsed Resume object
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Resume } from '@/types/optimization';

// Mock dependencies BEFORE imports
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(),
}));

vi.mock('@/actions/parseResumeText', () => ({
  parseResumeText: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockSetResumeContent = vi.fn();

vi.mock('@/store', () => ({
  useOptimizationStore: () => ({
    setResumeContent: mockSetResumeContent,
  }),
}));

// Import after mocks are set up
import { useResumeParser } from '@/hooks/useResumeParser';
import { parseResumeText } from '@/actions/parseResumeText';

const mockParseResumeText = vi.mocked(parseResumeText);

describe('useResumeParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parse function and isPending state', () => {
    const { result } = renderHook(() => useResumeParser());

    expect(result.current.parse).toBeDefined();
    expect(typeof result.current.parse).toBe('function');
    expect(result.current.isPending).toBe(false);
  });

  it('should show error toast when rawText is empty', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('');
    });

    expect(toast.error).toHaveBeenCalledWith('Cannot parse empty resume text');
    expect(mockParseResumeText).not.toHaveBeenCalled();
  });

  it('should show error toast when rawText is only whitespace', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('   \n\t  ');
    });

    expect(toast.error).toHaveBeenCalledWith('Cannot parse empty resume text');
    expect(mockParseResumeText).not.toHaveBeenCalled();
  });

  it('should call parseResumeText with raw text', async () => {
    const mockResume: Resume = {
      rawText: 'Test resume',
      summary: 'Test summary',
      skills: 'Test skills',
      experience: 'Test experience',
      education: 'Test education',
      uploadedAt: new Date(),
    };

    mockParseResumeText.mockResolvedValue({
      data: mockResume,
      error: null,
    });

    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(mockParseResumeText).toHaveBeenCalledWith('Test resume');
    });
  });

  it('should store parsed resume in Zustand on success', async () => {
    const mockResume: Resume = {
      rawText: 'Test resume',
      summary: 'Test summary',
      skills: 'Test skills',
      experience: 'Test experience',
      education: 'Test education',
      uploadedAt: new Date(),
    };

    mockParseResumeText.mockResolvedValue({
      data: mockResume,
      error: null,
    });

    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(mockSetResumeContent).toHaveBeenCalledWith(mockResume);
    });
  });

  it('should show success toast with parsed sections', async () => {
    const { toast } = await import('sonner');

    const mockResume: Resume = {
      rawText: 'Test resume',
      summary: 'Test summary',
      skills: 'Test skills',
      experience: 'Test experience',
      education: 'Test education',
      uploadedAt: new Date(),
    };

    mockParseResumeText.mockResolvedValue({
      data: mockResume,
      error: null,
    });

    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Parsed resume sections: Summary, Skills, Experience, Education'
      );
    });
  });

  it('should handle resume with missing sections in success toast', async () => {
    const { toast } = await import('sonner');

    const mockResume: Resume = {
      rawText: 'Test resume',
      skills: 'Test skills',
      experience: 'Test experience',
      uploadedAt: new Date(),
    };

    mockParseResumeText.mockResolvedValue({
      data: mockResume,
      error: null,
    });

    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Parsed resume sections: Skills, Experience'
      );
    });
  });

  it('should show error toast on parsing failure', async () => {
    const { toast } = await import('sonner');

    mockParseResumeText.mockResolvedValue({
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse resume',
      },
    });

    const { result } = renderHook(() => useResumeParser());

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to parse resume');
    });
  });

  it('should call onSuccess callback when provided', async () => {
    const onSuccess = vi.fn();

    const mockResume: Resume = {
      rawText: 'Test resume',
      summary: 'Test summary',
      uploadedAt: new Date(),
    };

    mockParseResumeText.mockResolvedValue({
      data: mockResume,
      error: null,
    });

    const { result } = renderHook(() => useResumeParser({ onSuccess }));

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockResume);
    });
  });

  it('should call onError callback when provided', async () => {
    const onError = vi.fn();

    const errorObj = {
      code: 'PARSE_ERROR',
      message: 'Failed to parse resume',
    };

    mockParseResumeText.mockResolvedValue({
      data: null,
      error: errorObj,
    });

    const { result } = renderHook(() => useResumeParser({ onError }));

    act(() => {
      result.current.parse('Test resume');
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorObj);
    });
  });
});

/**
 * Integration Tests for Experience Suggestions API
 * Story 6.4: Implement Experience Section Suggestions
 *
 * Tests the /api/suggestions/experience endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/suggestions/experience/route';
import { NextRequest } from 'next/server';
import type { ActionResponse } from '@/types';
import type { ExperienceSuggestion } from '@/types/suggestions';

// Mock dependencies
vi.mock('@/lib/ai/generateExperienceSuggestion');
vi.mock('@/lib/supabase/sessions');

describe('/api/suggestions/experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Validation', () => {
    it('should return VALIDATION_ERROR for invalid JSON', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('VALIDATION_ERROR');
      expect(data.error?.message).toContain('JSON');
    });

    it('should return VALIDATION_ERROR when session_id is missing', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          anonymous_id: 'anon-123',
          resume_content: 'Resume',
          jd_content: 'JD',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('VALIDATION_ERROR');
      expect(data.error?.message).toContain('Session');
    });

    it('should return VALIDATION_ERROR when anonymous_id is missing', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          resume_content: 'Resume',
          jd_content: 'JD',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('VALIDATION_ERROR');
      expect(data.error?.message).toContain('Anonymous');
    });

    it('should return VALIDATION_ERROR when resume_content is missing', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          jd_content: 'JD',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('VALIDATION_ERROR');
      expect(data.error?.message).toContain('Resume');
    });

    it('should return VALIDATION_ERROR when jd_content is missing', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          resume_content: 'Resume',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('VALIDATION_ERROR');
      expect(data.error?.message).toContain('Job');
    });

    it('should return VALIDATION_ERROR when current_experience is missing', async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          resume_content: 'Resume',
          jd_content: 'JD',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('VALIDATION_ERROR');
      expect(data.error?.message).toContain('experience');
    });
  });

  describe('Successful Generation', () => {
    it('should generate experience suggestion and save to session', async () => {
      const mockSuggestion: ExperienceSuggestion = {
        original: 'Original experience',
        experience_entries: [
          {
            company: 'Tech Corp',
            role: 'Engineer',
            dates: '2020-2023',
            original_bullets: ['Task 1'],
            suggested_bullets: [
              {
                original: 'Task 1',
                suggested: 'Enhanced task 1',
                metrics_added: ['30%'],
                keywords_incorporated: ['React'],
              },
            ],
          },
        ],
        summary: 'Optimized 1 bullet',
      };

      const { generateExperienceSuggestion } = await import('@/lib/ai/generateExperienceSuggestion');
      const { updateSession } = await import('@/lib/supabase/sessions');

      vi.mocked(generateExperienceSuggestion).mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.mocked(updateSession).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          resume_content: 'Full resume',
          jd_content: 'Job description',
          current_experience: 'Experience section',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).toBeNull();
      expect(data.data).not.toBeNull();
      expect(data.data?.experience_entries).toHaveLength(1);
      expect(generateExperienceSuggestion).toHaveBeenCalledWith(
        'Experience section',
        'Job description',
        'Full resume'
      );
      expect(updateSession).toHaveBeenCalledWith('sess-123', {
        experienceSuggestion: mockSuggestion,
      });
    });

    it('should continue when session update fails', async () => {
      const mockSuggestion: ExperienceSuggestion = {
        original: 'Original',
        experience_entries: [],
        summary: 'Test',
      };

      const { generateExperienceSuggestion } = await import('@/lib/ai/generateExperienceSuggestion');
      const { updateSession } = await import('@/lib/supabase/sessions');

      vi.mocked(generateExperienceSuggestion).mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.mocked(updateSession).mockResolvedValue({
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'DB failed',
        },
      });

      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          resume_content: 'Resume',
          jd_content: 'JD',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      // Should still return suggestion even if session update fails
      expect(data.error).toBeNull();
      expect(data.data).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return LLM_ERROR when generation fails', async () => {
      const { generateExperienceSuggestion } = await import('@/lib/ai/generateExperienceSuggestion');

      vi.mocked(generateExperienceSuggestion).mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'LLM failed',
        },
      });

      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          resume_content: 'Resume',
          jd_content: 'JD',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('LLM_ERROR');
      expect(data.data).toBeNull();
    });

    it('should return LLM_TIMEOUT on timeout', async () => {
      const { generateExperienceSuggestion } = await import('@/lib/ai/generateExperienceSuggestion');

      vi.mocked(generateExperienceSuggestion).mockRejectedValue(
        new Error('TIMEOUT: exceeded 60 seconds')
      );

      const request = {
        json: vi.fn().mockResolvedValue({
          session_id: 'sess-123',
          anonymous_id: 'anon-123',
          resume_content: 'Resume',
          jd_content: 'JD',
          current_experience: 'Experience',
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = (await response.json()) as ActionResponse<ExperienceSuggestion>;

      expect(data.error).not.toBeNull();
      expect(data.error?.code).toBe('LLM_TIMEOUT');
      expect(data.data).toBeNull();
    });
  });
});

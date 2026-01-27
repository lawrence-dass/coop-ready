/**
 * Integration Tests for /api/suggestions/skills
 * Story 6.3: Skills Suggestions API Route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/suggestions/skills/route';
import { NextRequest } from 'next/server';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { updateSession } from '@/lib/supabase/sessions';
import type { SkillsSuggestion } from '@/types/suggestions';

// Mock dependencies
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/supabase/sessions');

describe('POST /api/suggestions/skills', () => {
  const validRequestBody = {
    session_id: 'test-session-id',
    anonymous_id: 'test-anon-id',
    resume_content: 'Full resume text here',
    jd_content: 'Job description text here',
    current_skills: 'Python, JavaScript, React',
  };

  const mockSuggestion: SkillsSuggestion = {
    original: 'Python, JavaScript, React',
    existing_skills: ['Python', 'JavaScript', 'React'],
    matched_keywords: ['Python', 'React'],
    missing_but_relevant: [
      { skill: 'Docker', reason: 'Job requires containerization' },
    ],
    skill_additions: ['Docker', 'Kubernetes'],
    skill_removals: [
      { skill: 'jQuery', reason: 'Less relevant for modern stack' },
    ],
    summary: 'You have 8/12 key skills.',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful session update
    vi.mocked(updateSession).mockResolvedValue({
      data: { success: true },
      error: null,
    });
  });

  describe('Request Validation', () => {
    it('should return VALIDATION_ERROR for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: 'not json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid JSON');
      expect(data.data).toBeNull();
    });

    it('should return VALIDATION_ERROR when session_id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          session_id: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Session ID');
    });

    it('should return VALIDATION_ERROR when anonymous_id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          anonymous_id: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Anonymous ID');
    });

    it('should return VALIDATION_ERROR when resume_content is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          resume_content: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Resume content');
    });

    it('should return VALIDATION_ERROR when jd_content is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          jd_content: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Job description');
    });

    it('should return VALIDATION_ERROR when current_skills is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          current_skills: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Current skills');
    });
  });

  describe('Successful Generation', () => {
    it('should generate skills suggestion successfully', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBeNull();
      expect(data.data).not.toBeNull();
      expect(data.data.existing_skills).toEqual([
        'Python',
        'JavaScript',
        'React',
      ]);
      expect(data.data.matched_keywords).toContain('Python');
      expect(data.data.skill_additions).toContain('Docker');

      // Verify LLM was called with correct args
      expect(generateSkillsSuggestion).toHaveBeenCalledWith(
        validRequestBody.current_skills,
        validRequestBody.jd_content,
        validRequestBody.resume_content
      );

      // Verify session was updated
      expect(updateSession).toHaveBeenCalledWith(
        validRequestBody.session_id,
        { skillsSuggestion: mockSuggestion }
      );
    });

    it('should continue even if session update fails', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.mocked(updateSession).mockResolvedValue({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'DB error' },
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return suggestion even if session update failed
      expect(data.error).toBeNull();
      expect(data.data).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should propagate LLM_TIMEOUT error', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Skills suggestion generation timed out.',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('LLM_TIMEOUT');
      expect(data.data).toBeNull();

      // Session should not be updated on error
      expect(updateSession).not.toHaveBeenCalled();
    });

    it('should propagate PARSE_ERROR', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse LLM response',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('PARSE_ERROR');
      expect(data.data).toBeNull();
    });

    it('should propagate LLM_ERROR', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'API call failed',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('LLM_ERROR');
      expect(data.data).toBeNull();
    });

    it('should handle timeout at route level', async () => {
      // Simulate very slow response exceeding 60s
      vi.mocked(generateSkillsSuggestion).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  data: null,
                  error: { code: 'LLM_TIMEOUT', message: 'Timed out' },
                }),
              70000
            );
          })
      );

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should catch timeout from withTimeout wrapper
      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('LLM_TIMEOUT');
    }, 70000); // Increase test timeout

    it('should handle unexpected errors', async () => {
      vi.mocked(generateSkillsSuggestion).mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toBeNull();
      expect(data.error.code).toBe('LLM_ERROR');
      expect(data.data).toBeNull();
    });
  });

  describe('ActionResponse Pattern', () => {
    it('should always return ActionResponse structure', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('error');
      expect(response.status).toBe(200);
    });

    it('should always return 200 status even on errors', async () => {
      vi.mocked(generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'API failed',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/suggestions/skills', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});

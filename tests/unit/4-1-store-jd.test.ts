/**
 * Unit Tests: Zustand Store - Job Description State
 *
 * Tests for Story 4.1 - Store extensions for JD management
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimizationStore } from '@/store';
import { isJobDescriptionValid } from '@/lib/validations/jobDescription';

describe('useOptimizationStore - Job Description', () => {
  it('should initialize with null jobDescription', () => {
    const { result } = renderHook(() => useOptimizationStore());
    expect(result.current.jobDescription).toBeNull();
  });

  it('should set job description content', () => {
    const { result } = renderHook(() => useOptimizationStore());
    const testJD = 'Senior Software Engineer position with 5+ years experience required';

    act(() => {
      result.current.setJobDescription(testJD);
    });

    expect(result.current.jobDescription).toBe(testJD);
  });

  it('should clear job description', () => {
    const { result } = renderHook(() => useOptimizationStore());

    // Set JD first
    act(() => {
      result.current.setJobDescription('Test job description');
    });

    // Then clear it
    act(() => {
      result.current.clearJobDescription();
    });

    expect(result.current.jobDescription).toBeNull();
  });

  it('should clear error when setting job description', () => {
    const { result } = renderHook(() => useOptimizationStore());

    // Set error first
    act(() => {
      result.current.setError('Some error');
    });

    expect(result.current.error).toBe('Some error');

    // Setting JD should clear error
    act(() => {
      result.current.setJobDescription('New JD');
    });

    expect(result.current.error).toBeNull();
  });

  it('should reset job description when reset is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setJobDescription('Test JD');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.jobDescription).toBeNull();
  });
});

describe('isJobDescriptionValid - Validation Helper', () => {
  it('should return false for null JD', () => {
    expect(isJobDescriptionValid(null)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isJobDescriptionValid('')).toBe(false);
  });

  it('should return false for whitespace-only string', () => {
    expect(isJobDescriptionValid('   ')).toBe(false);
  });

  it('should return false for text under 50 characters', () => {
    expect(isJobDescriptionValid('Short text')).toBe(false);
  });

  it('should return true for text exactly 50 characters', () => {
    const text = 'a'.repeat(50);
    expect(isJobDescriptionValid(text)).toBe(true);
  });

  it('should return true for text over 50 characters', () => {
    const text = 'a'.repeat(100);
    expect(isJobDescriptionValid(text)).toBe(true);
  });

  it('should trim whitespace before checking length', () => {
    const text = '   ' + 'a'.repeat(50) + '   ';
    expect(isJobDescriptionValid(text)).toBe(true);
  });
});

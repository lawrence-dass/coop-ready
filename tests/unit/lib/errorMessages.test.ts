/**
 * Unit Tests: Error Message Mapping Service
 *
 * Tests the error message mapping utility that converts error codes
 * to user-friendly display information.
 */

import { describe, it, expect } from 'vitest';
import {
  getErrorDisplay,
  isKnownErrorCode,
  getAllErrorCodes,
  type ErrorCode,
} from '@/lib/errorMessages';

describe('errorMessages', () => {
  describe('getErrorDisplay', () => {
    it('returns correct display for INVALID_FILE_TYPE', () => {
      const display = getErrorDisplay('INVALID_FILE_TYPE');

      expect(display).toMatchObject({
        title: 'Invalid File Type',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
      expect(display.message).toContain('PDF');
      expect(display.message).toContain('Word');
    });

    it('returns correct display for FILE_TOO_LARGE', () => {
      const display = getErrorDisplay('FILE_TOO_LARGE');

      expect(display).toMatchObject({
        title: 'File Too Large',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
      expect(display.message).toContain('5MB');
    });

    it('returns correct display for PARSE_ERROR', () => {
      const display = getErrorDisplay('PARSE_ERROR');

      expect(display).toMatchObject({
        title: 'Could Not Read File',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
    });

    it('returns correct display for LLM_TIMEOUT', () => {
      const display = getErrorDisplay('LLM_TIMEOUT');

      expect(display).toMatchObject({
        title: 'Optimization Took Too Long',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
      expect(display.message).toContain('60');
    });

    it('returns correct display for LLM_ERROR', () => {
      const display = getErrorDisplay('LLM_ERROR');

      expect(display).toMatchObject({
        title: 'Optimization Failed',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
    });

    it('returns correct display for RATE_LIMITED', () => {
      const display = getErrorDisplay('RATE_LIMITED');

      expect(display).toMatchObject({
        title: 'Too Many Requests',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
    });

    it('returns correct display for VALIDATION_ERROR', () => {
      const display = getErrorDisplay('VALIDATION_ERROR');

      expect(display).toMatchObject({
        title: 'Invalid Input',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
    });

    it('returns default display for unknown error codes', () => {
      const display = getErrorDisplay('UNKNOWN_ERROR_CODE');

      expect(display).toMatchObject({
        title: 'Something Went Wrong',
        message: expect.any(String),
        recoveryAction: expect.any(String),
      });
    });

    it('all error displays have required properties', () => {
      const allCodes = getAllErrorCodes();

      allCodes.forEach((code) => {
        const display = getErrorDisplay(code);

        expect(display).toHaveProperty('title');
        expect(display).toHaveProperty('message');
        expect(display).toHaveProperty('recoveryAction');

        expect(typeof display.title).toBe('string');
        expect(typeof display.message).toBe('string');
        expect(typeof display.recoveryAction).toBe('string');

        expect(display.title.length).toBeGreaterThan(0);
        expect(display.message.length).toBeGreaterThan(0);
        expect(display.recoveryAction.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isKnownErrorCode', () => {
    it('returns true for valid error codes', () => {
      expect(isKnownErrorCode('INVALID_FILE_TYPE')).toBe(true);
      expect(isKnownErrorCode('FILE_TOO_LARGE')).toBe(true);
      expect(isKnownErrorCode('PARSE_ERROR')).toBe(true);
      expect(isKnownErrorCode('LLM_TIMEOUT')).toBe(true);
      expect(isKnownErrorCode('LLM_ERROR')).toBe(true);
      expect(isKnownErrorCode('RATE_LIMITED')).toBe(true);
      expect(isKnownErrorCode('VALIDATION_ERROR')).toBe(true);
    });

    it('returns false for unknown error codes', () => {
      expect(isKnownErrorCode('UNKNOWN_CODE')).toBe(false);
      expect(isKnownErrorCode('RANDOM_ERROR')).toBe(false);
      expect(isKnownErrorCode('')).toBe(false);
    });
  });

  describe('getAllErrorCodes', () => {
    it('returns all 7 standard error codes', () => {
      const codes = getAllErrorCodes();

      expect(codes).toHaveLength(7);
      expect(codes).toContain('INVALID_FILE_TYPE');
      expect(codes).toContain('FILE_TOO_LARGE');
      expect(codes).toContain('PARSE_ERROR');
      expect(codes).toContain('LLM_TIMEOUT');
      expect(codes).toContain('LLM_ERROR');
      expect(codes).toContain('RATE_LIMITED');
      expect(codes).toContain('VALIDATION_ERROR');
    });
  });
});

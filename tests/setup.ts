/**
 * Vitest Setup File
 *
 * Runs before all unit tests.
 * Configure global test utilities and mocks here.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock server-only to prevent errors in test environment
vi.mock('server-only', () => ({}));

// Mock Anthropic SDK globally to prevent browser environment errors
// This mock is needed because parseResumeText imports the SDK at module load time
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

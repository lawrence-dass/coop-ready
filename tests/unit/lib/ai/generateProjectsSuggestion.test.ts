/**
 * generateProjectsSuggestion Unit Tests
 * Story 18.5: Projects Suggestion Generator
 *
 * Tests:
 * - Input validation (empty projects, empty JD)
 * - Response structure validation (via real function call)
 * - Co-op heading suggestion ("Project Experience")
 * - Candidate type framing in prompts
 * - PII redaction is called
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProjectsSuggestion } from '@/lib/ai/generateProjectsSuggestion';
import type { CandidateType } from '@/lib/scoring/types';

// Shared mock for chain.invoke — hoisted so vi.mock factory can reference it
const { mockChainInvoke } = vi.hoisted(() => ({
  mockChainInvoke: vi.fn(),
}));

// Mock the dependencies
vi.mock('@/lib/ai/models', () => ({
  getSonnetModel: vi.fn(() => ({
    pipe: vi.fn(() => ({
      pipe: vi.fn(() => ({
        invoke: mockChainInvoke,
      })),
    })),
  })),
}));

vi.mock('@/lib/ai/chains', () => ({
  ChatPromptTemplate: {
    fromTemplate: vi.fn(() => ({
      pipe: vi.fn(() => ({
        pipe: vi.fn(() => ({
          invoke: mockChainInvoke,
        })),
      })),
    })),
  },
  createJsonParser: vi.fn(),
  invokeWithActionResponse: vi.fn(async (fn: () => Promise<unknown>) => {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return { data: null, error: { code: 'LLM_ERROR', message } };
    }
  }),
}));

vi.mock('@/lib/ai/redactPII', () => ({
  redactPII: vi.fn((text: string) => ({
    redactedText: text,
    redactionMap: new Map(),
    stats: { emails: 0, phones: 0, urls: 0, addresses: 0 },
  })),
  restorePII: vi.fn((text: string) => text),
}));

vi.mock('@/lib/ai/preferences', () => ({
  buildPreferencePrompt: vi.fn(() => ''),
  getJobTypeVerbGuidance: vi.fn(() => ''),
  getJobTypeFramingGuidance: vi.fn(() => ''),
}));

// Standard mock LLM response reused across tests
function createMockLLMResponse(overrides?: Partial<{ heading_suggestion: string }>) {
  return {
    project_entries: [
      {
        title: 'E-commerce Platform',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        dates: 'Spring 2024',
        original_bullets: ['Built shopping cart features'],
        suggested_bullets: [
          {
            original: 'Built shopping cart features',
            suggested_compact: 'Developed shopping cart using React',
            suggested_full:
              'Engineered full-stack shopping cart features using React and Node.js',
            metrics_added: [],
            keywords_incorporated: ['React', 'Node.js'],
            impact: 'high',
            point_value: 6,
            explanation: 'Incorporates React keywords from JD',
          },
        ],
      },
    ],
    total_point_value: 20,
    summary: 'Optimized 1 project with 1 bullet',
    ...overrides,
  };
}

describe('[P0] generateProjectsSuggestion input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns VALIDATION_ERROR for empty projects input', async () => {
    const result = await generateProjectsSuggestion(
      '', // empty projects
      'Software Engineer job description',
      'Full resume content'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('projects');
  });

  it('returns VALIDATION_ERROR for empty job description', async () => {
    const result = await generateProjectsSuggestion(
      'E-commerce Platform: Built full-stack application',
      '', // empty JD
      'Full resume content'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('Job description');
  });
});

describe('[P0] generateProjectsSuggestion response structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid ProjectsSuggestion structure from real function call', async () => {
    mockChainInvoke.mockResolvedValue(createMockLLMResponse());

    const result = await generateProjectsSuggestion(
      'E-commerce Platform: Built shopping cart features',
      'Looking for React and Node.js developer',
      'Full resume content'
    );

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.project_entries).toBeInstanceOf(Array);
    expect(result.data?.project_entries[0].title).toBe('E-commerce Platform');
    expect(result.data?.project_entries[0].suggested_bullets).toBeInstanceOf(Array);
    expect(result.data?.project_entries[0].suggested_bullets[0].suggested_compact).toBe(
      'Developed shopping cart using React'
    );
    expect(result.data?.project_entries[0].suggested_bullets[0].suggested_full).toBe(
      'Engineered full-stack shopping cart features using React and Node.js'
    );
    expect(result.data?.summary).toBe('Optimized 1 project with 1 bullet');
  });

  it('returns LLM_ERROR when chain returns invalid structure', async () => {
    mockChainInvoke.mockResolvedValue({ bad: 'data' });

    const result = await generateProjectsSuggestion(
      'E-commerce Platform: Built shopping cart features',
      'Looking for React developer',
      'Full resume content'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('LLM_ERROR');
  });
});

describe('[P1] Co-op heading suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes "Project Experience" heading for coop candidate type', async () => {
    mockChainInvoke.mockResolvedValue(createMockLLMResponse());

    const result = await generateProjectsSuggestion(
      'Course Project: Built web app for coursework',
      'Python developer position',
      'Full resume',
      { jobType: 'coop', modificationLevel: 'moderate' },
      undefined,
      undefined,
      undefined,
      'coop' // explicit candidateType
    );

    expect(result.error).toBeNull();
    expect(result.data?.heading_suggestion).toBe('Project Experience');
  });

  it('does not force heading suggestion for fulltime candidate type', async () => {
    // LLM might return its own heading_suggestion or not
    mockChainInvoke.mockResolvedValue(createMockLLMResponse());

    const result = await generateProjectsSuggestion(
      'Open Source Contribution: Contributed to React library',
      'Senior engineer role',
      'Full resume',
      null,
      undefined,
      undefined,
      undefined,
      'fulltime'
    );

    expect(result.error).toBeNull();
    // Fulltime should NOT get forced "Project Experience" heading
    expect(result.data?.heading_suggestion).not.toBe('Project Experience');
  });
});

describe('[P1] Candidate type derivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives coop from preferences.jobType when candidateType not provided', async () => {
    mockChainInvoke.mockResolvedValue(createMockLLMResponse());

    const result = await generateProjectsSuggestion(
      'Course Project: Built web app',
      'Intern position',
      'Full resume',
      { jobType: 'coop', modificationLevel: 'moderate' }
      // no explicit candidateType — should derive from preferences
    );

    expect(result.error).toBeNull();
    // Derived coop should get the heading suggestion
    expect(result.data?.heading_suggestion).toBe('Project Experience');
  });

  it('defaults to fulltime when no preferences or candidateType provided', async () => {
    mockChainInvoke.mockResolvedValue(createMockLLMResponse());

    const result = await generateProjectsSuggestion(
      'Side Project: Built dashboard',
      'Developer role',
      'Full resume'
      // no preferences, no candidateType
    );

    expect(result.error).toBeNull();
    // Default fulltime should NOT get forced heading
    expect(result.data?.heading_suggestion).not.toBe('Project Experience');
  });
});

describe('[P1] PII redaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls redactPII before LLM invocation', async () => {
    const { redactPII } = await import('@/lib/ai/redactPII');
    mockChainInvoke.mockResolvedValue(createMockLLMResponse());

    await generateProjectsSuggestion(
      'E-commerce project with email@example.com',
      'Software Engineer JD',
      'Resume content'
    );

    // Verify redactPII was called for projects, JD, and resume (education not provided)
    expect(vi.mocked(redactPII)).toHaveBeenCalledTimes(3);
  });
});

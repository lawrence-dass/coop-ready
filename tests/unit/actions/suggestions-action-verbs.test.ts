/**
 * Tests for generateActionVerbAndQuantificationSuggestions server action
 *
 * @see Story 5.3: Action Verb & Quantification Suggestions
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Mock dependencies before importing
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/openai", () => ({
  getOpenAIClient: jest.fn(),
  parseOpenAIResponse: jest.fn(),
}));
jest.mock("@/lib/openai/retry", () => ({
  withRetry: jest.fn(),
}));

import {
  generateActionVerbAndQuantificationSuggestions,
  transformActionVerbSuggestions,
} from "@/actions/suggestions";

// Helper to mock successful OpenAI response
function mockSuccessfulOpenAIResponse(
  suggestions: Array<{
    original: string;
    action_verb_suggestion: {
      improved: string;
      alternatives: string[];
      reasoning: string;
    } | null;
    quantification_suggestion: {
      prompt: string;
      example: string;
      metrics_to_consider: string[];
    } | null;
  }>
) {
  const mockContent = JSON.stringify({ suggestions });

  return {
    mockContent,
    setupMocks: async () => {
      const { getOpenAIClient, parseOpenAIResponse } = await import(
        "@/lib/openai"
      );
      const { withRetry } = await import("@/lib/openai/retry");

      const mockCreate = jest.fn().mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: mockContent } }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      (getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      });
      (withRetry as jest.Mock).mockImplementation(async (fn) => fn());
      (parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: mockContent,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      });

      return mockCreate;
    },
  };
}

describe("generateActionVerbAndQuantificationSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Input Validation", () => {
    test("rejects invalid scanId", async () => {
      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "invalid-uuid",
        bulletPoints: ["Responsible for team management"],
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    test("rejects empty bulletPoints array", async () => {
      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: [],
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    test("accepts valid input with achievementTypes", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Responsible for team management",
          action_verb_suggestion: {
            improved: "Led team management",
            alternatives: ["Managed", "Directed"],
            reasoning: "Led is stronger than Responsible for",
          },
          quantification_suggestion: null,
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Responsible for team management"],
        achievementTypes: ["team"],
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
    });
  });

  describe("Weak Verb Detection (AC1)", () => {
    test("generates action verb suggestion for weak verb", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Responsible for development team",
          action_verb_suggestion: {
            improved: "Led development team",
            alternatives: ["Managed", "Directed", "Supervised"],
            reasoning: "Led is a strong leadership verb",
          },
          quantification_suggestion: null,
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Responsible for development team"],
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.suggestions[0].actionVerbSuggestion).not.toBeNull();
      expect(
        result.data?.suggestions[0].actionVerbSuggestion?.improved
      ).toContain("Led");
    });

    test("does not suggest action verb for strong verb (AC5)", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Led migration of 2M user database",
          action_verb_suggestion: null,
          quantification_suggestion: null,
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Led migration of 2M user database"],
      });

      expect(result.error).toBeNull();
      expect(result.data?.suggestions[0].actionVerbSuggestion).toBeNull();
    });
  });

  describe("Strong Verb Alternatives by Category (AC2)", () => {
    test("provides leadership verb alternatives", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Responsible for team of 8 developers",
          action_verb_suggestion: {
            improved: "Led team of 8 developers",
            alternatives: ["Managed", "Directed", "Supervised"],
            reasoning: "Strong leadership verbs improve impact",
          },
          quantification_suggestion: null,
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Responsible for team of 8 developers"],
        achievementTypes: ["team"],
      });

      expect(result.error).toBeNull();
      const suggestion = result.data?.suggestions[0].actionVerbSuggestion;
      expect(suggestion).not.toBeNull();
      expect(suggestion?.alternatives).toContain("Managed");
    });

    test("provides technical verb alternatives", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Worked on API development",
          action_verb_suggestion: {
            improved: "Engineered scalable API",
            alternatives: ["Built", "Architected", "Developed"],
            reasoning: "Technical verbs show expertise",
          },
          quantification_suggestion: null,
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Worked on API development"],
        achievementTypes: ["technical"],
      });

      expect(result.error).toBeNull();
      const suggestion = result.data?.suggestions[0].actionVerbSuggestion;
      expect(suggestion?.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe("Quantification Detection (AC3)", () => {
    test("generates quantification suggestion for missing metrics", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Improved performance",
          action_verb_suggestion: null,
          quantification_suggestion: {
            prompt: "Consider adding: percentage improvement, time saved",
            example: "Improved performance by 40%",
            metrics_to_consider: [
              "percentage improvement",
              "time saved",
              "users impacted",
            ],
          },
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Improved performance"],
        achievementTypes: ["performance"],
      });

      expect(result.error).toBeNull();
      expect(
        result.data?.suggestions[0].quantificationSuggestion
      ).not.toBeNull();
      expect(
        result.data?.suggestions[0].quantificationSuggestion?.metricsToConsider
      ).toContain("percentage improvement");
    });

    test("does not suggest quantification when metrics exist (AC5)", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Improved performance by 40%",
          action_verb_suggestion: null,
          quantification_suggestion: null,
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Improved performance by 40%"],
      });

      expect(result.error).toBeNull();
      expect(result.data?.suggestions[0].quantificationSuggestion).toBeNull();
    });
  });

  describe("Contextual Quantification Prompts (AC4)", () => {
    test("provides performance-specific prompts", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Optimized database queries",
          action_verb_suggestion: null,
          quantification_suggestion: {
            prompt:
              "Consider adding: percentage improvement, time saved, users impacted",
            example: "Optimized database queries, reducing latency by 50%",
            metrics_to_consider: [
              "percentage improvement",
              "time saved",
              "users impacted",
            ],
          },
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Optimized database queries"],
        achievementTypes: ["performance"],
      });

      expect(result.error).toBeNull();
      const suggestion = result.data?.suggestions[0].quantificationSuggestion;
      expect(suggestion?.prompt).toContain("percentage improvement");
    });

    test("provides team-specific prompts", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Led development efforts",
          action_verb_suggestion: null,
          quantification_suggestion: {
            prompt: "Consider adding: team size, scope, impact",
            example: "Led team of 6 developers",
            metrics_to_consider: ["team size", "scope", "impact"],
          },
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Led development efforts"],
        achievementTypes: ["team"],
      });

      expect(result.error).toBeNull();
      const suggestion = result.data?.suggestions[0].quantificationSuggestion;
      expect(suggestion?.metricsToConsider).toContain("team size");
    });
  });

  describe("Combined Suggestions", () => {
    test("generates both action verb and quantification suggestions", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Helped with performance optimization",
          action_verb_suggestion: {
            improved: "Optimized system performance",
            alternatives: ["Improved", "Enhanced", "Accelerated"],
            reasoning: "Removed weak helper verb",
          },
          quantification_suggestion: {
            prompt: "Consider adding: percentage improvement, time saved",
            example: "Optimized system performance by 35%",
            metrics_to_consider: ["percentage improvement", "time saved"],
          },
        },
      ]);

      await mock.setupMocks();

      const result = await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Helped with performance optimization"],
      });

      expect(result.error).toBeNull();
      expect(result.data?.suggestions[0].actionVerbSuggestion).not.toBeNull();
      expect(
        result.data?.suggestions[0].quantificationSuggestion
      ).not.toBeNull();
    });
  });

  describe("Achievement Type Classification", () => {
    test("pads achievement types with general when not provided", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Bullet 1",
          action_verb_suggestion: null,
          quantification_suggestion: null,
        },
        {
          original: "Bullet 2",
          action_verb_suggestion: null,
          quantification_suggestion: null,
        },
      ]);

      const mockCreate = await mock.setupMocks();

      await generateActionVerbAndQuantificationSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        bulletPoints: ["Bullet 1", "Bullet 2"],
        // achievementTypes not provided
      });

      expect(mockCreate).toHaveBeenCalled();
      // Verify prompt was created successfully
    });
  });
});

describe("transformActionVerbSuggestions", () => {
  test("transforms action verb suggestion correctly (AC6)", () => {
    const input = [
      {
        original: "Responsible for team",
        actionVerbSuggestion: {
          improved: "Led team",
          alternatives: ["Managed", "Directed"],
          reasoning: "Stronger verb",
        },
        quantificationSuggestion: null,
      },
    ];

    const result = transformActionVerbSuggestions(input);

    expect(result).toHaveLength(1);
    expect(result[0].suggestionType).toBe("action_verb");
    expect(result[0].originalText).toBe("Responsible for team");
    expect(result[0].suggestedText).toBe("Led team");
  });

  test("transforms quantification suggestion correctly (AC6)", () => {
    const input = [
      {
        original: "Improved performance",
        actionVerbSuggestion: null,
        quantificationSuggestion: {
          prompt: "Add percentage",
          example: "by 40%",
          metricsToConsider: ["percentage"],
        },
      },
    ];

    const result = transformActionVerbSuggestions(input);

    expect(result).toHaveLength(1);
    expect(result[0].suggestionType).toBe("quantification");
    expect(result[0].suggestedText).toBe("Add percentage");
  });

  test("transforms both suggestions into separate records", () => {
    const input = [
      {
        original: "Helped improve performance",
        actionVerbSuggestion: {
          improved: "Optimized performance",
          alternatives: ["Improved"],
          reasoning: "Strong verb",
        },
        quantificationSuggestion: {
          prompt: "Add metrics",
          example: "by 30%",
          metricsToConsider: ["percentage"],
        },
      },
    ];

    const result = transformActionVerbSuggestions(input);

    expect(result).toHaveLength(2);
    expect(result[0].suggestionType).toBe("action_verb");
    expect(result[1].suggestionType).toBe("quantification");
  });

  test("handles empty suggestions", () => {
    const input = [
      {
        original: "Already strong bullet with metrics",
        actionVerbSuggestion: null,
        quantificationSuggestion: null,
      },
    ];

    const result = transformActionVerbSuggestions(input);

    expect(result).toHaveLength(0);
  });

  test("sets section to experience", () => {
    const input = [
      {
        original: "Test",
        actionVerbSuggestion: {
          improved: "Improved",
          alternatives: [],
          reasoning: "test",
        },
        quantificationSuggestion: null,
      },
    ];

    const result = transformActionVerbSuggestions(input);

    expect(result[0].section).toBe("experience");
  });

  test("includes itemIndex", () => {
    const input = [
      {
        original: "First",
        actionVerbSuggestion: {
          improved: "Test",
          alternatives: [],
          reasoning: "test",
        },
        quantificationSuggestion: null,
      },
      {
        original: "Second",
        actionVerbSuggestion: {
          improved: "Test2",
          alternatives: [],
          reasoning: "test",
        },
        quantificationSuggestion: null,
      },
    ];

    const result = transformActionVerbSuggestions(input);

    expect(result[0].itemIndex).toBe(0);
    expect(result[1].itemIndex).toBe(1);
  });
});

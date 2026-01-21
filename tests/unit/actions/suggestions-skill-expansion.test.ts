/**
 * Tests for generateSkillExpansionSuggestions server action
 *
 * @see Story 5.4: Skills Expansion Suggestions
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
  generateSkillExpansionSuggestions,
  transformSkillExpansionSuggestions,
} from "@/actions/suggestions";

// Helper to mock successful OpenAI response
function mockSuccessfulOpenAIResponse(
  suggestions: Array<{
    original: string;
    can_expand: boolean;
    expansion: string | null;
    keywords_matched: string[];
    reasoning: string;
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

describe("generateSkillExpansionSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Input Validation", () => {
    test("rejects invalid scanId", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "invalid-uuid",
        skills: ["Python"],
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    test("rejects empty skills array", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: [],
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    test("accepts valid inputs", async () => {
      // No need to make actual OpenAI call, just test validation passes
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Python"],
      });

      // Will fail if OpenAI not mocked, but validation should pass
      expect(result.error?.code).not.toBe("VALIDATION_ERROR");
    });
  });

  describe("Local Mapping Optimization", () => {
    test("uses local mappings for known skills without AI call", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Python", "JavaScript", "React"],
      });

      // Should succeed with local mappings
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.suggestions).toBeDefined();
      expect(result.data?.suggestions.length).toBeGreaterThan(0);
    });

    test("includes correct expansion for Python", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Python"],
      });

      expect(result.data?.suggestions[0]).toMatchObject({
        original: "Python",
        expansion: expect.stringContaining("pandas"),
      });
    });

    test("includes correct expansion for JavaScript", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["JavaScript"],
      });

      expect(result.data?.suggestions[0]).toMatchObject({
        original: "JavaScript",
        expansion: expect.stringContaining("React"),
      });
    });
  });

  describe("JD Keyword Matching", () => {
    test("filters keywords matched from JD", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Python"],
        jdKeywords: ["TensorFlow", "pandas"],
      });

      expect(result.data?.suggestions[0]).toMatchObject({
        original: "Python",
        keywordsMatched: expect.arrayContaining(["TensorFlow", "pandas"]),
      });
    });

    test("works without JD keywords", async () => {
      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Python"],
      });

      expect(result.data?.suggestions[0]).toMatchObject({
        original: "Python",
        keywordsMatched: expect.any(Array),
      });
    });
  });

  describe("AI Fallback for Unknown Skills", () => {
    test("calls AI for unknown skills", async () => {
      const { setupMocks } = mockSuccessfulOpenAIResponse([
        {
          original: "UnknownSkill123",
          can_expand: false,
          expansion: null,
          keywords_matched: [],
          reasoning: "Cannot be meaningfully expanded",
        },
      ]);

      const mockCreate = await setupMocks();

      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["UnknownSkill123"],
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    test("combines local and AI suggestions", async () => {
      const { setupMocks } = mockSuccessfulOpenAIResponse([
        {
          original: "UnknownFramework",
          can_expand: true,
          expansion: "UnknownFramework (Plugin A, Plugin B)",
          keywords_matched: [],
          reasoning: "Expanded with common plugins",
        },
      ]);

      await setupMocks();

      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Python", "UnknownFramework"],
      });

      expect(result.error).toBeNull();
      expect(result.data?.suggestions.length).toBe(2);
      expect(result.data?.suggestions[0].original).toBe("Python");
      expect(result.data?.suggestions[1].original).toBe("UnknownFramework");
    });
  });

  describe("Non-Expandable Skills", () => {
    test("filters out skills that cannot be expanded", async () => {
      const { setupMocks } = mockSuccessfulOpenAIResponse([
        {
          original: "Communication",
          can_expand: false,
          expansion: null,
          keywords_matched: [],
          reasoning: "Soft skill, cannot be expanded",
        },
      ]);

      await setupMocks();

      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["Communication"],
      });

      expect(result.error).toBeNull();
      expect(result.data?.suggestions).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    test("returns error on AI response parse failure", async () => {
      const { setupMocks } = mockSuccessfulOpenAIResponse([]);

      const mockCreate = await setupMocks();
      mockCreate.mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: "invalid json" } }],
      });

      const { parseOpenAIResponse } = await import("@/lib/openai");
      (parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: "invalid json",
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      });

      const result = await generateSkillExpansionSuggestions({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        skills: ["UnknownSkill"],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("PARSE_ERROR");
    });
  });
});

describe("transformSkillExpansionSuggestions", () => {
  test("transforms suggestions to database format", () => {
    const suggestions = [
      {
        original: "Python",
        expansion: "Python (pandas, NumPy, TensorFlow)",
        keywordsMatched: ["TensorFlow", "pandas"],
        reasoning: "Common data science libraries",
      },
    ];

    const result = transformSkillExpansionSuggestions(suggestions);

    expect(result).toEqual([
      {
        section: "skills",
        itemIndex: 0,
        originalText: "Python",
        suggestedText: "Python (pandas, NumPy, TensorFlow)",
        suggestionType: "skill_expansion",
        reasoning:
          "Common data science libraries\n\nKeywords matched: TensorFlow, pandas",
      },
    ]);
  });

  test("filters out null expansions", () => {
    const suggestions = [
      {
        original: "Python",
        expansion: "Python (pandas, NumPy)",
        keywordsMatched: [],
        reasoning: "Common libraries",
      },
      {
        original: "Communication",
        expansion: null,
        keywordsMatched: [],
        reasoning: "Cannot expand",
      },
    ];

    const result = transformSkillExpansionSuggestions(suggestions);

    expect(result.length).toBe(1);
    expect(result[0].originalText).toBe("Python");
  });

  test("handles empty keywords matched array", () => {
    const suggestions = [
      {
        original: "React",
        expansion: "React (Redux, Next.js)",
        keywordsMatched: [],
        reasoning: "Common React libraries",
      },
    ];

    const result = transformSkillExpansionSuggestions(suggestions);

    expect(result[0].reasoning).toContain("Keywords matched: none");
  });

  test("assigns correct item indexes", () => {
    const suggestions = [
      {
        original: "Python",
        expansion: "Python (pandas)",
        keywordsMatched: [],
        reasoning: "Expansion",
      },
      {
        original: "JavaScript",
        expansion: "JavaScript (React)",
        keywordsMatched: [],
        reasoning: "Expansion",
      },
    ];

    const result = transformSkillExpansionSuggestions(suggestions);

    expect(result[0].itemIndex).toBe(0);
    expect(result[1].itemIndex).toBe(1);
  });
});

/**
 * Tests for generateSkillMappings server action
 *
 * @see Story 5.2: Transferable Skills Detection & Mapping
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals"

// Mock dependencies before importing
jest.mock("@/lib/supabase/server")
jest.mock("@/lib/openai", () => ({
  getOpenAIClient: jest.fn(),
  parseOpenAIResponse: jest.fn(),
}))
jest.mock("@/lib/openai/retry", () => ({
  withRetry: jest.fn(),
}))

import { generateSkillMappings } from "@/actions/suggestions"

// Helper to mock successful OpenAI response
function mockSuccessfulOpenAIResponse(mappings: Array<{
  original: string
  mapped_skills: string[]
  tech_equivalent: string
  reasoning: string
  jd_keywords_matched: string[]
}>) {
  const mockContent = JSON.stringify({ mappings })

  return {
    mockContent,
    setupMocks: async () => {
      const { getOpenAIClient, parseOpenAIResponse } = await import("@/lib/openai")
      const { withRetry } = await import("@/lib/openai/retry")

      const mockCreate = jest.fn().mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: mockContent } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      })

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
      ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: mockContent,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      })

      return mockCreate
    },
  }
}

describe("generateSkillMappings", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Input Validation", () => {
    test("rejects invalid scanId", async () => {
      const result = await generateSkillMappings({
        scanId: "invalid-uuid",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("VALIDATION_ERROR")
    })

    test("rejects empty experiences array", async () => {
      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("VALIDATION_ERROR")
    })

    test("rejects invalid section value", async () => {
      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          // @ts-expect-error Testing invalid input
          { text: "Sample", context: "Context", section: "invalid" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("VALIDATION_ERROR")
    })

    test("rejects invalid experienceLevel", async () => {
      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        // @ts-expect-error Testing invalid input
        experienceLevel: "invalid",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("VALIDATION_ERROR")
    })

    test("accepts valid input", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Managed retail operations",
          mapped_skills: ["Operations Management", "Team Leadership"],
          tech_equivalent: "Technical program management",
          reasoning: "Relevant for tech roles",
          jd_keywords_matched: ["management"],
        },
      ])
      await mock.setupMocks()

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          {
            text: "Managed retail operations",
            context: "Store Manager",
            section: "experience",
          },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: ["management"],
      })

      expect(result.data).not.toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("Career Changer Context", () => {
    test("processes retail management experience", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Managed store with 50+ employees",
          mapped_skills: ["Team Leadership", "Operations Management"],
          tech_equivalent:
            "Technical project management, cross-functional team coordination",
          reasoning:
            "Demonstrates ability to lead teams and manage complex operations",
          jd_keywords_matched: ["project management", "leadership"],
        },
      ])
      await mock.setupMocks()

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          {
            text: "Managed store with 50+ employees",
            context: "Store Manager",
            section: "experience",
          },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Technical Project Manager",
        jdKeywords: ["project management", "leadership"],
      })

      expect(result.data).not.toBeNull()
      expect(result.data?.mappings).toHaveLength(1)
      expect(result.data?.mappings[0].mapped_skills).toContain(
        "Team Leadership"
      )
    })
  })

  describe("Student Context", () => {
    test("processes TA experience", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "TA for Data Structures course",
          mapped_skills: [
            "Technical Mentorship",
            "Code Review",
            "Debugging",
          ],
          tech_equivalent: "Technical mentorship, code review experience",
          reasoning:
            "Demonstrates ability to help others solve technical problems",
          jd_keywords_matched: ["mentorship"],
        },
      ])
      await mock.setupMocks()

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          {
            text: "TA for Data Structures course",
            context: "University TA",
            section: "education",
          },
        ],
        experienceLevel: "entry",
        isStudent: true,
        background: "student",
        targetRole: "Software Engineer",
        jdKeywords: ["mentorship"],
      })

      expect(result.data).not.toBeNull()
      expect(result.data?.mappings).toHaveLength(1)
      expect(result.data?.mappings[0].mapped_skills).toContain(
        "Technical Mentorship"
      )
    })
  })

  describe("Multiple Experiences", () => {
    test("handles multiple experiences in batch", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Managed inventory",
          mapped_skills: ["Database Management", "Optimization"],
          tech_equivalent: "Database management, inventory systems",
          reasoning: "Shows systems thinking",
          jd_keywords_matched: ["database"],
        },
        {
          original: "Led team of 12",
          mapped_skills: ["Team Leadership"],
          tech_equivalent: "Cross-functional team leadership",
          reasoning: "Leadership experience",
          jd_keywords_matched: ["leadership"],
        },
      ])
      await mock.setupMocks()

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          {
            text: "Managed inventory",
            context: "Inventory Manager",
            section: "experience",
          },
          { text: "Led team of 12", context: "Team Lead", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: ["database", "leadership"],
      })

      expect(result.data).not.toBeNull()
      expect(result.data?.mappings).toHaveLength(2)
    })
  })

  describe("Response Validation", () => {
    test("rejects response with wrong number of mappings", async () => {
      // Return 2 mappings for 1 experience
      const { getOpenAIClient, parseOpenAIResponse } = await import("@/lib/openai")
      const { withRetry } = await import("@/lib/openai/retry")

      const mockContent = JSON.stringify({
        mappings: [
          {
            original: "First",
            mapped_skills: ["Skill"],
            tech_equivalent: "Tech",
            reasoning: "Reason",
            jd_keywords_matched: [],
          },
          {
            original: "Second",
            mapped_skills: ["Skill"],
            tech_equivalent: "Tech",
            reasoning: "Reason",
            jd_keywords_matched: [],
          },
        ],
      })

      const mockCreate = jest.fn().mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: mockContent } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      })

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
      ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: mockContent,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      })

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("PARSE_ERROR")
      expect(result.error?.message).toContain("invalid number of mappings")
    })

    test("rejects response with malformed mapping structure", async () => {
      // Return mapping missing required fields
      const { getOpenAIClient, parseOpenAIResponse } = await import("@/lib/openai")
      const { withRetry } = await import("@/lib/openai/retry")

      const mockContent = JSON.stringify({
        mappings: [
          {
            original: "Sample",
            // Missing: mapped_skills, tech_equivalent, reasoning, jd_keywords_matched
          },
        ],
      })

      const mockCreate = jest.fn().mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: mockContent } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      })

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
      ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: mockContent,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      })

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("PARSE_ERROR")
      expect(result.error?.message).toContain("invalid mapping structure")
    })

    test("rejects response with wrong JSON structure (no mappings key)", async () => {
      const { getOpenAIClient, parseOpenAIResponse } = await import("@/lib/openai")
      const { withRetry } = await import("@/lib/openai/retry")

      // Valid JSON but wrong structure - 'data' instead of 'mappings'
      const mockContent = JSON.stringify({
        data: [{ original: "Sample" }],
      })

      const mockCreate = jest.fn().mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: mockContent } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      })

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
      ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: mockContent,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      })

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("PARSE_ERROR")
    })
  })

  describe("Error Handling", () => {
    test("handles OpenAI API failure gracefully", async () => {
      const { getOpenAIClient } = await import("@/lib/openai")
      const { withRetry } = await import("@/lib/openai/retry")

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error("API Error")),
          },
        },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("GENERATION_ERROR")
    })

    test("handles invalid JSON response from OpenAI", async () => {
      const { getOpenAIClient, parseOpenAIResponse } = await import("@/lib/openai")
      const { withRetry } = await import("@/lib/openai/retry")

      const mockCreate = jest.fn().mockResolvedValue({
        id: "test-id",
        model: "gpt-4o-mini",
        choices: [{ message: { content: "Invalid JSON response" } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      })

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
      ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: "Invalid JSON response",
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      })

      const result = await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "entry",
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
        jdKeywords: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe("PARSE_ERROR")
    })
  })

  describe("JD Keyword Matching", () => {
    test("passes JD keywords to prompt", async () => {
      const mock = mockSuccessfulOpenAIResponse([
        {
          original: "Sample",
          mapped_skills: ["Skill"],
          tech_equivalent: "Tech skill",
          reasoning: "Reasoning",
          jd_keywords_matched: ["agile", "scrum"],
        },
      ])
      const mockCreate = await mock.setupMocks()

      await generateSkillMappings({
        scanId: "550e8400-e29b-41d4-a716-446655440000",
        experiences: [
          { text: "Sample", context: "Context", section: "experience" },
        ],
        experienceLevel: "mid",
        isStudent: false,
        background: "management",
        targetRole: "Engineering Manager",
        jdKeywords: ["agile", "scrum", "CI/CD"],
      })

      // Verify OpenAI was called with prompt containing keywords
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("agile"),
            }),
          ]),
        })
      )
    })
  })
})

/**
 * Tests for transferable skills detection prompt
 *
 * @see Story 5.2: Transferable Skills Detection & Mapping
 */

import { describe, test, expect } from "@jest/globals"
import { createTransferableSkillsPrompt } from "@/lib/openai/prompts/skills"

describe("createTransferableSkillsPrompt", () => {
  describe("Career Changer Context", () => {
    test("generates prompt for retail management background", () => {
      const experiences = [
        {
          text: "Managed daily operations for retail store with 50+ employees and $2M revenue",
          context: "Store Manager at RetailCo",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: false,
        background: "retail",
        targetRole: "Technical Project Manager",
      }

      const jdKeywords = ["project management", "cross-functional", "agile"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      // Verify prompt includes career changer context
      expect(prompt).toContain("career changer")
      expect(prompt).toContain("retail")
      expect(prompt).toContain("Technical Project Manager")
      expect(prompt).toContain("project management")
      expect(prompt).toContain("operations")
      expect(prompt).toContain("JSON")
    })

    test("generates prompt for finance background", () => {
      const experiences = [
        {
          text: "Analyzed financial data and generated quarterly reports",
          context: "Financial Analyst",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: false,
        background: "finance",
        targetRole: "Backend Developer",
      }

      const jdKeywords = ["data analysis", "SQL", "reporting"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      expect(prompt).toContain("finance")
      expect(prompt).toContain("data analysis")
      expect(prompt).toContain("Backend Developer")
    })
  })

  describe("Student Context", () => {
    test("generates prompt for TA experience", () => {
      const experiences = [
        {
          text: "Teaching Assistant for Data Structures course, helped 200+ students debug code",
          context: "TA at University",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: true,
        background: "student",
        targetRole: "Software Engineer",
      }

      const jdKeywords = ["mentorship", "code review", "debugging"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      // Verify prompt includes student context
      expect(prompt).toContain("student")
      expect(prompt).toContain("TA")
      expect(prompt).toContain("mentorship")
      expect(prompt).toContain("Software Engineer")
    })

    test("generates prompt for group project experience", () => {
      const experiences = [
        {
          text: "Led group project building e-commerce website with 4 team members",
          context: "CS Course Project",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: true,
        background: "student",
        targetRole: "Full Stack Developer",
      }

      const jdKeywords = ["collaboration", "leadership", "web development"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      expect(prompt).toContain("student")
      expect(prompt).toContain("group project")
      expect(prompt).toContain("collaboration")
    })
  })

  describe("Multiple Experiences", () => {
    test("handles multiple experiences in single prompt", () => {
      const experiences = [
        {
          text: "Managed inventory of 10,000+ SKUs",
          context: "Inventory Manager",
        },
        {
          text: "Led team of 12 associates",
          context: "Team Lead",
        },
        {
          text: "Implemented new scheduling system",
          context: "Process Improvement",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: false,
        background: "retail",
        targetRole: "Product Manager",
      }

      const jdKeywords = ["systems", "team leadership", "optimization"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      // Verify all experiences are included
      expect(prompt).toContain("10,000+ SKUs")
      expect(prompt).toContain("12 associates")
      expect(prompt).toContain("scheduling system")
    })
  })

  describe("JSON Structure Validation", () => {
    test("prompt instructs for proper JSON response format", () => {
      const experiences = [
        {
          text: "Sample experience",
          context: "Sample context",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
      }

      const jdKeywords = ["test"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      // Verify JSON format instructions
      expect(prompt).toContain("JSON")
      expect(prompt).toContain("mappings")
      expect(prompt).toContain("original")
      expect(prompt).toContain("mapped_skills")
      expect(prompt).toContain("tech_equivalent")
      expect(prompt).toContain("reasoning")
      expect(prompt).toContain("jd_keywords_matched")
    })
  })

  describe("Job Description Keyword Matching", () => {
    test("includes JD keywords in prompt for alignment", () => {
      const experiences = [
        {
          text: "Managed team and projects",
          context: "Manager",
        },
      ]

      const userProfile = {
        experienceLevel: "mid" as const,
        isStudent: false,
        background: "management",
        targetRole: "Engineering Manager",
      }

      const jdKeywords = ["agile", "scrum", "CI/CD", "distributed systems"]

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      // Verify all keywords are present
      jdKeywords.forEach((keyword) => {
        expect(prompt).toContain(keyword)
      })
    })

    test("handles empty JD keywords array", () => {
      const experiences = [
        {
          text: "Sample experience",
          context: "Sample context",
        },
      ]

      const userProfile = {
        experienceLevel: "entry" as const,
        isStudent: false,
        background: "retail",
        targetRole: "Developer",
      }

      const jdKeywords: string[] = []

      const prompt = createTransferableSkillsPrompt(
        experiences,
        userProfile,
        jdKeywords
      )

      // Should not crash with empty keywords
      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe("Experience Level Handling", () => {
    test("includes experience level in prompt context", () => {
      const testCases: Array<"entry" | "mid" | "senior"> = [
        "entry",
        "mid",
        "senior",
      ]

      testCases.forEach((level) => {
        const experiences = [
          { text: "Sample experience", context: "Sample context" },
        ]

        const userProfile = {
          experienceLevel: level,
          isStudent: false,
          background: "tech",
          targetRole: "Developer",
        }

        const jdKeywords = ["test"]

        const prompt = createTransferableSkillsPrompt(
          experiences,
          userProfile,
          jdKeywords
        )

        expect(prompt).toContain(level)
      })
    })
  })
})

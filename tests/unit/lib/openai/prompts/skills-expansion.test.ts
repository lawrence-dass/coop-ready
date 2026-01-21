/**
 * Unit Tests: Skills Expansion Prompt
 *
 * Tests the OpenAI prompt generation for skill expansion suggestions.
 * Story 5.4: Skills Expansion Suggestions
 */

import { describe, it, expect } from "@jest/globals";
import { SKILL_EXPANSION_PROMPT } from "@/lib/openai/prompts/skills-expansion";

describe("SKILL_EXPANSION_PROMPT", () => {
  describe("Basic Prompt Generation", () => {
    it("should generate prompt with skills list", () => {
      const skills = ["Python", "JavaScript"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("Python");
      expect(prompt).toContain("JavaScript");
      expect(prompt).toContain("1. Python");
      expect(prompt).toContain("2. JavaScript");
    });

    it("should include ATS optimization context", () => {
      const skills = ["React"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("ATS");
      expect(prompt).toContain("keyword");
    });

    it("should request JSON response format", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("JSON");
      expect(prompt).toContain("suggestions");
    });
  });

  describe("JD Keywords Integration", () => {
    it("should include JD keywords when provided", () => {
      const skills = ["Python"];
      const jdKeywords = ["TensorFlow", "pandas", "scikit-learn"];
      const prompt = SKILL_EXPANSION_PROMPT(skills, undefined, jdKeywords);

      expect(prompt).toContain("Job Description Keywords");
      expect(prompt).toContain("TensorFlow");
      expect(prompt).toContain("pandas");
      expect(prompt).toContain("scikit-learn");
    });

    it("should prioritize expansions matching JD keywords", () => {
      const skills = ["Python"];
      const jdKeywords = ["TensorFlow"];
      const prompt = SKILL_EXPANSION_PROMPT(skills, undefined, jdKeywords);

      expect(prompt).toContain("Prioritize expansions that include these keywords");
    });

    it("should handle empty JD keywords array", () => {
      const skills = ["Python"];
      const jdKeywords: string[] = [];
      const prompt = SKILL_EXPANSION_PROMPT(skills, undefined, jdKeywords);

      expect(prompt).not.toContain("Job Description Keywords");
    });

    it("should work without JD keywords", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).not.toContain("Job Description Keywords");
      expect(prompt).toContain("Python");
    });
  });

  describe("JD Content Integration", () => {
    it("should include JD content excerpt when provided", () => {
      const skills = ["Python"];
      const jdContent = "Looking for a Python developer with experience in data science and machine learning.";
      const prompt = SKILL_EXPANSION_PROMPT(skills, jdContent);

      expect(prompt).toContain("Job Description excerpt");
      expect(prompt).toContain("Python developer");
    });

    it("should truncate long JD content to 500 chars", () => {
      const skills = ["Python"];
      const longJdContent = "A".repeat(1000);
      const prompt = SKILL_EXPANSION_PROMPT(skills, longJdContent);

      expect(prompt).toContain("A".repeat(500) + "...");
      expect(prompt).not.toContain("A".repeat(501));
    });

    it("should work without JD content", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).not.toContain("Job Description excerpt");
    });
  });

  describe("Rules and Instructions", () => {
    it("should include technical accuracy rules", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("technically accurate");
      expect(prompt).toContain("honest");
    });

    it("should warn against soft skills expansion", () => {
      const skills = ["Communication", "Leadership"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("Communication");
      expect(prompt).toContain("Leadership");
      expect(prompt.toLowerCase()).toContain("cannot be meaningfully expanded");
    });

    it("should request CAN_EXPAND flag", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("CAN_EXPAND");
      expect(prompt).toContain("true/false");
    });

    it("should request EXPANSION field", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("EXPANSION");
    });

    it("should request KEYWORDS_MATCHED field", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("KEYWORDS_MATCHED");
    });

    it("should request REASONING field", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("REASONING");
    });
  });

  describe("Response Format", () => {
    it("should specify JSON structure with suggestions array", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain('"suggestions"');
      expect(prompt).toContain('"original"');
      expect(prompt).toContain('"can_expand"');
      expect(prompt).toContain('"expansion"');
      expect(prompt).toContain('"keywords_matched"');
      expect(prompt).toContain('"reasoning"');
    });
  });

  describe("Multiple Skills Handling", () => {
    it("should handle multiple skills with proper numbering", () => {
      const skills = ["Python", "JavaScript", "React", "AWS"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("1. Python");
      expect(prompt).toContain("2. JavaScript");
      expect(prompt).toContain("3. React");
      expect(prompt).toContain("4. AWS");
    });

    it("should request response for EACH skill", () => {
      const skills = ["Python", "JavaScript"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt.toUpperCase()).toContain("EACH SKILL");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single skill", () => {
      const skills = ["Python"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("1. Python");
      expect(prompt).not.toContain("2. Python");
    });

    it("should handle skills with special characters", () => {
      const skills = ["C#", "F#"];
      const prompt = SKILL_EXPANSION_PROMPT(skills);

      expect(prompt).toContain("C#");
      expect(prompt).toContain("F#");
    });

    it("should combine JD keywords and content when both provided", () => {
      const skills = ["Python"];
      const jdKeywords = ["TensorFlow"];
      const jdContent = "Looking for Python developer";
      const prompt = SKILL_EXPANSION_PROMPT(skills, jdContent, jdKeywords);

      expect(prompt).toContain("Job Description Keywords");
      expect(prompt).toContain("TensorFlow");
      expect(prompt).toContain("Job Description excerpt");
      expect(prompt).toContain("Python developer");
    });
  });
});

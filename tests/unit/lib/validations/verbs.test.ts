/**
 * Unit Tests: Verb Validation for Action Verb & Quantification Suggestions
 *
 * Tests weak verb detection and strong verb categorization.
 * Story 5.3: Action Verb & Quantification Suggestions
 */

import { describe, it, expect } from "@jest/globals";
import {
  WEAK_VERBS,
  STRONG_VERBS_BY_CATEGORY,
  hasWeakVerb,
  extractVerbContext,
} from "@/lib/validations/verbs";

describe("WEAK_VERBS", () => {
  it("should include all required weak verbs from AC1", () => {
    const requiredWeakVerbs = [
      "responsible for",
      "helped with",
      "assisted with",
      "worked on",
      "was involved in",
      "participated in",
      "contributed to",
      "did",
      "made",
      "got",
    ];

    requiredWeakVerbs.forEach((verb) => {
      expect(WEAK_VERBS).toContain(verb);
    });
  });
});

describe("STRONG_VERBS_BY_CATEGORY", () => {
  it("should have leadership verbs from AC2", () => {
    const requiredLeadershipVerbs = [
      "Led",
      "Directed",
      "Managed",
      "Orchestrated",
      "Supervised",
      "Guided",
      "Mentored",
      "Championed",
      "Spearheaded",
    ];

    requiredLeadershipVerbs.forEach((verb) => {
      expect(STRONG_VERBS_BY_CATEGORY.leadership).toContain(verb);
    });
  });

  it("should have technical verbs from AC2", () => {
    const requiredTechnicalVerbs = [
      "Engineered",
      "Built",
      "Designed",
      "Architected",
      "Developed",
      "Implemented",
      "Deployed",
      "Optimized",
      "Scaled",
    ];

    requiredTechnicalVerbs.forEach((verb) => {
      expect(STRONG_VERBS_BY_CATEGORY.technical).toContain(verb);
    });
  });

  it("should have analysis verbs from AC2", () => {
    const requiredAnalysisVerbs = [
      "Analyzed",
      "Identified",
      "Diagnosed",
      "Evaluated",
      "Assessed",
      "Investigated",
      "Discovered",
    ];

    requiredAnalysisVerbs.forEach((verb) => {
      expect(STRONG_VERBS_BY_CATEGORY.analysis).toContain(verb);
    });
  });

  it("should have communication verbs from AC2", () => {
    const requiredCommunicationVerbs = [
      "Presented",
      "Communicated",
      "Articulated",
      "Conveyed",
      "Explained",
      "Documented",
      "Authored",
      "Wrote",
    ];

    requiredCommunicationVerbs.forEach((verb) => {
      expect(STRONG_VERBS_BY_CATEGORY.communication).toContain(verb);
    });
  });
});

describe("hasWeakVerb", () => {
  it('should detect "Responsible for" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Responsible for development")).toBe(true);
  });

  it('should detect "Helped with" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Helped with team coordination")).toBe(true);
  });

  it('should detect "Assisted with" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Assisted with project management")).toBe(true);
  });

  it('should detect "Worked on" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Worked on API development")).toBe(true);
  });

  it('should detect "Was involved in" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Was involved in migration project")).toBe(true);
  });

  it('should detect "Participated in" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Participated in code reviews")).toBe(true);
  });

  it('should detect "Contributed to" as weak verb (AC1)', () => {
    expect(hasWeakVerb("Contributed to open source")).toBe(true);
  });

  it("should be case-insensitive when detecting weak verbs", () => {
    expect(hasWeakVerb("RESPONSIBLE FOR development")).toBe(true);
    expect(hasWeakVerb("helped with testing")).toBe(true);
  });

  it("should return false for strong verbs (AC5)", () => {
    expect(hasWeakVerb("Led migration of 2M user database")).toBe(false);
    expect(hasWeakVerb("Engineered scalable API")).toBe(false);
    expect(hasWeakVerb("Optimized database queries")).toBe(false);
  });

  it("should not match partial words (word boundary fix)", () => {
    // "made" should NOT match in "remade" or "handmade"
    expect(hasWeakVerb("Remade the entire system")).toBe(false);
    expect(hasWeakVerb("Created handmade solutions")).toBe(false);
    // But "made" alone should still match
    expect(hasWeakVerb("Made improvements to the codebase")).toBe(true);
  });

  it("should match weak verb phrases at different positions", () => {
    // At start
    expect(hasWeakVerb("Responsible for team management")).toBe(true);
    // In middle
    expect(hasWeakVerb("Was responsible for team management")).toBe(true);
    // At end
    expect(hasWeakVerb("The position I was responsible for")).toBe(true);
  });
});

describe("extractVerbContext", () => {
  it("should identify strong leadership verb", () => {
    const result = extractVerbContext("Led team of 8 developers");
    expect(result.verb).toBe("led");
    expect(result.category).toBe("leadership");
  });

  it("should identify strong technical verb", () => {
    const result = extractVerbContext("Engineered scalable API");
    expect(result.verb).toBe("engineered");
    expect(result.category).toBe("technical");
  });

  it("should identify strong analysis verb", () => {
    const result = extractVerbContext("Analyzed user behavior patterns");
    expect(result.verb).toBe("analyzed");
    expect(result.category).toBe("analysis");
  });

  it("should identify strong communication verb", () => {
    const result = extractVerbContext("Presented findings to stakeholders");
    expect(result.verb).toBe("presented");
    expect(result.category).toBe("communication");
  });

  it("should return null for weak verbs", () => {
    const result = extractVerbContext("Responsible for team management");
    expect(result.verb).toBeNull();
    expect(result.category).toBeNull();
  });

  it("should detect weak verb even when not at start", () => {
    const result = extractVerbContext(
      "Development project where I was involved in architecture"
    );
    // Contains "was involved in" which is weak, so should return null
    expect(result.verb).toBeNull();
    expect(result.category).toBeNull();
  });

  it("should handle empty text", () => {
    const result = extractVerbContext("");
    expect(result.verb).toBeNull();
    expect(result.category).toBeNull();
  });
});

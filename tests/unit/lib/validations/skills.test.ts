import { describe, it, expect } from "@jest/globals";
import {
  SKILL_EXPANSION_MAPPINGS,
  findSkillExpansion,
  getExpandableSkills,
  isExpandableSkill,
  filterExpandableSkills,
} from "@/lib/validations/skills";

describe("SKILL_EXPANSION_MAPPINGS", () => {
  it("should contain python skill expansion", () => {
    expect(SKILL_EXPANSION_MAPPINGS.python).toBeDefined();
    expect(SKILL_EXPANSION_MAPPINGS.python.family).toBe("Python");
    expect(SKILL_EXPANSION_MAPPINGS.python.expandTo).toContain("pandas");
  });

  it("should contain javascript skill expansion", () => {
    expect(SKILL_EXPANSION_MAPPINGS.javascript).toBeDefined();
    expect(SKILL_EXPANSION_MAPPINGS.javascript.family).toBe("JavaScript");
    expect(SKILL_EXPANSION_MAPPINGS.javascript.relatedSkills).toContain(
      "React"
    );
  });

  it("should contain aws skill expansion", () => {
    expect(SKILL_EXPANSION_MAPPINGS.aws).toBeDefined();
    expect(SKILL_EXPANSION_MAPPINGS.aws.family).toBe("AWS");
    expect(SKILL_EXPANSION_MAPPINGS.aws.relatedSkills).toContain("EC2");
  });
});

describe("findSkillExpansion", () => {
  it("should find expansion for exact match (lowercase key)", () => {
    const expansion = findSkillExpansion("python");
    expect(expansion).toBeDefined();
    expect(expansion?.family).toBe("Python");
  });

  it("should find expansion for case-insensitive match", () => {
    const expansion = findSkillExpansion("Python");
    expect(expansion).toBeDefined();
    expect(expansion?.family).toBe("Python");
  });

  it("should find expansion for family name match", () => {
    const expansion = findSkillExpansion("JavaScript");
    expect(expansion).toBeDefined();
    expect(expansion?.family).toBe("JavaScript");
  });

  it("should find expansion with spaces removed", () => {
    const expansion = findSkillExpansion("Google Cloud");
    expect(expansion).toBeDefined();
    expect(expansion?.family).toBe("Google Cloud");
  });

  it("should return null for unknown skill", () => {
    const expansion = findSkillExpansion("UnknownSkill123");
    expect(expansion).toBeNull();
  });

  it("should return null for empty string", () => {
    const expansion = findSkillExpansion("");
    expect(expansion).toBeNull();
  });

  it("should handle skills with multiple words", () => {
    const expansion = findSkillExpansion("Machine Learning");
    expect(expansion).toBeDefined();
  });
});

describe("getExpandableSkills", () => {
  it("should return array of expandable skill families", () => {
    const expandable = getExpandableSkills();
    expect(Array.isArray(expandable)).toBe(true);
    expect(expandable.length).toBeGreaterThan(0);
  });

  it("should include common technologies", () => {
    const expandable = getExpandableSkills();
    expect(expandable).toContain("Python");
    expect(expandable).toContain("JavaScript");
    expect(expandable).toContain("React");
    expect(expandable).toContain("AWS");
  });

  it("should have at least 30 expandable skills", () => {
    const expandable = getExpandableSkills();
    expect(expandable.length).toBeGreaterThanOrEqual(30);
  });
});

describe("isExpandableSkill", () => {
  it("should return true for known expandable skill", () => {
    expect(isExpandableSkill("Python")).toBe(true);
    expect(isExpandableSkill("JavaScript")).toBe(true);
    expect(isExpandableSkill("React")).toBe(true);
  });

  it("should return false for unknown skill", () => {
    expect(isExpandableSkill("UnknownFramework")).toBe(false);
  });

  it("should return false for soft skills", () => {
    expect(isExpandableSkill("Communication")).toBe(false);
    expect(isExpandableSkill("Leadership")).toBe(false);
  });

  it("should handle case-insensitive checks", () => {
    expect(isExpandableSkill("python")).toBe(true);
    expect(isExpandableSkill("PYTHON")).toBe(true);
  });
});

describe("filterExpandableSkills", () => {
  it("should filter only expandable skills from mixed list", () => {
    const skills = ["Python", "Communication", "React", "Leadership"];
    const expandable = filterExpandableSkills(skills);
    expect(expandable).toEqual(["Python", "React"]);
  });

  it("should return empty array for all non-expandable skills", () => {
    const skills = ["Communication", "Leadership", "Problem Solving"];
    const expandable = filterExpandableSkills(skills);
    expect(expandable).toEqual([]);
  });

  it("should return all skills if all are expandable", () => {
    const skills = ["Python", "JavaScript", "React"];
    const expandable = filterExpandableSkills(skills);
    expect(expandable).toEqual(["Python", "JavaScript", "React"]);
  });

  it("should handle empty array", () => {
    const skills: string[] = [];
    const expandable = filterExpandableSkills(skills);
    expect(expandable).toEqual([]);
  });

  it("should handle case-insensitive filtering", () => {
    const skills = ["python", "COMMUNICATION", "react"];
    const expandable = filterExpandableSkills(skills);
    expect(expandable.length).toBe(2);
  });
});

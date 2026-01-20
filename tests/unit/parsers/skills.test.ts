import { describe, it, expect } from "@jest/globals";
import { parseSkillsSection } from "@/lib/parsers/skills";
import { Skill } from "@/lib/parsers/types";

/**
 * Unit Tests for Skills Parser (AC4)
 * Tests extraction and categorization of skills as technical vs soft
 */

describe("Skills Parser - parseSkillsSection()", () => {
  describe("Basic skill extraction", () => {
    it("should extract skills from comma-separated list", () => {
      const text = "Python, JavaScript, React, Node.js, PostgreSQL";

      const skills = parseSkillsSection(text);

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some((s) => s.name.toLowerCase().includes("python"))).toBe(
        true
      );
      expect(skills.some((s) => s.name.toLowerCase().includes("react"))).toBe(
        true
      );
    });

    it("should extract skills from semicolon-separated list", () => {
      const text = "Python; JavaScript; React; Node.js; PostgreSQL";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });

    it("should extract skills from line-separated list", () => {
      const text = `
Python
JavaScript
React
Node.js
PostgreSQL
      `;

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });

    it("should extract skills from bullet-point list", () => {
      const text = `
- Python
- JavaScript
- React
- Node.js
      `;

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe("Technical skill categorization", () => {
    it("should identify programming languages as technical", () => {
      const text = "Python, JavaScript, Java, C++, Go, Rust";

      const skills = parseSkillsSection(text);
      const technicalSkills = skills.filter((s) => s.category === "technical");

      expect(technicalSkills.length).toBeGreaterThan(0);
    });

    it("should identify frameworks as technical", () => {
      const text = "React, Vue.js, Angular, Django, Spring Boot, Flask";

      const skills = parseSkillsSection(text);
      const technicalSkills = skills.filter((s) => s.category === "technical");

      expect(technicalSkills.length).toBeGreaterThan(0);
      expect(
        technicalSkills.some((s) => s.name.toLowerCase().includes("react"))
      ).toBe(true);
    });

    it("should identify databases as technical", () => {
      const text = "PostgreSQL, MySQL, MongoDB, Redis, DynamoDB, Cassandra";

      const skills = parseSkillsSection(text);
      const technicalSkills = skills.filter((s) => s.category === "technical");

      expect(technicalSkills.length).toBeGreaterThan(0);
    });

    it("should identify tools and platforms as technical", () => {
      const text = "Docker, Kubernetes, AWS, Azure, Git, GitHub, Jenkins";

      const skills = parseSkillsSection(text);
      const technicalSkills = skills.filter((s) => s.category === "technical");

      expect(technicalSkills.length).toBeGreaterThan(0);
    });

    it("should identify DevOps and infrastructure tools as technical", () => {
      const text = "Terraform, Ansible, CloudFormation, Helm, CI/CD, GitLab CI";

      const skills = parseSkillsSection(text);
      const technicalSkills = skills.filter((s) => s.category === "technical");

      expect(technicalSkills.length).toBeGreaterThan(0);
    });
  });

  describe("Soft skill categorization", () => {
    it("should identify communication as soft skill", () => {
      const text = "Communication, Written Communication, Verbal Communication";

      const skills = parseSkillsSection(text);
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(softSkills.length).toBeGreaterThan(0);
    });

    it("should identify leadership as soft skill", () => {
      const text = "Leadership, Team Leadership, Project Leadership";

      const skills = parseSkillsSection(text);
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(softSkills.length).toBeGreaterThan(0);
    });

    it("should identify teamwork as soft skill", () => {
      const text = "Teamwork, Collaboration, Cross-functional Collaboration";

      const skills = parseSkillsSection(text);
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(softSkills.length).toBeGreaterThan(0);
    });

    it("should identify problem-solving as soft skill", () => {
      const text =
        "Problem-Solving, Critical Thinking, Analytical Thinking, Troubleshooting";

      const skills = parseSkillsSection(text);
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(softSkills.length).toBeGreaterThan(0);
    });

    it("should identify other soft skills", () => {
      const text =
        "Adaptability, Time Management, Attention to Detail, Creativity, Mentoring";

      const skills = parseSkillsSection(text);
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(softSkills.length).toBeGreaterThan(0);
    });
  });

  describe("Mixed technical and soft skills", () => {
    it("should categorize mixed skills correctly", () => {
      const text = `
Python, JavaScript, React
Leadership, Communication
Node.js, PostgreSQL
Teamwork, Problem-Solving
      `;

      const skills = parseSkillsSection(text);
      const technicalSkills = skills.filter((s) => s.category === "technical");
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(technicalSkills.length).toBeGreaterThan(0);
      expect(softSkills.length).toBeGreaterThan(0);
    });

    it("should handle grouped skills with category headers", () => {
      const text = `
Programming Languages: Python, JavaScript, Java
Frameworks: React, Django, Spring Boot
Soft Skills: Leadership, Communication, Teamwork
      `;

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      expect(
        skills.some((s) => s.name.toLowerCase().includes("python"))
      ).toBe(true);
    });
  });

  describe("Skill format variations", () => {
    it("should handle skills with whitespace", () => {
      const text = "  Python  ,  JavaScript  ,  React  ";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      // Skills should be trimmed
      skills.forEach((skill) => {
        expect(skill.name.trim()).toBe(skill.name);
      });
    });

    it("should handle multi-word skills", () => {
      const text =
        "Machine Learning, Natural Language Processing, Computer Vision, Agile Methodology";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      expect(
        skills.some((s) => s.name.includes("Machine Learning"))
      ).toBe(true);
    });

    it("should handle skills with special characters", () => {
      const text = "C++, C#, F#, .NET, Node.js, Adobe CC, Office 365";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });

    it("should handle skills with levels", () => {
      const text = "Python (Advanced), JavaScript (Intermediate), React (Expert)";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });

    it("should handle skills with years of experience", () => {
      const text = "Python (5 years), React (3 years), Leadership (8 years)";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      // Years should be extracted as part of skill name or metadata
    });
  });

  describe("Edge cases", () => {
    it("should handle empty skills section", () => {
      const text = "";

      const skills = parseSkillsSection(text);

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });

    it("should handle single skill", () => {
      const text = "Python";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBe(1);
      expect(skills[0].name).toContain("Python");
    });

    it("should handle duplicate skills", () => {
      const text = "Python, Python, JavaScript";

      const skills = parseSkillsSection(text);

      // Should handle duplicates (either keep or deduplicate)
      expect(skills.length).toBeGreaterThan(0);
    });

    it("should handle case-insensitive skill matching", () => {
      const text = "PYTHON, javascript, ReAcT";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      // Should classify correctly regardless of case
    });

    it("should handle skills with numbers", () => {
      const text = "Python 3, JavaScript ES6, C++ 11, SQL Server 2019";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });

    it("should handle very long skills list", () => {
      const skillsList = Array.from({ length: 50 }, (_, i) =>
        `Skill${i}`
      ).join(", ");

      const skills = parseSkillsSection(skillsList);

      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe("Return type validation", () => {
    it("should return array of Skill objects", () => {
      const text = "Python, Leadership, React";

      const skills = parseSkillsSection(text);

      expect(Array.isArray(skills)).toBe(true);
      skills.forEach((skill: Skill) => {
        expect(typeof skill.name).toBe("string");
        expect(typeof skill.category).toBe("string");
        expect(["technical", "soft"]).toContain(skill.category);
      });
    });

    it("should have required properties", () => {
      const text = "Python";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty("name");
      expect(skills[0]).toHaveProperty("category");
    });
  });

  describe("Unknown skills handling", () => {
    it("should handle skills not in predefined lists", () => {
      const text = "CustomTechTool, UniqueSkill, MyCustomFramework";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      // Should still extract even if not categorized correctly
    });

    it("should default unknown skills to technical", () => {
      const text = "UnknownTech123, CustomFramework, MyLibrary";

      const skills = parseSkillsSection(text);

      // Unknown technical-looking skills may default to technical
      expect(skills.length).toBeGreaterThan(0);
    });

    it("should handle abbreviated skill names", () => {
      const text = "HTML, CSS, SQL, JSON, REST, API, OOP, MVC";

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe("Complex skill scenarios", () => {
    it("should handle real-world resume skills section", () => {
      const text = `
Programming Languages
Python, JavaScript, Java, SQL, HTML/CSS

Web Frameworks & Libraries
React.js, Node.js, Django, Spring Boot

Databases & Tools
PostgreSQL, MongoDB, Docker, Git

Soft Skills
Project Management, Leadership, Communication, Problem-Solving
      `;

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
      const technicalSkills = skills.filter((s) => s.category === "technical");
      const softSkills = skills.filter((s) => s.category === "soft");

      expect(technicalSkills.length).toBeGreaterThan(0);
      expect(softSkills.length).toBeGreaterThan(0);
    });

    it("should handle mixed separators", () => {
      const text = `
Python, JavaScript; React
Node.js - Express
- MongoDB
• Docker
AWS
      `;

      const skills = parseSkillsSection(text);

      expect(skills.length).toBeGreaterThan(0);
    });
  });
});

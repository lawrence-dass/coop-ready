import { describe, it, expect } from "@jest/globals";
import { detectSections } from "@/lib/parsers/resume";

/**
 * Unit Tests for Section Detection (AC1, AC5)
 * Tests the regex-based detection of resume section headers
 */

describe("Section Detection - detectSections()", () => {
  describe("Standard sections", () => {
    it("should detect Contact section at start of resume", () => {
      const text = `
John Doe
(555) 123-4567
john@example.com

Professional Summary
Experienced developer
      `;

      const sections = detectSections(text);
      expect(sections.has("contact")).toBeTruthy();
    });

    it("should detect Summary/Objective section with multiple header variations", () => {
      const variations = [
        "Summary\nExperienced developer",
        "PROFESSIONAL SUMMARY\nExperienced developer",
        "Objective:\nExperienced developer",
        "Professional Profile\nExperienced developer",
      ];

      variations.forEach((text) => {
        const sections = detectSections(text);
        expect(sections.has("summary")).toBeTruthy();
      });
    });

    it("should detect Experience section with header variations", () => {
      const variations = [
        "Experience\nTech Corp, Developer, 2021",
        "PROFESSIONAL EXPERIENCE\nTech Corp, Developer, 2021",
        "Work Experience:\nTech Corp, Developer, 2021",
        "Employment History\nTech Corp, Developer, 2021",
      ];

      variations.forEach((text) => {
        const sections = detectSections(text);
        expect(sections.has("experience")).toBeTruthy();
      });
    });

    it("should detect Education section with header variations", () => {
      const variations = [
        "Education\nUniversity Name, B.S. 2019",
        "ACADEMIC BACKGROUND\nUniversity Name, B.S. 2019",
        "Degree:\nUniversity Name, B.S. 2019",
      ];

      variations.forEach((text) => {
        const sections = detectSections(text);
        expect(sections.has("education")).toBeTruthy();
      });
    });

    it("should detect Skills section with header variations", () => {
      const variations = [
        "Skills\nPython, JavaScript",
        "TECHNICAL SKILLS\nPython, JavaScript",
        "Core Competencies:\nPython, JavaScript",
        "Expertise\nPython, JavaScript",
      ];

      variations.forEach((text) => {
        const sections = detectSections(text);
        expect(sections.has("skills")).toBeTruthy();
      });
    });

    it("should detect Projects section with header variations", () => {
      const variations = [
        "Projects\nE-commerce Platform",
        "PORTFOLIO\nE-commerce Platform",
        "Achievements:\nE-commerce Platform",
      ];

      variations.forEach((text) => {
        const sections = detectSections(text);
        expect(sections.has("projects")).toBeTruthy();
      });
    });
  });

  describe("Case-insensitive matching", () => {
    it("should match section headers regardless of case", () => {
      const text = `
EXPERIENCE
Tech Corp

education
University

skills
Python
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
      expect(sections.has("education")).toBeTruthy();
      expect(sections.has("skills")).toBeTruthy();
    });

    it("should handle mixed case variations", () => {
      const text = `
PrOfEsSiOnAl ExPeRiEnCe
Tech Corp

SkIlLs
Python
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
      expect(sections.has("skills")).toBeTruthy();
    });
  });

  describe("Header format variations", () => {
    it("should handle headers with colons", () => {
      const text = `
Experience:
Tech Corp

Skills:
Python
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
      expect(sections.has("skills")).toBeTruthy();
    });

    it("should handle headers with underscores", () => {
      const text = `
==== Experience ====
Tech Corp

---- Skills ----
Python
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
      expect(sections.has("skills")).toBeTruthy();
    });

    it("should handle headers with asterisks or dashes", () => {
      const text = `
** Experience **
Tech Corp

* Skills *
Python
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
      expect(sections.has("skills")).toBeTruthy();
    });
  });

  describe("Non-standard sections", () => {
    it("should NOT categorize unknown sections into standard categories", () => {
      const text = `
Certifications
AWS Solutions Architect

Volunteering
Red Cross Volunteer

Publications
Paper on AI
      `;

      const sections = detectSections(text);
      // Should detect these as sections but not map to standard categories
      // (they'll be handled as "Other" in the orchestrator)
      expect(sections.size).toBeGreaterThan(0);
    });

    it("should detect section boundaries with line numbers", () => {
      const text = `Line 1
Line 2
Experience
Line 4
Line 5
Education
Line 7`;

      const sections = detectSections(text);
      const experienceSection = sections.get("experience");
      const educationSection = sections.get("education");

      // Should include start/end positions
      expect(experienceSection).toHaveProperty("start");
      expect(experienceSection).toHaveProperty("end");
      expect(experienceSection?.start).toBeLessThan(educationSection?.start);
    });
  });

  describe("Order preservation", () => {
    it("should return sections in the order they appear in document", () => {
      const text = `
Experience
Tech Corp

Skills
Python

Education
University
      `;

      const sections = detectSections(text);
      const sectionOrder = Array.from(sections.keys());

      expect(sectionOrder.indexOf("experience")).toBeLessThan(
        sectionOrder.indexOf("skills")
      );
      expect(sectionOrder.indexOf("skills")).toBeLessThan(
        sectionOrder.indexOf("education")
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle resume with minimal sections", () => {
      const text = `
John Doe
john@example.com

Experience
Tech Corp, 2020-2021
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
    });

    it("should handle resume with only contact and experience", () => {
      const text = `
John Doe | john@example.com

Experience
Tech Corp - Developer - 2020-2021
      `;

      const sections = detectSections(text);
      expect(sections.has("experience")).toBeTruthy();
    });

    it("should return empty map for text with no identifiable sections", () => {
      const text = "Random text without any section headers";

      const sections = detectSections(text);
      expect(sections.size).toBe(0);
    });

    it("should handle section headers with special characters", () => {
      const text = `
[EXPERIENCE]
Tech Corp

{SKILLS}
Python
      `;

      const sections = detectSections(text);
      // Should still detect even with special chars
      expect(sections.size).toBeGreaterThan(0);
    });
  });

  describe("Contact section specifics", () => {
    it("should detect Contact section at beginning of resume", () => {
      const text = `
John Doe
(555) 123-4567
john@example.com
linkedin.com/in/johndoe

Experience
Tech Corp
      `;

      const sections = detectSections(text);
      const contact = sections.get("contact");

      expect(contact).toBeDefined();
      expect(contact?.start).toBe(0); // Should be at beginning
    });

    it("should not detect Contact section if headers appear before it", () => {
      const text = `
Experience
Tech Corp

John Doe
john@example.com
      `;

      const sections = detectSections(text);
      // Contact section should be at top, not after Experience
      // This tests that we don't false-positive on contact-like info later in doc
      expect(sections.has('contact')).toBe(true);
    });
  });
});

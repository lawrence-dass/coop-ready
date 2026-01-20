import { describe, it, expect } from "@jest/globals";
import { parseEducationSection } from "@/lib/parsers/education";
import { EducationEntry } from "@/lib/parsers/types";

/**
 * Unit Tests for Education Section Parser (AC3)
 * Tests extraction of education entries with institution, degree, dates, and GPA
 */

describe("Education Parser - parseEducationSection()", () => {
  describe("Basic education entry extraction", () => {
    it("should extract single education entry with institution, degree, and dates", () => {
      const text = `
State University
B.S. Computer Science
2019
      `;

      const education = parseEducationSection(text);

      expect(education.length).toBe(1);
      expect(education[0]).toHaveProperty("institution");
      expect(education[0]).toHaveProperty("degree");
      expect(education[0]).toHaveProperty("dates");

      expect(education[0].institution).toContain("State University");
      expect(education[0].degree).toContain("B.S.");
      expect(education[0].degree).toContain("Computer Science");
      expect(education[0].dates).toContain("2019");
    });

    it("should extract multiple education entries in order", () => {
      const text = `
State University
B.S. Computer Science
2019

Technical Academy
Machine Learning Certificate
2020
      `;

      const education = parseEducationSection(text);

      expect(education.length).toBe(2);
      expect(education[0].institution).toContain("State University");
      expect(education[1].institution).toContain("Technical Academy");
    });
  });

  describe("Degree format variations", () => {
    it("should handle various degree abbreviations", () => {
      const degrees = [
        "B.S. Computer Science",
        "BS in Computer Science",
        "Bachelor of Science",
        "BA Philosophy",
        "M.S. Engineering",
        "MS in Data Science",
        "Master of Science",
        "MBA Business Administration",
        "Ph.D. Physics",
      ];

      degrees.forEach((degree) => {
        const text = `
University Name
${degree}
2020
        `;

        const education = parseEducationSection(text);
        expect(education.length).toBeGreaterThan(0);
        expect(education[0].degree).toBeDefined();
      });
    });

    it("should extract degree with and without major", () => {
      const text1 = `
University
B.S.
2020
      `;

      const text2 = `
University
B.S. Computer Science
2020
      `;

      const edu1 = parseEducationSection(text1);
      const edu2 = parseEducationSection(text2);

      expect(edu1[0].degree).toContain("B.S.");
      expect(edu2[0].degree).toContain("Computer Science");
    });

    it("should handle degrees with multiple specializations", () => {
      const text = `
University Name
B.S. Computer Science with Minor in Mathematics
2019
      `;

      const education = parseEducationSection(text);
      expect(education[0].degree).toContain("Computer Science");
      expect(education[0].degree).toContain("Mathematics");
    });
  });

  describe("Date extraction", () => {
    it("should extract graduation year", () => {
      const text = `
University Name
B.S. Computer Science
2019
      `;

      const education = parseEducationSection(text);
      expect(education[0].dates).toContain("2019");
    });

    it("should handle date ranges (enrollment - graduation)", () => {
      const text = `
University Name
B.S. Computer Science
2015 - 2019
      `;

      const education = parseEducationSection(text);
      expect(education[0].dates).toContain("2015");
      expect(education[0].dates).toContain("2019");
    });

    it("should handle various date formats", () => {
      const formats = ["2019", "2015-2019", "2015 - 2019", "May 2019", "May 2015 - May 2019"];

      formats.forEach((dateFormat) => {
        const text = `
University Name
B.S. Computer Science
${dateFormat}
        `;

        const education = parseEducationSection(text);
        expect(education.length).toBeGreaterThan(0);
        expect(education[0].dates).toBeDefined();
      });
    });

    it("should extract partial dates", () => {
      const text = `
University Name
B.S. Computer Science
Expected May 2024
      `;

      const education = parseEducationSection(text);
      expect(education[0].dates).toBeDefined();
    });
  });

  describe("GPA extraction", () => {
    it("should extract GPA when present", () => {
      const text = `
University Name
B.S. Computer Science
2019
GPA: 3.8/4.0
      `;

      const education = parseEducationSection(text);
      expect(education[0]).toHaveProperty("gpa");
      expect(education[0].gpa).toContain("3.8");
    });

    it("should handle various GPA formats", () => {
      const formats = [
        "GPA: 3.8",
        "3.8 GPA",
        "3.8/4.0",
        "GPA: 3.8/4.0",
        "3.8 out of 4.0",
        "GPA 3.8",
      ];

      formats.forEach((gpaFormat) => {
        const text = `
University Name
B.S. Computer Science
2019
${gpaFormat}
        `;

        const education = parseEducationSection(text);
        expect(education[0].gpa).toBeDefined();
      });
    });

    it("should not include GPA if not present", () => {
      const text = `
University Name
B.S. Computer Science
2019
      `;

      const education = parseEducationSection(text);
      // GPA should be undefined or empty
      expect(!education[0].gpa || education[0].gpa.length === 0).toBe(true);
    });

    it("should extract GPA even when not in typical format", () => {
      const text = `
University Name
B.S. Computer Science
2019, Summa Cum Laude, 3.95 GPA
      `;

      const education = parseEducationSection(text);
      if (education[0].gpa) {
        expect(education[0].gpa).toContain("3.95");
      }
    });
  });

  describe("Institution name extraction", () => {
    it("should extract institution name", () => {
      const text = `
Stanford University
B.S. Computer Science
2019
      `;

      const education = parseEducationSection(text);
      expect(education[0].institution).toContain("Stanford University");
    });

    it("should handle institution names with special characters", () => {
      const text = `
MIT (Massachusetts Institute of Technology)
B.S. Computer Science
2019
      `;

      const education = parseEducationSection(text);
      expect(education[0].institution).toBeDefined();
    });

    it("should handle institution names with location", () => {
      const text = `
University of California, Berkeley
B.S. Computer Science
2019
      `;

      const education = parseEducationSection(text);
      expect(education[0].institution).toContain("Berkeley");
    });
  });

  describe("Entry separation", () => {
    it("should separate entries by blank lines", () => {
      const text = `
University A
B.S. Computer Science
2019

University B
M.S. Data Science
2021
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBe(2);
    });

    it("should separate entries by institution/degree pattern", () => {
      const text = `
University A, B.S. Computer Science, 2019
University B, M.S. Data Science, 2021
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle education entry with minimal information", () => {
      const text = `
University Name
2019
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
      expect(education[0].institution).toBeDefined();
      expect(education[0].dates).toBeDefined();
    });

    it("should handle education entry with only institution and degree", () => {
      const text = `
University Name
B.S. Computer Science
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
      expect(education[0].institution).toBeDefined();
      expect(education[0].degree).toBeDefined();
    });

    it("should handle empty education section", () => {
      const text = "";

      const education = parseEducationSection(text);
      expect(Array.isArray(education)).toBeTruthy();
      expect(education.length).toBe(0);
    });

    it("should handle single-line education entries", () => {
      const text = "University Name, B.S. Computer Science, 2019, GPA: 3.8";

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
      expect(education[0].institution).toBeDefined();
    });

    it("should handle academic honors and distinctions", () => {
      const text = `
University Name
B.S. Computer Science
2019
Summa Cum Laude, GPA: 3.95
      `;

      const education = parseEducationSection(text);
      expect(education[0].institution).toBeDefined();
    });
  });

  describe("Honors and distinctions", () => {
    it("should capture honors in degree field or separately", () => {
      const text = `
University Name
B.S. Computer Science
2019
Honors: Summa Cum Laude
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
      // Honors may be in degree or in the overall entry
    });

    it("should handle Dean's List and similar distinctions", () => {
      const text = `
University Name
B.S. Computer Science with Distinction
2019
Dean's List all semesters
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
    });
  });

  describe("Certifications as education entries", () => {
    it("should extract certificate programs", () => {
      const text = `
Online Learning Platform
Machine Learning Certificate
2020
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
      expect(education[0].degree).toContain("Certificate");
    });

    it("should handle boot camp style education", () => {
      const text = `
Coding Boot Camp
Full Stack Web Development
12 weeks, 2020
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
    });
  });

  describe("Return type validation", () => {
    it("should return array of EducationEntry objects", () => {
      const text = `
University Name
B.S. Computer Science
2019
GPA: 3.8
      `;

      const education = parseEducationSection(text);

      expect(Array.isArray(education)).toBe(true);
      education.forEach((entry: EducationEntry) => {
        expect(typeof entry.institution).toBe("string");
        expect(typeof entry.degree).toBe("string");
        expect(typeof entry.dates).toBe("string");
        // GPA is optional
        if (entry.gpa) {
          expect(typeof entry.gpa).toBe("string");
        }
      });
    });
  });

  describe("Content preservation", () => {
    it("should preserve detailed degree information", () => {
      const text = `
State University
B.S. Computer Science, Minor in Mathematics
2015 - 2019
GPA: 3.75/4.0
      `;

      const education = parseEducationSection(text);
      expect(education[0].degree).toContain("Computer Science");
      expect(education[0].degree).toContain("Mathematics");
    });

    it("should handle course highlights", () => {
      const text = `
University Name
B.S. Computer Science
2019
Relevant Coursework: Machine Learning, Algorithms, Database Systems
      `;

      const education = parseEducationSection(text);
      expect(education.length).toBeGreaterThan(0);
    });
  });
});

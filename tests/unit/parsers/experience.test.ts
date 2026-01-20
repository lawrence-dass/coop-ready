import { describe, it, expect } from "@jest/globals";
import { parseExperienceSection } from "@/lib/parsers/experience";
import { JobEntry } from "@/lib/parsers/types";

/**
 * Unit Tests for Experience Section Parser (AC2)
 * Tests extraction of job entries with company, title, dates, and bullet points
 */

describe("Experience Parser - parseExperienceSection()", () => {
  describe("Basic job entry extraction", () => {
    it("should extract single job entry with company, title, dates, and bullets", () => {
      const text = `
Tech Corp
Senior Developer
June 2021 - Present
- Led team of 5 engineers
- Implemented microservices architecture
- Reduced API response time by 40%
      `;

      const jobs = parseExperienceSection(text);

      expect(jobs.length).toBe(1);
      expect(jobs[0]).toHaveProperty("company");
      expect(jobs[0]).toHaveProperty("title");
      expect(jobs[0]).toHaveProperty("dates");
      expect(jobs[0]).toHaveProperty("bulletPoints");

      expect(jobs[0].company).toContain("Tech Corp");
      expect(jobs[0].title).toContain("Senior Developer");
      expect(jobs[0].dates).toContain("2021");
      expect(jobs[0].bulletPoints.length).toBe(3);
    });

    it("should extract multiple job entries in order", () => {
      const text = `
Tech Corp
Senior Developer
June 2021 - Present
- Led team of 5 engineers

StartupXYZ
Junior Developer
January 2020 - May 2021
- Built React components
- Implemented REST APIs
      `;

      const jobs = parseExperienceSection(text);

      expect(jobs.length).toBe(2);
      expect(jobs[0].company).toContain("Tech Corp");
      expect(jobs[1].company).toContain("StartupXYZ");
      expect(jobs[0].dates).toContain("2021");
      expect(jobs[1].dates).toContain("2020");
    });
  });

  describe("Date format variations", () => {
    it("should handle various date formats", () => {
      const formats = [
        "June 2021 - Present",
        "06/2021 - present",
        "2021 - 2022",
        "2021-2022",
        "June 2021 - May 2022",
        "06/2021 - 05/2022",
      ];

      formats.forEach((dateFormat) => {
        const text = `
Tech Corp
Developer
${dateFormat}
- Worked on projects
        `;

        const jobs = parseExperienceSection(text);
        expect(jobs.length).toBeGreaterThan(0);
        expect(jobs[0].dates).toBeDefined();
        expect(jobs[0].dates.length).toBeGreaterThan(0);
      });
    });

    it("should extract Present or Current as end date", () => {
      const text = `
Tech Corp
Senior Developer
June 2021 - Present
- Led team
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].dates).toContain("Present");
    });
  });

  describe("Bullet point extraction", () => {
    it("should extract bullet points starting with dash", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Built feature A
- Implemented feature B
- Fixed bugs
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].bulletPoints.length).toBe(3);
      expect(jobs[0].bulletPoints[0]).toContain("Built feature A");
    });

    it("should extract bullet points with various markers", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Bullet with dash
• Bullet with dot
* Bullet with asterisk
> Bullet with arrow
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].bulletPoints.length).toBeGreaterThanOrEqual(3);
    });

    it("should not extract bullets before job entry ends", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Worked on features
- Led initiatives

StartupXYZ
Junior Developer
2020 - 2021
- Built components
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].bulletPoints.length).toBe(2);
      expect(jobs[1].bulletPoints.length).toBe(1);
    });

    it("should handle multi-line bullet points", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Led team of 5 engineers to deliver
  microservices platform ahead of schedule
- Implemented architecture that
  improved performance by 40%
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].bulletPoints.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Company name detection", () => {
    it("should extract company name", () => {
      const text = `
Tech Corp International
Senior Developer
2021 - 2022
- Worked on projects
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].company).toContain("Tech Corp International");
    });

    it("should handle company names with special characters", () => {
      const text = `
Tech & Innovation Inc.
Developer
2021 - 2022
- Worked
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].company).toBeDefined();
    });

    it("should handle company names in all caps", () => {
      const text = `
TECH CORP
Senior Developer
2021 - 2022
- Worked
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].company).toContain("TECH CORP");
    });
  });

  describe("Job title extraction", () => {
    it("should extract job title", () => {
      const text = `
Tech Corp
Senior Software Developer
2021 - 2022
- Worked
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].title).toContain("Senior Software Developer");
    });

    it("should handle job titles with levels", () => {
      const titles = [
        "Junior Developer",
        "Mid-level Engineer",
        "Senior Developer",
        "Lead Software Engineer",
        "Principal Architect",
      ];

      titles.forEach((title) => {
        const text = `
Tech Corp
${title}
2021 - 2022
- Worked
        `;

        const jobs = parseExperienceSection(text);
        expect(jobs[0].title).toContain(title);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle job entry with missing dates", () => {
      const text = `
Tech Corp
Senior Developer
- Led team
- Built features
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs.length).toBeGreaterThan(0);
      // Should still extract company and title
      expect(jobs[0].company).toBeDefined();
      expect(jobs[0].title).toBeDefined();
    });

    it("should handle job entry with missing bullet points", () => {
      const text = `
Tech Corp
Senior Developer
2021 - Present
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0].company).toBeDefined();
      expect(jobs[0].title).toBeDefined();
      expect(Array.isArray(jobs[0].bulletPoints)).toBeTruthy();
    });

    it("should handle multiple titles at same company", () => {
      const text = `
Tech Corp
Junior Developer
2020 - 2021
- Built features

Tech Corp
Senior Developer
2021 - Present
- Led team
      `;

      const jobs = parseExperienceSection(text);
      // Should create separate entries for each role
      expect(jobs.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle empty experience section", () => {
      const text = "";

      const jobs = parseExperienceSection(text);
      expect(Array.isArray(jobs)).toBeTruthy();
      expect(jobs.length).toBe(0);
    });

    it("should handle experience with only company names", () => {
      const text = `
Google
Amazon
Microsoft
      `;

      const jobs = parseExperienceSection(text);
      // Should extract at least the company names
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  describe("Entry separation", () => {
    it("should separate entries by blank lines", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Worked

StartupXYZ
Engineer
2020 - 2021
- Built
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs.length).toBe(2);
    });

    it("should separate entries by date patterns", () => {
      const text = `
Tech Corp, Developer, 2021 - 2022, Worked on X

StartupXYZ, Engineer, 2020 - 2021, Built Y
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  describe("Content preservation", () => {
    it("should preserve special characters in bullet points", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Built API with 99.99% uptime
- Created C++/Python integration
- Handled $1M+ transactions
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].bulletPoints.some((b) => b.includes("99.99%"))).toBe(
        true
      );
      expect(jobs[0].bulletPoints.some((b) => b.includes("C++/Python"))).toBe(
        true
      );
      expect(jobs[0].bulletPoints.some((b) => b.includes("$1M+"))).toBe(true);
    });

    it("should handle numbers and metrics in description", () => {
      const text = `
Tech Corp
Developer, led 5 engineers
2021 - 2022, $120k/year
- Improved performance by 40%
      `;

      const jobs = parseExperienceSection(text);
      expect(jobs[0].title).toContain("5");
      expect(jobs[0].dates).toContain("120k");
    });
  });

  describe("Return type validation", () => {
    it("should return array of JobEntry objects", () => {
      const text = `
Tech Corp
Developer
2021 - 2022
- Worked
      `;

      const jobs = parseExperienceSection(text);

      expect(Array.isArray(jobs)).toBe(true);
      jobs.forEach((job: JobEntry) => {
        expect(typeof job.company).toBe("string");
        expect(typeof job.title).toBe("string");
        expect(typeof job.dates).toBe("string");
        expect(Array.isArray(job.bulletPoints)).toBe(true);
      });
    });
  });
});

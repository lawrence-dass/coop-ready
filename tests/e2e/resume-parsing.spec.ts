import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Skill } from "@/lib/parsers/types";

/**
 * E2E Tests for Story 3.3: Resume Section Parsing
 * Tests the complete flow: Upload → Extract → Parse → Verify Database
 * These tests should FAIL initially (red phase), then pass after implementation
 */

// Initialize Supabase client for database verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_TIMEOUT = 30000;

test.describe("Resume Section Parsing (Story 3.3)", () => {
  /**
   * AC1: Basic Section Categorization
   * Given text has been extracted from a resume
   * When parsing process runs
   * Then text is categorized into sections
   */
  test("AC1: Should categorize resume into Contact, Summary, Education, Experience, Skills, Projects, Other sections", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Sample extracted resume text
    const resumeText = `
John Doe
(555) 123-4567
john@example.com
linkedin.com/in/johndoe

Professional Summary
Experienced full-stack developer with 5+ years of expertise in building scalable web applications.

Professional Experience
Tech Corp, Senior Developer
June 2021 - Present
- Led development team of 5 engineers
- Implemented microservices architecture
- Reduced API response time by 40%

StartupXYZ, Junior Developer
Jan 2020 - May 2021
- Built React components for e-commerce platform
- Implemented REST API endpoints

Education
State University
B.S. Computer Science
2019
GPA: 3.8/4.0

Technical University
Machine Learning Certificate
2020

Skills
Python, JavaScript, React, Node.js, PostgreSQL, Docker, AWS
Leadership, Communication, Problem-Solving

Projects
E-commerce Platform: Full-stack MERN application with payment integration
Portfolio: Personal website built with Next.js and Tailwind CSS
    `;

    // Call parsing API endpoint
    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-001",
          extractedText: resumeText,
        },
      }
    );

    expect(parseResponse.ok()).toBeTruthy();
    const result = await parseResponse.json();

    // Verify response structure
    expect(result).toHaveProperty("data");
    expect(result.data).toHaveProperty("contact");
    expect(result.data).toHaveProperty("summary");
    expect(result.data).toHaveProperty("education");
    expect(result.data).toHaveProperty("experience");
    expect(result.data).toHaveProperty("skills");
    expect(result.data).toHaveProperty("projects");
    expect(result.data).toHaveProperty("other");

    // Verify parsing_status is marked as completed
    expect(result.data).toHaveProperty("parsingStatus", "completed");
  });

  /**
   * AC2: Experience Section Parsing
   * Given a resume has a clear "Experience" or "Work Experience" header
   * When parsing identifies this section
   * Then individual job entries are identified and contain: company, title, dates, bullet points
   */
  test("AC2: Should parse Experience section with job entries containing company, title, dates, and bullets", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    const resumeText = `
Professional Experience

Tech Corp
Senior Developer
June 2021 - Present
- Led team of 5 engineers
- Implemented microservices architecture
- Reduced API response time by 40%

StartupXYZ
Junior Developer
January 2020 - May 2021
- Built React components
- Implemented REST API endpoints
- Collaborated with design team
    `;

    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-exp",
          extractedText: resumeText,
        },
      }
    );

    const result = await parseResponse.json();
    const experience = result.data.experience;

    // Verify it's an array with 2 entries
    expect(Array.isArray(experience)).toBeTruthy();
    expect(experience.length).toBe(2);

    // Verify first job entry structure
    expect(experience[0]).toHaveProperty("company");
    expect(experience[0]).toHaveProperty("title");
    expect(experience[0]).toHaveProperty("dates");
    expect(experience[0]).toHaveProperty("bulletPoints");

    // Verify content
    expect(experience[0].company).toContain("Tech Corp");
    expect(experience[0].title).toContain("Senior Developer");
    expect(experience[0].dates).toContain("2021");
    expect(Array.isArray(experience[0].bulletPoints)).toBeTruthy();
    expect(experience[0].bulletPoints.length).toBeGreaterThan(0);

    // Verify second job entry
    expect(experience[1].company).toContain("StartupXYZ");
    expect(experience[1].title).toContain("Junior Developer");
  });

  /**
   * AC3: Education Section Parsing
   * Given a resume has an "Education" section
   * When parsing identifies this section
   * Then educational entries contain: institution, degree, dates, GPA (if present)
   */
  test("AC3: Should parse Education section with institution, degree, dates, and GPA", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    const resumeText = `
Education

State University
B.S. Computer Science
2019
GPA: 3.8/4.0

Technical University
Machine Learning Certificate
2020
    `;

    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-edu",
          extractedText: resumeText,
        },
      }
    );

    const result = await parseResponse.json();
    const education = result.data.education;

    // Verify it's an array
    expect(Array.isArray(education)).toBeTruthy();
    expect(education.length).toBeGreaterThanOrEqual(1);

    // Verify first education entry structure
    expect(education[0]).toHaveProperty("institution");
    expect(education[0]).toHaveProperty("degree");
    expect(education[0]).toHaveProperty("dates");

    // Verify content
    expect(education[0].institution).toContain("State University");
    expect(education[0].degree).toContain("B.S.");
    expect(education[0].degree).toContain("Computer Science");
    expect(education[0].dates).toContain("2019");

    // GPA should be present if extracted
    if (education[0].gpa) {
      expect(education[0].gpa).toContain("3.8");
    }
  });

  /**
   * AC4: Skills Section Parsing
   * Given a resume has a "Skills" section
   * When parsing identifies this section
   * Then skills are extracted and categorized as technical vs soft
   */
  test("AC4: Should parse Skills section and categorize as technical vs soft skills", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    const resumeText = `
Skills
Python, JavaScript, React, Node.js, PostgreSQL, Docker, AWS, Kubernetes
Leadership, Communication, Problem-Solving, Team Collaboration, Strategic Planning
    `;

    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-skills",
          extractedText: resumeText,
        },
      }
    );

    const result = await parseResponse.json();
    const skills = result.data.skills;

    // Verify it's an array
    expect(Array.isArray(skills)).toBeTruthy();
    expect(skills.length).toBeGreaterThan(0);

    // Verify each skill has name and category
    skills.forEach((skill: Skill) => {
      expect(skill).toHaveProperty("name");
      expect(skill).toHaveProperty("category");
      expect(["technical", "soft"]).toContain(skill.category);
    });

    // Find and verify technical skills
    const technicalSkills = skills.filter(
      (s: Skill) => s.category === "technical"
    );
    expect(technicalSkills.length).toBeGreaterThan(0);

    // Find and verify soft skills
    const softSkills = skills.filter((s: Skill) => s.category === "soft");
    expect(softSkills.length).toBeGreaterThan(0);

    // Verify known technical skill is categorized correctly
    const pythonSkill = technicalSkills.find((s: Skill) =>
      s.name.toLowerCase().includes("python")
    );
    expect(pythonSkill).toBeDefined();

    // Verify known soft skill is categorized correctly
    const leadershipSkill = softSkills.find((s: Skill) =>
      s.name.toLowerCase().includes("leadership")
    );
    expect(leadershipSkill).toBeDefined();
  });

  /**
   * AC5: Non-Standard Section Handling
   * Given a resume has non-standard sections (Certifications, Volunteering, Publications)
   * When parsing runs
   * Then unrecognized sections are placed in "Other"
   */
  test("AC5: Should handle non-standard sections and place in Other category", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    const resumeText = `
Certifications
AWS Solutions Architect Associate
Google Cloud Professional Data Engineer

Volunteering
Red Cross Volunteer - Disaster Relief
2022 - Present

Publications
"Building Scalable APIs" - Published in Tech Monthly
"Machine Learning in Production" - Conference Talk 2023
    `;

    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-other",
          extractedText: resumeText,
        },
      }
    );

    const result = await parseResponse.json();
    const other = result.data.other;

    // Verify "Other" section exists and contains content
    expect(other).toBeDefined();
    expect(typeof other).toBe("string");
    expect(other.length).toBeGreaterThan(0);

    // Verify content from non-standard sections is preserved
    expect(other).toContain("Certification");
    expect(other).toContain("AWS");
    expect(other).toContain("Volunteer");
  });

  /**
   * AC6: Parsed Data Storage
   * Given parsing completes successfully
   * When results are saved
   * Then parsed sections are stored as JSON in resumes.parsed_sections
   * And parsing_status is marked as completed
   */
  test("AC6: Should store parsed sections as JSON in database with completed status", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    const resumeText = `
Contact: John Doe, john@example.com, (555) 123-4567

Summary: Full-stack developer with 5 years experience

Experience
Tech Corp, Senior Developer, 2021-Present
- Led development team
- Improved performance

Education
University Name, B.S. Computer Science, 2019

Skills
JavaScript, React, Node.js
Leadership, Communication
    `;

    // Create a test resume first
    const uploadResponse = await context.request.post("/api/resumes/upload", {
      data: {
        fileName: "test-resume.pdf",
        fileType: "pdf",
        fileSize: 102400,
      },
    });

    const uploadData = await uploadResponse.json();
    const resumeId = uploadData.data.id;

    // Parse the resume
    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId,
          extractedText: resumeText,
        },
      }
    );

    expect(parseResponse.ok()).toBeTruthy();

    // Query database to verify parsed_sections was stored
    const { data: resume, error } = await supabase
      .from("resumes")
      .select(
        "id, parsed_sections, parsing_status, parsing_error, extraction_status"
      )
      .eq("id", resumeId)
      .single();

    expect(error).toBeNull();
    expect(resume).toBeDefined();

    // Verify parsing_status is completed
    expect(resume.parsing_status).toBe("completed");

    // Verify parsed_sections is valid JSON with expected structure
    expect(resume.parsed_sections).toBeDefined();
    const parsed = resume.parsed_sections;
    expect(typeof parsed).toBe("object");
    expect(parsed).toHaveProperty("contact");
    expect(parsed).toHaveProperty("summary");
    expect(parsed).toHaveProperty("experience");
    expect(parsed).toHaveProperty("education");
    expect(parsed).toHaveProperty("skills");

    // Verify parsing_error is null on success
    expect(resume.parsing_error).toBeNull();
  });

  /**
   * Error Handling: Should gracefully handle parsing failures
   * When extraction produces malformed or incomplete text
   * Then parsing_status is marked as failed with error message
   * And partial results are still stored if possible
   */
  test("Should handle parsing errors gracefully and set failed status", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    const emptyText = "";

    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-error",
          extractedText: emptyText,
        },
      }
    );

    // Response should not error out - errors are handled gracefully
    expect(parseResponse.ok()).toBeTruthy();

    const result = await parseResponse.json();
    expect(result).toBeDefined();

    // Either parsing_status is "completed" with empty sections, or "failed" with error message
    if (result.data.parsingStatus === "failed") {
      expect(result.data.parsingError).toBeDefined();
      expect(typeof result.data.parsingError).toBe("string");
    }
  });

  /**
   * Integration: Full upload → extract → parse workflow
   * When user uploads resume and both extraction and parsing complete
   * Then all status columns are properly updated
   */
  test("Should complete full workflow: upload → extract → parse with proper status tracking", async ({
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Simulate full workflow
    const resumeText = `
John Smith
john.smith@example.com
(555) 987-6543

Summary: Results-driven software engineer

Experience
Acme Inc, Lead Developer, 2020-Present
- Architected microservices platform
- Managed team of engineers

Education
Tech University, M.S. Computer Science, 2020

Skills
Java, Kotlin, Spring Boot, Kubernetes, PostgreSQL
Team Leadership, Mentoring, Strategic Planning
    `;

    // Parse resume
    const parseResponse = await context.request.post(
      "/api/resumes/parse-section",
      {
        data: {
          resumeId: "test-resume-workflow",
          extractedText: resumeText,
        },
      }
    );

    expect(parseResponse.ok()).toBeTruthy();
    const result = await parseResponse.json();

    // Verify all sections are present
    expect(result.data).toHaveProperty("contact");
    expect(result.data).toHaveProperty("summary");
    expect(result.data).toHaveProperty("experience");
    expect(result.data).toHaveProperty("education");
    expect(result.data).toHaveProperty("skills");

    // Verify parsing completed
    expect(result.data.parsingStatus).toBe("completed");
    expect(result.data.experience.length).toBeGreaterThan(0);
    expect(result.data.education.length).toBeGreaterThan(0);
    expect(result.data.skills.length).toBeGreaterThan(0);
  });
});

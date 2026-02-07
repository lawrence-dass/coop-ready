/**
 * Tests for detectSectionOrder helper
 * Story: 18.9 Task 2
 */

import { describe, it, expect } from 'vitest';
import { detectSectionOrder } from '@/lib/scoring/sectionOrdering';

describe('detectSectionOrder', () => {
  it('detects standard fulltime order', () => {
    const resumeText = `
      Professional Summary
      Results-driven software engineer...

      Skills
      JavaScript, TypeScript, React...

      Work Experience
      Senior Software Engineer at TechCorp

      Education
      BS Computer Science

      Projects
      Built several web applications
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['summary', 'skills', 'experience', 'education', 'projects']);
  });

  it('detects co-op order (skills first)', () => {
    const resumeText = `
      Technical Skills
      Python, Java, C++...

      Education
      BS Computer Science (Expected 2027)

      Projects
      Capstone project: ML model

      Experience
      Summer Intern 2024
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['skills', 'education', 'projects', 'experience']);
  });

  it('detects career changer order (summary, skills, education first)', () => {
    const resumeText = `
      Objective
      Transitioning to software development...

      Core Competencies
      Full Stack Web Development...

      Academic Background
      Web Development Bootcamp

      Portfolio
      Built 5 full-stack projects

      Professional Experience
      Marketing Coordinator (2019-2025)
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['summary', 'skills', 'education', 'projects', 'experience']);
  });

  it('handles missing sections gracefully', () => {
    const resumeText = `
      Skills
      Java, Python

      Experience
      Software Engineer
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['skills', 'experience']);
  });

  it('handles resume with certifications', () => {
    const resumeText = `
      Summary
      Certified cloud architect

      Skills
      AWS, Azure, GCP

      Certifications
      AWS Solutions Architect
      Microsoft Azure Certified

      Experience
      Cloud Engineer
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['summary', 'skills', 'certifications', 'experience']);
  });

  it('handles alternative heading names', () => {
    const resumeText = `
      About Me
      Passionate developer...

      Technical Competencies
      Frontend and backend skills

      Employment History
      5 years in tech

      Academic Qualifications
      MS Computer Science

      Technical Projects
      Open source contributions
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['summary', 'skills', 'experience', 'education', 'projects']);
  });

  it('returns empty array for resume with no recognizable sections', () => {
    const resumeText = 'Just a paragraph of text with no sections.';
    const order = detectSectionOrder(resumeText);
    expect(order).toEqual([]);
  });

  it('detects first occurrence when section appears multiple times', () => {
    const resumeText = `
      Summary (First)
      ...

      Skills
      ...

      Summary (Duplicate)
      ...

      Experience
      ...
    `;

    const order = detectSectionOrder(resumeText);
    // Should only include 'summary' once at its first occurrence
    expect(order).toEqual(['summary', 'skills', 'experience']);
  });

  it('is case-insensitive for section detection', () => {
    const resumeText = `
      SUMMARY
      ...

      SkILLs
      ...

      experience
      ...
    `;

    const order = detectSectionOrder(resumeText);
    expect(order).toEqual(['summary', 'skills', 'experience']);
  });
});

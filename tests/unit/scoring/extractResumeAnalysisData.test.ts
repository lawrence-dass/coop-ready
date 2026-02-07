/**
 * Tests for extractResumeAnalysisData helper
 * Story: 18.9 Task 1
 */

import { describe, it, expect } from 'vitest';
import { extractResumeAnalysisData } from '@/lib/scoring/candidateTypeDetection';

describe('extractResumeAnalysisData', () => {
  describe('role count detection', () => {
    it('counts distinct date ranges in experience section', () => {
      const resumeText = `
        Experience:
        Software Engineer at Company A
        Jan 2020 – Present

        Junior Developer at Company B
        Sep 2018 – Dec 2019

        Intern at Company C
        Summer 2017
      `;

      const result = extractResumeAnalysisData(resumeText);
      expect(result.resumeRoleCount).toBe(2); // "Jan 2020 – Present" + "Sep 2018 – Dec 2019"
    });

    it('returns 0 for resume with no date ranges', () => {
      const resumeText = 'Software Engineer with great skills';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.resumeRoleCount).toBe(0);
    });

    it('handles various date formats', () => {
      const resumeText = `
        Jan 2023 – Present
        February 2021 - December 2022
        Mar 2019–Apr 2020
      `;

      const result = extractResumeAnalysisData(resumeText);
      expect(result.resumeRoleCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('active education detection', () => {
    it('detects "Expected" graduation', () => {
      const resumeText = 'Expected graduation: May 2027';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.hasActiveEducation).toBe(true);
    });

    it('detects "Anticipated" graduation', () => {
      const resumeText = 'Anticipated graduation date: Spring 2026';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.hasActiveEducation).toBe(true);
    });

    it('detects "Candidate for" degree', () => {
      const resumeText = 'Candidate for Bachelor of Science, expected Fall 2028';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.hasActiveEducation).toBe(true);
    });

    it('detects "graduating" with future year', () => {
      const resumeText = 'Graduating in 2029';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.hasActiveEducation).toBe(true);
    });

    it('returns false for completed education', () => {
      const resumeText = 'Graduated: May 2020, Bachelor of Science';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.hasActiveEducation).toBe(false);
    });

    it('returns false for no education section', () => {
      const resumeText = 'Software Engineer with 5 years experience';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.hasActiveEducation).toBe(false);
    });
  });

  describe('experience years calculation', () => {
    it('calculates span from earliest to latest year', () => {
      const resumeText = `
        Experience: 2015 - 2020
        Education: 2010 - 2014
      `;

      const result = extractResumeAnalysisData(resumeText);
      expect(result.totalExperienceYears).toBe(10); // 2020 - 2010 = 10
    });

    it('returns 0 for resume with no years', () => {
      const resumeText = 'Software Engineer';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.totalExperienceYears).toBe(0);
    });

    it('handles single year in resume', () => {
      const resumeText = 'Intern 2022';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.totalExperienceYears).toBe(0); // 2022 - 2022 = 0
    });

    it('calculates correct span with scattered years', () => {
      const resumeText = 'Worked in 2018, then 2020, and currently 2025';
      const result = extractResumeAnalysisData(resumeText);
      expect(result.totalExperienceYears).toBe(7); // 2025 - 2018 = 7
    });
  });

  describe('complete resume scenarios', () => {
    it('extracts all signals for co-op candidate', () => {
      const resumeText = `
        Summary: Computer Science student seeking co-op placement

        Education:
        Bachelor of Science in Computer Science
        Expected graduation: May 2027

        Experience:
        Software Development Intern at TechCo
        Summer 2024
      `;

      const result = extractResumeAnalysisData(resumeText);
      expect(result.resumeRoleCount).toBe(0); // "Summer 2024" doesn't match date range pattern
      expect(result.hasActiveEducation).toBe(true);
      expect(result.totalExperienceYears).toBe(3); // 2027 (expected grad) - 2024 (intern) = 3
    });

    it('extracts all signals for experienced professional', () => {
      const resumeText = `
        Experience:
        Senior Software Engineer at BigCo
        Jan 2020 – Present

        Software Engineer at MediumCo
        Mar 2017 – Dec 2019

        Junior Developer at StartupCo
        Jun 2015 – Feb 2017

        Education:
        BS Computer Science, 2015
      `;

      const result = extractResumeAnalysisData(resumeText);
      expect(result.resumeRoleCount).toBe(3);
      expect(result.hasActiveEducation).toBe(false);
      expect(result.totalExperienceYears).toBeGreaterThanOrEqual(5); // 2020 - 2015
    });

    it('extracts all signals for career changer', () => {
      const resumeText = `
        Education:
        Full Stack Web Development Bootcamp
        Expected completion: Fall 2026

        BA in English Literature, 2018

        Experience:
        Marketing Coordinator at RetailCo
        Jan 2019 – Aug 2025
      `;

      const result = extractResumeAnalysisData(resumeText);
      expect(result.resumeRoleCount).toBe(1);
      expect(result.hasActiveEducation).toBe(true); // "Expected completion: Fall 2026"
      expect(result.totalExperienceYears).toBeGreaterThanOrEqual(7); // 2025 - 2018
    });
  });
});

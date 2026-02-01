/**
 * Unit Tests for Format Scoring
 * Tests ATS parseability signals
 */

import { describe, it, expect } from 'vitest';
import { calculateFormatScore, generateFormatActionItems } from '@/lib/scoring/formatScore';

describe('calculateFormatScore', () => {
  describe('Contact Information Detection', () => {
    it('[P0] should detect email addresses', () => {
      const resumeText = `
        John Doe
        john.doe@example.com
        Software Engineer
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.hasEmail).toBe(true);
    });

    it('[P0] should detect phone numbers', () => {
      const resumeText = `
        John Doe
        (555) 123-4567
        Software Engineer
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.hasPhone).toBe(true);
    });

    it('[P1] should detect various phone formats', () => {
      const formats = [
        '555-123-4567',
        '(555) 123-4567',
        '+1 555-123-4567',
        '555.123.4567',
      ];

      for (const phone of formats) {
        const result = calculateFormatScore(`Contact: ${phone}`);
        expect(result.hasPhone).toBe(true);
      }
    });

    it('[P0] should score 100 for both email and phone', () => {
      const resumeText = `
        John Doe
        john.doe@example.com
        (555) 123-4567
        Software Engineer
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.contactScore).toBe(100);
      expect(result.hasEmail).toBe(true);
      expect(result.hasPhone).toBe(true);
    });

    it('[P1] should score 60 for email only', () => {
      const resumeText = `
        John Doe
        john.doe@example.com
        Software Engineer
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.contactScore).toBe(60);
      expect(result.hasEmail).toBe(true);
      expect(result.hasPhone).toBe(false);
    });

    it('[P1] should score 40 for phone only', () => {
      const resumeText = `
        John Doe
        555-123-4567
        Software Engineer
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.contactScore).toBe(40);
      expect(result.hasEmail).toBe(false);
      expect(result.hasPhone).toBe(true);
    });

    it('[P1] should score 0 for no contact info', () => {
      const resumeText = `
        John Doe
        Software Engineer
        Summary: Experienced developer
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.contactScore).toBe(0);
      expect(result.hasEmail).toBe(false);
      expect(result.hasPhone).toBe(false);
    });
  });

  describe('Structure Detection', () => {
    it('[P0] should detect date patterns', () => {
      const resumeText = `
        EXPERIENCE
        Software Engineer | Jan 2020 - Present
        Previous Company | Jun 2018 - Dec 2019
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.hasDatePatterns).toBe(true);
    });

    it('[P1] should detect various date formats', () => {
      const resumeText = `
        Jan 2020 - Present
        06/2018 - 12/2019
        2017 - 2018
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.hasDatePatterns).toBe(true);
    });

    it('[P0] should detect section headers', () => {
      const resumeText = `SUMMARY
Experienced engineer...

EXPERIENCE
Software Engineer at Company

SKILLS
Python, React, AWS`;

      const result = calculateFormatScore(resumeText);

      expect(result.hasSectionHeaders).toBe(true);
    });

    it('[P0] should detect bullet structure', () => {
      const resumeText = `EXPERIENCE
• Led development of new features
• Built scalable architecture
• Implemented CI/CD pipelines
• Reduced deployment time by 50%`;

      const result = calculateFormatScore(resumeText);

      expect(result.hasBulletStructure).toBe(true);
    });

    it('[P1] should handle numbered lists', () => {
      const resumeText = `
        EXPERIENCE
        1. Led development of new features
        2. Built scalable architecture
        3. Implemented CI/CD pipelines
        4. Reduced deployment time by 50%
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.hasBulletStructure).toBe(true);
    });

    it('[P0] should score high for all structure elements', () => {
      const resumeText = `John Doe

SUMMARY
Experienced software engineer

EXPERIENCE
Company Name | Jan 2020 - Present
Previous Role | Jun 2018 - Dec 2019
• Led development of new features
• Built scalable architecture
• Implemented CI/CD pipelines
• Reduced deployment time by 50%

SKILLS
Python, React, AWS`;

      const result = calculateFormatScore(resumeText);

      // Should have all structure elements detected
      expect(result.hasDatePatterns).toBe(true);
      expect(result.hasSectionHeaders).toBe(true);
      expect(result.hasBulletStructure).toBe(true);
      expect(result.structureScore).toBe(100);
    });
  });

  describe('Overall Score Calculation', () => {
    it('[P0] should score 100 for well-formatted resume', () => {
      const resumeText = `John Doe
john.doe@example.com | (555) 123-4567

SUMMARY
Experienced software engineer with 8 years...

EXPERIENCE
Company Name | Jan 2020 - Present
Previous Company | Jun 2018 - Dec 2019
• Led development of new features
• Built scalable architecture
• Implemented CI/CD pipelines
• Reduced deployment time by 50%

SKILLS
Python, React, AWS, Docker`;

      const result = calculateFormatScore(resumeText);

      expect(result.score).toBe(100);
    });

    it('[P0] should score 0 for plain text without structure', () => {
      const resumeText = `
        John Doe
        I am a software engineer with experience in building applications.
        I have worked on various projects using different technologies.
      `;

      const result = calculateFormatScore(resumeText);

      expect(result.score).toBeLessThan(30);
    });

    it('[P1] should average contact and structure scores', () => {
      // Email only (60) + full structure (100) = 80 average
      const resumeText = `john@example.com

SUMMARY
Experienced engineer

EXPERIENCE
Company | Jan 2020 - Present
Previous | Jun 2018 - Dec 2019
• Led development of features
• Built scalable features
• Deployed production code
• Fixed critical bugs`;

      const result = calculateFormatScore(resumeText);

      expect(result.contactScore).toBe(60);
      expect(result.structureScore).toBe(100);
      expect(result.score).toBe(80);
    });
  });

  describe('Determinism', () => {
    it('[P0] same input should always produce same output', () => {
      const resumeText = `
        John Doe
        john@example.com
        (555) 123-4567

        EXPERIENCE
        Company | Jan 2020 - Present
        • Led development of features
      `;

      const result1 = calculateFormatScore(resumeText);
      const result2 = calculateFormatScore(resumeText);

      expect(result1.score).toBe(result2.score);
      expect(result1.contactScore).toBe(result2.contactScore);
      expect(result1.structureScore).toBe(result2.structureScore);
    });
  });
});

describe('generateFormatActionItems', () => {
  it('[P0] should suggest adding email when missing', () => {
    const result = {
      score: 50,
      hasEmail: false,
      hasPhone: true,
      hasDatePatterns: true,
      hasSectionHeaders: true,
      hasBulletStructure: true,
      contactScore: 40,
      structureScore: 100,
    };

    const items = generateFormatActionItems(result);

    expect(items.some(item => item.toLowerCase().includes('email'))).toBe(true);
  });

  it('[P0] should suggest adding phone when missing', () => {
    const result = {
      score: 50,
      hasEmail: true,
      hasPhone: false,
      hasDatePatterns: true,
      hasSectionHeaders: true,
      hasBulletStructure: true,
      contactScore: 60,
      structureScore: 100,
    };

    const items = generateFormatActionItems(result);

    expect(items.some(item => item.toLowerCase().includes('phone'))).toBe(true);
  });

  it('[P1] should suggest adding dates when missing', () => {
    const result = {
      score: 50,
      hasEmail: true,
      hasPhone: true,
      hasDatePatterns: false,
      hasSectionHeaders: true,
      hasBulletStructure: true,
      contactScore: 100,
      structureScore: 70,
    };

    const items = generateFormatActionItems(result);

    expect(items.some(item => item.toLowerCase().includes('date'))).toBe(true);
  });

  it('[P1] should suggest adding section headers when missing', () => {
    const result = {
      score: 50,
      hasEmail: true,
      hasPhone: true,
      hasDatePatterns: true,
      hasSectionHeaders: false,
      hasBulletStructure: true,
      contactScore: 100,
      structureScore: 65,
    };

    const items = generateFormatActionItems(result);

    expect(items.some(item => item.toLowerCase().includes('header'))).toBe(true);
  });

  it('[P1] should suggest adding bullets when missing', () => {
    const result = {
      score: 50,
      hasEmail: true,
      hasPhone: true,
      hasDatePatterns: true,
      hasSectionHeaders: true,
      hasBulletStructure: false,
      contactScore: 100,
      structureScore: 65,
    };

    const items = generateFormatActionItems(result);

    expect(items.some(item => item.toLowerCase().includes('bullet'))).toBe(true);
  });
});

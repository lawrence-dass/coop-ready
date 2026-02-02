/**
 * Unit Tests for Section Scoring
 * Tests density-based section evaluation
 */

import { describe, it, expect } from 'vitest';
import { calculateSectionScore, generateSectionActionItems } from '@/lib/scoring/sectionScore';
import { SECTION_THRESHOLDS } from '@/lib/scoring/constants';

describe('calculateSectionScore', () => {
  describe('Summary Scoring', () => {
    it('[P0] should score 100 for summary with 30+ words', () => {
      const parsedResume = {
        summary: 'Experienced software engineer with 8 years of experience building scalable web applications and distributed systems. Proven track record of leading cross-functional teams and delivering complex projects on time and within budget while maintaining high code quality.',
        skills: 'Python, React',
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.summaryScore).toBe(100);
      expect(result.summaryWordCount).toBeGreaterThanOrEqual(30);
    });

    it('[P0] should score proportionally for shorter summaries', () => {
      const parsedResume = {
        summary: 'Software engineer with 5 years experience.', // ~7 words
        skills: 'Python, React',
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      // 7/30 = ~23%
      expect(result.summaryScore).toBeLessThan(50);
      expect(result.summaryWordCount).toBeLessThan(15);
    });

    it('[P1] should score 0 for missing summary', () => {
      const parsedResume = {
        summary: undefined,
        skills: 'Python, React',
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.summaryScore).toBe(0);
      expect(result.summaryWordCount).toBe(0);
    });

    it('[P1] should score 0 for empty summary', () => {
      const parsedResume = {
        summary: '   ',
        skills: 'Python, React',
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.summaryScore).toBe(0);
    });
  });

  describe('Skills Scoring', () => {
    it('[P0] should score 100 for 6+ skill items', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: 'Python, React, AWS, Docker, Kubernetes, TypeScript, Node.js',
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.skillsScore).toBe(100);
      expect(result.skillsItemCount).toBeGreaterThanOrEqual(6);
    });

    it('[P0] should score proportionally for fewer skills', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: 'Python, React, AWS', // 3 items
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      // 3/6 = 50%
      expect(result.skillsScore).toBe(50);
      expect(result.skillsItemCount).toBe(3);
    });

    it('[P1] should handle bullet-separated skills', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: '• Python • React • AWS • Docker • Kubernetes • TypeScript',
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.skillsItemCount).toBeGreaterThanOrEqual(6);
    });

    it('[P1] should handle newline-separated skills', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: `Python
        React
        AWS
        Docker
        Kubernetes
        TypeScript`,
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.skillsItemCount).toBeGreaterThanOrEqual(6);
    });

    it('[P1] should score 0 for missing skills', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: undefined,
        experience: '• Built applications',
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.skillsScore).toBe(0);
      expect(result.skillsItemCount).toBe(0);
    });
  });

  describe('Experience Scoring', () => {
    it('[P0] should score 100 for 8+ experience bullets', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: 'Python, React',
        experience: `
          • Led development of microservices
          • Built scalable API infrastructure
          • Implemented CI/CD pipelines
          • Reduced deployment time by 50%
          • Mentored junior developers
          • Designed database architecture
          • Created automated testing framework
          • Delivered features ahead of schedule
        `,
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.experienceScore).toBe(100);
      expect(result.experienceBulletCount).toBeGreaterThanOrEqual(8);
    });

    it('[P0] should score proportionally for fewer bullets', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: 'Python, React',
        experience: `
          • Led development of microservices
          • Built scalable API infrastructure
          • Implemented CI/CD pipelines
          • Reduced deployment time by 50%
        `, // 4 bullets
      };

      const result = calculateSectionScore(parsedResume);

      // 4/8 = 50%
      expect(result.experienceScore).toBe(50);
    });

    it('[P1] should score 0 for missing experience', () => {
      const parsedResume = {
        summary: 'Summary text here',
        skills: 'Python, React',
        experience: undefined,
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.experienceScore).toBe(0);
      expect(result.experienceBulletCount).toBe(0);
    });
  });

  describe('Overall Score Calculation', () => {
    it('[P0] should average all section scores', () => {
      const parsedResume = {
        summary: 'Experienced software engineer with over 8 years of experience building scalable web applications across multiple industries. Proven track record of leading cross-functional teams and delivering complex projects on time within budget.',
        skills: 'Python, React, AWS, Docker, Kubernetes, TypeScript, JavaScript, Node.js',
        experience: `
          • Led development of microservices architecture
          • Built scalable API handling 1M requests/day
          • Implemented CI/CD pipelines reducing deploy time
          • Reduced infrastructure costs by 40%
          • Mentored team of 5 junior developers
          • Designed distributed database architecture
          • Created automated testing framework
          • Delivered all features ahead of schedule
        `,
      };

      const result = calculateSectionScore(parsedResume);

      // All sections should score high
      expect(result.summaryScore).toBeGreaterThanOrEqual(90);
      expect(result.skillsScore).toBe(100);
      expect(result.experienceScore).toBe(100);
      expect(result.score).toBeGreaterThanOrEqual(95);
    });

    it('[P1] should handle completely empty resume', () => {
      const parsedResume = {
        summary: undefined,
        skills: undefined,
        experience: undefined,
      };

      const result = calculateSectionScore(parsedResume);

      expect(result.score).toBe(0);
    });
  });

  describe('Determinism', () => {
    it('[P0] same input should always produce same output', () => {
      const parsedResume = {
        summary: 'Software engineer with 5 years experience in web development.',
        skills: 'Python, React, AWS, Docker',
        experience: `
          • Built scalable applications
          • Led development team
          • Implemented new features
        `,
      };

      const result1 = calculateSectionScore(parsedResume);
      const result2 = calculateSectionScore(parsedResume);

      expect(result1.score).toBe(result2.score);
      expect(result1.summaryScore).toBe(result2.summaryScore);
      expect(result1.skillsScore).toBe(result2.skillsScore);
      expect(result1.experienceScore).toBe(result2.experienceScore);
    });
  });
});

describe('generateSectionActionItems', () => {
  it('[P0] should suggest adding summary when missing', () => {
    const result = {
      score: 67,
      summaryScore: 0,
      skillsScore: 100,
      experienceScore: 100,
      summaryWordCount: 0,
      skillsItemCount: 8,
      experienceBulletCount: 10,
    };

    const items = generateSectionActionItems(result);

    expect(items.some(item => item.toLowerCase().includes('summary'))).toBe(true);
  });

  it('[P0] should suggest expanding short summary', () => {
    const result = {
      score: 50,
      summaryScore: 50,
      skillsScore: 100,
      experienceScore: 100,
      summaryWordCount: 15, // Less than threshold of 30
      skillsItemCount: 8,
      experienceBulletCount: 10,
    };

    const items = generateSectionActionItems(result);

    expect(items.some(item => item.includes('summary') && item.includes('words'))).toBe(true);
  });

  it('[P1] should suggest adding skills when count is low', () => {
    const result = {
      score: 50,
      summaryScore: 100,
      skillsScore: 50,
      experienceScore: 100,
      summaryWordCount: 35,
      skillsItemCount: 3, // Less than threshold of 6
      experienceBulletCount: 10,
    };

    const items = generateSectionActionItems(result);

    expect(items.some(item => item.includes('skills'))).toBe(true);
  });

  it('[P1] should suggest adding experience bullets when low', () => {
    const result = {
      score: 50,
      summaryScore: 100,
      skillsScore: 100,
      experienceScore: 50,
      summaryWordCount: 35,
      skillsItemCount: 8,
      experienceBulletCount: 4, // Less than threshold of 8
    };

    const items = generateSectionActionItems(result);

    expect(items.some(item => item.includes('bullet'))).toBe(true);
  });
});

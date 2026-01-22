/**
 * Unit Tests for extractBullets utilities
 * Story 9.1: ATS Scoring Recalibration
 */

import { extractBullets, extractBulletsFromText } from '@/lib/utils/extractBullets';
import type { ParsedResume } from '@/lib/parsers/types';

describe('extractBullets', () => {
  describe('extractBullets from ParsedResume', () => {
    it('should extract bullets from experience section', () => {
      const resume: ParsedResume = {
        contact: 'test@example.com',
        summary: 'Summary',
        experience: [
          {
            company: 'Company A',
            title: 'Developer',
            dates: '2020-2023',
            bulletPoints: [
              'Increased revenue by 25%',
              'Led team of 5 engineers',
            ],
          },
        ],
        education: [],
        skills: [],
        projects: '',
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(2);
      expect(bullets).toContain('Increased revenue by 25%');
      expect(bullets).toContain('Led team of 5 engineers');
    });

    it('should extract bullets from multiple experience entries', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [
          {
            company: 'Company A',
            title: 'Developer',
            dates: '2020-2023',
            bulletPoints: ['Bullet 1', 'Bullet 2'],
          },
          {
            company: 'Company B',
            title: 'Senior Developer',
            dates: '2023-Present',
            bulletPoints: ['Bullet 3', 'Bullet 4'],
          },
        ],
        education: [],
        skills: [],
        projects: '',
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(4);
    });

    it('should extract bullets from projects section', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [
          {
            name: 'Project A',
            description: 'Description',
            bulletPoints: ['Built feature X', 'Deployed to production'],
          },
        ],
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(2);
      expect(bullets).toContain('Built feature X');
    });

    it('should combine bullets from experience and projects', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [
          {
            company: 'Company',
            title: 'Dev',
            dates: '',
            bulletPoints: ['Experience bullet'],
          },
        ],
        education: [],
        skills: [],
        projects: [
          {
            name: 'Project',
            description: '',
            bulletPoints: ['Project bullet'],
          },
        ],
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(2);
      expect(bullets).toContain('Experience bullet');
      expect(bullets).toContain('Project bullet');
    });

    it('should return empty array if no bullets', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(0);
    });

    it('should handle missing experience array', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: undefined as any,
        education: [],
        skills: [],
        projects: '',
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(0);
    });

    it('should handle experience entries without bulletPoints', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [
          {
            company: 'Company',
            title: 'Dev',
            dates: '',
            // No bulletPoints property
          } as any,
        ],
        education: [],
        skills: [],
        projects: '',
        other: '',
      };

      const bullets = extractBullets(resume);

      expect(bullets).toHaveLength(0);
    });
  });

  describe('extractBulletsFromText', () => {
    it('should extract bullets starting with -', () => {
      const text = `
        Experience
        - Increased sales by 50%
        - Managed team of 10 people
        Other text
      `;

      const bullets = extractBulletsFromText(text);

      expect(bullets).toHaveLength(2);
      expect(bullets).toContain('Increased sales by 50%');
    });

    it('should extract bullets starting with *', () => {
      const text = `
        * Built web applications with React
        * Implemented CI/CD pipelines
      `;

      const bullets = extractBulletsFromText(text);

      expect(bullets).toHaveLength(2);
    });

    it('should extract bullets starting with bullet character', () => {
      const text = `
        • Saved $100,000 annually
        • Reduced processing time by 40%
      `;

      const bullets = extractBulletsFromText(text);

      expect(bullets).toHaveLength(2);
    });

    it('should filter out short bullets (< 10 chars)', () => {
      const text = `
        - Short
        - This is a much longer bullet point that should be included
      `;

      const bullets = extractBulletsFromText(text);

      expect(bullets).toHaveLength(1);
      expect(bullets[0]).toContain('longer bullet');
    });

    it('should handle mixed bullet markers', () => {
      const text = `
        - First bullet with dash
        * Second bullet with asterisk
        • Third bullet with bullet char
        ► Fourth bullet with arrow
      `;

      const bullets = extractBulletsFromText(text);

      expect(bullets).toHaveLength(4);
    });

    it('should return empty array for text without bullets', () => {
      const text = `
        John Doe
        Software Engineer
        Skills: React, TypeScript
      `;

      const bullets = extractBulletsFromText(text);

      expect(bullets).toHaveLength(0);
    });

    it('should handle empty string', () => {
      const bullets = extractBulletsFromText('');

      expect(bullets).toHaveLength(0);
    });

    it('should trim whitespace from extracted bullets', () => {
      const text = '-   Bullet with extra spaces   ';

      const bullets = extractBulletsFromText(text);

      expect(bullets[0]).not.toMatch(/^\s/);
      expect(bullets[0]).not.toMatch(/\s$/);
    });
  });
});

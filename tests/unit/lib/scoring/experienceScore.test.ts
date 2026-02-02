/**
 * Unit Tests for Experience Scoring
 * Tests quantification, action verbs, and keyword density scoring
 */

import { describe, it, expect } from 'vitest';
import { calculateExperienceScore, generateExperienceActionItems } from '@/lib/scoring/experienceScore';

describe('calculateExperienceScore', () => {
  describe('Quantification Scoring', () => {
    it('[P0] should score high when bullets have metrics', () => {
      const resumeText = `
        • Led team of 12 engineers to deliver product 30% faster
        • Increased revenue by $2.5M through optimization
        • Reduced infrastructure costs by 45%
        • Improved user engagement by 200%
      `;

      const result = calculateExperienceScore(resumeText, ['team', 'engineers']);

      expect(result.quantificationScore).toBeGreaterThanOrEqual(80);
      expect(result.bulletsWithMetrics).toBeGreaterThanOrEqual(3);
    });

    it('[P0] should score low when no metrics present', () => {
      const resumeText = `
        • Worked on software development
        • Helped with team projects
        • Participated in meetings
        • Assisted with testing
      `;

      const result = calculateExperienceScore(resumeText, []);

      expect(result.quantificationScore).toBeLessThan(30);
      expect(result.bulletsWithMetrics).toBe(0);
    });

    it('[P1] should detect various metric formats', () => {
      const resumeText = `
        • Grew user base to 50,000+ customers
        • Achieved 99.9% uptime
        • Saved $1.2M annually
        • Completed project 3x faster than estimated
      `;

      const result = calculateExperienceScore(resumeText, []);

      expect(result.bulletsWithMetrics).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Action Verb Scoring', () => {
    it('[P0] should score high with strong action verbs', () => {
      const resumeText = `
        • Led development of microservices architecture
        • Built scalable data pipeline processing 1TB daily
        • Drove adoption of CI/CD practices
        • Delivered critical features ahead of schedule
      `;

      const result = calculateExperienceScore(resumeText, []);

      expect(result.actionVerbScore).toBeGreaterThanOrEqual(70);
      expect(result.strongVerbCount).toBeGreaterThanOrEqual(3);
    });

    it('[P0] should score low with weak action verbs', () => {
      const resumeText = `
        • Helped with application development
        • Assisted in code reviews
        • Worked on bug fixes
        • Participated in sprint planning
      `;

      const result = calculateExperienceScore(resumeText, []);

      expect(result.actionVerbScore).toBeLessThan(50);
      expect(result.weakVerbCount).toBeGreaterThan(0);
    });

    it('[P1] should penalize for weak verbs', () => {
      const strongOnly = `
        • Led development of new features
        • Built automated testing framework
        • Drove team productivity improvements
        • Delivered quarterly roadmap on time
      `;

      const mixedVerbs = `
        • Led development of new features
        • Helped with testing
        • Worked on various tasks
        • Delivered quarterly roadmap on time
      `;

      const strongResult = calculateExperienceScore(strongOnly, []);
      const mixedResult = calculateExperienceScore(mixedVerbs, []);

      expect(strongResult.actionVerbScore).toBeGreaterThan(mixedResult.actionVerbScore);
    });
  });

  describe('Keyword Density Scoring', () => {
    it('[P0] should score high when keywords appear in bullets', () => {
      const resumeText = `
        • Developed Python microservices with AWS Lambda
        • Built React frontend with TypeScript
        • Deployed applications using Docker and Kubernetes
        • Implemented CI/CD pipelines with GitHub Actions
      `;
      const keywords = ['Python', 'AWS', 'React', 'Docker', 'Kubernetes', 'CI/CD'];

      const result = calculateExperienceScore(resumeText, keywords);

      expect(result.keywordDensityScore).toBeGreaterThanOrEqual(50);
    });

    it('[P0] should score low when keywords missing from bullets', () => {
      const resumeText = `
        • Worked on software development
        • Built web applications
        • Tested code quality
        • Deployed to production
      `;
      const keywords = ['Python', 'AWS', 'React', 'Docker', 'Kubernetes'];

      const result = calculateExperienceScore(resumeText, keywords);

      expect(result.keywordDensityScore).toBeLessThan(50);
    });
  });

  describe('Overall Score Calculation', () => {
    it('[P0] should combine sub-scores with correct weights', () => {
      // Strong resume with all components
      const strongResume = `
        • Led team of 8 engineers to deliver platform 25% faster
        • Built microservices architecture handling 10M requests/day
        • Drove adoption of Python and AWS across organization
        • Delivered $3M cost savings through optimization
      `;
      const keywords = ['Python', 'AWS', 'microservices', 'team'];

      const result = calculateExperienceScore(strongResume, keywords);

      // Should score well on all components
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.quantificationScore).toBeGreaterThanOrEqual(50);
      expect(result.actionVerbScore).toBeGreaterThanOrEqual(50);
    });

    it('[P1] should handle empty resume text', () => {
      const result = calculateExperienceScore('', []);

      expect(result.score).toBe(0);
      expect(result.bulletCount).toBe(0);
    });
  });

  describe('Determinism', () => {
    it('[P0] same input should always produce same output', () => {
      const resumeText = `
        • Led development of features increasing revenue by 20%
        • Built scalable API handling 1M requests daily
        • Reduced deployment time from 2 hours to 15 minutes
      `;
      const keywords = ['API', 'development', 'scalable'];

      const result1 = calculateExperienceScore(resumeText, keywords);
      const result2 = calculateExperienceScore(resumeText, keywords);
      const result3 = calculateExperienceScore(resumeText, keywords);

      expect(result1.score).toBe(result2.score);
      expect(result2.score).toBe(result3.score);
      expect(result1.quantificationScore).toBe(result2.quantificationScore);
      expect(result1.actionVerbScore).toBe(result2.actionVerbScore);
    });
  });
});

describe('generateExperienceActionItems', () => {
  it('[P0] should suggest adding metrics when low quantification', () => {
    const result = {
      score: 40,
      quantificationScore: 30,
      actionVerbScore: 70,
      keywordDensityScore: 60,
      bulletCount: 6,
      bulletsWithMetrics: 1,
      strongVerbCount: 4,
      weakVerbCount: 0,
    };

    const items = generateExperienceActionItems(result);

    expect(items.some(item => item.includes('metric'))).toBe(true);
  });

  it('[P0] should suggest replacing weak verbs when present', () => {
    const result = {
      score: 50,
      quantificationScore: 60,
      actionVerbScore: 40,
      keywordDensityScore: 50,
      bulletCount: 6,
      bulletsWithMetrics: 3,
      strongVerbCount: 2,
      weakVerbCount: 3,
    };

    const items = generateExperienceActionItems(result);

    expect(items.some(item => item.includes('Replace') && item.includes('weak'))).toBe(true);
  });

  it('[P1] should suggest adding more bullets when count is low', () => {
    const result = {
      score: 50,
      quantificationScore: 80,
      actionVerbScore: 80,
      keywordDensityScore: 60,
      bulletCount: 4,
      bulletsWithMetrics: 3,
      strongVerbCount: 4,
      weakVerbCount: 0,
    };

    const items = generateExperienceActionItems(result);

    expect(items.some(item => item.includes('accomplishment') || item.includes('bullet'))).toBe(true);
  });
});

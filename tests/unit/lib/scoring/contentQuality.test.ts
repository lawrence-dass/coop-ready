/**
 * Unit Tests for Content Quality Scoring (V2.1)
 *
 * Tests the content quality component which evaluates:
 * - Quantification with quality tiers (35%)
 * - Action verbs with weak verb penalties (30%)
 * - Keyword density (35%)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateContentQuality,
  extractQuantifications,
  classifyActionVerb,
  generateContentQualityActionItems,
} from '@/lib/scoring/contentQuality';
import type { ContentQualityInput } from '@/lib/scoring/contentQuality';

describe('extractQuantifications', () => {
  it('should detect high-tier currency amounts', () => {
    const matches = extractQuantifications('Saved $50M in operational costs');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].tier).toBe('high');
    expect(matches[0].type).toBe('currency');
  });

  it('should detect medium-tier currency amounts', () => {
    const matches = extractQuantifications('Generated $200K in revenue');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].tier).toBe('medium');
  });

  it('should detect high-tier percentages', () => {
    const matches = extractQuantifications('Achieved 99.99% uptime');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].tier).toBe('high');
  });

  it('should detect medium-tier percentages', () => {
    const matches = extractQuantifications('Improved efficiency by 50%');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].tier).toBe('medium');
  });

  it('should detect multipliers', () => {
    const matches = extractQuantifications('Scaled system to handle 10x traffic');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].tier).toBe('high');
    expect(matches[0].type).toBe('multiplier');
  });

  it('should return empty array for no metrics', () => {
    const matches = extractQuantifications('Worked on various projects');
    expect(matches).toHaveLength(0);
  });
});

describe('classifyActionVerb', () => {
  it('should classify strong verbs correctly', () => {
    expect(classifyActionVerb('Led development of new feature')).toBe('strong');
    expect(classifyActionVerb('Architected microservices system')).toBe('strong');
    expect(classifyActionVerb('Built scalable API')).toBe('strong');
    expect(classifyActionVerb('Drove adoption of best practices')).toBe('strong');
  });

  it('should classify moderate verbs correctly', () => {
    // Use verbs only in MODERATE_ACTION_VERBS (not in STRONG_ACTION_VERBS)
    expect(classifyActionVerb('Maintained system infrastructure')).toBe('moderate');
    expect(classifyActionVerb('Conducted user research')).toBe('moderate');
    expect(classifyActionVerb('Reviewed code submissions')).toBe('moderate');
  });

  it('should classify weak verbs correctly', () => {
    expect(classifyActionVerb('Helped with development')).toBe('weak');
    expect(classifyActionVerb('Worked on projects')).toBe('weak');
    expect(classifyActionVerb('Was responsible for testing')).toBe('weak');
  });

  it('should classify multi-word weak phrases', () => {
    expect(classifyActionVerb('Was responsible for managing servers')).toBe('weak');
    expect(classifyActionVerb('Was involved in the project')).toBe('weak');
  });

  it('should return unknown for unrecognized verbs', () => {
    expect(classifyActionVerb('Xyz random word')).toBe('unknown');
  });
});

describe('calculateContentQuality', () => {
  const createInput = (
    bullets: string[],
    jobType: 'coop' | 'fulltime' = 'fulltime'
  ): ContentQualityInput => ({
    bullets,
    bulletSources: { experience: bullets.length, projects: 0, education: 0 },
    jdKeywords: ['Python', 'React', 'AWS'],
    jobType,
  });

  it('should give high score for well-quantified bullets with strong verbs', () => {
    const input = createInput([
      'Led development of API serving 1,000,000+ requests daily',
      'Architected microservices system reducing latency by 90%',
      'Built Python automation saving $50M annually',
      'Drove React migration improving performance 10x',
    ]);

    const result = calculateContentQuality(input);
    expect(result.score).toBeGreaterThan(70);
    expect(result.details.strongVerbCount).toBe(4);
    expect(result.details.bulletsWithMetrics).toBe(4);
    expect(result.details.highTierMetrics).toBeGreaterThan(0);
  });

  it('should give low score for weak verbs and no metrics', () => {
    const input = createInput([
      'Helped with the development process',
      'Worked on various projects',
      'Was responsible for testing',
      'Assisted team members',
    ]);

    const result = calculateContentQuality(input);
    expect(result.score).toBeLessThan(50);
    expect(result.details.weakVerbCount).toBeGreaterThan(0);
    expect(result.details.bulletsWithMetrics).toBe(0);
  });

  it('should return 0 for empty bullets', () => {
    const input = createInput([]);
    const result = calculateContentQuality(input);
    expect(result.score).toBe(0);
    expect(result.details.totalBullets).toBe(0);
  });

  it('should be more lenient for co-op positions', () => {
    const bullets = [
      'Contributed to team projects using React',
      'Supported development of new features',
      'Collaborated with senior engineers',
    ];

    const coopResult = calculateContentQuality(createInput(bullets, 'coop'));
    const fulltimeResult = calculateContentQuality(createInput(bullets, 'fulltime'));

    // Co-op should score higher for same content (moderate verbs acceptable)
    expect(coopResult.breakdown.actionVerbScore).toBeGreaterThanOrEqual(
      fulltimeResult.breakdown.actionVerbScore
    );
  });

  it('should detect keywords in bullets', () => {
    const input = createInput([
      'Built Python microservices',
      'Developed React frontend',
      'Deployed to AWS',
    ]);

    const result = calculateContentQuality(input);
    expect(result.details.keywordsFound).toContain('Python');
    expect(result.details.keywordsFound).toContain('React');
    expect(result.details.keywordsFound).toContain('AWS');
  });

  it('should track quantification quality tiers', () => {
    const input = createInput([
      'Managed $50M budget', // high tier
      'Improved performance by 60%', // medium tier
      'Supported 500 users', // low tier
    ]);

    const result = calculateContentQuality(input);
    expect(result.details.highTierMetrics).toBe(1);
    expect(result.details.mediumTierMetrics).toBe(1);
    expect(result.details.lowTierMetrics).toBe(1);
  });
});

describe('generateContentQualityActionItems', () => {
  it('should suggest adding metrics when low quantification', () => {
    const result = {
      score: 30,
      breakdown: {
        quantificationScore: 20,
        actionVerbScore: 60,
        keywordDensityScore: 50,
      },
      details: {
        totalBullets: 10,
        bulletsWithMetrics: 1,
        highTierMetrics: 0,
        mediumTierMetrics: 1,
        lowTierMetrics: 0,
        strongVerbCount: 5,
        moderateVerbCount: 3,
        weakVerbCount: 2,
        keywordsFound: ['Python'],
        keywordsMissing: ['React'],
      },
    };

    const items = generateContentQualityActionItems(result);
    expect(items.some((i) => i.message.includes('metrics'))).toBe(true);
  });

  it('should suggest replacing weak verbs', () => {
    const result = {
      score: 40,
      breakdown: {
        quantificationScore: 50,
        actionVerbScore: 30,
        keywordDensityScore: 50,
      },
      details: {
        totalBullets: 10,
        bulletsWithMetrics: 5,
        highTierMetrics: 1,
        mediumTierMetrics: 2,
        lowTierMetrics: 2,
        strongVerbCount: 2,
        moderateVerbCount: 2,
        weakVerbCount: 6,
        keywordsFound: ['Python'],
        keywordsMissing: ['React'],
      },
    };

    const items = generateContentQualityActionItems(result);
    expect(items.some((i) => i.message.includes('weak verbs'))).toBe(true);
  });

  it('should return empty for high-quality content', () => {
    const result = {
      score: 90,
      breakdown: {
        quantificationScore: 90,
        actionVerbScore: 90,
        keywordDensityScore: 85,
      },
      details: {
        totalBullets: 10,
        bulletsWithMetrics: 8,
        highTierMetrics: 5,
        mediumTierMetrics: 3,
        lowTierMetrics: 0,
        strongVerbCount: 8,
        moderateVerbCount: 2,
        weakVerbCount: 0,
        keywordsFound: ['Python', 'React', 'AWS'],
        keywordsMissing: [],
      },
    };

    const items = generateContentQualityActionItems(result);
    expect(items).toHaveLength(0);
  });
});

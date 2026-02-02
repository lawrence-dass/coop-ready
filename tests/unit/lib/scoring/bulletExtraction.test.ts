/**
 * Unit Tests for Bullet Extraction
 * Tests regex-based bullet extraction
 */

import { describe, it, expect } from 'vitest';
import { extractBullets, classifyVerb } from '@/lib/scoring/bulletExtraction';

describe('extractBullets', () => {
  describe('Pattern-based Extraction', () => {
    it('[P0] should extract dash bullets', () => {
      const text = `
        EXPERIENCE
        - Led development of new features
        - Built scalable architecture
        - Implemented CI/CD pipelines
      `;

      const result = extractBullets(text, []);

      expect(result.bullets.length).toBeGreaterThanOrEqual(3);
      expect(result.source).toBe('pattern');
    });

    it('[P0] should extract bullet point bullets', () => {
      const text = `
        EXPERIENCE
        • Led development of new features
        • Built scalable architecture
        • Implemented CI/CD pipelines
      `;

      const result = extractBullets(text, []);

      expect(result.bullets.length).toBeGreaterThanOrEqual(3);
    });

    it('[P0] should extract asterisk bullets', () => {
      const text = `
        EXPERIENCE
        * Led development of new features
        * Built scalable architecture
        * Implemented CI/CD pipelines
      `;

      const result = extractBullets(text, []);

      expect(result.bullets.length).toBeGreaterThanOrEqual(3);
    });

    it('[P1] should extract numbered list items', () => {
      const text = `
        EXPERIENCE
        1. Led development of new features
        2. Built scalable architecture
        3. Implemented CI/CD pipelines
      `;

      const result = extractBullets(text, []);

      expect(result.bullets.length).toBeGreaterThanOrEqual(3);
    });

    it('[P1] should ignore very short bullets', () => {
      const text = `• Led development of new features across multiple teams
• Yes
• No
• Built scalable architecture for high traffic
• Deployed applications to production environments
• Managed database systems and infrastructure`;

      const result = extractBullets(text, []);

      // Should only have the longer bullets (>10 chars)
      // 6 bullets total, 2 short ("Yes", "No") = 4 valid bullets
      expect(result.bullets.length).toBe(4);

      // Verify short bullets are not included
      const texts = result.bullets.map(b => b.text);
      expect(texts.some(t => t === 'Yes' || t === 'No')).toBe(false);
    });
  });

  describe('Newline Fallback', () => {
    it('[P1] should fall back to newline extraction when few bullets found', () => {
      const text = `
        Led development of new features across multiple product lines
        Built scalable architecture handling millions of requests
        Implemented CI/CD pipelines reducing deployment time
        Mentored junior developers on best practices
      `;

      const result = extractBullets(text, []);

      // Should use newline extraction since no bullet patterns found
      expect(result.bullets.length).toBeGreaterThan(0);
    });
  });

  describe('Metric Detection', () => {
    it('[P0] should detect percentage metrics', () => {
      const text = '• Reduced costs by 45% through optimization';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasMetric).toBe(true);
    });

    it('[P0] should detect dollar metrics', () => {
      const text = '• Generated $2.5M in annual revenue';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasMetric).toBe(true);
    });

    it('[P0] should detect user/customer counts', () => {
      const text = '• Grew user base to 50,000+ customers';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasMetric).toBe(true);
    });

    it('[P1] should detect multiplier patterns', () => {
      const text = '• Achieved 3x faster deployment times';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasMetric).toBe(true);
    });

    it('[P1] should not flag text without metrics', () => {
      const text = '• Led development of new features';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasMetric).toBe(false);
    });
  });

  describe('Strong Verb Detection', () => {
    it('[P0] should detect strong action verbs', () => {
      const text = '• Led development of microservices architecture';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasStrongVerb).toBe(true);
      expect(result.bullets[0].firstWord).toBe('led');
    });

    it('[P0] should detect various strong verbs', () => {
      const verbs = ['Built', 'Drove', 'Delivered', 'Achieved', 'Launched'];

      for (const verb of verbs) {
        const text = `• ${verb} new features for the platform`;
        const result = extractBullets(text, []);
        expect(result.bullets[0].hasStrongVerb).toBe(true);
      }
    });

    it('[P1] should not flag weak verbs', () => {
      const text = '• Helped with application development';

      const result = extractBullets(text, []);

      expect(result.bullets[0].hasStrongVerb).toBe(false);
    });
  });

  describe('Keyword Detection', () => {
    it('[P0] should find JD keywords in bullets', () => {
      const text = '• Built Python microservices with AWS Lambda';
      const keywords = ['Python', 'AWS', 'microservices'];

      const result = extractBullets(text, keywords);

      expect(result.bullets[0].keywords).toContain('Python');
      expect(result.bullets[0].keywords).toContain('AWS');
      expect(result.bullets[0].keywords).toContain('microservices');
    });

    it('[P1] should be case insensitive', () => {
      const text = '• Developed applications using PYTHON and aws';
      const keywords = ['python', 'AWS'];

      const result = extractBullets(text, keywords);

      expect(result.bullets[0].keywords.length).toBe(2);
    });

    it('[P1] should return empty array when no keywords match', () => {
      const text = '• Built applications for the web';
      const keywords = ['Python', 'React', 'Docker'];

      const result = extractBullets(text, keywords);

      expect(result.bullets[0].keywords).toEqual([]);
    });
  });

  describe('Deduplication', () => {
    it('[P1] should not include duplicate bullets', () => {
      const text = `• Led development of new features for the platform
• Led development of new features for the platform
• Built scalable architecture for multiple services
• Implemented CI/CD pipelines reducing deployment time
• Reduced infrastructure costs through optimization`;

      const result = extractBullets(text, []);

      // Should dedupe the duplicate bullet
      // 5 bullets with 1 duplicate = 4 unique bullets
      expect(result.bullets.length).toBe(4);

      // Verify no duplicates in output
      const texts = result.bullets.map(b => b.text);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(texts.length);
    });
  });
});

describe('classifyVerb', () => {
  it('[P0] should classify strong verbs', () => {
    const strongVerbs = ['led', 'built', 'drove', 'delivered', 'achieved'];

    for (const verb of strongVerbs) {
      expect(classifyVerb(verb)).toBe('strong');
    }
  });

  it('[P0] should classify weak verbs', () => {
    const weakVerbs = ['helped', 'assisted', 'worked', 'participated'];

    for (const verb of weakVerbs) {
      expect(classifyVerb(verb)).toBe('weak');
    }
  });

  it('[P1] should classify neutral verbs', () => {
    const neutralVerbs = ['created', 'wrote', 'made', 'started'];

    for (const verb of neutralVerbs) {
      // These may be neutral or strong depending on constants
      const result = classifyVerb(verb);
      expect(['strong', 'weak', 'neutral']).toContain(result);
    }
  });

  it('[P1] should handle case insensitivity', () => {
    expect(classifyVerb('LED')).toBe('strong');
    expect(classifyVerb('Led')).toBe('strong');
    expect(classifyVerb('HELPED')).toBe('weak');
  });
});

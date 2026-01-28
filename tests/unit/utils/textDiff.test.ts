/**
 * Unit Tests for Text Diffing Utility
 *
 * Tests the word-level diff algorithm used for before/after resume comparison.
 * Ensures correctness, edge case handling, and performance.
 */

import { describe, it, expect } from 'vitest';
import { diffTexts, countChanges, type DiffChunk } from '@/lib/utils/textDiff';

describe('diffTexts', () => {
  describe('Basic Operations', () => {
    it('should detect simple word addition', () => {
      const result = diffTexts('Hello world', 'Hello beautiful world');

      expect(result).toContainEqual({ type: 'equal', value: 'Hello ' });
      expect(result).toContainEqual({ type: 'insert', value: 'beautiful ' });
      expect(result).toContainEqual({ type: 'equal', value: 'world' });
    });

    it('should detect simple word deletion', () => {
      const result = diffTexts('Hello beautiful world', 'Hello world');

      expect(result).toContainEqual({ type: 'equal', value: 'Hello ' });
      expect(result).toContainEqual({ type: 'delete', value: 'beautiful ' });
      expect(result).toContainEqual({ type: 'equal', value: 'world' });
    });

    it('should detect word replacement', () => {
      const result = diffTexts('Led the team', 'Led a team');

      expect(result).toContainEqual({ type: 'equal', value: 'Led ' });
      expect(result).toContainEqual({ type: 'delete', value: 'the' });
      expect(result).toContainEqual({ type: 'insert', value: 'a' });
      expect(result).toContainEqual({ type: 'equal', value: ' team' });
    });

    it('should handle multiple changes in sequence', () => {
      const result = diffTexts(
        'Led the team to deliver',
        'Led a team of 5 to deliver on time'
      );

      // Should have both insertions and replacements
      const types = result.map((chunk) => chunk.type);
      expect(types).toContain('equal');
      expect(types).toContain('insert');
      expect(types).toContain('delete');
    });
  });

  describe('Edge Cases', () => {
    it('should handle identical texts', () => {
      const result = diffTexts('Same text', 'Same text');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'equal', value: 'Same text' });
    });

    it('should handle empty original text', () => {
      const result = diffTexts('', 'New text');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'insert', value: 'New text' });
    });

    it('should handle empty suggested text', () => {
      const result = diffTexts('Old text', '');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'delete', value: 'Old text' });
    });

    it('should handle both texts empty', () => {
      const result = diffTexts('', '');

      expect(result).toHaveLength(0);
    });

    it('should normalize whitespace', () => {
      const result = diffTexts('  Hello   world  ', 'Hello world');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'equal', value: 'Hello world' });
    });

    it('should handle texts with only whitespace differences', () => {
      const result = diffTexts('Hello world', 'Hello  world');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('equal');
    });
  });

  describe('Special Characters', () => {
    it('should handle punctuation changes', () => {
      const result = diffTexts('Hello world', 'Hello, world!');

      // Punctuation is part of the word in word-level diff
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((chunk) => chunk.type !== 'equal')).toBe(true);
    });

    it('should handle special characters', () => {
      const result = diffTexts('Cost: $50', 'Cost: $100');

      expect(result.length).toBeGreaterThan(0);
      const hasChange = result.some((chunk) => chunk.type !== 'equal');
      expect(hasChange).toBe(true);
    });

    it('should handle quotes and brackets', () => {
      const original = 'Led "project alpha"';
      const suggested = 'Led [project alpha]';

      const result = diffTexts(original, suggested);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Case Sensitivity', () => {
    it('should treat different cases as different words', () => {
      const result = diffTexts('hello world', 'Hello World');

      // Case differences should be detected
      expect(result.length).toBeGreaterThan(1);
      expect(result.some((chunk) => chunk.type !== 'equal')).toBe(true);
    });
  });

  describe('Resume Content Examples', () => {
    it('should handle typical resume bullet point changes', () => {
      const original =
        'Led team to deliver project under budget and on schedule';
      const suggested =
        'Led cross-functional team of 8 to deliver $2M project 15% under budget and 2 weeks ahead of schedule';

      const result = diffTexts(original, suggested);

      // Should have additions
      expect(result.some((chunk) => chunk.type === 'insert')).toBe(true);
      // Should have some equal parts (common words)
      expect(result.some((chunk) => chunk.type === 'equal')).toBe(true);
    });

    it('should handle skill list changes', () => {
      const original = 'JavaScript, Python, SQL';
      const suggested = 'JavaScript, TypeScript, Python, SQL, React';

      const result = diffTexts(original, suggested);

      expect(result.some((chunk) => chunk.type === 'insert')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete quickly for typical resume length', () => {
      // Typical resume section: ~200 words
      const longText = 'word '.repeat(200).trim();

      const start = performance.now();
      diffTexts(longText, longText + ' extra');
      const duration = performance.now() - start;

      // Should complete in < 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle very long texts', () => {
      // Stress test: ~1000 words
      const veryLongText = 'word '.repeat(1000).trim();

      const start = performance.now();
      diffTexts(veryLongText, veryLongText + ' extra words here');
      const duration = performance.now() - start;

      // Should still be reasonable (< 500ms)
      expect(duration).toBeLessThan(500);
    });
  });
});

describe('countChanges', () => {
  it('should count insertions correctly', () => {
    const chunks: DiffChunk[] = [
      { type: 'equal', value: 'Hello ' },
      { type: 'insert', value: 'beautiful amazing ' },
      { type: 'equal', value: 'world' },
    ];

    const result = countChanges(chunks);

    expect(result.insertions).toBe(2); // "beautiful" and "amazing"
    expect(result.deletions).toBe(0);
    expect(result.totalChanges).toBe(2);
  });

  it('should count deletions correctly', () => {
    const chunks: DiffChunk[] = [
      { type: 'equal', value: 'Hello ' },
      { type: 'delete', value: 'old boring ' },
      { type: 'equal', value: 'world' },
    ];

    const result = countChanges(chunks);

    expect(result.insertions).toBe(0);
    expect(result.deletions).toBe(2); // "old" and "boring"
    expect(result.totalChanges).toBe(2);
  });

  it('should count both insertions and deletions', () => {
    const chunks: DiffChunk[] = [
      { type: 'delete', value: 'the ' },
      { type: 'insert', value: 'a team of ' },
      { type: 'equal', value: 'people' },
    ];

    const result = countChanges(chunks);

    expect(result.insertions).toBe(3); // "a", "team", "of"
    expect(result.deletions).toBe(1); // "the"
    expect(result.totalChanges).toBe(4);
  });

  it('should handle no changes', () => {
    const chunks: DiffChunk[] = [{ type: 'equal', value: 'No changes here' }];

    const result = countChanges(chunks);

    expect(result.insertions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.totalChanges).toBe(0);
  });

  it('should handle empty chunks array', () => {
    const result = countChanges([]);

    expect(result.insertions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.totalChanges).toBe(0);
  });
});

/**
 * Tests for section ordering validation (Story 18.3)
 */

import { describe, it, expect } from 'vitest';
import {
  validateSectionOrder,
  RECOMMENDED_ORDER,
  type SectionOrderValidation,
} from '@/lib/scoring/sectionOrdering';

describe('RECOMMENDED_ORDER constant', () => {
  it('should define ordering for all 3 candidate types', () => {
    expect(RECOMMENDED_ORDER).toHaveProperty('coop');
    expect(RECOMMENDED_ORDER).toHaveProperty('fulltime');
    expect(RECOMMENDED_ORDER).toHaveProperty('career_changer');
  });

  it('should have correct co-op ordering (skills first, edu before exp)', () => {
    const coopOrder = RECOMMENDED_ORDER.coop;
    expect(coopOrder[0]).toBe('skills');
    expect(coopOrder.indexOf('education')).toBeLessThan(coopOrder.indexOf('experience'));
  });

  it('should have correct full-time ordering (summary first, exp before edu)', () => {
    const fulltimeOrder = RECOMMENDED_ORDER.fulltime;
    expect(fulltimeOrder[0]).toBe('summary');
    expect(fulltimeOrder.indexOf('experience')).toBeLessThan(
      fulltimeOrder.indexOf('education')
    );
  });

  it('should have correct career changer ordering (summary first, edu before exp)', () => {
    const careerOrder = RECOMMENDED_ORDER.career_changer;
    expect(careerOrder[0]).toBe('summary');
    expect(careerOrder.indexOf('education')).toBeLessThan(careerOrder.indexOf('experience'));
  });
});

describe('validateSectionOrder', () => {
  describe('Edge cases', () => {
    it('[P1] should handle empty sections array', () => {
      const result = validateSectionOrder([], 'coop');
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.recommendedOrder).toEqual(RECOMMENDED_ORDER.coop);
    });

    it('[P1] should handle single section present', () => {
      const result = validateSectionOrder(['skills'], 'coop');
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('[P1] should handle partial resume (only some sections present)', () => {
      // Only skills and education - no experience, projects, or certifications
      const result = validateSectionOrder(['skills', 'education'], 'coop');
      expect(result.isCorrectOrder).toBe(true); // Correct relative order
      expect(result.violations).toHaveLength(0);
    });

    it('[P1] should ignore unknown/custom sections without false violations', () => {
      // Custom section "hobbies" not in RECOMMENDED_ORDER - should not shift positions
      const result = validateSectionOrder(
        ['skills', 'hobbies', 'education', 'experience'],
        'coop'
      );
      // Known sections (skills, education, experience) are in correct relative order
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
      // Verify no violation references unknown sections
      expect(result.violations.every((v) => v.section !== 'hobbies')).toBe(true);
    });
  });

  describe('Co-op candidate ordering validation', () => {
    it('[P0] should detect experience before education violation', () => {
      const result = validateSectionOrder(
        ['skills', 'experience', 'education'],
        'coop'
      );
      expect(result.isCorrectOrder).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      // Find the specific violations
      const expViolation = result.violations.find((v) => v.section === 'experience');
      const eduViolation = result.violations.find((v) => v.section === 'education');

      // At least one should be flagged
      expect(expViolation || eduViolation).toBeTruthy();
    });

    it('[P1] should return isCorrectOrder: true for correct co-op ordering', () => {
      const result = validateSectionOrder(
        ['skills', 'education', 'projects', 'experience', 'certifications'],
        'coop'
      );
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('[P1] should handle partial co-op resume with correct order', () => {
      // Just skills and education in correct order
      const result = validateSectionOrder(['skills', 'education'], 'coop');
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Full-time candidate ordering validation', () => {
    it('[P0] should detect education before experience violation', () => {
      const result = validateSectionOrder(
        ['summary', 'skills', 'education', 'experience'],
        'fulltime'
      );
      expect(result.isCorrectOrder).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      const eduViolation = result.violations.find((v) => v.section === 'education');
      const expViolation = result.violations.find((v) => v.section === 'experience');

      // At least one should be flagged
      expect(eduViolation || expViolation).toBeTruthy();
    });

    it('[P1] should return isCorrectOrder: true for correct full-time ordering', () => {
      const result = validateSectionOrder(
        ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
        'fulltime'
      );
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Career changer candidate ordering validation', () => {
    it('[P0] should detect education below experience violation', () => {
      const result = validateSectionOrder(
        ['summary', 'skills', 'experience', 'education'],
        'career_changer'
      );
      expect(result.isCorrectOrder).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      const eduViolation = result.violations.find((v) => v.section === 'education');
      const expViolation = result.violations.find((v) => v.section === 'experience');

      // At least one should be flagged
      expect(eduViolation || expViolation).toBeTruthy();
    });

    it('[P1] should return isCorrectOrder: true for correct career changer ordering', () => {
      const result = validateSectionOrder(
        ['summary', 'skills', 'education', 'projects', 'experience', 'certifications'],
        'career_changer'
      );
      expect(result.isCorrectOrder).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Violation details', () => {
    it('[P1] should provide detailed violation information', () => {
      const result = validateSectionOrder(['experience', 'education'], 'coop');

      expect(result.isCorrectOrder).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      const violation = result.violations[0];
      expect(violation).toHaveProperty('section');
      expect(violation).toHaveProperty('expectedPosition');
      expect(violation).toHaveProperty('actualPosition');
      expect(violation).toHaveProperty('description');
      expect(typeof violation.description).toBe('string');
    });
  });

  describe('Recommended order output', () => {
    it('[P1] should always return recommendedOrder for candidate type', () => {
      const resultCoop = validateSectionOrder(['skills'], 'coop');
      const resultFulltime = validateSectionOrder(['summary'], 'fulltime');
      const resultCareer = validateSectionOrder(['summary'], 'career_changer');

      expect(resultCoop.recommendedOrder).toEqual(RECOMMENDED_ORDER.coop);
      expect(resultFulltime.recommendedOrder).toEqual(RECOMMENDED_ORDER.fulltime);
      expect(resultCareer.recommendedOrder).toEqual(RECOMMENDED_ORDER.career_changer);
    });
  });
});

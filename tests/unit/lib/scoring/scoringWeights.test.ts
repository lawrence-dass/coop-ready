import { describe, it, expect } from 'vitest';
import { ROLE_WEIGHT_ADJUSTMENTS } from '@/lib/scoring/constants';

describe('ROLE_WEIGHT_ADJUSTMENTS', () => {
  describe('[P0] Weight profile validation', () => {
    it('career_changer weights sum to 1.0', () => {
      const weights = ROLE_WEIGHT_ADJUSTMENTS.career_changer;
      const sum =
        weights.keywords +
        weights.qualificationFit +
        weights.contentQuality +
        weights.sections +
        weights.format;

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('coop_entry weights sum to 1.0 (regression)', () => {
      const weights = ROLE_WEIGHT_ADJUSTMENTS.coop_entry;
      const sum =
        weights.keywords +
        weights.qualificationFit +
        weights.contentQuality +
        weights.sections +
        weights.format;

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('mid weights sum to 1.0 (regression)', () => {
      const weights = ROLE_WEIGHT_ADJUSTMENTS.mid;
      const sum =
        weights.keywords +
        weights.qualificationFit +
        weights.contentQuality +
        weights.sections +
        weights.format;

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('senior_executive weights sum to 1.0 (regression)', () => {
      const weights = ROLE_WEIGHT_ADJUSTMENTS.senior_executive;
      const sum =
        weights.keywords +
        weights.qualificationFit +
        weights.contentQuality +
        weights.sections +
        weights.format;

      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('Career changer weight profile', () => {
    it('has expected weight distribution', () => {
      const weights = ROLE_WEIGHT_ADJUSTMENTS.career_changer;

      expect(weights.keywords).toBe(0.40);
      expect(weights.qualificationFit).toBe(0.14);
      expect(weights.contentQuality).toBe(0.18);
      expect(weights.sections).toBe(0.18);
      expect(weights.format).toBe(0.10);
    });
  });

  describe('Cross-type differentiation', () => {
    it('all three profiles have different weight distributions', () => {
      const coop = ROLE_WEIGHT_ADJUSTMENTS.coop_entry;
      const career = ROLE_WEIGHT_ADJUSTMENTS.career_changer;
      const mid = ROLE_WEIGHT_ADJUSTMENTS.mid;

      // Career changer vs co-op: different qualification fit
      expect(career.qualificationFit).not.toBe(coop.qualificationFit);

      // Career changer vs mid: different sections weight
      expect(career.sections).not.toBe(mid.sections);

      // Co-op vs mid: different keywords weight
      expect(coop.keywords).not.toBe(mid.keywords);
    });
  });
});

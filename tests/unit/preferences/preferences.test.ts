import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  PREFERENCE_METADATA,
  type OptimizationPreferences,
  type TonePreference,
  type VerbosityPreference,
  type EmphasisPreference,
  type IndustryPreference,
  type ExperienceLevelPreference,
} from '@/types';

describe('Optimization Preferences', () => {
  describe('DEFAULT_PREFERENCES', () => {
    it('should have all 5 required preferences', () => {
      expect(DEFAULT_PREFERENCES).toHaveProperty('tone');
      expect(DEFAULT_PREFERENCES).toHaveProperty('verbosity');
      expect(DEFAULT_PREFERENCES).toHaveProperty('emphasis');
      expect(DEFAULT_PREFERENCES).toHaveProperty('industry');
      expect(DEFAULT_PREFERENCES).toHaveProperty('experienceLevel');
    });

    it('should use sensible default values', () => {
      expect(DEFAULT_PREFERENCES.tone).toBe('professional');
      expect(DEFAULT_PREFERENCES.verbosity).toBe('detailed');
      expect(DEFAULT_PREFERENCES.emphasis).toBe('impact');
      expect(DEFAULT_PREFERENCES.industry).toBe('generic');
      expect(DEFAULT_PREFERENCES.experienceLevel).toBe('mid');
    });

    it('should be a valid OptimizationPreferences object', () => {
      const preferences: OptimizationPreferences = DEFAULT_PREFERENCES;
      expect(preferences).toBeDefined();
    });
  });

  describe('Preference Type Constraints', () => {
    it('should accept valid tone values', () => {
      const validTones: TonePreference[] = [
        'professional',
        'technical',
        'casual',
      ];
      validTones.forEach((tone) => {
        expect(tone).toBeDefined();
      });
    });

    it('should accept valid verbosity values', () => {
      const validVerbosity: VerbosityPreference[] = [
        'concise',
        'detailed',
        'comprehensive',
      ];
      validVerbosity.forEach((verbosity) => {
        expect(verbosity).toBeDefined();
      });
    });

    it('should accept valid emphasis values', () => {
      const validEmphasis: EmphasisPreference[] = [
        'skills',
        'impact',
        'keywords',
      ];
      validEmphasis.forEach((emphasis) => {
        expect(emphasis).toBeDefined();
      });
    });

    it('should accept valid industry values', () => {
      const validIndustries: IndustryPreference[] = [
        'tech',
        'finance',
        'healthcare',
        'generic',
      ];
      validIndustries.forEach((industry) => {
        expect(industry).toBeDefined();
      });
    });

    it('should accept valid experience level values', () => {
      const validLevels: ExperienceLevelPreference[] = [
        'entry',
        'mid',
        'senior',
      ];
      validLevels.forEach((level) => {
        expect(level).toBeDefined();
      });
    });
  });

  describe('Custom Preferences', () => {
    it('should allow creating custom preference combinations', () => {
      const customPrefs: OptimizationPreferences = {
        tone: 'technical',
        verbosity: 'concise',
        emphasis: 'keywords',
        industry: 'tech',
        experienceLevel: 'senior',
      };

      expect(customPrefs.tone).toBe('technical');
      expect(customPrefs.verbosity).toBe('concise');
      expect(customPrefs.emphasis).toBe('keywords');
      expect(customPrefs.industry).toBe('tech');
      expect(customPrefs.experienceLevel).toBe('senior');
    });

    it('should allow partial updates to preferences', () => {
      const basePrefs = { ...DEFAULT_PREFERENCES };
      const updatedPrefs: OptimizationPreferences = {
        ...basePrefs,
        tone: 'casual',
        industry: 'finance',
      };

      expect(updatedPrefs.tone).toBe('casual');
      expect(updatedPrefs.verbosity).toBe('detailed'); // unchanged
      expect(updatedPrefs.emphasis).toBe('impact'); // unchanged
      expect(updatedPrefs.industry).toBe('finance');
      expect(updatedPrefs.experienceLevel).toBe('mid'); // unchanged
    });
  });

  describe('PREFERENCE_METADATA', () => {
    it('should have metadata for all 5 preferences', () => {
      expect(PREFERENCE_METADATA).toHaveProperty('tone');
      expect(PREFERENCE_METADATA).toHaveProperty('verbosity');
      expect(PREFERENCE_METADATA).toHaveProperty('emphasis');
      expect(PREFERENCE_METADATA).toHaveProperty('industry');
      expect(PREFERENCE_METADATA).toHaveProperty('experienceLevel');
    });

    it('should have labels and descriptions for each preference', () => {
      Object.entries(PREFERENCE_METADATA).forEach(([key, metadata]) => {
        expect(metadata.label).toBeDefined();
        expect(metadata.description).toBeDefined();
        expect(metadata.options).toBeDefined();
      });
    });

    it('should have options for tone preference', () => {
      const toneOptions = PREFERENCE_METADATA.tone.options;
      expect(toneOptions.professional).toBeDefined();
      expect(toneOptions.technical).toBeDefined();
      expect(toneOptions.casual).toBeDefined();
    });

    it('should have options for verbosity preference', () => {
      const verbosityOptions = PREFERENCE_METADATA.verbosity.options;
      expect(verbosityOptions.concise).toBeDefined();
      expect(verbosityOptions.detailed).toBeDefined();
      expect(verbosityOptions.comprehensive).toBeDefined();
    });

    it('should have options for emphasis preference', () => {
      const emphasisOptions = PREFERENCE_METADATA.emphasis.options;
      expect(emphasisOptions.skills).toBeDefined();
      expect(emphasisOptions.impact).toBeDefined();
      expect(emphasisOptions.keywords).toBeDefined();
    });

    it('should have options for industry preference', () => {
      const industryOptions = PREFERENCE_METADATA.industry.options;
      expect(industryOptions.tech).toBeDefined();
      expect(industryOptions.finance).toBeDefined();
      expect(industryOptions.healthcare).toBeDefined();
      expect(industryOptions.generic).toBeDefined();
    });

    it('should have options for experience level preference', () => {
      const levelOptions = PREFERENCE_METADATA.experienceLevel.options;
      expect(levelOptions.entry).toBeDefined();
      expect(levelOptions.mid).toBeDefined();
      expect(levelOptions.senior).toBeDefined();
    });
  });

  describe('Preference Immutability', () => {
    it('should not mutate DEFAULT_PREFERENCES when spread', () => {
      const original = { ...DEFAULT_PREFERENCES };
      const modified = { ...DEFAULT_PREFERENCES, tone: 'casual' as const };

      expect(DEFAULT_PREFERENCES.tone).toBe('professional');
      expect(modified.tone).toBe('casual');
      expect(original.tone).toBe('professional');
    });
  });
});

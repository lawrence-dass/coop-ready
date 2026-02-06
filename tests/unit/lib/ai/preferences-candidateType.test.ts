/**
 * Unit Tests for Candidate Type Guidance Functions
 * Story 18.6: Conditional Summary & Candidate-Type Suggestion Framing
 *
 * Tests: getCandidateTypeGuidance, getJobTypeFramingGuidance career_changer case,
 * getJobTypeVerbGuidance career_changer case
 */

import { describe, it, expect } from 'vitest';
import {
  getCandidateTypeGuidance,
  getJobTypeFramingGuidance,
  getJobTypeVerbGuidance,
  deriveEffectiveCandidateType,
} from '@/lib/ai/preferences';
import type { CandidateType } from '@/lib/scoring/types';

describe('getCandidateTypeGuidance', () => {
  const sections = ['summary', 'skills', 'experience', 'education', 'projects'] as const;
  const candidateTypes: CandidateType[] = ['coop', 'career_changer', 'fulltime'];

  // AC #13a: Test guidance returns non-empty string for all combinations
  it('should return non-empty guidance for all 3 candidate types × 5 sections (15 combinations)', () => {
    candidateTypes.forEach((candidateType) => {
      sections.forEach((section) => {
        const guidance = getCandidateTypeGuidance(candidateType, section);
        expect(guidance).toBeTruthy();
        expect(guidance.length).toBeGreaterThan(0);
        expect(typeof guidance).toBe('string');
      });
    });
  });

  describe('Co-op Candidate Guidance', () => {
    // AC #13b: Co-op summary guidance mentions remove/skip
    it('should suggest removing or skipping summary for co-op candidates', () => {
      const guidance = getCandidateTypeGuidance('coop', 'summary');
      const lowerGuidance = guidance.toLowerCase();
      expect(
        lowerGuidance.includes('remove') ||
        lowerGuidance.includes('skip') ||
        lowerGuidance.includes('not include') ||
        lowerGuidance.includes('should not')
      ).toBe(true);
    });

    it('should emphasize education as PRIMARY credential for co-op', () => {
      const guidance = getCandidateTypeGuidance('coop', 'education');
      expect(guidance.toLowerCase()).toContain('primary');
    });

    it('should emphasize projects as PRIMARY experience for co-op', () => {
      const guidance = getCandidateTypeGuidance('coop', 'projects');
      expect(guidance.toLowerCase()).toContain('primary');
    });

    it('should suggest breadth over depth for co-op skills', () => {
      const guidance = getCandidateTypeGuidance('coop', 'skills');
      expect(guidance.toLowerCase()).toContain('breadth');
    });

    it('should frame experience as learning for co-op', () => {
      const guidance = getCandidateTypeGuidance('coop', 'experience');
      const lowerGuidance = guidance.toLowerCase();
      expect(lowerGuidance.includes('learning') || lowerGuidance.includes('collaborative')).toBe(true);
    });
  });

  describe('Career Changer Guidance', () => {
    // AC #13c: Career changer summary guidance mentions bridge/transition
    it('should emphasize bridging narrative for career changer summary', () => {
      const guidance = getCandidateTypeGuidance('career_changer', 'summary');
      const lowerGuidance = guidance.toLowerCase();
      expect(
        lowerGuidance.includes('bridge') ||
        lowerGuidance.includes('transition') ||
        lowerGuidance.includes('critical')
      ).toBe(true);
    });

    // AC #13e: Career changer experience guidance mentions transferable
    it('should emphasize transferable skills for career changer experience', () => {
      const guidance = getCandidateTypeGuidance('career_changer', 'experience');
      expect(guidance.toLowerCase()).toContain('transferable');
    });

    it('should emphasize education as PRIMARY (pivot) credential for career changer', () => {
      const guidance = getCandidateTypeGuidance('career_changer', 'education');
      const lowerGuidance = guidance.toLowerCase();
      expect(
        lowerGuidance.includes('primary') ||
        lowerGuidance.includes('pivot') ||
        lowerGuidance.includes('master')
      ).toBe(true);
    });

    it('should emphasize new-career skills first for career changer skills section', () => {
      const guidance = getCandidateTypeGuidance('career_changer', 'skills');
      const lowerGuidance = guidance.toLowerCase();
      expect(lowerGuidance.includes('lead with') || lowerGuidance.includes('new-career')).toBe(true);
    });

    it('should emphasize bridging gap for career changer projects', () => {
      const guidance = getCandidateTypeGuidance('career_changer', 'projects');
      const lowerGuidance = guidance.toLowerCase();
      expect(lowerGuidance.includes('bridge') || lowerGuidance.includes('gap')).toBe(true);
    });
  });

  describe('Full-time Candidate Guidance', () => {
    // AC #13d: Fulltime summary guidance mentions tailored/years
    it('should suggest tailored summary with years of experience for fulltime', () => {
      const guidance = getCandidateTypeGuidance('fulltime', 'summary');
      const lowerGuidance = guidance.toLowerCase();
      expect(
        lowerGuidance.includes('tailored') ||
        lowerGuidance.includes('years') ||
        lowerGuidance.includes('experience')
      ).toBe(true);
    });

    it('should emphasize proficiency for fulltime skills', () => {
      const guidance = getCandidateTypeGuidance('fulltime', 'skills');
      const lowerGuidance = guidance.toLowerCase();
      expect(lowerGuidance.includes('proficiency') || lowerGuidance.includes('production')).toBe(true);
    });

    it('should emphasize impact and outcomes for fulltime experience', () => {
      const guidance = getCandidateTypeGuidance('fulltime', 'experience');
      const lowerGuidance = guidance.toLowerCase();
      expect(lowerGuidance.includes('impact') || lowerGuidance.includes('outcomes')).toBe(true);
    });

    it('should frame education as supporting credential for fulltime', () => {
      const guidance = getCandidateTypeGuidance('fulltime', 'education');
      expect(guidance.toLowerCase()).toContain('supporting');
    });

    it('should keep projects concise for fulltime', () => {
      const guidance = getCandidateTypeGuidance('fulltime', 'projects');
      expect(guidance.toLowerCase()).toContain('concise');
    });
  });

  // AC #13a: Test guidance differs across candidate types for same section
  it('should return different guidance for different candidate types on same section', () => {
    const coopSummary = getCandidateTypeGuidance('coop', 'summary');
    const careerChangerSummary = getCandidateTypeGuidance('career_changer', 'summary');
    const fulltimeSummary = getCandidateTypeGuidance('fulltime', 'summary');

    // All should be different
    expect(coopSummary).not.toBe(careerChangerSummary);
    expect(coopSummary).not.toBe(fulltimeSummary);
    expect(careerChangerSummary).not.toBe(fulltimeSummary);
  });
});

describe('getJobTypeFramingGuidance - career_changer extension', () => {
  // AC #2: Test career_changer case returns distinct output
  it('should return distinct framing for career_changer vs coop/fulltime on summary', () => {
    const careerChangerFraming = getJobTypeFramingGuidance('career_changer', 'summary');
    const coopFraming = getJobTypeFramingGuidance('coop', 'summary');
    const fulltimeFraming = getJobTypeFramingGuidance('fulltime', 'summary');

    expect(careerChangerFraming).toBeTruthy();
    expect(careerChangerFraming).not.toBe(coopFraming);
    expect(careerChangerFraming).not.toBe(fulltimeFraming);
  });

  it('should mention transition/bridge for career_changer summary framing', () => {
    const framing = getJobTypeFramingGuidance('career_changer', 'summary');
    const lowerFraming = framing.toLowerCase();
    expect(
      lowerFraming.includes('transition') ||
      lowerFraming.includes('bridge') ||
      lowerFraming.includes('career change')
    ).toBe(true);
  });

  it('should emphasize transferable skills for career_changer experience framing', () => {
    const framing = getJobTypeFramingGuidance('career_changer', 'experience');
    expect(framing.toLowerCase()).toContain('transferable');
  });

  it('should emphasize new-career skills for career_changer skills framing', () => {
    const framing = getJobTypeFramingGuidance('career_changer', 'skills');
    const lowerFraming = framing.toLowerCase();
    expect(lowerFraming.includes('new-career') || lowerFraming.includes('new field')).toBe(true);
  });

  it('should emphasize master\'s degree as pivot for career_changer education framing', () => {
    const framing = getJobTypeFramingGuidance('career_changer', 'education');
    const lowerFraming = framing.toLowerCase();
    expect(
      lowerFraming.includes('master') ||
      lowerFraming.includes('pivot') ||
      lowerFraming.includes('primary')
    ).toBe(true);
  });

  // AC #2.6, #2.7: Test projects section support
  it('should support projects section for all job types', () => {
    const coopProjects = getJobTypeFramingGuidance('coop', 'projects');
    const careerChangerProjects = getJobTypeFramingGuidance('career_changer', 'projects');
    const fulltimeProjects = getJobTypeFramingGuidance('fulltime', 'projects');

    expect(coopProjects).toBeTruthy();
    expect(careerChangerProjects).toBeTruthy();
    expect(fulltimeProjects).toBeTruthy();

    // Should be distinct
    expect(coopProjects).not.toBe(careerChangerProjects);
    expect(coopProjects).not.toBe(fulltimeProjects);
  });
});

describe('getJobTypeVerbGuidance - career_changer extension', () => {
  // AC #3: Test career_changer returns distinct verbs
  it('should return distinct verb guidance for career_changer', () => {
    const careerChangerVerbs = getJobTypeVerbGuidance('career_changer');
    const coopVerbs = getJobTypeVerbGuidance('coop');
    const fulltimeVerbs = getJobTypeVerbGuidance('fulltime');

    expect(careerChangerVerbs).toBeTruthy();
    expect(careerChangerVerbs).not.toBe(coopVerbs);
    expect(careerChangerVerbs).not.toBe(fulltimeVerbs);
  });

  it('should include transferable-skill-focused verbs for career_changer', () => {
    const verbs = getJobTypeVerbGuidance('career_changer');
    const lowerVerbs = verbs.toLowerCase();

    // Should include transition-related verbs
    const hasTransitionVerbs =
      lowerVerbs.includes('transitioned') ||
      lowerVerbs.includes('applied') ||
      lowerVerbs.includes('leveraged') ||
      lowerVerbs.includes('adapted') ||
      lowerVerbs.includes('bridged');

    expect(hasTransitionVerbs).toBe(true);
  });

  it('should avoid junior-sounding verbs for career_changer', () => {
    const verbs = getJobTypeVerbGuidance('career_changer');
    const lowerVerbs = verbs.toLowerCase();

    // Should mention avoiding junior verbs
    expect(lowerVerbs.includes('avoid')).toBe(true);
    expect(lowerVerbs.includes('assisted') || lowerVerbs.includes('supported')).toBe(true);
  });

  it('should emphasize connection between careers for career_changer', () => {
    const verbs = getJobTypeVerbGuidance('career_changer');
    const lowerVerbs = verbs.toLowerCase();

    expect(
      lowerVerbs.includes('connect') ||
      lowerVerbs.includes('bridge') ||
      lowerVerbs.includes('transferability')
    ).toBe(true);
  });
});

describe('deriveEffectiveCandidateType', () => {
  it('should return explicit candidateType when provided', () => {
    expect(deriveEffectiveCandidateType('career_changer', { jobType: 'fulltime' })).toBe('career_changer');
    expect(deriveEffectiveCandidateType('coop', { jobType: 'fulltime' })).toBe('coop');
    expect(deriveEffectiveCandidateType('fulltime', { jobType: 'coop' })).toBe('fulltime');
  });

  it('should derive coop from preferences.jobType when candidateType not provided', () => {
    expect(deriveEffectiveCandidateType(undefined, { jobType: 'coop' })).toBe('coop');
  });

  it('should derive fulltime from preferences.jobType when candidateType not provided', () => {
    expect(deriveEffectiveCandidateType(undefined, { jobType: 'fulltime' })).toBe('fulltime');
  });

  it('should default to fulltime when neither candidateType nor preferences provided', () => {
    expect(deriveEffectiveCandidateType(undefined, null)).toBe('fulltime');
    expect(deriveEffectiveCandidateType(undefined, undefined)).toBe('fulltime');
  });
});

describe('Conditional Summary Skip Logic (AC #13b, #13c)', () => {
  // AC #13b: Co-op summary skip logic
  it('should skip summary for co-op without summary section', () => {
    const effectiveCandidateType = deriveEffectiveCandidateType(undefined, { jobType: 'coop' });
    const resumeSummary = '';
    const shouldGenerateSummary = !(effectiveCandidateType === 'coop' && (!resumeSummary || resumeSummary.trim().length === 0));
    const forceSummary = effectiveCandidateType === 'career_changer';

    expect(shouldGenerateSummary).toBe(false);
    expect(forceSummary).toBe(false);
    // Result: no summary generation
    expect(shouldGenerateSummary || forceSummary).toBe(false);
  });

  it('should generate summary for co-op WITH existing summary section', () => {
    const effectiveCandidateType = deriveEffectiveCandidateType(undefined, { jobType: 'coop' });
    const resumeSummary = 'Experienced software developer with skills in React and Node.js.';
    const shouldGenerateSummary = !(effectiveCandidateType === 'coop' && (!resumeSummary || resumeSummary.trim().length === 0));
    const forceSummary = effectiveCandidateType === 'career_changer';

    expect(shouldGenerateSummary).toBe(true);
    // Result: summary generated (with "consider removing" framing)
    expect(shouldGenerateSummary || forceSummary).toBe(true);
  });

  // AC #13c: Career changer summary always-generate logic
  it('should ALWAYS generate summary for career changer (even without summary section)', () => {
    const effectiveCandidateType = deriveEffectiveCandidateType('career_changer', { jobType: 'fulltime' });
    const resumeSummary = '';
    const shouldGenerateSummary = !(effectiveCandidateType === 'coop' && (!resumeSummary || resumeSummary.trim().length === 0));
    const forceSummary = effectiveCandidateType === 'career_changer';

    expect(forceSummary).toBe(true);
    // Result: summary generated via forceSummary
    expect(shouldGenerateSummary || forceSummary).toBe(true);
  });

  it('should generate summary for fulltime candidates normally', () => {
    const effectiveCandidateType = deriveEffectiveCandidateType(undefined, { jobType: 'fulltime' });
    const resumeSummary = 'Some summary';
    const shouldGenerateSummary = !(effectiveCandidateType === 'coop' && (!resumeSummary || resumeSummary.trim().length === 0));
    const forceSummary = effectiveCandidateType === 'career_changer';

    expect(shouldGenerateSummary).toBe(true);
    expect(forceSummary).toBe(false);
    expect(shouldGenerateSummary || forceSummary).toBe(true);
  });
});

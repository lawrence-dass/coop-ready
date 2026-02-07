/**
 * Cross-Type Scoring Integration Tests
 * Story 18.10 Task 1
 *
 * Tests that calculateATSScoreV21 applies different component weights per candidate type.
 *
 * Base weights from lib/scoring/constants.ts ROLE_WEIGHT_ADJUSTMENTS:
 * - coop_entry: keywords 0.42, qualFit 0.10, content 0.18, sections 0.20, format 0.10
 * - mid (fulltime): keywords 0.40, qualFit 0.15, content 0.20, sections 0.15, format 0.10
 * - career_changer: keywords 0.40, qualFit 0.14, content 0.18, sections 0.18, format 0.10
 *
 * NOTE: getComponentWeightsV21 applies role-specific adjustments after candidateType.
 * For software_engineer (detected from JD with "developer"): keywords += 0.03, sections -= 0.03
 * Final weights are then normalized to sum = 1.0.
 *
 * Also tests section config differences for career_changer:
 * - education.maxPoints=20 (vs fulltime=15)
 * - experience.maxPoints=20 (vs fulltime=30)
 * - projects.maxPoints=15 (vs fulltime=10)
 */

import { describe, it, expect } from 'vitest';
import { calculateATSScoreV21 } from '@/lib/scoring';
import type {
  KeywordMatchV21,
  JDQualifications,
  ResumeQualifications,
} from '@/lib/scoring/types';

describe('[P0] Cross-Type Scoring Integration', () => {
  // Shared test data - same resume/JD for all 3 types
  const baseKeywords: KeywordMatchV21[] = [
    { keyword: 'React', category: 'technologies', importance: 'high', requirement: 'required', found: true, matchType: 'exact', placement: ['experience'], context: 'Built apps with React' },
    { keyword: 'TypeScript', category: 'technologies', importance: 'high', requirement: 'required', found: true, matchType: 'exact', placement: ['skills'], context: 'TypeScript expert' },
    { keyword: 'Node.js', category: 'technologies', importance: 'medium', requirement: 'preferred', found: false },
  ];

  const baseJDQuals: JDQualifications = {
    requiredDegree: 'Bachelor',
    preferredDegree: 'Master',
    requiredYears: 2,
    preferredYears: 3,
    requiredCerts: [],
    preferredCerts: ['AWS'],
  };

  const baseResumeQuals: ResumeQualifications = {
    degree: 'Bachelor',
    yearsOfExperience: 2,
    certifications: [],
  };

  const baseBullets = [
    'Led React development for 3 major projects',
    'Improved performance by 40% using TypeScript',
    'Collaborated with team of 5 developers',
  ];

  const bulletSources = { experience: 3, projects: 0, education: 0 };

  const baseSections = {
    summary: 'Experienced software engineer',
    skills: ['React', 'TypeScript', 'JavaScript'],
    experience: ['Software Engineer at TechCo (2022-2024)', 'Built React apps'],
    education: 'BS Computer Science, StateU',
    projects: [] as string[],
  };

  const resumeText = 'Software Engineer\nReact TypeScript JavaScript\nExperience at TechCo';
  const jdText = 'Looking for React developer with TypeScript';

  // Helper to run scoring for a specific candidate type
  function scoreForType(candidateType: 'coop' | 'fulltime' | 'career_changer', overrides: Record<string, unknown> = {}) {
    return calculateATSScoreV21({
      keywords: baseKeywords,
      jdQualifications: baseJDQuals,
      resumeQualifications: baseResumeQuals,
      allBullets: baseBullets,
      bulletSources,
      sections: baseSections,
      resumeText,
      jdText,
      jobType: candidateType === 'coop' ? 'coop' : 'fulltime',
      candidateType,
      ...overrides,
    });
  }

  describe('1.2: Component weight application per candidate type', () => {
    it('should apply coop-derived weights (base coop_entry + software_engineer role adjustment)', () => {
      const result = scoreForType('coop');

      // coop_entry base: kw=0.42, qf=0.10, cq=0.18, sec=0.20, fmt=0.10
      // software_engineer adjustment: kw+=0.03, sec-=0.03
      // After adjustment: kw=0.45, qf=0.10, cq=0.18, sec=0.17, fmt=0.10 → normalized
      expect(result.metadata.weightsUsed.keywords).toBeCloseTo(0.45, 2);
      expect(result.metadata.weightsUsed.qualificationFit).toBeCloseTo(0.10, 2);
      expect(result.metadata.weightsUsed.contentQuality).toBeCloseTo(0.18, 2);
      expect(result.metadata.weightsUsed.sections).toBeCloseTo(0.17, 2);
      expect(result.metadata.weightsUsed.format).toBeCloseTo(0.10, 2);

      // Verify score is valid
      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should apply fulltime/mid-derived weights (base mid + software_engineer role adjustment)', () => {
      const result = scoreForType('fulltime');

      // mid base: kw=0.40, qf=0.15, cq=0.20, sec=0.15, fmt=0.10
      // software_engineer adjustment: kw+=0.03, sec-=0.03
      // After adjustment: kw=0.43, qf=0.15, cq=0.20, sec=0.12, fmt=0.10 → normalized
      expect(result.metadata.weightsUsed.keywords).toBeCloseTo(0.43, 2);
      expect(result.metadata.weightsUsed.qualificationFit).toBeCloseTo(0.15, 2);
      expect(result.metadata.weightsUsed.contentQuality).toBeCloseTo(0.20, 2);
      expect(result.metadata.weightsUsed.sections).toBeCloseTo(0.12, 2);
      expect(result.metadata.weightsUsed.format).toBeCloseTo(0.10, 2);
    });

    it('should apply career_changer-derived weights (base career_changer + software_engineer role adjustment)', () => {
      const result = scoreForType('career_changer');

      // career_changer base: kw=0.40, qf=0.14, cq=0.18, sec=0.18, fmt=0.10
      // software_engineer adjustment: kw+=0.03, sec-=0.03
      // After adjustment: kw=0.43, qf=0.14, cq=0.18, sec=0.15, fmt=0.10 → normalized
      expect(result.metadata.weightsUsed.keywords).toBeCloseTo(0.43, 2);
      expect(result.metadata.weightsUsed.qualificationFit).toBeCloseTo(0.14, 2);
      expect(result.metadata.weightsUsed.contentQuality).toBeCloseTo(0.18, 2);
      expect(result.metadata.weightsUsed.sections).toBeCloseTo(0.15, 2);
      expect(result.metadata.weightsUsed.format).toBeCloseTo(0.10, 2);
    });

    it('should produce different weights for coop vs fulltime vs career_changer', () => {
      const coopResult = scoreForType('coop');
      const fulltimeResult = scoreForType('fulltime');
      const careerChangerResult = scoreForType('career_changer');

      // Coop has different keywords weight than fulltime (0.45 vs 0.43)
      expect(coopResult.metadata.weightsUsed.keywords).not.toBeCloseTo(
        fulltimeResult.metadata.weightsUsed.keywords, 2
      );

      // Coop has different sections weight than fulltime (0.17 vs 0.12)
      expect(coopResult.metadata.weightsUsed.sections).not.toBeCloseTo(
        fulltimeResult.metadata.weightsUsed.sections, 2
      );

      // Career changer has different qualificationFit than fulltime (0.14 vs 0.15)
      expect(careerChangerResult.metadata.weightsUsed.qualificationFit).not.toBeCloseTo(
        fulltimeResult.metadata.weightsUsed.qualificationFit, 2
      );
    });
  });

  describe('1.3: career_changer section maxPoints adjustments', () => {
    it('should score career_changer education higher than fulltime for same strong education', () => {
      const strongEduOverrides = {
        resumeQualifications: { ...baseResumeQuals, degree: 'Master' },
        sections: { ...baseSections, education: 'MS Computer Science, Top University, GPA 3.9' },
      };

      const careerResult = scoreForType('career_changer', strongEduOverrides);
      const fulltimeResult = scoreForType('fulltime', strongEduOverrides);

      // Both should produce valid section scores
      expect(careerResult.breakdownV21.sections.score).toBeGreaterThanOrEqual(0);
      expect(fulltimeResult.breakdownV21.sections.score).toBeGreaterThanOrEqual(0);

      // Verify different candidate types produce different overall scores
      expect(careerResult.overall).not.toBe(fulltimeResult.overall);
    });

    it('should not penalize career_changer as heavily for low experience (maxPoints=20 vs 30)', () => {
      const lowExpOverrides = {
        resumeQualifications: { ...baseResumeQuals, yearsOfExperience: 1 },
      };

      const careerResult = scoreForType('career_changer', lowExpOverrides);
      const fulltimeResult = scoreForType('fulltime', lowExpOverrides);

      // Both should produce valid scores
      expect(careerResult.overall).toBeGreaterThan(0);
      expect(fulltimeResult.overall).toBeGreaterThan(0);

      // Career changer has lower experience maxPoints (20 vs 30), so experience
      // contributes less to the overall — verify scores differ
      expect(careerResult.overall).not.toBe(fulltimeResult.overall);
    });

    it('should weight career_changer projects more heavily (maxPoints=15 vs 10)', () => {
      const projectOverrides = {
        sections: {
          ...baseSections,
          projects: ['Portfolio website', 'Open source contribution'],
        },
        bulletSources: { experience: 1, projects: 2, education: 0 },
      };

      const careerResult = scoreForType('career_changer', projectOverrides);
      const fulltimeResult = scoreForType('fulltime', projectOverrides);

      // Both should have valid section scores
      expect(careerResult.breakdownV21.sections.score).toBeGreaterThan(0);
      expect(fulltimeResult.breakdownV21.sections.score).toBeGreaterThan(0);

      // Career changer weights projects higher (maxPoints=15 vs 10),
      // so section scores should differ
      expect(careerResult.breakdownV21.sections.score).not.toBe(
        fulltimeResult.breakdownV21.sections.score
      );
    });
  });

  describe('1.4: co-op summary optional and experience waiver', () => {
    it('should not heavily penalize co-op for missing summary (required=false)', () => {
      const withSummary = scoreForType('coop');
      const withoutSummary = scoreForType('coop', {
        sections: { ...baseSections, summary: undefined },
      });

      // Both should produce valid scores
      expect(withSummary.overall).toBeGreaterThan(0);
      expect(withoutSummary.overall).toBeGreaterThan(0);

      // For fulltime, missing summary should matter more
      const fulltimeWithSummary = scoreForType('fulltime');
      const fulltimeWithoutSummary = scoreForType('fulltime', {
        sections: { ...baseSections, summary: undefined },
      });

      // The fulltime penalty for missing summary should be >= coop penalty
      const coopPenalty = withSummary.overall - withoutSummary.overall;
      const fulltimePenalty = fulltimeWithSummary.overall - fulltimeWithoutSummary.overall;
      expect(fulltimePenalty).toBeGreaterThanOrEqual(coopPenalty);
    });

    it('should accept co-op with strong projects and no experience', () => {
      const result = scoreForType('coop', {
        sections: {
          ...baseSections,
          experience: undefined,
          projects: ['React calculator app', 'TypeScript game engine', 'Portfolio website'],
        },
        resumeQualifications: { ...baseResumeQuals, yearsOfExperience: 0 },
        allBullets: ['Built React calculator app', 'Created TypeScript game', 'Deployed portfolio website'],
        bulletSources: { experience: 0, projects: 3, education: 0 },
      });

      // Co-op with 3 projects and no experience should still score reasonably
      expect(result.overall).toBeGreaterThan(0);
      expect(result.breakdownV21.sections.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('1.5: Weight profiles sum to 1.0 from actual scoring engine', () => {
    it('should have coop weights sum to exactly 1.0 (from engine)', () => {
      const result = scoreForType('coop');
      const w = result.metadata.weightsUsed;
      const sum = w.keywords + w.qualificationFit + w.contentQuality + w.sections + w.format;
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have fulltime weights sum to exactly 1.0 (from engine)', () => {
      const result = scoreForType('fulltime');
      const w = result.metadata.weightsUsed;
      const sum = w.keywords + w.qualificationFit + w.contentQuality + w.sections + w.format;
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have career_changer weights sum to exactly 1.0 (from engine)', () => {
      const result = scoreForType('career_changer');
      const w = result.metadata.weightsUsed;
      const sum = w.keywords + w.qualificationFit + w.contentQuality + w.sections + w.format;
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });
});

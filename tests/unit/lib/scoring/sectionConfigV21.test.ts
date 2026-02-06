import { describe, it, expect } from 'vitest';
import { SECTION_CONFIG_V21 } from '@/lib/scoring/constants';
import { calculateSectionScoreV21 } from '@/lib/scoring/sectionScore';

describe('SECTION_CONFIG_V21', () => {
  describe('[P1] Career changer section config', () => {
    it('exists with correct configuration', () => {
      const config = SECTION_CONFIG_V21.career_changer;

      expect(config).toBeDefined();
      expect(config.summary).toEqual({
        required: true,
        minLength: 80,
        maxPoints: 20,
      });
      expect(config.skills).toEqual({
        required: true,
        minItems: 8,
        maxPoints: 25,
      });
      expect(config.experience).toEqual({
        required: true,
        minBullets: 4,
        maxPoints: 20,
      });
      expect(config.education).toEqual({
        required: true,
        minLength: 30,
        maxPoints: 20,
      });
      expect(config.projects).toEqual({
        required: true,
        minBullets: 2,
        maxPoints: 15,
      });
      expect(config.certifications).toEqual({
        required: false,
        minItems: 1,
        maxPoints: 10,
      });
    });

    it('maxPoints total is 110', () => {
      const config = SECTION_CONFIG_V21.career_changer;
      const total =
        config.summary.maxPoints +
        config.skills.maxPoints +
        config.experience.maxPoints +
        config.education.maxPoints +
        config.projects.maxPoints +
        config.certifications.maxPoints;

      expect(total).toBe(110);
    });
  });

  describe('[P0] Co-op summary requirement change', () => {
    it('summary.required is false for coop', () => {
      const config = SECTION_CONFIG_V21.coop;
      expect(config.summary.required).toBe(false);
    });
  });

  describe('Section config regression checks', () => {
    it('co-op maxPoints total is 115', () => {
      const config = SECTION_CONFIG_V21.coop;
      const total =
        config.summary.maxPoints +
        config.skills.maxPoints +
        config.experience.maxPoints +
        config.education.maxPoints +
        config.projects.maxPoints +
        config.certifications.maxPoints;

      expect(total).toBe(115);
    });

    it('fulltime maxPoints total is 105', () => {
      const config = SECTION_CONFIG_V21.fulltime;
      const total =
        config.summary.maxPoints +
        config.skills.maxPoints +
        config.experience.maxPoints +
        config.education.maxPoints +
        config.projects.maxPoints +
        config.certifications.maxPoints;

      expect(total).toBe(105);
    });
  });

  describe('[P0] Co-op experience waiver with strong projects', () => {
    // Note: The actual co-op experience waiver logic will be tested in integration
    // since it requires the full calculateSectionScoreV21 function. This test
    // verifies the config supports the waiver rule (experience not required).
    it('co-op has experience.required = false', () => {
      const config = SECTION_CONFIG_V21.coop;
      expect(config.experience.required).toBe(false);
    });

    it('co-op has projects.required = true', () => {
      const config = SECTION_CONFIG_V21.coop;
      expect(config.projects.required).toBe(true);
      expect(config.projects.minBullets).toBe(2);
    });
  });

  describe('[P0] Co-op experience waiver functional test', () => {
    it('co-op with no experience is not penalized (experience excluded from scoring)', () => {
      const result = calculateSectionScoreV21({
        sections: {
          skills: ['JS', 'TS', 'React', 'Node', 'CSS', 'HTML', 'Git', 'SQL'],
          education: 'BS Computer Science, University, 2024. GPA: 3.8. Relevant Coursework: Algorithms, Web Dev',
          projects: ['Project A bullet', 'Project B bullet', 'Project C bullet'],
          experience: [], // No experience
        },
        candidateType: 'coop',
        jdKeywords: ['JavaScript', 'React'],
      });

      // Experience should not appear in breakdown (not required, not present = excluded)
      expect(result.breakdown.experience).toBeUndefined();

      // Score should be reasonable (not penalized for missing experience)
      expect(result.score).toBeGreaterThan(70);
    });

    it('co-op with experience present includes it in scoring', () => {
      const withExp = calculateSectionScoreV21({
        sections: {
          skills: ['JS', 'TS', 'React', 'Node', 'CSS', 'HTML', 'Git', 'SQL'],
          education: 'BS Computer Science, University, 2024. GPA: 3.8. Relevant Coursework: Algorithms, Web Dev',
          projects: ['Project A bullet', 'Project B bullet', 'Project C bullet'],
          experience: ['Developed features', 'Built APIs', 'Led team projects'],
        },
        candidateType: 'coop',
        jdKeywords: ['JavaScript', 'React'],
      });

      // Experience should be in breakdown when present
      expect(withExp.breakdown.experience).toBeDefined();
      expect(withExp.breakdown.experience?.present).toBe(true);
    });

    it('co-op summary missing does not create penalty in breakdown', () => {
      const withoutSummary = calculateSectionScoreV21({
        sections: {
          // No summary
          skills: ['JS', 'TS', 'React', 'Node', 'CSS', 'HTML', 'Git', 'SQL'],
          education: 'BS Computer Science, University, 2024. GPA: 3.8. Relevant Coursework: Algorithms, Web Dev',
          projects: ['Project A bullet', 'Project B bullet', 'Project C bullet'],
          experience: ['Intern at company, developed features'],
        },
        candidateType: 'coop',
        jdKeywords: ['JavaScript', 'React'],
      });

      // Summary should NOT appear in breakdown as a penalty (it's optional for co-op)
      expect(withoutSummary.breakdown.summary).toBeUndefined();

      // Score should be reasonable without summary
      expect(withoutSummary.score).toBeGreaterThan(60);
    });

    it('fulltime summary missing IS penalized in breakdown', () => {
      const withoutSummary = calculateSectionScoreV21({
        sections: {
          // No summary
          skills: ['JS', 'TS', 'React', 'Node', 'CSS', 'HTML', 'Git', 'SQL'],
          education: 'BS Computer Science, University, 2024. GPA: 3.8. Relevant Coursework: Algorithms, Web Dev',
          projects: ['Project A bullet', 'Project B bullet', 'Project C bullet'],
          experience: ['Developed features', 'Built APIs', 'Led team', 'Managed releases', 'Wrote tests', 'Deployed apps'],
        },
        candidateType: 'fulltime',
        jdKeywords: ['JavaScript', 'React'],
      });

      // Summary SHOULD appear in breakdown with penalty (it's required for fulltime)
      expect(withoutSummary.breakdown.summary).toBeDefined();
      expect(withoutSummary.breakdown.summary?.present).toBe(false);
      expect(withoutSummary.breakdown.summary?.issues).toContain('No professional summary section');
    });
  });
});

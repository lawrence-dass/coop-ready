/**
 * Unit tests for candidate type detection
 *
 * Story: 18.1 - Candidate Type Detection & Classification
 * Tests the 6-priority detection chain with edge cases
 */

import { describe, it, expect } from 'vitest';
import { detectCandidateType } from '@/lib/scoring/candidateTypeDetection';
import type { CandidateTypeInput } from '@/lib/scoring/types';

describe('detectCandidateType', () => {
  describe('[P0] Priority 1: User Selection (userJobType === coop)', () => {
    it('returns coop with confidence 1.0 when user explicitly selects coop', () => {
      const input: CandidateTypeInput = {
        userJobType: 'coop',
        careerGoal: 'first-job',
        resumeRoleCount: 0,
        hasActiveEducation: true,
        totalExperienceYears: 0,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('coop');
      expect(result.confidence).toBe(1.0);
      expect(result.detectedFrom).toBe('user_selection');
    });

    it('returns coop even when resume suggests fulltime experience', () => {
      const input: CandidateTypeInput = {
        userJobType: 'coop',
        careerGoal: 'advancing',
        resumeRoleCount: 5,
        hasActiveEducation: false,
        totalExperienceYears: 8,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('coop');
      expect(result.confidence).toBe(1.0);
      expect(result.detectedFrom).toBe('user_selection');
    });
  });

  describe('[P0] Priority 2: Career Changer Detection (fulltime + switching-careers)', () => {
    it('returns career_changer when user selects fulltime with switching-careers goal', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        careerGoal: 'switching-careers',
        resumeRoleCount: 3,
        hasActiveEducation: false,
        totalExperienceYears: 5,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('career_changer');
      expect(result.confidence).toBe(0.95);
      expect(result.detectedFrom).toBe('onboarding');
    });

    it('returns career_changer even with minimal resume data', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        careerGoal: 'switching-careers',
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('career_changer');
      expect(result.confidence).toBe(0.95);
      expect(result.detectedFrom).toBe('onboarding');
    });
  });

  describe('[P1] Priority 3: Career Changer via Resume Analysis (fulltime + education + <3 roles)', () => {
    it('returns career_changer for fulltime with active education and few roles', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        careerGoal: 'first-job',
        resumeRoleCount: 2,
        hasActiveEducation: true,
        totalExperienceYears: 1,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('career_changer');
      expect(result.confidence).toBe(0.7);
      expect(result.detectedFrom).toBe('resume_analysis');
    });

    it('returns career_changer with exactly 2 roles', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        resumeRoleCount: 2,
        hasActiveEducation: true,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('career_changer');
      expect(result.confidence).toBe(0.7);
      expect(result.detectedFrom).toBe('resume_analysis');
    });

    it('does NOT match when resumeRoleCount >= 3 - falls to explicit fulltime handler', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        resumeRoleCount: 3,
        hasActiveEducation: true,
      };

      const result = detectCandidateType(input);

      // Should fall through to explicit fulltime handler (Priority 3.5)
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.9);
      expect(result.detectedFrom).toBe('user_selection');
    });

    it('does NOT match when no active education - falls to explicit fulltime handler', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        resumeRoleCount: 2,
        hasActiveEducation: false,
      };

      const result = detectCandidateType(input);

      // Should fall through to explicit fulltime handler (Priority 3.5)
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.9);
      expect(result.detectedFrom).toBe('user_selection');
    });
  });

  describe('[P0] Priority 3.5: Explicit Fulltime Selection (fulltime without career-changer signals)', () => {
    it('returns fulltime with confidence 0.9 when user selects fulltime with no career-changer criteria', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.9);
      expect(result.detectedFrom).toBe('user_selection');
    });

    it('returns fulltime 0.9 even with experienced resume data', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        careerGoal: 'advancing',
        resumeRoleCount: 5,
        hasActiveEducation: false,
        totalExperienceYears: 8,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.9);
      expect(result.detectedFrom).toBe('user_selection');
    });

    it('returns fulltime 0.9 when careerGoal is not switching-careers', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        careerGoal: 'promotion',
        resumeRoleCount: 0,
        hasActiveEducation: false,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.9);
      expect(result.detectedFrom).toBe('user_selection');
    });
  });

  describe('[P1] Priority 4: Auto-detect Co-op (<2 roles + active education)', () => {
    it('returns coop when no userJobType, <2 roles, and active education', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 1,
        hasActiveEducation: true,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('coop');
      expect(result.confidence).toBe(0.8);
      expect(result.detectedFrom).toBe('resume_analysis');
    });

    it('returns coop with 0 roles', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 0,
        hasActiveEducation: true,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('coop');
      expect(result.confidence).toBe(0.8);
      expect(result.detectedFrom).toBe('resume_analysis');
    });

    it('does NOT match when resumeRoleCount >= 2 - falls to default', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 2,
        hasActiveEducation: true,
      };

      const result = detectCandidateType(input);

      // 2 roles + education but no userJobType → falls to default
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });

    it('does NOT match when no active education - falls to default', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 1,
        hasActiveEducation: false,
      };

      const result = detectCandidateType(input);

      // 1 role, no education, no userJobType → falls to default
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });

    it('does NOT match Priority 4 when userJobType is fulltime with education (Priority 3 takes over)', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        resumeRoleCount: 1,
        hasActiveEducation: true,
      };

      const result = detectCandidateType(input);

      // Should be handled by Priority 3 (career_changer) instead of Priority 4 (coop)
      expect(result.candidateType).toBe('career_changer');
      expect(result.detectedFrom).toBe('resume_analysis');
      expect(result.confidence).toBe(0.7);
    });

    it('does NOT match Priority 4 when userJobType is fulltime without education (Priority 3.5 takes over)', () => {
      const input: CandidateTypeInput = {
        userJobType: 'fulltime',
        resumeRoleCount: 1,
        hasActiveEducation: false,
      };

      const result = detectCandidateType(input);

      // Should be handled by Priority 3.5 (explicit fulltime) instead of Priority 4 (coop)
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.9);
      expect(result.detectedFrom).toBe('user_selection');
    });
  });

  describe('[P1] Priority 5: Auto-detect Full-time (3+ roles + 3+ years)', () => {
    it('returns fulltime when no userJobType, 3+ roles, 3+ years experience', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 3,
        totalExperienceYears: 3,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.85);
      expect(result.detectedFrom).toBe('resume_analysis');
    });

    it('returns fulltime with 5 roles and 10 years', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 5,
        totalExperienceYears: 10,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.85);
      expect(result.detectedFrom).toBe('resume_analysis');
    });

    it('does NOT match when resumeRoleCount < 3 - falls to default', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 2,
        totalExperienceYears: 5,
      };

      const result = detectCandidateType(input);

      // 2 roles (< 3) → doesn't match P5, falls to default
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });

    it('does NOT match when totalExperienceYears < 3 - falls to default', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 4,
        totalExperienceYears: 2,
      };

      const result = detectCandidateType(input);

      // 4 roles but only 2 years (< 3) → doesn't match P5, falls to default
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });
  });

  describe('[P1] Priority 6: Default Fallback', () => {
    it('returns fulltime with confidence 0.5 when no other criteria match', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 2,
        totalExperienceYears: 1,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });

    it('returns fulltime default with empty input', () => {
      const input: CandidateTypeInput = {};

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });

    it('returns fulltime default when all fields are undefined', () => {
      const input: CandidateTypeInput = {
        userJobType: undefined,
        careerGoal: undefined,
        resumeRoleCount: undefined,
        hasActiveEducation: undefined,
        totalExperienceYears: undefined,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });
  });

  describe('Edge Cases', () => {
    it('handles boundary: exactly 3 roles should match Priority 5 if 3+ years', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 3,
        totalExperienceYears: 3,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.85);
    });

    it('handles boundary: exactly 2 roles should NOT match Priority 4 without education', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 2,
        hasActiveEducation: false,
      };

      const result = detectCandidateType(input);

      // Should fall through to default
      expect(result.detectedFrom).toBe('default');
    });

    it('handles partial input: only careerGoal', () => {
      const input: CandidateTypeInput = {
        careerGoal: 'advancement',
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('fulltime');
      expect(result.detectedFrom).toBe('default');
    });

    it('handles partial input: only resumeRoleCount', () => {
      const input: CandidateTypeInput = {
        resumeRoleCount: 1,
      };

      const result = detectCandidateType(input);

      // Without hasActiveEducation=true, can't match Priority 4
      expect(result.detectedFrom).toBe('default');
    });

    it('correctly prioritizes user selection over everything else', () => {
      const input: CandidateTypeInput = {
        userJobType: 'coop',
        careerGoal: 'switching-careers', // Would trigger Priority 2 if userJobType was fulltime
        resumeRoleCount: 10,
        totalExperienceYears: 20,
        hasActiveEducation: false,
      };

      const result = detectCandidateType(input);

      expect(result.candidateType).toBe('coop');
      expect(result.confidence).toBe(1.0);
      expect(result.detectedFrom).toBe('user_selection');
    });
  });
});

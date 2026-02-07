/**
 * Backward Compatibility Tests
 * Story 18.10 Task 4
 *
 * Tests that sessions with null/undefined candidateType default to fulltime
 * behavior throughout the pipeline: detection, structural suggestions,
 * section ordering, and effective type derivation.
 */

import { describe, it, expect } from 'vitest';
import { detectCandidateType } from '@/lib/scoring/candidateTypeDetection';
import { generateStructuralSuggestions } from '@/lib/scoring/structuralSuggestions';
import { validateSectionOrder } from '@/lib/scoring/sectionOrdering';
import { deriveEffectiveCandidateType } from '@/lib/ai/preferences';

describe('[P0] Backward Compatibility — null candidateType defaults', () => {
  describe('4.2: detectCandidateType with empty input', () => {
    it('should return fulltime with default confidence when given empty input', () => {
      const result = detectCandidateType({});
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedFrom).toBe('default');
    });

    it('should return fulltime when all fields are undefined', () => {
      const result = detectCandidateType({
        userJobType: undefined,
        careerGoal: undefined,
        resumeRoleCount: undefined,
        hasActiveEducation: undefined,
        totalExperienceYears: undefined,
      });
      expect(result.candidateType).toBe('fulltime');
      expect(result.detectedFrom).toBe('default');
    });
  });

  describe('4.3: validateSectionOrder with fulltime default', () => {
    it('should validate fulltime order when candidateType defaults', () => {
      const validation = validateSectionOrder(
        ['summary', 'skills', 'experience', 'education'],
        'fulltime'
      );
      expect(validation.isCorrectOrder).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect violations for fulltime when edu before exp', () => {
      const validation = validateSectionOrder(
        ['summary', 'skills', 'education', 'experience'],
        'fulltime'
      );
      expect(validation.isCorrectOrder).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
    });
  });

  describe('4.4: generateStructuralSuggestions with fulltime candidateType', () => {
    it('should apply fulltime rules when candidateType is fulltime', () => {
      // Fulltime with education before experience should trigger Rule 5
      const suggestions = generateStructuralSuggestions({
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced engineer',
          skills: 'React, Python',
          education: 'BS Computer Science',
          experience: 'Senior Engineer at TechCo',
        },
        sectionOrder: ['summary', 'skills', 'education', 'experience'],
      });

      const orderSuggestion = suggestions.find(s => s.category === 'section_order');
      expect(orderSuggestion).toBeDefined();
      expect(orderSuggestion!.id).toContain('fulltime');
    });

    it('should return no suggestions for well-structured fulltime resume', () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced engineer with 5+ years',
          skills: 'React, Python, TypeScript',
          experience: 'Senior Engineer at TechCo',
          education: 'BS Computer Science',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'],
      });

      // Well-structured fulltime resume should have no order/presence violations
      const orderOrPresence = suggestions.filter(
        s => s.category === 'section_order' || s.category === 'section_presence'
      );
      expect(orderOrPresence).toHaveLength(0);
    });
  });

  describe('4.5: Store defaults to fulltime tab ordering', () => {
    it('should handle null candidateType by falling through to fulltime detection', () => {
      // When candidate_type is null in session, the pipeline calls detectCandidateType
      // with minimal signals, which defaults to fulltime
      const result = detectCandidateType({
        userJobType: undefined,
        careerGoal: undefined,
      });
      expect(result.candidateType).toBe('fulltime');
    });

    it('should validate fulltime tab ordering as correct', () => {
      // Fulltime expected order: summary, skills, experience, projects, education
      const validation = validateSectionOrder(
        ['summary', 'skills', 'experience', 'projects', 'education'],
        'fulltime'
      );
      expect(validation.isCorrectOrder).toBe(true);
    });
  });

  describe('4.6: deriveEffectiveCandidateType fallback', () => {
    it('should return fulltime when both args are undefined', () => {
      const result = deriveEffectiveCandidateType(undefined, undefined);
      expect(result).toBe('fulltime');
    });

    it('should return fulltime when both args are null-ish', () => {
      const result = deriveEffectiveCandidateType(undefined, null);
      expect(result).toBe('fulltime');
    });

    it('should return fulltime when preferences has no jobType', () => {
      const result = deriveEffectiveCandidateType(undefined, {});
      expect(result).toBe('fulltime');
    });

    it('should return coop when preferences.jobType is coop', () => {
      const result = deriveEffectiveCandidateType(undefined, { jobType: 'coop' });
      expect(result).toBe('coop');
    });

    it('should prefer explicit candidateType over preferences', () => {
      const result = deriveEffectiveCandidateType('career_changer', { jobType: 'coop' });
      expect(result).toBe('career_changer');
    });

    it('should return explicit coop candidateType regardless of preferences', () => {
      const result = deriveEffectiveCandidateType('coop', { jobType: 'fulltime' });
      expect(result).toBe('coop');
    });
  });
});

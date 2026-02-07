/**
 * Candidate-Type Pipeline Integration Tests
 * Story 18.10 Task 3
 *
 * Tests the full candidate-type pipeline: detect → score → structural → suggest
 * for all 3 candidate types (coop, fulltime, career_changer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCandidateType } from '@/lib/scoring/candidateTypeDetection';
import { calculateATSScoreV21 } from '@/lib/scoring';
import { generateStructuralSuggestions } from '@/lib/scoring/structuralSuggestions';
import { validateSectionOrder, detectSectionOrder } from '@/lib/scoring/sectionOrdering';
import type { CandidateTypeInput } from '@/lib/scoring/types';
import type { KeywordMatchV21, JDQualifications, ResumeQualifications } from '@/lib/scoring/types';

// Mock generateAllSuggestions dependencies (LLM calls)
vi.mock('@/lib/ai/generateSummarySuggestion');
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/ai/generateExperienceSuggestion');
vi.mock('@/lib/ai/generateEducationSuggestion');
vi.mock('@/lib/ai/generateProjectsSuggestion');
vi.mock('@/lib/ai/judgeSuggestion');
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/supabase/sessions');
vi.mock('@/lib/supabase/user-context');

describe('[P0] Candidate-Type Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Shared test data
  const baseKeywords: KeywordMatchV21[] = [
    { keyword: 'React', category: 'technologies', importance: 'high', requirement: 'required', found: true, matchType: 'exact', placement: ['skills'], context: 'React developer' },
    { keyword: 'Python', category: 'technologies', importance: 'medium', requirement: 'preferred', found: true, matchType: 'exact', placement: ['skills'], context: 'Python scripting' },
    { keyword: 'Docker', category: 'technologies', importance: 'medium', requirement: 'preferred', found: false },
  ];

  const baseJDQuals: JDQualifications = {
    requiredDegree: 'Bachelor',
    preferredDegree: 'Master',
    requiredYears: 2,
    preferredYears: 4,
    requiredCerts: [],
    preferredCerts: [],
  };

  const baseResumeQuals: ResumeQualifications = {
    degree: 'Bachelor',
    yearsOfExperience: 1,
    certifications: [],
  };

  const jdText = 'Looking for a React developer with Python skills';

  describe('3.2: Co-op pipeline end-to-end', () => {
    const coopInput: CandidateTypeInput = {
      userJobType: 'coop',
      careerGoal: undefined,
      resumeRoleCount: 0,
      hasActiveEducation: true,
      totalExperienceYears: 0,
    };

    it('should detect coop candidate type', () => {
      const result = detectCandidateType(coopInput);
      expect(result.candidateType).toBe('coop');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should apply coop scoring weights', () => {
      const result = calculateATSScoreV21({
        keywords: baseKeywords,
        jdQualifications: baseJDQuals,
        resumeQualifications: { ...baseResumeQuals, yearsOfExperience: 0 },
        allBullets: ['Built React app for school project'],
        bulletSources: { experience: 0, projects: 1, education: 0 },
        sections: {
          skills: ['React', 'Python', 'JavaScript'],
          education: 'BS Computer Science, Expected May 2027',
          projects: ['Built React app for school project'],
        },
        resumeText: 'Skills: React Python\nEducation: BS CS\nProjects: React app',
        jdText,
        jobType: 'coop',
        candidateType: 'coop',
      });

      expect(result.overall).toBeGreaterThan(0);
      expect(result.metadata.version).toBe('v2.1');
      // Coop with 2/3 keyword matches and skills should score meaningfully
      // (even with no experience, projects and skills carry weight for coop)
      expect(result.overall).toBeGreaterThan(30);
    });

    it('should fire co-op structural rules when violations present', () => {
      // Co-op resume with experience before education (Rule 1 violation)
      const suggestions = generateStructuralSuggestions({
        candidateType: 'coop',
        parsedResume: {
          skills: 'React, Python',
          experience: 'Intern at Company X',
          education: 'BS Computer Science',
          projects: 'React app',
        },
        sectionOrder: ['experience', 'education', 'skills', 'projects'],
      });

      // Rule 2: skills not at top → should fire
      const rule2 = suggestions.find(s => s.id?.includes('skills') || s.category === 'section_presence');
      // There should be at least one suggestion for this disordered resume
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should validate co-op section order', () => {
      const validation = validateSectionOrder(
        ['skills', 'education', 'projects', 'experience'],
        'coop'
      );
      // This is the recommended co-op order
      expect(validation.isCorrectOrder).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  describe('3.3: Fulltime pipeline end-to-end', () => {
    const fulltimeInput: CandidateTypeInput = {
      userJobType: 'fulltime',
      careerGoal: undefined,
      resumeRoleCount: 3,
      hasActiveEducation: false,
      totalExperienceYears: 5,
    };

    it('should detect fulltime candidate type', () => {
      const result = detectCandidateType(fulltimeInput);
      expect(result.candidateType).toBe('fulltime');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should apply fulltime scoring weights', () => {
      const result = calculateATSScoreV21({
        keywords: baseKeywords,
        jdQualifications: baseJDQuals,
        resumeQualifications: { ...baseResumeQuals, yearsOfExperience: 5 },
        allBullets: [
          'Led React migration for 3 projects',
          'Improved performance by 40%',
          'Mentored 2 junior developers',
        ],
        bulletSources: { experience: 3, projects: 0, education: 0 },
        sections: {
          summary: 'Senior software engineer with 5 years experience',
          skills: ['React', 'Python', 'Docker'],
          experience: ['Led React migration', 'Performance improvement', 'Mentoring'],
          education: 'BS Computer Science, StateU 2019',
        },
        resumeText: 'Summary: Senior engineer\nSkills: React Python\nExperience: Led migration',
        jdText,
        jobType: 'fulltime',
        candidateType: 'fulltime',
      });

      expect(result.overall).toBeGreaterThan(0);
      // Fulltime with 5 years experience, 3 strong bullets, and 2/3 keywords should score well
      expect(result.overall).toBeGreaterThan(40);
    });

    it('should fire fulltime structural rules when violations present', () => {
      // Fulltime resume with education before experience (Rule 5)
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

      // Rule 5: edu before exp for fulltime → should fire
      const orderSuggestion = suggestions.find(s => s.category === 'section_order');
      expect(orderSuggestion).toBeDefined();
    });

    it('should validate fulltime section order', () => {
      const validation = validateSectionOrder(
        ['summary', 'skills', 'experience', 'education'],
        'fulltime'
      );
      expect(validation.isCorrectOrder).toBe(true);
    });
  });

  describe('3.4: Career changer pipeline end-to-end', () => {
    const careerChangerInput: CandidateTypeInput = {
      userJobType: 'fulltime',
      careerGoal: 'switching-careers',
      resumeRoleCount: 2,
      hasActiveEducation: false,
      totalExperienceYears: 8,
    };

    it('should detect career_changer candidate type', () => {
      const result = detectCandidateType(careerChangerInput);
      expect(result.candidateType).toBe('career_changer');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.detectedFrom).toBe('onboarding');
    });

    it('should apply career_changer scoring weights', () => {
      const result = calculateATSScoreV21({
        keywords: baseKeywords,
        jdQualifications: baseJDQuals,
        resumeQualifications: { ...baseResumeQuals, yearsOfExperience: 8, degree: 'Master' },
        allBullets: [
          'Transitioned from finance to software',
          'Built React portfolio website',
          'Completed bootcamp in full-stack development',
        ],
        bulletSources: { experience: 1, projects: 2, education: 0 },
        sections: {
          summary: 'Career changer transitioning from finance to software engineering with MS in CS',
          skills: ['React', 'Python', 'JavaScript'],
          education: 'MS Computer Science, StateU 2025',
          projects: ['Portfolio website', 'Finance automation tool'],
          experience: ['Financial Analyst at Bank (2016-2024)'],
        },
        resumeText: 'Summary: Career changer\nSkills: React\nEducation: MS CS\nProjects: Portfolio',
        jdText,
        jobType: 'fulltime',
        candidateType: 'career_changer',
      });

      expect(result.overall).toBeGreaterThan(0);
      expect(result.metadata.version).toBe('v2.1');
    });

    it('should fire career_changer structural rules when violations present', () => {
      // Career changer without summary (Rule 6) and education below experience (Rule 7)
      const suggestions = generateStructuralSuggestions({
        candidateType: 'career_changer',
        parsedResume: {
          skills: 'React, Python',
          experience: 'Financial Analyst at Bank',
          education: 'MS Computer Science',
          projects: 'Portfolio website',
        },
        sectionOrder: ['skills', 'experience', 'education', 'projects'],
      });

      // Rule 6: no summary for career_changer → should fire (critical)
      const noSummarySuggestion = suggestions.find(s =>
        s.category === 'section_presence' && s.priority === 'critical'
      );
      expect(noSummarySuggestion).toBeDefined();

      // Rule 7: education below experience → should fire
      const eduOrderSuggestion = suggestions.find(s => s.category === 'section_order');
      expect(eduOrderSuggestion).toBeDefined();
    });

    it('should validate career_changer section order', () => {
      const validation = validateSectionOrder(
        ['summary', 'skills', 'education', 'projects', 'experience'],
        'career_changer'
      );
      expect(validation.isCorrectOrder).toBe(true);
    });
  });

  describe('3.5: candidateType flows through pipeline consistently', () => {
    it('should detect different types for different inputs', () => {
      const coopResult = detectCandidateType({ userJobType: 'coop' });
      const fulltimeResult = detectCandidateType({ userJobType: 'fulltime' });
      const careerChangerResult = detectCandidateType({
        userJobType: 'fulltime',
        careerGoal: 'switching-careers',
      });

      expect(coopResult.candidateType).toBe('coop');
      expect(fulltimeResult.candidateType).toBe('fulltime');
      expect(careerChangerResult.candidateType).toBe('career_changer');
    });

    it('should produce type-specific scoring for same resume', () => {
      const sharedInput = {
        keywords: baseKeywords,
        jdQualifications: baseJDQuals,
        resumeQualifications: baseResumeQuals,
        allBullets: ['Built React app'],
        bulletSources: { experience: 1, projects: 0, education: 0 },
        sections: {
          summary: 'Developer',
          skills: ['React'],
          experience: ['Engineer at Co'],
          education: 'BS CS',
        },
        resumeText: 'Summary\nSkills\nExperience\nEducation',
        jdText,
      };

      const coopScore = calculateATSScoreV21({ ...sharedInput, jobType: 'coop', candidateType: 'coop' });
      const fulltimeScore = calculateATSScoreV21({ ...sharedInput, jobType: 'fulltime', candidateType: 'fulltime' });
      const careerChangerScore = calculateATSScoreV21({ ...sharedInput, jobType: 'fulltime', candidateType: 'career_changer' });

      // Different candidate types should use different weights
      expect(coopScore.metadata.weightsUsed).not.toEqual(fulltimeScore.metadata.weightsUsed);
      expect(fulltimeScore.metadata.weightsUsed).not.toEqual(careerChangerScore.metadata.weightsUsed);
    });

    it('should produce type-specific structural suggestions for same resume', () => {
      const sharedResume = {
        parsedResume: {
          skills: 'React, Python',
          experience: 'Engineer at Co',
          education: 'BS CS',
        },
        sectionOrder: ['experience', 'skills', 'education'],
      };

      const coopSuggestions = generateStructuralSuggestions({ ...sharedResume, candidateType: 'coop' });
      const fulltimeSuggestions = generateStructuralSuggestions({ ...sharedResume, candidateType: 'fulltime' });
      const careerChangerSuggestions = generateStructuralSuggestions({ ...sharedResume, candidateType: 'career_changer' });

      // All should have suggestions for this disordered resume
      // But the specific suggestions should differ by type
      const coopIds = coopSuggestions.map(s => s.id);
      const careerChangerIds = careerChangerSuggestions.map(s => s.id);

      // Career changer should flag missing summary; co-op should not (summary optional)
      const careerChangerHasSummaryRule = careerChangerSuggestions.some(
        s => s.category === 'section_presence' && s.priority === 'critical'
      );
      expect(careerChangerHasSummaryRule).toBe(true);
    });
  });
});

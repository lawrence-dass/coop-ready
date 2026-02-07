/**
 * Structural Suggestions Edge Case Tests
 * Story 18.10 Task 7
 *
 * Tests cross-rule interactions, multiple simultaneous violations,
 * and non-standard header detection edge cases.
 */

import { describe, it, expect } from 'vitest';
import { generateStructuralSuggestions } from '@/lib/scoring/structuralSuggestions';

describe('[P0] Structural Suggestions Edge Cases', () => {
  describe('7.2: Co-op with ALL 4 violations simultaneously', () => {
    it('should return 4 suggestions when all co-op rules fire', () => {
      // Violations: Rule 1 (exp before edu), Rule 2 (no skills at top),
      // Rule 3 (has generic summary), Rule 4 (has projects but not "Project Experience")
      const suggestions = generateStructuralSuggestions({
        candidateType: 'coop',
        parsedResume: {
          summary: 'I am a student looking for opportunities.',
          skills: 'React, Python',
          experience: 'Intern at Company X',
          education: 'BS Computer Science',
          projects: 'Built a React app',
        },
        sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
        rawResumeText: [
          'Summary',
          'I am a student looking for opportunities.',
          '',
          'Experience',
          'Intern at Company X',
          '',
          'Education',
          'BS Computer Science',
          '',
          'Skills',
          'React, Python',
          '',
          'Projects',
          'Built a React app',
        ].join('\n'),
      });

      // Rule 1: experience before education → fires
      const rule1 = suggestions.find(s => s.id?.includes('coop') && s.category === 'section_order');
      expect(rule1).toBeDefined();

      // Rule 2: skills not at top → fires
      const rule2 = suggestions.find(s => s.id?.includes('skills') ||
        (s.category === 'section_presence' && s.priority === 'critical'));
      expect(rule2).toBeDefined();

      // Rule 3: has summary → fires (co-op shouldn't have generic summary)
      const rule3 = suggestions.find(s =>
        s.id?.includes('summary') ||
        (s.category === 'section_presence' && s.priority === 'high')
      );
      expect(rule3).toBeDefined();

      // All 4 co-op rules should fire: Rule 1 (exp before edu), Rule 2 (skills not at top),
      // Rule 3 (generic summary), Rule 4 (projects heading not "Project Experience")
      expect(suggestions.length).toBeGreaterThanOrEqual(4);

      // Verify each rule fired by checking IDs
      const ruleIds = suggestions.map(s => s.id);
      expect(ruleIds).toContain('rule-coop-exp-before-edu');      // Rule 1
      expect(ruleIds).toContain('rule-coop-no-skills-at-top');    // Rule 2
      expect(ruleIds).toContain('rule-coop-generic-summary');     // Rule 3
      expect(ruleIds).toContain('rule-coop-projects-heading');    // Rule 4

      // Verify correct priorities exist
      const priorities = suggestions.map(s => s.priority);
      expect(priorities).toContain('critical'); // Rule 2
      expect(priorities).toContain('high');     // Rule 1 or 3
    });
  });

  describe('7.3: Career changer with no summary AND edu below exp', () => {
    it('should return 2 suggestions for career changer missing summary with wrong order', () => {
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

      // Rule 6: no summary for career_changer → critical
      const noSummarySuggestion = suggestions.find(
        s => s.category === 'section_presence' && s.priority === 'critical'
      );
      expect(noSummarySuggestion).toBeDefined();
      expect(noSummarySuggestion!.id).toContain('career-changer');

      // Rule 7: education below experience → high
      const eduOrderSuggestion = suggestions.find(s => s.category === 'section_order');
      expect(eduOrderSuggestion).toBeDefined();
      expect(eduOrderSuggestion!.priority).toBe('high');

      // Should have exactly these 2 type-specific suggestions (plus possibly Rule 8 headers)
      const typeSpecific = suggestions.filter(
        s => s.category === 'section_order' || s.category === 'section_presence'
      );
      expect(typeSpecific).toHaveLength(2);
    });

    it('should mark no-summary as critical priority', () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'career_changer',
        parsedResume: {
          skills: 'React, Python',
          experience: 'Financial Analyst',
          education: 'MS CS',
        },
        sectionOrder: ['skills', 'experience', 'education'],
      });

      const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
      expect(criticalSuggestions.length).toBeGreaterThanOrEqual(1);
      expect(criticalSuggestions[0].category).toBe('section_presence');
    });
  });

  describe('7.4: Non-standard headers with mixed case', () => {
    it('should detect "My Journey" as non-standard experience header', () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced engineer',
          skills: 'React, Python',
          experience: 'Worked at TechCo',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'],
        rawResumeText: [
          'Summary',
          'Experienced engineer',
          '',
          'Skills',
          'React, Python',
          '',
          'My Journey',
          'Worked at TechCo',
          '',
          'Education',
          'BS CS',
        ].join('\n'),
      });

      const headerSuggestion = suggestions.find(s => s.category === 'section_heading');
      expect(headerSuggestion).toBeDefined();
      expect(headerSuggestion!.priority).toBe('moderate');
    });

    it('should detect "WHAT I KNOW" as non-standard skills header', () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced engineer',
          skills: 'React, Python',
          experience: 'Worked at TechCo',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'],
        rawResumeText: [
          'Summary',
          'Experienced engineer',
          '',
          'WHAT I KNOW',
          'React, Python',
          '',
          'Experience',
          'Worked at TechCo',
          '',
          'Education',
          'BS CS',
        ].join('\n'),
      });

      const headerSuggestion = suggestions.find(s => s.category === 'section_heading');
      expect(headerSuggestion).toBeDefined();
    });

    it("should detect \"things I've Built\" as non-standard projects header", () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'coop',
        parsedResume: {
          skills: 'React, Python',
          education: 'BS CS',
          projects: 'Built a React app',
        },
        sectionOrder: ['skills', 'education', 'projects'],
        rawResumeText: [
          'Skills',
          'React, Python',
          '',
          'Education',
          'BS CS',
          '',
          "things I've Built",
          'Built a React app',
        ].join('\n'),
      });

      const headerSuggestion = suggestions.find(s => s.category === 'section_heading');
      expect(headerSuggestion).toBeDefined();
    });
  });

  describe('7.5: Rule 8 headers only detected in heading context', () => {
    it('should not flag "my journey" when it appears in body text only', () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Throughout my journey as a developer, I have grown',
          skills: 'React, Python',
          experience: 'Worked at TechCo',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'],
        rawResumeText: [
          'Summary',
          'Throughout my journey as a developer, I have grown significantly.',
          '',
          'Skills',
          'React, Python',
          '',
          'Experience',
          'Worked at TechCo',
          '',
          'Education',
          'BS CS',
        ].join('\n'),
      });

      // "my journey" in body text should NOT trigger Rule 8
      // because the regex anchors to line start/end
      const headerSuggestions = suggestions.filter(s => s.category === 'section_heading');
      const myJourneyFlagged = headerSuggestions.some(
        s => s.currentState?.toLowerCase().includes('my journey')
      );
      expect(myJourneyFlagged).toBe(false);
    });

    it('should flag "my journey" when it appears as a standalone heading', () => {
      const suggestions = generateStructuralSuggestions({
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced engineer',
          skills: 'React, Python',
          experience: 'Worked at TechCo',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'],
        rawResumeText: [
          'Summary',
          'Experienced engineer',
          '',
          'Skills',
          'React, Python',
          '',
          'My Journey',
          'Worked at TechCo',
          '',
          'Education',
          'BS CS',
        ].join('\n'),
      });

      const headerSuggestions = suggestions.filter(s => s.category === 'section_heading');
      expect(headerSuggestions.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Tests for structural suggestions engine (Story 18.3)
 */

import { describe, it, expect } from 'vitest';
import {
  generateStructuralSuggestions,
  type StructuralSuggestionInput,
} from '@/lib/scoring/structuralSuggestions';

describe('generateStructuralSuggestions', () => {
  describe('Co-op candidate rules', () => {
    it('[P0] should generate suggestion for Rule 1: Experience before Education', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          skills: 'JavaScript, Python',
          experience: 'Co-op at Company X',
          education: 'BS CS',
        },
        sectionOrder: ['skills', 'experience', 'education'], // Wrong order
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule1 = suggestions.find((s) => s.id === 'rule-coop-exp-before-edu');

      expect(rule1).toBeDefined();
      expect(rule1?.priority).toBe('high');
      expect(rule1?.category).toBe('section_order');
      expect(rule1?.message).toContain('Education should come before Experience');
    });

    it('[P0] should generate suggestion for Rule 2: No Skills at top', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          education: 'BS CS',
          experience: 'Co-op at Company X',
          // Skills missing
        },
        sectionOrder: ['education', 'experience'],
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule2 = suggestions.find((s) => s.id === 'rule-coop-no-skills-at-top');

      expect(rule2).toBeDefined();
      expect(rule2?.priority).toBe('critical');
      expect(rule2?.category).toBe('section_presence');
      expect(rule2?.message).toContain('must lead with Skills');
    });

    it('[P0] should generate suggestion for Rule 2: Skills not first', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          education: 'BS CS',
          skills: 'JavaScript, Python',
        },
        sectionOrder: ['education', 'skills'], // Skills not first
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule2 = suggestions.find((s) => s.id === 'rule-coop-no-skills-at-top');

      expect(rule2).toBeDefined();
      expect(rule2?.priority).toBe('critical');
      expect(rule2?.category).toBe('section_presence');
    });

    it('[P1] should generate suggestion for Rule 3: Generic summary present', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          summary: 'Motivated student seeking opportunities', // Summary present
          skills: 'JavaScript, Python',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'education'],
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule3 = suggestions.find((s) => s.id === 'rule-coop-generic-summary');

      expect(rule3).toBeDefined();
      expect(rule3?.priority).toBe('high');
      expect(rule3?.category).toBe('section_presence');
      expect(rule3?.message).toContain('should not include');
    });

    it('[P1] should generate suggestion for Rule 4: "Projects" heading', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          skills: 'JavaScript, Python',
          education: 'BS CS',
          projects: 'E-commerce site built with React', // Projects present
        },
        sectionOrder: ['skills', 'education', 'projects'],
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule4 = suggestions.find((s) => s.id === 'rule-coop-projects-heading');

      expect(rule4).toBeDefined();
      expect(rule4?.priority).toBe('moderate');
      expect(rule4?.category).toBe('section_heading');
      expect(rule4?.message).toContain('Project Experience');
    });
  });

  describe('Full-time candidate rules', () => {
    it('[P0] should generate suggestion for Rule 5: Education before Experience', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced developer',
          skills: 'JavaScript, Python',
          education: 'BS CS',
          experience: 'Senior Developer at Company X',
        },
        sectionOrder: ['summary', 'skills', 'education', 'experience'], // Wrong order
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule5 = suggestions.find((s) => s.id === 'rule-fulltime-edu-before-exp');

      expect(rule5).toBeDefined();
      expect(rule5?.priority).toBe('high');
      expect(rule5?.category).toBe('section_order');
      expect(rule5?.message).toContain('Experience should come before Education');
    });

    it('[P1] should NOT generate Rule 5 when order is correct', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced developer',
          skills: 'JavaScript, Python',
          experience: 'Senior Developer at Company X',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'], // Correct order
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule5 = suggestions.find((s) => s.id === 'rule-fulltime-edu-before-exp');

      expect(rule5).toBeUndefined();
    });
  });

  describe('Career changer candidate rules', () => {
    it('[P0] should generate suggestion for Rule 6: Missing summary', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'career_changer',
        parsedResume: {
          // No summary
          skills: 'JavaScript, Python',
          education: 'MBA',
          experience: 'Sales Manager at Company Y',
        },
        sectionOrder: ['skills', 'education', 'experience'],
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule6 = suggestions.find((s) => s.id === 'rule-career-changer-no-summary');

      expect(rule6).toBeDefined();
      expect(rule6?.priority).toBe('critical');
      expect(rule6?.category).toBe('section_presence');
      expect(rule6?.message).toContain('must include a Professional Summary');
    });

    it('[P1] should generate suggestion for Rule 7: Education below Experience', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'career_changer',
        parsedResume: {
          summary: 'Transitioning from sales to tech',
          skills: 'JavaScript, Python',
          experience: 'Sales Manager at Company Y',
          education: 'MBA',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'], // Wrong order
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule7 = suggestions.find((s) => s.id === 'rule-career-changer-edu-below-exp');

      expect(rule7).toBeDefined();
      expect(rule7?.priority).toBe('high');
      expect(rule7?.category).toBe('section_order');
      expect(rule7?.message).toContain('Education should come before Experience');
    });

    it('[P1] should NOT generate Rule 7 when order is correct', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'career_changer',
        parsedResume: {
          summary: 'Transitioning from sales to tech',
          skills: 'JavaScript, Python',
          education: 'MBA',
          experience: 'Sales Manager at Company Y',
        },
        sectionOrder: ['summary', 'skills', 'education', 'experience'], // Correct order
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule7 = suggestions.find((s) => s.id === 'rule-career-changer-edu-below-exp');

      expect(rule7).toBeUndefined();
    });
  });

  describe('Rule 8: Non-standard headers', () => {
    it('[P1] should detect unsafe header "My Journey"', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          experience: 'Senior Developer',
        },
        sectionOrder: ['experience'],
        rawResumeText: 'John Doe\n\nMy Journey\nSenior Developer at Company X\n',
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule8 = suggestions.find((s) => s.id === 'rule-non-standard-headers');

      expect(rule8).toBeDefined();
      expect(rule8?.priority).toBe('moderate');
      expect(rule8?.category).toBe('section_heading');
      expect(rule8?.message).toContain('Non-standard');
    });

    it('[P1] should detect multiple unsafe headers', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          experience: 'Senior Developer',
          skills: 'JavaScript',
        },
        sectionOrder: ['experience', 'skills'],
        rawResumeText:
          'John Doe\n\nMy Journey\nSenior Developer\n\nWhat I Know\nJavaScript, Python\n',
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule8 = suggestions.find((s) => s.id === 'rule-non-standard-headers');

      expect(rule8).toBeDefined();
      expect(rule8?.currentState).toContain('my journey');
      expect(rule8?.currentState).toContain('what i know');
    });

    it('[P1] should NOT false-positive on unsafe header words in body text', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          experience: 'Senior ML Engineer',
          skills: 'Machine Learning, Deep Learning',
        },
        sectionOrder: ['experience', 'skills'],
        rawResumeText:
          'John Doe\n\nExperience\nApplied machine learning and deep learning to improve predictions.\nManaged my work across 3 teams.\n\nSkills\nMachine Learning, tech stack: React, Node.js\n',
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule8 = suggestions.find((s) => s.id === 'rule-non-standard-headers');

      // "learning", "my work", "tech stack" appear inline but NOT as section headings
      expect(rule8).toBeUndefined();
    });

    it('[P1] should NOT generate Rule 8 if no raw text provided', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          experience: 'Senior Developer',
        },
        sectionOrder: ['experience'],
        // No rawResumeText
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule8 = suggestions.find((s) => s.id === 'rule-non-standard-headers');

      expect(rule8).toBeUndefined();
    });
  });

  describe('No suggestions for correct resume', () => {
    it('[P1] should return empty array for correctly structured co-op resume', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          skills: 'JavaScript, Python',
          education: 'BS CS',
          projects: 'E-commerce site',
          experience: 'Co-op at Company X',
        },
        sectionOrder: ['skills', 'education', 'projects', 'experience'],
      };

      const suggestions = generateStructuralSuggestions(input);
      // Should only have the "Projects" heading suggestion (Rule 4)
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].id).toBe('rule-coop-projects-heading');
    });

    it('[P1] should return empty array for correctly structured full-time resume', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          summary: 'Experienced developer',
          skills: 'JavaScript, Python',
          experience: 'Senior Developer',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'skills', 'experience', 'education'],
      };

      const suggestions = generateStructuralSuggestions(input);
      expect(suggestions).toHaveLength(0);
    });

    it('[P1] should return empty array for correctly structured career changer resume', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'career_changer',
        parsedResume: {
          summary: 'Transitioning to tech',
          skills: 'JavaScript, Python',
          education: 'MBA',
          experience: 'Sales Manager',
        },
        sectionOrder: ['summary', 'skills', 'education', 'experience'],
      };

      const suggestions = generateStructuralSuggestions(input);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Suggestion structure', () => {
    it('[P1] should have unique IDs within a result set', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          summary: 'Motivated student', // Triggers Rule 3
          // No skills - triggers Rule 2
          experience: 'Co-op at Company X',
          education: 'BS CS',
        },
        sectionOrder: ['summary', 'experience', 'education'], // Triggers Rule 1
      };

      const suggestions = generateStructuralSuggestions(input);
      const ids = suggestions.map((s) => s.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size); // All IDs should be unique
    });

    it('[P1] should have all required fields in each suggestion', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          summary: 'Motivated student',
        },
        sectionOrder: ['summary'],
      };

      const suggestions = generateStructuralSuggestions(input);
      const rule3 = suggestions.find((s) => s.id === 'rule-coop-generic-summary');

      expect(rule3).toBeDefined();
      expect(rule3).toHaveProperty('id');
      expect(rule3).toHaveProperty('priority');
      expect(rule3).toHaveProperty('category');
      expect(rule3).toHaveProperty('message');
      expect(rule3).toHaveProperty('currentState');
      expect(rule3).toHaveProperty('recommendedAction');

      expect(typeof rule3?.id).toBe('string');
      expect(typeof rule3?.message).toBe('string');
      expect(typeof rule3?.currentState).toBe('string');
      expect(typeof rule3?.recommendedAction).toBe('string');
    });
  });

  describe('Multiple suggestions', () => {
    it('[P1] should generate multiple suggestions for badly structured resume', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          summary: 'Motivated student', // Triggers Rule 3
          experience: 'Co-op at Company X',
          education: 'BS CS',
          projects: 'E-commerce site', // Triggers Rule 4
          // No skills - triggers Rule 2
        },
        sectionOrder: ['summary', 'experience', 'education', 'projects'], // Triggers Rule 1
      };

      const suggestions = generateStructuralSuggestions(input);

      // Should have multiple suggestions
      expect(suggestions.length).toBeGreaterThan(1);

      // Check specific rules triggered
      const ruleIds = suggestions.map((s) => s.id);
      expect(ruleIds).toContain('rule-coop-exp-before-edu'); // Rule 1
      expect(ruleIds).toContain('rule-coop-no-skills-at-top'); // Rule 2
      expect(ruleIds).toContain('rule-coop-generic-summary'); // Rule 3
      expect(ruleIds).toContain('rule-coop-projects-heading'); // Rule 4
    });
  });

  describe('Edge cases', () => {
    it('[P1] should handle empty sectionOrder array', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'coop',
        parsedResume: {
          skills: 'JavaScript',
        },
        sectionOrder: [], // Empty
      };

      const suggestions = generateStructuralSuggestions(input);
      // Should only check presence/heading rules, not ordering rules
      expect(() => generateStructuralSuggestions(input)).not.toThrow();
    });

    it('[P1] should handle null/undefined sections', () => {
      const input: StructuralSuggestionInput = {
        candidateType: 'fulltime',
        parsedResume: {
          summary: null,
          skills: undefined,
          experience: 'Senior Developer',
        },
        sectionOrder: ['experience'],
      };

      const suggestions = generateStructuralSuggestions(input);
      expect(() => generateStructuralSuggestions(input)).not.toThrow();
    });
  });
});

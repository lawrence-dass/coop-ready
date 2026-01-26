// Story 5.4: Unit tests for keyword guidance utility
import { describe, it, expect } from 'vitest';
import { getKeywordGuidance } from '@/lib/utils/keywordGuidance';
import { ExtractedKeyword, KeywordCategory } from '@/types/analysis';

describe('getKeywordGuidance', () => {
  describe('category-based guidance', () => {
    it('should provide skills-specific guidance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Python',
        category: KeywordCategory.SKILLS,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.where).toContain('Skills section');
      expect(guidance.example).toContain('Python');
    });

    it('should provide technologies-specific guidance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'React',
        category: KeywordCategory.TECHNOLOGIES,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.where).toContain('Skills section');
      expect(guidance.example).toContain('React');
    });

    it('should provide qualifications-specific guidance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'MBA',
        category: KeywordCategory.QUALIFICATIONS,
        importance: 'medium',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.where).toContain('Education');
      expect(guidance.example).toContain('MBA');
    });

    it('should provide experience-specific guidance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Team Leadership',
        category: KeywordCategory.EXPERIENCE,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.where).toContain('Experience');
      expect(guidance.example).toContain('Team Leadership');
    });

    it('should provide soft skills-specific guidance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Communication',
        category: KeywordCategory.SOFT_SKILLS,
        importance: 'medium',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.where).toContain('Experience');
      expect(guidance.example).toContain('Communication');
    });

    it('should provide certifications-specific guidance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'AWS Certified',
        category: KeywordCategory.CERTIFICATIONS,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.where).toContain('Certifications');
      expect(guidance.example).toContain('AWS Certified');
    });
  });

  describe('importance-based "why" messages', () => {
    it('should explain high priority importance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Critical Skill',
        category: KeywordCategory.SKILLS,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.why).toContain('core requirement');
      expect(guidance.why.toLowerCase()).toContain('ats');
    });

    it('should explain medium priority importance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Nice Skill',
        category: KeywordCategory.SKILLS,
        importance: 'medium',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.why).toContain('important');
      expect(guidance.why).toContain('match score');
    });

    it('should explain low priority importance', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Optional Skill',
        category: KeywordCategory.SKILLS,
        importance: 'low',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.why).toContain('nice-to-have');
      expect(guidance.why.toLowerCase()).toContain('edge');
    });
  });

  describe('complete guidance structure', () => {
    it('should return all required fields', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Test',
        category: KeywordCategory.SKILLS,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance).toHaveProperty('why');
      expect(guidance).toHaveProperty('where');
      expect(guidance).toHaveProperty('example');
      expect(typeof guidance.why).toBe('string');
      expect(typeof guidance.where).toBe('string');
      expect(typeof guidance.example).toBe('string');
    });

    it('should provide non-empty guidance for all fields', () => {
      const keyword: ExtractedKeyword = {
        keyword: 'Test',
        category: KeywordCategory.SKILLS,
        importance: 'high',
      };

      const guidance = getKeywordGuidance(keyword);

      expect(guidance.why.length).toBeGreaterThan(10);
      expect(guidance.where.length).toBeGreaterThan(10);
      expect(guidance.example.length).toBeGreaterThan(10);
    });
  });
});

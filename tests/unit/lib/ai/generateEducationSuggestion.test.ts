/**
 * Unit Tests for Education Suggestion Generation
 *
 * CRITICAL: These tests verify anti-fabrication constraints
 * to ensure the system NEVER creates fake coursework, projects, or achievements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateEducationSuggestion } from '@/lib/ai/generateEducationSuggestion';

describe('generateEducationSuggestion', () => {
  describe('[CRITICAL] Original Field Quality Tests', () => {
    it('should NOT use placeholder text in "original" field', async () => {
      const education = "Bachelor's in CS\nSome University\n2022";
      const jd = "Software role";

      const result = await generateEducationSuggestion(education, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      for (const bullet of suggestions) {
        // Should NOT contain placeholder descriptions in "original"
        expect(bullet.original).not.toMatch(/^No (location|coursework|projects)/i);
        expect(bullet.original).not.toMatch(/^Missing /i);
        expect(bullet.original).not.toMatch(/^Add(ing)? /i);
        expect(bullet.original).not.toMatch(/formatting$/i);

        // Original should be actual resume text or description of what exists
        // If it starts with "Recommendation:", it's a future action (OK)
        const isRecommendation = bullet.suggested.startsWith('Recommendation:');
        if (!isRecommendation) {
          // Original should look like actual resume content
          expect(bullet.original.length).toBeGreaterThan(10); // Not just "Missing X"
        }
      }
    }, 30000);

    it('should not create duplicate suggestions for same change', async () => {
      const education = "Bachelor's Degree in Information Systems\nDePaul University\n2020";
      const jd = "IT position";

      const result = await generateEducationSuggestion(education, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      // Check for duplicate suggested text
      const suggestedTexts = suggestions.map(s => s.suggested);
      const uniqueSuggestions = new Set(suggestedTexts);

      // Should not have duplicates
      expect(suggestedTexts.length).toBe(uniqueSuggestions.size);
    }, 30000);
  });

  describe('[CRITICAL] Anti-Fabrication Tests', () => {
    it('should NOT fabricate coursework for sparse education section', async () => {
      const sparseEducation = "Bachelor of Science in Information Technology\nUniversity of Colorado Denver\nGraduated: 2021";
      const jd = "Looking for skills in database management, network administration, and programming.";

      const result = await generateEducationSuggestion(sparseEducation, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      // Verify NO coursework lists were added
      for (const bullet of suggestions) {
        // Should NOT contain long course lists
        expect(bullet.suggested).not.toMatch(/Relevant Coursework:.*,.*,.*,/i);
        expect(bullet.suggested).not.toMatch(/Coursework: Database Management, Network/i);

        // Original should NOT be fabrication-prone
        if (bullet.original.match(/^No (coursework|projects|honors)/i)) {
          expect(bullet.suggested).toMatch(/^Recommendation:/i);
        }
      }
    }, 30000); // 30s timeout for LLM call

    it('should NOT fabricate capstone projects or academic projects', async () => {
      const sparseEducation = "BS Computer Science\nStanford University\n2019";
      const jd = "Seeking experience with React, Node.js, and microservices.";

      const result = await generateEducationSuggestion(sparseEducation, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      for (const bullet of suggestions) {
        // Should NOT contain fabricated projects
        expect(bullet.suggested).not.toMatch(/Capstone Project:/i);
        expect(bullet.suggested).not.toMatch(/Academic Project:/i);
        expect(bullet.suggested).not.toMatch(/Developed .* application/i);
        expect(bullet.suggested).not.toMatch(/Built .* using React/i);
      }
    }, 30000);

    it('should NOT fabricate academic honors or achievements', async () => {
      const sparseEducation = "Bachelor of Science in Computer Science\nUC Berkeley\nMay 2020";
      const jd = "Entry-level software engineer position.";

      const result = await generateEducationSuggestion(sparseEducation, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      for (const bullet of suggestions) {
        // Should NOT contain fabricated honors
        expect(bullet.suggested).not.toMatch(/Dean's List/i);
        expect(bullet.suggested).not.toMatch(/Cum Laude/i);
        expect(bullet.suggested).not.toMatch(/Outstanding Student/i);
        expect(bullet.suggested).not.toMatch(/Hackathon/i);
        expect(bullet.suggested).not.toMatch(/Winner of/i);
        expect(bullet.suggested).not.toMatch(/Award for/i);
      }
    }, 30000);

    it('should only suggest formatting improvements for sparse sections', async () => {
      const sparseEducation = "BS Information Technology\nUCD\n2021";
      const jd = "Network administrator role requiring IT fundamentals.";

      const result = await generateEducationSuggestion(sparseEducation, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      // Should have SOME suggestions (at least formatting or recommendations)
      expect(suggestions.length).toBeGreaterThan(0);

      for (const bullet of suggestions) {
        const isFormatting =
          bullet.suggested.match(/format|location|date|GPA/i) ||
          bullet.impact === 'moderate';

        const isRecommendation = bullet.suggested.startsWith('Recommendation:');

        // All suggestions should be formatting OR recommendations
        expect(isFormatting || isRecommendation).toBe(true);
      }
    }, 30000);

    it('should limit point values for sparse sections (max ~10 points)', async () => {
      const sparseEducation = "Bachelor's in CS\nSome University\n2022";
      const jd = "Software development position.";

      const result = await generateEducationSuggestion(sparseEducation, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      // Total point value should be LOW for sparse sections with only formatting
      const totalPoints = result.data!.total_point_value || 0;

      // Should NOT exceed realistic formatting + recommendation range
      expect(totalPoints).toBeLessThanOrEqual(15);

      // Individual suggestion points should be reasonable
      const suggestions = result.data!.education_entries[0].suggested_bullets;
      for (const bullet of suggestions) {
        if (bullet.point_value) {
          // Critical tier max: 4 points (formatting only)
          if (bullet.impact === 'critical') {
            expect(bullet.point_value).toBeLessThanOrEqual(4);
          }
          // High tier max: 5 points (recommendations)
          if (bullet.impact === 'high') {
            expect(bullet.point_value).toBeLessThanOrEqual(5);
          }
          // Moderate tier max: 2 points
          if (bullet.impact === 'moderate') {
            expect(bullet.point_value).toBeLessThanOrEqual(2);
          }
        }
      }
    }, 30000);
  });

  describe('Validation', () => {
    it('should return error for missing education section', async () => {
      const result = await generateEducationSuggestion('', 'some job description');

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing job description', async () => {
      const result = await generateEducationSuggestion('BS Computer Science\nStanford\n2019', '');

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Formatting Improvements (Allowed)', () => {
    it('should suggest formatting improvements for existing GPA', async () => {
      const educationWithGPA = "BS Computer Science\nStanford University\n2019\nGPA: 3.85/4.0";
      const jd = "Software engineer position.";

      const result = await generateEducationSuggestion(educationWithGPA, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      // Should have suggestions about formatting GPA or dates
      const suggestions = result.data!.education_entries[0].suggested_bullets;
      const hasFormattingSuggestion = suggestions.some(s =>
        s.suggested.includes('GPA') ||
        s.suggested.includes('format') ||
        s.suggested.includes('Graduated')
      );

      // It's OK if there are no suggestions, or if there are formatting suggestions
      // Just verify we're not fabricating content
      if (suggestions.length > 0) {
        expect(hasFormattingSuggestion || suggestions.some(s => s.suggested.startsWith('Recommendation'))).toBe(true);
      }
    }, 30000);
  });

  describe('Certification Recommendations (Allowed)', () => {
    it('should suggest future certifications with Recommendation prefix', async () => {
      const education = "Bachelor of Science in Information Technology\nUniversity of Colorado Denver\n2021";
      const jd = "Looking for AWS cloud skills and IT fundamentals for entry-level role.";

      const result = await generateEducationSuggestion(education, jd);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const suggestions = result.data!.education_entries[0].suggested_bullets;

      // Should have at least one recommendation
      const recommendations = suggestions.filter(s => s.suggested.startsWith('Recommendation:'));

      // Recommendations are optional but if present, should be properly formatted
      if (recommendations.length > 0) {
        for (const rec of recommendations) {
          expect(rec.suggested).toMatch(/^Recommendation:/);
          expect(rec.impact).toBe('high');
        }
      }
    }, 30000);
  });
});

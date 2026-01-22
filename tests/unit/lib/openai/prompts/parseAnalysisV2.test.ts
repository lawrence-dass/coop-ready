/**
 * Unit Tests for parseAnalysisResponseV2
 * Story 9.1: ATS Scoring Recalibration
 */

import { parseAnalysisResponseV2 } from '@/lib/openai/prompts/parseAnalysisV2';

describe('parseAnalysisResponseV2', () => {
  const validV2Response = {
    overallScore: 75,
    scoreBreakdown: {
      overall: 75,
      categories: {
        keywordAlignment: {
          score: 80,
          weight: 0.25,
          reason: 'Good keyword coverage',
        },
        contentRelevance: {
          score: 78,
          weight: 0.25,
          reason: 'Content aligns well',
        },
        quantificationImpact: {
          score: 65,
          weight: 0.2,
          reason: 'Moderate quantification density: 60%',
          quantificationDensity: 60,
        },
        formatStructure: {
          score: 85,
          weight: 0.15,
          reason: 'Clean formatting',
        },
        skillsCoverage: {
          score: 70,
          weight: 0.15,
          reason: 'Decent skills match',
        },
      },
    },
    justification: 'Strong overall performance.',
    strengths: ['Good keywords', 'Clean format'],
    weaknesses: ['Could improve metrics'],
  };

  describe('Valid V2 JSON Parsing', () => {
    it('should parse valid V2 JSON response', () => {
      const result = parseAnalysisResponseV2(JSON.stringify(validV2Response));

      expect(result.overallScore).toBe(75);
      expect(result.scoreBreakdown).toBeDefined();
      // Overall is recalculated from weighted categories: 80*0.25 + 78*0.25 + 65*0.2 + 85*0.15 + 70*0.15 = 75.75 ≈ 76
      expect((result.scoreBreakdown as any).overall).toBe(76);
      expect((result.scoreBreakdown as any).categories.keywordAlignment.score).toBe(80);
      expect((result.scoreBreakdown as any).categories.quantificationImpact.quantificationDensity).toBe(60);
    });

    it('should handle JSON wrapped in markdown code blocks', () => {
      const wrapped = '```json\n' + JSON.stringify(validV2Response) + '\n```';
      const result = parseAnalysisResponseV2(wrapped);

      expect(result.overallScore).toBe(75);
    });

    it('should trim whitespace from justification', () => {
      const response = {
        ...validV2Response,
        justification: '  Trimmed justification  ',
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.justification).toBe('Trimmed justification');
    });
  });

  describe('Score Clamping', () => {
    it('should clamp overall score above 100 to 100', () => {
      const response = {
        ...validV2Response,
        overallScore: 150,
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.overallScore).toBe(100);
    });

    it('should clamp overall score below 0 to 0', () => {
      const response = {
        ...validV2Response,
        overallScore: -10,
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.overallScore).toBe(0);
    });

    it('should clamp category scores to 0-100 range', () => {
      const response = {
        ...validV2Response,
        scoreBreakdown: {
          ...validV2Response.scoreBreakdown,
          categories: {
            ...validV2Response.scoreBreakdown.categories,
            keywordAlignment: {
              ...validV2Response.scoreBreakdown.categories.keywordAlignment,
              score: 150,
            },
          },
        },
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect((result.scoreBreakdown as any).categories.keywordAlignment.score).toBe(100);
    });
  });

  describe('Array Handling', () => {
    it('should limit strengths to 5 items', () => {
      const response = {
        ...validV2Response,
        strengths: ['1', '2', '3', '4', '5', '6', '7'],
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.strengths).toHaveLength(5);
    });

    it('should limit weaknesses to 5 items', () => {
      const response = {
        ...validV2Response,
        weaknesses: ['1', '2', '3', '4', '5', '6', '7'],
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.weaknesses).toHaveLength(5);
    });

    it('should filter out non-string array elements', () => {
      const response = {
        ...validV2Response,
        strengths: ['valid', 123, null, 'also valid'],
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.strengths).toEqual(['valid', 'also valid']);
    });
  });

  describe('Weight Validation', () => {
    it('should calculate overall score from weighted categories', () => {
      const result = parseAnalysisResponseV2(JSON.stringify(validV2Response));

      // Manual calculation: 80*0.25 + 78*0.25 + 65*0.2 + 85*0.15 + 70*0.15 = 75.75 ≈ 76
      const breakdown = result.scoreBreakdown as any;
      expect(breakdown.overall).toBeGreaterThan(70);
      expect(breakdown.overall).toBeLessThan(80);
    });

    it('should warn but not fail if weights do not sum to 1.0', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const response = {
        ...validV2Response,
        scoreBreakdown: {
          ...validV2Response.scoreBreakdown,
          categories: {
            keywordAlignment: { score: 80, weight: 0.3, reason: 'test' },
            contentRelevance: { score: 80, weight: 0.3, reason: 'test' },
            quantificationImpact: { score: 80, weight: 0.3, reason: 'test', quantificationDensity: 50 },
            formatStructure: { score: 80, weight: 0.3, reason: 'test' },
            skillsCoverage: { score: 80, weight: 0.3, reason: 'test' },
          },
        },
      };

      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Weights do not sum to 1.0')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid JSON', () => {
      expect(() => parseAnalysisResponseV2('not valid json')).toThrow(
        'Failed to parse analysis response'
      );
    });

    it('should throw error for missing overallScore', () => {
      const response = { ...validV2Response };
      delete (response as any).overallScore;

      expect(() => parseAnalysisResponseV2(JSON.stringify(response))).toThrow(
        'Missing or invalid overallScore'
      );
    });

    it('should throw error for missing scoreBreakdown', () => {
      const response = { ...validV2Response };
      delete (response as any).scoreBreakdown;

      expect(() => parseAnalysisResponseV2(JSON.stringify(response))).toThrow(
        'Missing or invalid scoreBreakdown'
      );
    });

    it('should throw error for missing category', () => {
      const response = {
        ...validV2Response,
        scoreBreakdown: {
          overall: 75,
          categories: {
            keywordAlignment: { score: 80, weight: 0.25, reason: 'test' },
            // Missing other categories
          },
        },
      };

      expect(() => parseAnalysisResponseV2(JSON.stringify(response))).toThrow(
        'Missing category'
      );
    });

    it('should throw error for missing justification', () => {
      const response = { ...validV2Response };
      delete (response as any).justification;

      expect(() => parseAnalysisResponseV2(JSON.stringify(response))).toThrow(
        'Missing or invalid justification'
      );
    });

    it('should throw error for non-array strengths', () => {
      const response = {
        ...validV2Response,
        strengths: 'not an array',
      };

      expect(() => parseAnalysisResponseV2(JSON.stringify(response))).toThrow(
        'Missing or invalid strengths array'
      );
    });
  });

  describe('Optional Fields', () => {
    it('should include keywords if present', () => {
      const response = {
        ...validV2Response,
        keywords: {
          keywordsFound: [{ keyword: 'React', frequency: 3 }],
          keywordsMissing: [],
          majorKeywordsCoverage: 80,
        },
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.keywords).toBeDefined();
      expect(result.keywords?.keywordsFound).toHaveLength(1);
    });

    it('should include sectionScores if present', () => {
      const response = {
        ...validV2Response,
        sectionScores: {
          experience: { score: 80, explanation: 'Good', strengths: [], weaknesses: [] },
        },
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.sectionScores).toBeDefined();
      expect(result.sectionScores?.experience?.score).toBe(80);
    });

    it('should include formatIssues if present', () => {
      const response = {
        ...validV2Response,
        formatIssues: [
          { type: 'warning', message: 'Test', detail: 'Detail', source: 'ai-detected' },
        ],
      };
      const result = parseAnalysisResponseV2(JSON.stringify(response));

      expect(result.formatIssues).toBeDefined();
      expect(result.formatIssues).toHaveLength(1);
    });
  });
});

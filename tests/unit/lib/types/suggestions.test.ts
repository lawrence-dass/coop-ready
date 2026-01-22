import {
  isCalibrationSuggestion,
  isLegacySuggestion,
  isValidUrgency,
  isValidSuggestionType,
  isValidResumeSection,
  type BaseSuggestion,
  type CalibrationSuggestion,
  type InferenceSignals,
} from '@/lib/types/suggestions'

describe('Suggestions Types', () => {
  describe('isCalibrationSuggestion', () => {
    it('returns true for calibration suggestion (V2)', () => {
      const suggestion: CalibrationSuggestion = {
        type: 'action_verb',
        section: 'experience',
        originalText: 'Led the team',
        suggestedText: 'Directed the team',
        reasoning: 'Better verb',
        urgency: 'high',
        suggestionMode: 'Transformation',
        inferenceSignals: {
          atsScore: 25,
          experienceLevel: 'student',
          missingKeywordsCount: 5,
          quantificationDensity: 40,
        },
      }

      expect(isCalibrationSuggestion(suggestion)).toBe(true)
    })

    it('returns false for legacy suggestion (V1)', () => {
      const suggestion: BaseSuggestion = {
        type: 'action_verb',
        section: 'experience',
        originalText: 'Led the team',
        suggestedText: 'Directed the team',
        reasoning: 'Better verb',
        urgency: 'high',
      }

      expect(isCalibrationSuggestion(suggestion)).toBe(false)
    })

    it('returns false for suggestions with incomplete calibration metadata', () => {
      const suggestion = {
        type: 'action_verb',
        section: 'experience',
        originalText: 'Led the team',
        suggestedText: 'Directed the team',
        reasoning: 'Better verb',
        urgency: 'high',
        suggestionMode: 'Transformation',
        // missing inferenceSignals
      }

      expect(isCalibrationSuggestion(suggestion as any)).toBe(false)
    })

    it('returns false for suggestions with invalid mode', () => {
      const suggestion = {
        type: 'action_verb',
        section: 'experience',
        originalText: 'Led the team',
        suggestedText: 'Directed the team',
        reasoning: 'Better verb',
        urgency: 'high',
        suggestionMode: 'InvalidMode',
        inferenceSignals: {
          atsScore: 25,
          experienceLevel: 'student',
          missingKeywordsCount: 5,
          quantificationDensity: 40,
        },
      }

      expect(isCalibrationSuggestion(suggestion as any)).toBe(false)
    })
  })

  describe('isLegacySuggestion', () => {
    it('returns true for legacy suggestion (V1)', () => {
      const suggestion: BaseSuggestion = {
        type: 'action_verb',
        section: 'experience',
        originalText: 'Led the team',
        suggestedText: 'Directed the team',
        reasoning: 'Better verb',
        urgency: 'high',
      }

      expect(isLegacySuggestion(suggestion)).toBe(true)
    })

    it('returns false for calibration suggestion (V2)', () => {
      const suggestion: CalibrationSuggestion = {
        type: 'action_verb',
        section: 'experience',
        originalText: 'Led the team',
        suggestedText: 'Directed the team',
        reasoning: 'Better verb',
        urgency: 'high',
        suggestionMode: 'Transformation',
        inferenceSignals: {
          atsScore: 25,
          experienceLevel: 'student',
          missingKeywordsCount: 5,
          quantificationDensity: 40,
        },
      }

      expect(isLegacySuggestion(suggestion)).toBe(false)
    })
  })

  describe('isValidUrgency', () => {
    it('returns true for valid urgencies', () => {
      expect(isValidUrgency('low')).toBe(true)
      expect(isValidUrgency('medium')).toBe(true)
      expect(isValidUrgency('high')).toBe(true)
      expect(isValidUrgency('critical')).toBe(true)
    })

    it('returns false for invalid urgencies', () => {
      expect(isValidUrgency('invalid')).toBe(false)
      expect(isValidUrgency(123)).toBe(false)
      expect(isValidUrgency(null)).toBe(false)
      expect(isValidUrgency(undefined)).toBe(false)
    })
  })

  describe('isValidSuggestionType', () => {
    it('returns true for valid suggestion types', () => {
      expect(isValidSuggestionType('bullet_rewrite')).toBe(true)
      expect(isValidSuggestionType('skill_mapping')).toBe(true)
      expect(isValidSuggestionType('action_verb')).toBe(true)
      expect(isValidSuggestionType('quantification')).toBe(true)
      expect(isValidSuggestionType('skill_expansion')).toBe(true)
      expect(isValidSuggestionType('format')).toBe(true)
      expect(isValidSuggestionType('removal')).toBe(true)
    })

    it('returns false for invalid suggestion types', () => {
      expect(isValidSuggestionType('invalid')).toBe(false)
      expect(isValidSuggestionType(123)).toBe(false)
      expect(isValidSuggestionType(null)).toBe(false)
      expect(isValidSuggestionType(undefined)).toBe(false)
    })
  })

  describe('isValidResumeSection', () => {
    it('returns true for valid resume sections', () => {
      expect(isValidResumeSection('experience')).toBe(true)
      expect(isValidResumeSection('education')).toBe(true)
      expect(isValidResumeSection('projects')).toBe(true)
      expect(isValidResumeSection('skills')).toBe(true)
      expect(isValidResumeSection('format')).toBe(true)
    })

    it('returns false for invalid resume sections', () => {
      expect(isValidResumeSection('invalid')).toBe(false)
      expect(isValidResumeSection('summary')).toBe(false)
      expect(isValidResumeSection(123)).toBe(false)
      expect(isValidResumeSection(null)).toBe(false)
      expect(isValidResumeSection(undefined)).toBe(false)
    })
  })

  describe('CalibrationSuggestion structure', () => {
    it('can be created with all required fields', () => {
      const signals: InferenceSignals = {
        atsScore: 60,
        experienceLevel: 'career_changer',
        missingKeywordsCount: 3,
        quantificationDensity: 55,
      }

      const suggestion: CalibrationSuggestion = {
        type: 'skill_mapping',
        section: 'experience',
        originalText: 'Worked with databases',
        suggestedText: 'Designed and managed SQL databases',
        reasoning: 'More specific technology mapping',
        urgency: 'medium',
        suggestionMode: 'Improvement',
        inferenceSignals: signals,
      }

      expect(suggestion.suggestionMode).toBe('Improvement')
      expect(suggestion.inferenceSignals.atsScore).toBe(60)
      expect(suggestion.inferenceSignals.experienceLevel).toBe('career_changer')
    })

    it('handles null suggestedText for removal suggestions', () => {
      const suggestion: CalibrationSuggestion = {
        type: 'removal',
        section: 'format',
        originalText: 'Phone number: (555) 123-4567',
        suggestedText: null,
        reasoning: 'Personal contact info not needed on resume',
        urgency: 'high',
        suggestionMode: 'Transformation',
        inferenceSignals: {
          atsScore: 30,
          experienceLevel: 'student',
          missingKeywordsCount: 4,
          quantificationDensity: 35,
        },
      }

      expect(suggestion.suggestedText).toBeNull()
      expect(suggestion.type).toBe('removal')
    })
  })
})

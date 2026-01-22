import {
  getSuggestionMode,
  getTargetSuggestionCount,
  getFocusAreasByExperience,
  getKeywordUrgencyBoost,
  getQuantificationUrgencyBoost,
  calibrateSuggestions,
  getSuggestionModeDescription,
  getFocusAreasDescription,
  validateCalibrationSignals,
  type CalibrationSignals,
} from '@/lib/utils/suggestionCalibrator'

describe('SuggestionCalibrator', () => {
  describe('getSuggestionMode', () => {
    it('returns Transformation for ATS 0-30', () => {
      expect(getSuggestionMode(0)).toBe('Transformation')
      expect(getSuggestionMode(15)).toBe('Transformation')
      expect(getSuggestionMode(29)).toBe('Transformation')
    })

    it('returns Improvement for ATS 30-50', () => {
      expect(getSuggestionMode(30)).toBe('Improvement')
      expect(getSuggestionMode(40)).toBe('Improvement')
      expect(getSuggestionMode(49)).toBe('Improvement')
    })

    it('returns Optimization for ATS 50-70', () => {
      expect(getSuggestionMode(50)).toBe('Optimization')
      expect(getSuggestionMode(60)).toBe('Optimization')
      expect(getSuggestionMode(69)).toBe('Optimization')
    })

    it('returns Validation for ATS 70+', () => {
      expect(getSuggestionMode(70)).toBe('Validation')
      expect(getSuggestionMode(80)).toBe('Validation')
      expect(getSuggestionMode(100)).toBe('Validation')
    })
  })

  describe('getTargetSuggestionCount', () => {
    it('returns 8-12 for Transformation', () => {
      const range = getTargetSuggestionCount('Transformation')
      expect(range.min).toBe(8)
      expect(range.max).toBe(12)
    })

    it('returns 5-8 for Improvement', () => {
      const range = getTargetSuggestionCount('Improvement')
      expect(range.min).toBe(5)
      expect(range.max).toBe(8)
    })

    it('returns 3-5 for Optimization', () => {
      const range = getTargetSuggestionCount('Optimization')
      expect(range.min).toBe(3)
      expect(range.max).toBe(5)
    })

    it('returns 1-2 for Validation', () => {
      const range = getTargetSuggestionCount('Validation')
      expect(range.min).toBe(1)
      expect(range.max).toBe(2)
    })
  })

  describe('getFocusAreasByExperience', () => {
    it('returns student-focused areas for student level', () => {
      const areas = getFocusAreasByExperience('student')
      expect(areas).toContain('quantification_projects')
      expect(areas).toContain('academic_framing')
      expect(areas).toContain('gpa_guidance')
      expect(areas).toContain('skill_expansion')
    })

    it('returns career_changer-focused areas for career_changer level', () => {
      const areas = getFocusAreasByExperience('career_changer')
      expect(areas).toContain('skill_mapping')
      expect(areas).toContain('transferable_language')
      expect(areas).toContain('bridge_statements')
      expect(areas).toContain('section_reordering')
    })

    it('returns experienced-focused areas for experienced level', () => {
      const areas = getFocusAreasByExperience('experienced')
      expect(areas).toContain('leadership_language')
      expect(areas).toContain('scope_amplification')
      expect(areas).toContain('metric_enhancement')
      expect(areas).toContain('format_polish')
    })
  })

  describe('getKeywordUrgencyBoost', () => {
    it('returns +2 for 5+ missing keywords', () => {
      expect(getKeywordUrgencyBoost(5)).toBe(2)
      expect(getKeywordUrgencyBoost(10)).toBe(2)
    })

    it('returns +1 for 2-4 missing keywords', () => {
      expect(getKeywordUrgencyBoost(2)).toBe(1)
      expect(getKeywordUrgencyBoost(3)).toBe(1)
      expect(getKeywordUrgencyBoost(4)).toBe(1)
    })

    it('returns 0 for 0-1 missing keywords', () => {
      expect(getKeywordUrgencyBoost(0)).toBe(0)
      expect(getKeywordUrgencyBoost(1)).toBe(0)
    })
  })

  describe('getQuantificationUrgencyBoost', () => {
    it('returns +2 for density < 30%', () => {
      expect(getQuantificationUrgencyBoost(0)).toBe(2)
      expect(getQuantificationUrgencyBoost(29)).toBe(2)
    })

    it('returns +1 for density 30-50%', () => {
      expect(getQuantificationUrgencyBoost(30)).toBe(1)
      expect(getQuantificationUrgencyBoost(40)).toBe(1)
      expect(getQuantificationUrgencyBoost(50)).toBe(0)
    })

    it('returns 0 for density 50-80%', () => {
      expect(getQuantificationUrgencyBoost(50)).toBe(0)
      expect(getQuantificationUrgencyBoost(65)).toBe(0)
      expect(getQuantificationUrgencyBoost(79)).toBe(0)
    })

    it('returns -1 for density 80%+', () => {
      expect(getQuantificationUrgencyBoost(80)).toBe(-1)
      expect(getQuantificationUrgencyBoost(100)).toBe(-1)
    })
  })

  describe('calibrateSuggestions', () => {
    it('creates Transformation calibration for low ATS student', () => {
      const signals: CalibrationSignals = {
        atsScore: 25,
        experienceLevel: 'student',
        missingKeywordsCount: 6,
        quantificationDensity: 20,
        totalBullets: 10,
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Transformation')
      expect(result.suggestionsTargetCount).toBe(10) // avg of 8-12
      expect(result.priorityBoosts.keyword).toBe(2) // 6 keywords
      expect(result.priorityBoosts.quantification).toBe(2) // 20% density
      expect(result.priorityBoosts.experience).toBe(1) // Transformation mode
      expect(result.focusAreas).toContain('quantification_projects')
      expect(result.focusAreas).toContain('academic_framing')
    })

    it('creates Improvement calibration for fair ATS career changer', () => {
      const signals: CalibrationSignals = {
        atsScore: 40,
        experienceLevel: 'career_changer',
        missingKeywordsCount: 3,
        quantificationDensity: 45,
        totalBullets: 12,
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Improvement')
      expect(result.suggestionsTargetCount).toBe(6) // avg of 5-8
      expect(result.priorityBoosts.keyword).toBe(1) // 3 keywords
      expect(result.priorityBoosts.quantification).toBe(1) // 45% density
      expect(result.priorityBoosts.experience).toBe(0) // Improvement mode
      expect(result.focusAreas).toContain('skill_mapping')
      expect(result.focusAreas).toContain('transferable_language')
    })

    it('creates Optimization calibration for good ATS experienced', () => {
      const signals: CalibrationSignals = {
        atsScore: 60,
        experienceLevel: 'experienced',
        missingKeywordsCount: 1,
        quantificationDensity: 70,
        totalBullets: 15,
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Optimization')
      expect(result.suggestionsTargetCount).toBe(4) // avg of 3-5
      expect(result.priorityBoosts.keyword).toBe(0) // 1 keyword
      expect(result.priorityBoosts.quantification).toBe(0) // 70% density
      expect(result.priorityBoosts.experience).toBe(-1) // Optimization mode
      expect(result.focusAreas).toContain('leadership_language')
      expect(result.focusAreas).toContain('metric_enhancement')
    })

    it('creates Validation calibration for excellent ATS', () => {
      const signals: CalibrationSignals = {
        atsScore: 85,
        experienceLevel: 'experienced',
        missingKeywordsCount: 0,
        quantificationDensity: 90,
        totalBullets: 12,
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Validation')
      expect(result.suggestionsTargetCount).toBe(1) // avg of 1-2
      expect(result.priorityBoosts.keyword).toBe(0) // 0 keywords
      expect(result.priorityBoosts.quantification).toBe(-1) // 90% density
      expect(result.priorityBoosts.experience).toBe(-1) // Validation mode
    })

    it('includes reasoning in result', () => {
      const signals: CalibrationSignals = {
        atsScore: 35,
        experienceLevel: 'student',
        missingKeywordsCount: 4,
        quantificationDensity: 40,
        totalBullets: 10,
      }

      const result = calibrateSuggestions(signals)

      expect(result.reasoning).toContain('Improvement mode')
      expect(result.reasoning).toContain('4 missing keywords')
      expect(result.reasoning).toContain('40% quantification')
    })
  })

  describe('getSuggestionModeDescription', () => {
    it('returns appropriate description for Transformation', () => {
      const desc = getSuggestionModeDescription('Transformation')
      expect(desc).toContain('significant')
    })

    it('returns appropriate description for Improvement', () => {
      const desc = getSuggestionModeDescription('Improvement')
      expect(desc).toContain('solid')
    })

    it('returns appropriate description for Optimization', () => {
      const desc = getSuggestionModeDescription('Optimization')
      expect(desc).toContain('strong')
    })

    it('returns appropriate description for Validation', () => {
      const desc = getSuggestionModeDescription('Validation')
      expect(desc).toContain('excellent')
    })
  })

  describe('getFocusAreasDescription', () => {
    it('converts focus areas to human-readable format', () => {
      const desc = getFocusAreasDescription([
        'quantification_projects',
        'academic_framing',
        'skill_mapping',
      ])

      expect(desc).toContain('Adding metrics')
      expect(desc).toContain('Framing academic')
      expect(desc).toContain('Mapping skills')
    })

    it('handles empty focus areas', () => {
      const desc = getFocusAreasDescription([])
      expect(desc).toBe('')
    })
  })

  describe('validateCalibrationSignals', () => {
    it('returns empty array for valid signals', () => {
      const signals: CalibrationSignals = {
        atsScore: 50,
        experienceLevel: 'student',
        missingKeywordsCount: 3,
        quantificationDensity: 60,
        totalBullets: 10,
      }

      const errors = validateCalibrationSignals(signals)
      expect(errors).toHaveLength(0)
    })

    it('validates ATS score range', () => {
      const signals: CalibrationSignals = {
        atsScore: 150,
        experienceLevel: 'student',
        missingKeywordsCount: 3,
        quantificationDensity: 60,
        totalBullets: 10,
      }

      const errors = validateCalibrationSignals(signals)
      expect(errors).toContain('ATS score must be between 0-100')
    })

    it('validates experience level', () => {
      const signals = {
        atsScore: 50,
        experienceLevel: 'invalid' as any,
        missingKeywordsCount: 3,
        quantificationDensity: 60,
        totalBullets: 10,
      }

      const errors = validateCalibrationSignals(signals)
      expect(errors.some((e) => e.includes('Invalid experience level'))).toBe(true)
    })

    it('validates missing keywords count', () => {
      const signals: CalibrationSignals = {
        atsScore: 50,
        experienceLevel: 'student',
        missingKeywordsCount: -5,
        quantificationDensity: 60,
        totalBullets: 10,
      }

      const errors = validateCalibrationSignals(signals)
      expect(errors).toContain('Missing keywords count cannot be negative')
    })

    it('validates quantification density range', () => {
      const signals: CalibrationSignals = {
        atsScore: 50,
        experienceLevel: 'student',
        missingKeywordsCount: 3,
        quantificationDensity: 150,
        totalBullets: 10,
      }

      const errors = validateCalibrationSignals(signals)
      expect(errors).toContain('Quantification density must be between 0-100')
    })

    it('validates total bullets', () => {
      const signals: CalibrationSignals = {
        atsScore: 50,
        experienceLevel: 'student',
        missingKeywordsCount: 3,
        quantificationDensity: 60,
        totalBullets: 0,
      }

      const errors = validateCalibrationSignals(signals)
      expect(errors).toContain('Total bullets must be greater than 0')
    })
  })
})

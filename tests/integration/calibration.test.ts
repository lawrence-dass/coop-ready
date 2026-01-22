/**
 * Integration Tests for Suggestion Calibration
 *
 * Tests the complete calibration flow from signal extraction
 * through suggestion generation to metadata application.
 *
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

import {
  calibrateSuggestions,
  getSuggestionMode,
  getTargetSuggestionCount,
  getFocusAreasByExperience,
  getKeywordUrgencyBoost,
  getQuantificationUrgencyBoost,
  type CalibrationSignals,
  type SuggestionMode
} from '@/lib/utils/suggestionCalibrator'

describe('Calibration Integration Tests', () => {
  describe('Mode-Based Calibration (Task 6.1-6.4)', () => {
    it('Task 6.1: should calibrate for Transformation mode (ATS 0-30)', () => {
      const signals: CalibrationSignals = {
        atsScore: 25,
        experienceLevel: 'student',
        missingKeywordsCount: 8,
        quantificationDensity: 20,
        totalBullets: 10
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Transformation')
      expect(result.suggestionsTargetCount).toBeGreaterThanOrEqual(8)
      expect(result.suggestionsTargetCount).toBeLessThanOrEqual(12)
      expect(result.priorityBoosts.keyword).toBe(2) // 8 missing = high priority
      expect(result.priorityBoosts.quantification).toBe(2) // 20% = critical
      expect(result.reasoning).toContain('Transformation')
    })

    it('Task 6.2: should calibrate for Improvement mode (ATS 30-50)', () => {
      const signals: CalibrationSignals = {
        atsScore: 40,
        experienceLevel: 'career_changer',
        missingKeywordsCount: 4,
        quantificationDensity: 40,
        totalBullets: 12
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Improvement')
      expect(result.suggestionsTargetCount).toBeGreaterThanOrEqual(5)
      expect(result.suggestionsTargetCount).toBeLessThanOrEqual(8)
      expect(result.priorityBoosts.keyword).toBe(1) // 4 missing = medium priority
      expect(result.priorityBoosts.quantification).toBe(1) // 40% = high
    })

    it('Task 6.3: should calibrate for Optimization mode (ATS 50-70)', () => {
      const signals: CalibrationSignals = {
        atsScore: 60,
        experienceLevel: 'experienced',
        missingKeywordsCount: 2,
        quantificationDensity: 60,
        totalBullets: 15
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Optimization')
      expect(result.suggestionsTargetCount).toBeGreaterThanOrEqual(3)
      expect(result.suggestionsTargetCount).toBeLessThanOrEqual(5)
      expect(result.priorityBoosts.keyword).toBe(1) // 2 missing = medium
      expect(result.priorityBoosts.quantification).toBe(0) // 60% = balanced
    })

    it('Task 6.4: should calibrate for Validation mode (ATS 70+)', () => {
      const signals: CalibrationSignals = {
        atsScore: 85,
        experienceLevel: 'experienced',
        missingKeywordsCount: 0,
        quantificationDensity: 85,
        totalBullets: 15
      }

      const result = calibrateSuggestions(signals)

      expect(result.mode).toBe('Validation')
      expect(result.suggestionsTargetCount).toBeGreaterThanOrEqual(1)
      expect(result.suggestionsTargetCount).toBeLessThanOrEqual(2)
      expect(result.priorityBoosts.keyword).toBe(0) // 0 missing = no priority
      expect(result.priorityBoosts.quantification).toBe(-1) // 85% = depriorize
    })
  })

  describe('Experience-Level Focus Areas (Task 6.5-6.6)', () => {
    it('Task 6.5: should provide student focus areas', () => {
      const focusAreas = getFocusAreasByExperience('student')

      expect(focusAreas).toContain('quantification_projects')
      expect(focusAreas).toContain('academic_framing')
      expect(focusAreas).toContain('gpa_guidance')
      expect(focusAreas).toContain('skill_expansion')
      expect(focusAreas.length).toBe(4)
    })

    it('Task 6.6: should provide career changer focus areas', () => {
      const focusAreas = getFocusAreasByExperience('career_changer')

      expect(focusAreas).toContain('skill_mapping')
      expect(focusAreas).toContain('transferable_language')
      expect(focusAreas).toContain('bridge_statements')
      expect(focusAreas).toContain('section_reordering')
      expect(focusAreas.length).toBe(4)
    })

    it('should provide experienced professional focus areas', () => {
      const focusAreas = getFocusAreasByExperience('experienced')

      expect(focusAreas).toContain('leadership_language')
      expect(focusAreas).toContain('scope_amplification')
      expect(focusAreas).toContain('metric_enhancement')
      expect(focusAreas).toContain('format_polish')
      expect(focusAreas.length).toBe(4)
    })
  })

  describe('Keyword Gap Impact (Task 6.7)', () => {
    it('Task 6.7: should boost priority with 5+ missing keywords', () => {
      const boost = getKeywordUrgencyBoost(7)
      expect(boost).toBe(2) // Critical priority
    })

    it('Task 6.7: should boost priority with 2-4 missing keywords', () => {
      const boost = getKeywordUrgencyBoost(3)
      expect(boost).toBe(1) // High priority
    })

    it('Task 6.7: should shift focus with 0-1 missing keywords', () => {
      const boost0 = getKeywordUrgencyBoost(0)
      const boost1 = getKeywordUrgencyBoost(1)

      expect(boost0).toBe(0) // No priority boost
      expect(boost1).toBe(0) // Focus shifts to other areas
    })
  })

  describe('Quantification Density Impact (Task 6.8)', () => {
    it('Task 6.8: should boost priority when density < 30%', () => {
      const boost = getQuantificationUrgencyBoost(20)
      expect(boost).toBe(2) // Critical
    })

    it('Task 6.8: should boost priority when density 30-50%', () => {
      const boost = getQuantificationUrgencyBoost(40)
      expect(boost).toBe(1) // High
    })

    it('Task 6.8: should maintain normal priority when density 50-80%', () => {
      const boost = getQuantificationUrgencyBoost(65)
      expect(boost).toBe(0) // Balanced
    })

    it('Task 6.8: should reduce priority when density > 80%', () => {
      const boost = getQuantificationUrgencyBoost(85)
      expect(boost).toBe(-1) // Already strong, deprioritize
    })
  })

  describe('End-to-End Calibration Flow (Task 6.9)', () => {
    it('Task 6.9: should produce complete calibration from signals', () => {
      // Simulate complete flow: ATS analysis → calibration → mode selection
      const signals: CalibrationSignals = {
        atsScore: 35, // Improvement mode
        experienceLevel: 'student',
        missingKeywordsCount: 5, // High keyword priority
        quantificationDensity: 25, // Critical quantification priority
        totalBullets: 10
      }

      const calibration = calibrateSuggestions(signals)

      // Verify complete calibration result
      expect(calibration.mode).toBe('Improvement')
      expect(calibration.suggestionsTargetCount).toBeGreaterThan(0)
      expect(calibration.focusAreas.length).toBeGreaterThan(0)
      expect(calibration.priorityBoosts.keyword).toBeGreaterThanOrEqual(0)
      expect(calibration.priorityBoosts.quantification).toBeGreaterThanOrEqual(0)
      expect(calibration.reasoning).toBeTruthy()
      expect(calibration.reasoning).toContain('ATS Score')
      expect(calibration.reasoning).toContain('missing keywords')
      expect(calibration.reasoning).toContain('quantification')
    })

    it('Task 6.9: should handle edge case - high ATS with low keywords', () => {
      // User has high score but missing keywords
      const signals: CalibrationSignals = {
        atsScore: 82, // Validation mode
        experienceLevel: 'experienced',
        missingKeywordsCount: 6, // But missing keywords!
        quantificationDensity: 75,
        totalBullets: 15
      }

      const calibration = calibrateSuggestions(signals)

      expect(calibration.mode).toBe('Validation') // Mode based on ATS
      expect(calibration.priorityBoosts.keyword).toBe(2) // But keyword boost is high
      // This creates targeted suggestions for keywords even in Validation mode
    })

    it('Task 6.9: should handle edge case - low ATS with good keywords', () => {
      // User has low score but good keyword coverage
      const signals: CalibrationSignals = {
        atsScore: 18, // Transformation mode
        experienceLevel: 'student',
        missingKeywordsCount: 1, // But keywords are good!
        quantificationDensity: 10, // Quantification is poor
        totalBullets: 8
      }

      const calibration = calibrateSuggestions(signals)

      expect(calibration.mode).toBe('Transformation') // Mode based on ATS
      expect(calibration.priorityBoosts.keyword).toBe(0) // Keyword boost is low
      expect(calibration.priorityBoosts.quantification).toBe(2) // Quantification boost is high
      // This shifts focus from keywords to quantification
    })
  })

  describe('Mode Boundaries', () => {
    it('should handle exact boundary at 30 (Transformation → Improvement)', () => {
      const mode29 = getSuggestionMode(29)
      const mode30 = getSuggestionMode(30)
      const mode31 = getSuggestionMode(31)

      expect(mode29).toBe('Transformation')
      expect(mode30).toBe('Improvement')
      expect(mode31).toBe('Improvement')
    })

    it('should handle exact boundary at 50 (Improvement → Optimization)', () => {
      const mode49 = getSuggestionMode(49)
      const mode50 = getSuggestionMode(50)
      const mode51 = getSuggestionMode(51)

      expect(mode49).toBe('Improvement')
      expect(mode50).toBe('Optimization')
      expect(mode51).toBe('Optimization')
    })

    it('should handle exact boundary at 70 (Optimization → Validation)', () => {
      const mode69 = getSuggestionMode(69)
      const mode70 = getSuggestionMode(70)
      const mode71 = getSuggestionMode(71)

      expect(mode69).toBe('Optimization')
      expect(mode70).toBe('Validation')
      expect(mode71).toBe('Validation')
    })
  })

  describe('Suggestion Target Counts', () => {
    it('should provide correct ranges for each mode', () => {
      const transformation = getTargetSuggestionCount('Transformation')
      const improvement = getTargetSuggestionCount('Improvement')
      const optimization = getTargetSuggestionCount('Optimization')
      const validation = getTargetSuggestionCount('Validation')

      expect(transformation).toEqual({ min: 8, max: 12 })
      expect(improvement).toEqual({ min: 5, max: 8 })
      expect(optimization).toEqual({ min: 3, max: 5 })
      expect(validation).toEqual({ min: 1, max: 2 })
    })

    it('should calculate average target count correctly', () => {
      const signals: CalibrationSignals = {
        atsScore: 60,
        experienceLevel: 'experienced',
        missingKeywordsCount: 2,
        quantificationDensity: 60,
        totalBullets: 15
      }

      const result = calibrateSuggestions(signals)
      // Optimization mode has range 3-5, average = 4
      expect(result.suggestionsTargetCount).toBe(4)
    })
  })

  describe('Calibration Metadata Structure (Task 6.10)', () => {
    it('Task 6.10: should produce metadata suitable for suggestion enrichment', () => {
      const signals: CalibrationSignals = {
        atsScore: 45,
        experienceLevel: 'career_changer',
        missingKeywordsCount: 3,
        quantificationDensity: 50,
        totalBullets: 12
      }

      const calibration = calibrateSuggestions(signals)

      // Verify structure matches what's needed for suggestion metadata
      expect(calibration).toHaveProperty('mode')
      expect(calibration).toHaveProperty('suggestionsTargetCount')
      expect(calibration).toHaveProperty('priorityBoosts')
      expect(calibration).toHaveProperty('focusAreas')
      expect(calibration).toHaveProperty('reasoning')

      // Verify types are correct
      expect(typeof calibration.mode).toBe('string')
      expect(typeof calibration.suggestionsTargetCount).toBe('number')
      expect(typeof calibration.priorityBoosts.keyword).toBe('number')
      expect(typeof calibration.priorityBoosts.quantification).toBe('number')
      expect(typeof calibration.priorityBoosts.experience).toBe('number')
      expect(Array.isArray(calibration.focusAreas)).toBe(true)
      expect(typeof calibration.reasoning).toBe('string')
    })

    it('Task 6.10: should create consistent inference signals', () => {
      const signals: CalibrationSignals = {
        atsScore: 45,
        experienceLevel: 'career_changer',
        missingKeywordsCount: 3,
        quantificationDensity: 50,
        totalBullets: 12
      }

      // InferenceSignals should match subset of CalibrationSignals
      const inferenceSignals = {
        atsScore: signals.atsScore,
        experienceLevel: signals.experienceLevel,
        missingKeywordsCount: signals.missingKeywordsCount,
        quantificationDensity: signals.quantificationDensity
      }

      expect(inferenceSignals.atsScore).toBe(45)
      expect(inferenceSignals.experienceLevel).toBe('career_changer')
      expect(inferenceSignals.missingKeywordsCount).toBe(3)
      expect(inferenceSignals.quantificationDensity).toBe(50)
    })
  })

  describe('Zero and Extreme Values', () => {
    it('should handle ATS score = 0', () => {
      const mode = getSuggestionMode(0)
      expect(mode).toBe('Transformation')
    })

    it('should handle ATS score = 100', () => {
      const mode = getSuggestionMode(100)
      expect(mode).toBe('Validation')
    })

    it('should handle zero missing keywords', () => {
      const boost = getKeywordUrgencyBoost(0)
      expect(boost).toBe(0)
    })

    it('should handle zero quantification density', () => {
      const boost = getQuantificationUrgencyBoost(0)
      expect(boost).toBe(2) // Critical - no metrics at all
    })

    it('should handle 100% quantification density', () => {
      const boost = getQuantificationUrgencyBoost(100)
      expect(boost).toBe(-1) // Deprioritize - already perfect
    })

    it('should handle minimal bullets (1 bullet)', () => {
      const signals: CalibrationSignals = {
        atsScore: 50,
        experienceLevel: 'student',
        missingKeywordsCount: 0,
        quantificationDensity: 0,
        totalBullets: 1
      }

      const result = calibrateSuggestions(signals)
      expect(result.mode).toBe('Optimization')
      expect(result.suggestionsTargetCount).toBeGreaterThan(0)
    })
  })
})

/**
 * Tests for Quantification Density Analyzer
 *
 * @see Story 9.1: ATS Scoring Recalibration (dependency)
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

import { calculateQuantificationDensity } from '@/lib/utils/quantificationAnalyzer'

describe('Quantification Density Analyzer', () => {
  describe('calculateQuantificationDensity', () => {
    it('should return 100% for resume with all quantified bullets', () => {
      const resumeText = `
        • Increased sales by 25% through strategic campaigns
        • Managed team of 10 developers across 3 projects
        • Reduced costs by $50K annually
        • Improved performance by 3x
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should return 0% for resume with no quantification', () => {
      const resumeText = `
        • Led development team
        • Implemented new features
        • Collaborated with stakeholders
        • Improved system architecture
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(0)
    })

    it('should calculate partial quantification correctly', () => {
      const resumeText = `
        • Increased sales by 25%
        • Led development team
        • Managed 10 developers
        • Collaborated with stakeholders
      `
      // 2 out of 4 bullets have quantification = 50%
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(50)
    })

    it('should detect percentages', () => {
      const resumeText = `
        • Improved efficiency by 30%
        • Increased retention by 15.5%
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should detect currency amounts', () => {
      const resumeText = `
        • Reduced costs by $50K
        • Generated $1.2M in revenue
        • Saved $500 per transaction
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should detect user/customer counts', () => {
      const resumeText = `
        • Served 10,000 users daily
        • Managed 50 clients
        • Supported 100 customers
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should detect time metrics', () => {
      const resumeText = `
        • Completed project in 3 weeks
        • Reduced processing time by 5 hours
        • Maintained 99.9% uptime for 2 years
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should detect multipliers (2x, 3x, etc)', () => {
      const resumeText = `
        • Increased performance by 3x
        • Improved speed by 10x
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should detect large number formats (million, thousand)', () => {
      const resumeText = `
        • Processed 2 million transactions
        • Managed 50 thousand records
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should detect general numbers', () => {
      const resumeText = `
        • Led team of 5 engineers
        • Implemented 20 new features
      `
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should return 0 for empty string', () => {
      const density = calculateQuantificationDensity('')
      expect(density).toBe(0)
    })

    it('should return 0 for whitespace only', () => {
      const density = calculateQuantificationDensity('   \n  \n  ')
      expect(density).toBe(0)
    })

    it('should handle mixed bullet point formats', () => {
      const resumeText = `
        • Increased sales by 25%
        ● Led 10 developers
        ○ Collaborated with stakeholders
        ― Reduced costs by $50K
      `
      // 3 out of 4 bullets have quantification = 75%
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(75)
    })

    it('should ignore very short lines', () => {
      const resumeText = `
        • Increased sales by 25%
        •
        • Very short
        • Led development team with 10 engineers
      `
      // Only 2 valid bullets (short ones ignored), both quantified = 100%
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(100)
    })

    it('should round to nearest integer', () => {
      const resumeText = `
        • Increased sales by 25%
        • Led development team across multiple projects
        • Managed 10 developers
      `
      // 2 out of 3 = 66.666...% rounds to 67%
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBe(67)
    })

    it('should handle real-world resume text', () => {
      const resumeText = `
        • Architected and deployed microservices platform serving 1M+ users
        • Led team of 8 engineers across 3 product areas
        • Reduced API response time by 60% through optimization
        • Implemented CI/CD pipeline, increasing deployment frequency by 5x
        • Mentored 5 junior developers and conducted code reviews
        • Collaborated with product managers on feature prioritization
      `
      // Should detect reasonable quantification in real-world text
      const density = calculateQuantificationDensity(resumeText)
      expect(density).toBeGreaterThanOrEqual(50) // At least half quantified
      expect(density).toBeLessThanOrEqual(100)
    })
  })
})

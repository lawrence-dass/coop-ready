/**
 * PDFDocument Component
 * Main PDF wrapper that orchestrates all resume sections
 * Story 6.2: PDF Resume Generation
 */

import React from 'react'
import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import type { ParsedResume } from '@/lib/parsers/types'
import { PDFHeader } from './PDFHeader'
import { PDFSection } from './PDFSection'
import { PDFExperienceEntry } from './PDFExperienceEntry'
import { PDFEducationEntry } from './PDFEducationEntry'
import { PDFSkillsList } from './PDFSkillsList'

/**
 * Style options passed from PDF generator
 */
export interface PDFStyleOptions {
  fontSize: {
    body: number
    header: number
    title: number
  }
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  lineSpacing: 1.15 | 1.5
}

/**
 * Default style options (used when styleOptions not provided)
 */
const defaultStyleOptions: PDFStyleOptions = {
  fontSize: { body: 11, header: 12, title: 16 },
  margins: { top: 0.75, right: 0.75, bottom: 0.5, left: 0.75 },
  lineSpacing: 1.15,
}

interface PDFDocumentProps {
  resume: ParsedResume
  styleOptions?: PDFStyleOptions
}

export function PDFDocument({ resume, styleOptions }: PDFDocumentProps): React.ReactElement {
  const opts = styleOptions ?? defaultStyleOptions

  // Create dynamic styles based on options
  const styles = StyleSheet.create({
    page: {
      padding: `${opts.margins.top}in ${opts.margins.right}in ${opts.margins.bottom}in ${opts.margins.left}in`,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: opts.fontSize.body,
      lineHeight: opts.lineSpacing,
    },
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with contact information */}
        <PDFHeader resume={resume} />

        {/* Professional Summary */}
        {resume.summary && (
          <PDFSection title="PROFESSIONAL SUMMARY">
            {resume.summary}
          </PDFSection>
        )}

        {/* Experience Section */}
        {resume.experience && resume.experience.length > 0 && (
          <PDFSection title="EXPERIENCE">
            {resume.experience.map((entry, index) => (
              <PDFExperienceEntry key={index} entry={entry} isLast={index === resume.experience.length - 1} />
            ))}
          </PDFSection>
        )}

        {/* Education Section */}
        {resume.education && resume.education.length > 0 && (
          <PDFSection title="EDUCATION">
            {resume.education.map((entry, index) => (
              <PDFEducationEntry key={index} entry={entry} isLast={index === resume.education.length - 1} />
            ))}
          </PDFSection>
        )}

        {/* Skills Section */}
        {resume.skills && resume.skills.length > 0 && (
          <PDFSection title="SKILLS">
            <PDFSkillsList skills={resume.skills} />
          </PDFSection>
        )}

        {/* Projects Section */}
        {resume.projects && (
          <PDFSection title="PROJECTS">
            {resume.projects}
          </PDFSection>
        )}

        {/* Other Section */}
        {resume.other && (
          <PDFSection title="ADDITIONAL INFORMATION">
            {resume.other}
          </PDFSection>
        )}
      </Page>
    </Document>
  )
}

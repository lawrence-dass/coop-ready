/**
 * DOCX Document Structure Helpers
 * Story 6.3: DOCX Resume Generation
 */

import {
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  convertInchesToTwip,
} from 'docx'
import type { JobEntry, EducationEntry, Skill } from '@/lib/parsers/types'

/**
 * Style configuration for DOCX generation
 */
export interface DOCXStyleConfig {
  fontName: string
  fontSize: number
  bodyLineSpacing: number
}

/**
 * Create heading paragraph with specified level
 */
export function createHeadingParagraph(
  text: string,
  level: 1 | 2,
  styles?: DOCXStyleConfig
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: styles?.fontName,
        size: styles ? (level === 1 ? styles.fontSize * 2 + 8 : styles.fontSize * 2 + 2) : undefined,
      }),
    ],
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: {
      after: level === 1 ? 120 : 200,
    },
  })
}

/**
 * Create normal paragraph with optional indent
 */
export function createNormalParagraph(
  text: string,
  indent?: number,
  styles?: DOCXStyleConfig
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: styles?.fontName,
        size: styles ? styles.fontSize * 2 : undefined,
      }),
    ],
    spacing: {
      after: 120,
      line: styles ? Math.round(styles.bodyLineSpacing * 240) : undefined,
    },
    indent: indent
      ? {
          left: convertInchesToTwip(indent),
        }
      : undefined,
  })
}

/**
 * Create bullet paragraph with native Word bullet formatting
 */
export function createBulletParagraph(
  text: string,
  indent?: number,
  styles?: DOCXStyleConfig
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: styles?.fontName,
        size: styles ? styles.fontSize * 2 : undefined,
      }),
    ],
    bullet: {
      level: indent || 0,
    },
    spacing: {
      after: 80,
      line: styles ? Math.round(styles.bodyLineSpacing * 240) : undefined,
    },
  })
}

/**
 * Build contact section
 * Format: Name (Heading 1), then contact details (normal)
 */
export function buildContactSection(contact: string, styles?: DOCXStyleConfig): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const lines = contact.split('\n').map((l) => l.trim()).filter(Boolean)

  if (lines.length === 0) {
    return paragraphs
  }

  // First line is the name (Heading 1)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: lines[0],
          font: styles?.fontName,
          size: styles ? styles.fontSize * 2 + 8 : undefined, // Heading is larger
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 120,
      },
    })
  )

  // Remaining lines are contact details (centered, normal)
  if (lines.length > 1) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: lines.slice(1).join(' | '),
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 240,
        },
      })
    )
  }

  return paragraphs
}

/**
 * Build summary section
 */
export function buildSummarySection(summary: string, styles?: DOCXStyleConfig): Paragraph[] {
  if (!summary || summary.trim() === '') {
    return []
  }

  return [
    createHeadingParagraph('PROFESSIONAL SUMMARY', 2, styles),
    createNormalParagraph(summary.trim(), undefined, styles),
  ]
}

/**
 * Build experience section with job entries
 */
export function buildExperienceSection(experience: JobEntry[], styles?: DOCXStyleConfig): Paragraph[] {
  if (!experience || experience.length === 0) {
    return []
  }

  const paragraphs: Paragraph[] = [createHeadingParagraph('EXPERIENCE', 2, styles)]

  experience.forEach((job, index) => {
    // Company | Title | Dates (bold)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${job.company} | ${job.title}`,
            bold: true,
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
          new TextRun({
            text: ` | ${job.dates}`,
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
        ],
        spacing: {
          before: index === 0 ? 0 : 200,
          after: 80,
        },
      })
    )

    // Bullet points
    if (job.bulletPoints && job.bulletPoints.length > 0) {
      job.bulletPoints.forEach((bullet) => {
        paragraphs.push(createBulletParagraph(bullet, undefined, styles))
      })
    }
  })

  return paragraphs
}

/**
 * Build education section
 */
export function buildEducationSection(
  education: EducationEntry[],
  styles?: DOCXStyleConfig
): Paragraph[] {
  if (!education || education.length === 0) {
    return []
  }

  const paragraphs: Paragraph[] = [createHeadingParagraph('EDUCATION', 2, styles)]

  education.forEach((entry, index) => {
    // Institution | Degree | Dates (bold)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${entry.institution} | ${entry.degree}`,
            bold: true,
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
          new TextRun({
            text: ` | ${entry.dates}`,
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
        ],
        spacing: {
          before: index === 0 ? 0 : 120,
          after: entry.gpa ? 60 : 120,
        },
      })
    )

    // GPA if present
    if (entry.gpa) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `GPA: ${entry.gpa}`,
              font: styles?.fontName,
              size: styles ? styles.fontSize * 2 : undefined,
            }),
          ],
          spacing: {
            after: 120,
          },
        })
      )
    }
  })

  return paragraphs
}

/**
 * Build skills section with categories
 */
export function buildSkillsSection(skills: Skill[], styles?: DOCXStyleConfig): Paragraph[] {
  if (!skills || skills.length === 0) {
    return []
  }

  const paragraphs: Paragraph[] = [createHeadingParagraph('SKILLS', 2, styles)]

  // Group skills by category
  const technicalSkills = skills
    .filter((s) => s.category === 'technical')
    .map((s) => s.name)
  const softSkills = skills
    .filter((s) => s.category === 'soft')
    .map((s) => s.name)

  if (technicalSkills.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Technical: ',
            bold: true,
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
          new TextRun({
            text: technicalSkills.join(', '),
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
        ],
        spacing: {
          after: softSkills.length > 0 ? 80 : 120,
        },
      })
    )
  }

  if (softSkills.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Soft Skills: ',
            bold: true,
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
          new TextRun({
            text: softSkills.join(', '),
            font: styles?.fontName,
            size: styles ? styles.fontSize * 2 : undefined,
          }),
        ],
        spacing: {
          after: 120,
        },
      })
    )
  }

  return paragraphs
}

/**
 * Build projects section
 */
export function buildProjectsSection(projects: string, styles?: DOCXStyleConfig): Paragraph[] {
  if (!projects || projects.trim() === '') {
    return []
  }

  return [
    createHeadingParagraph('PROJECTS', 2, styles),
    createNormalParagraph(projects.trim(), undefined, styles),
  ]
}

/**
 * Build other/additional section (certifications, awards, etc.)
 */
export function buildOtherSection(other: string, styles?: DOCXStyleConfig): Paragraph[] {
  if (!other || other.trim() === '') {
    return []
  }

  return [
    createHeadingParagraph('ADDITIONAL', 2, styles),
    createNormalParagraph(other.trim(), undefined, styles),
  ]
}

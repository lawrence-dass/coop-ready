'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, GraduationCap, Code, FileText } from 'lucide-react'
import type { ParsedResume } from '@/lib/parsers/types'
import { ExperiencePreview } from './ExperiencePreview'
import { SkillsPreview } from './SkillsPreview'
import { LoadingPreview } from './LoadingPreview'
import { ErrorPreview } from './ErrorPreview'

/**
 * Resume Preview Component
 *
 * Displays parsed resume content organized by section.
 * Shows all sections with expandable cards and clear labels.
 *
 * @see Story 3.4: Resume Preview Display
 */

export interface ResumePreviewProps {
  resume: {
    id: string
    fileName: string
    extractionStatus: 'completed' | 'failed' | 'pending'
    extractionError?: string | null
    parsingStatus: 'completed' | 'failed' | 'pending'
    parsingError?: string | null
    parsedSections?: ParsedResume | null
  }
  isLoading?: boolean
  /** Callback for re-upload action (client components) */
  onReupload?: () => void
  /** URL for re-upload navigation (server components) */
  reuploadHref?: string
}

export function ResumePreview({
  resume,
  isLoading = false,
  onReupload,
  reuploadHref,
}: ResumePreviewProps) {
  const { parsedSections, extractionStatus, extractionError, parsingStatus, parsingError } =
    resume

  // Show loading state if processing is in progress
  if (
    isLoading ||
    extractionStatus === 'pending' ||
    (extractionStatus === 'completed' && parsingStatus === 'pending')
  ) {
    return <LoadingPreview />
  }

  // Show error state if extraction or parsing failed
  if (extractionStatus === 'failed' && extractionError) {
    return (
      <ErrorPreview
        errorType="extraction"
        errorMessage={extractionError}
        onReupload={onReupload}
        reuploadHref={reuploadHref}
      />
    )
  }

  if (parsingStatus === 'failed' && parsingError) {
    return (
      <ErrorPreview
        errorType="parsing"
        errorMessage={parsingError}
        onReupload={onReupload}
        reuploadHref={reuploadHref}
      />
    )
  }

  // No parsed sections available
  if (!parsedSections) {
    return null
  }

  return (
    <div className="space-y-6" data-testid="resume-preview">
      {/* Contact Section */}
      {parsedSections.contact && (
        <Card data-testid="contact-section">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="contact-section-header"
            >
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent data-testid="contact-section-content">
            <p className="whitespace-pre-wrap text-sm">{parsedSections.contact}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      {parsedSections.summary && (
        <Card data-testid="summary-section">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="summary-section-header"
            >
              <FileText className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent data-testid="summary-section-content">
            <p className="whitespace-pre-wrap text-sm">{parsedSections.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Education Section */}
      {parsedSections.education && parsedSections.education.length > 0 && (
        <Card data-testid="education-section">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="education-section-header"
            >
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedSections.education.map((edu, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-4">
                <p className="font-medium">{edu.degree}</p>
                <p className="text-sm text-muted-foreground">{edu.institution}</p>
                <p className="text-xs text-muted-foreground">{edu.dates}</p>
                {edu.gpa && (
                  <p className="text-xs text-muted-foreground">GPA: {edu.gpa}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Experience Section - using ExperiencePreview component */}
      {parsedSections.experience && parsedSections.experience.length > 0 && (
        <ExperiencePreview experience={parsedSections.experience} />
      )}

      {/* Skills Section - using SkillsPreview component */}
      {parsedSections.skills && parsedSections.skills.length > 0 && (
        <SkillsPreview skills={parsedSections.skills} />
      )}

      {/* Projects Section */}
      {parsedSections.projects && (
        <Card data-testid="projects-section">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="projects-section-header"
            >
              <Code className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{parsedSections.projects}</p>
          </CardContent>
        </Card>
      )}

      {/* Other Section */}
      {parsedSections.other && (
        <Card data-testid="other-section">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{parsedSections.other}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

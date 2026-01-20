'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Upload } from 'lucide-react'
import Link from 'next/link'

/**
 * Error Preview Component
 *
 * Displays error state when extraction or parsing fails.
 * Shows error message, error type, and option to re-upload.
 *
 * @see Story 3.4: Resume Preview Display - Task 5
 */

export interface ErrorPreviewProps {
  /** Error type: extraction or parsing failure */
  errorType: 'extraction' | 'parsing'
  /** Detailed error message */
  errorMessage: string
  /** Callback when user clicks re-upload (for client components) */
  onReupload?: () => void
  /** URL to navigate to for re-upload (for server components) */
  reuploadHref?: string
}

export function ErrorPreview({
  errorType,
  errorMessage,
  onReupload,
  reuploadHref,
}: ErrorPreviewProps) {
  const errorTitle =
    errorType === 'extraction'
      ? 'Text Extraction Failed'
      : 'Resume Parsing Failed'

  const errorDescription =
    errorType === 'extraction'
      ? 'We were unable to extract text from your resume. This might happen if the file is corrupted or in an unsupported format.'
      : 'We extracted text from your resume but encountered an error while parsing the content into sections.'

  return (
    <div className="space-y-6" data-testid="error-preview-container">
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Error Icon */}
            <div
              className="rounded-full bg-red-100 p-3 dark:bg-red-900"
              data-testid="error-icon"
            >
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Type */}
            <div className="space-y-2">
              <h3
                className="text-lg font-semibold text-red-900 dark:text-red-100"
                data-testid="error-type"
              >
                {errorTitle}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 max-w-md">
                {errorDescription}
              </p>
            </div>

            {/* Detailed Error Message */}
            <div
              className="w-full max-w-md bg-red-100 dark:bg-red-900 rounded-lg p-3"
              data-testid="error-message"
            >
              <p className="text-xs font-mono text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
            </div>

            {/* Re-upload Button */}
            {reuploadHref ? (
              <Link href={reuploadHref}>
                <Button
                  variant="default"
                  className="mt-4"
                  data-testid="reupload-button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Re-upload Resume
                </Button>
              </Link>
            ) : (
              <Button
                onClick={onReupload}
                variant="default"
                className="mt-4"
                data-testid="reupload-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Re-upload Resume
              </Button>
            )}

            {/* Help Text */}
            <p className="text-xs text-muted-foreground max-w-md">
              Make sure your resume is in PDF or DOCX format and is not
              password-protected or corrupted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

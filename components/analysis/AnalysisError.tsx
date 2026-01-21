'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RotateCcw, PlusCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Analysis Error Component
 *
 * Displays error state when analysis fails.
 * Provides retry and "start new scan" options.
 *
 * @see Story 4.7: Analysis Results Page - Task 9 (AC: 10)
 */

export interface AnalysisErrorProps {
  scanId?: string
  errorMessage?: string
  onRetry?: () => void
}

export function AnalysisError({
  errorMessage = 'Analysis failed. Please try again.',
  onRetry,
}: AnalysisErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>

          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button variant="outline" asChild className="w-full">
              <Link href="/scan/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Start New Scan
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            If the problem persists, please{' '}
            <a
              href="mailto:support@coopready.com"
              className="underline hover:text-foreground"
            >
              contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

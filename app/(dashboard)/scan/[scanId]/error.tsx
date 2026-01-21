'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

/**
 * Error Boundary for Scan Results Page
 *
 * Catches and displays errors that occur during rendering.
 * Provides recovery options for users.
 *
 * @see Story 4.7: Analysis Results Page - Task 1 (Error Boundaries)
 */

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ScanError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('[ScanError] Rendering error caught:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error while loading your scan results.
            This could be a temporary issue.
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
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

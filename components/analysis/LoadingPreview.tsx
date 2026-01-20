'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

/**
 * Loading Preview Component
 *
 * Displays skeleton loading state while resume is being processed.
 * Shows loading message and animated skeletons for each section.
 *
 * @see Story 3.4: Resume Preview Display - Task 4
 */

export function LoadingPreview() {
  return (
    <div className="space-y-6" data-testid="loading-preview-container">
      {/* Loading Message */}
      <div className="flex items-center justify-center gap-3 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p
          className="text-sm font-medium text-muted-foreground"
          data-testid="loading-message"
        >
          Processing your resume...
        </p>
      </div>

      {/* Contact Section Skeleton */}
      <Card data-testid="loading-contact-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>

      {/* Summary Section Skeleton */}
      <Card data-testid="loading-summary-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      {/* Education Section Skeleton */}
      <Card data-testid="loading-education-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-5 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Experience Section Skeleton */}
      <Card data-testid="loading-experience-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-5 w-56 mb-2" />
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-3 w-40 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills Section Skeleton */}
      <Card data-testid="loading-skills-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects Section Skeleton */}
      <Card data-testid="loading-projects-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  )
}

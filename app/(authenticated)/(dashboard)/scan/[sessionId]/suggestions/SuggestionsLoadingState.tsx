'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SuggestionsLoadingStateProps {
  sessionId: string;
}

/**
 * Loading state component for suggestions page.
 * Shows animated spinner and skeleton placeholders while suggestions are being generated.
 * Auto-refreshes the page every 5 seconds to check for completion.
 *
 * GitHub Issue: #153
 */
export function SuggestionsLoadingState({ sessionId }: SuggestionsLoadingStateProps) {
  const router = useRouter();

  // Auto-refresh every 5 seconds to check if suggestions are ready
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Optimization Suggestions</h1>
          <p className="mt-2 text-gray-600">
            Review and apply suggestions to improve your ATS score
          </p>
        </div>

        {/* Loading Indicator */}
        <div
          className="flex items-center justify-center gap-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-6"
          role="status"
          aria-live="polite"
          data-testid="suggestions-loading-state"
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg font-medium text-primary">
            Generating suggestions...
          </p>
        </div>

        {/* Score Comparison Skeleton */}
        <Card className="border-2 border-blue-100 bg-blue-50/50">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
              {/* Original Score Skeleton */}
              <div className="flex flex-col items-center">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-16 w-20" />
                <Skeleton className="h-5 w-16 mt-2" />
              </div>

              {/* Arrow Skeleton */}
              <Skeleton className="hidden md:block h-12 w-12 rounded-full" />

              {/* Projected Score Skeleton */}
              <div className="flex flex-col items-center">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-16 w-20" />
                <Skeleton className="h-5 w-24 mt-2" />
              </div>

              {/* Delta Skeleton */}
              <div className="flex flex-col items-center md:ml-8">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-14 w-16" />
                <Skeleton className="h-4 w-28 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {/* Tabs Skeleton */}
            <div className="grid w-full grid-cols-3 gap-2 mb-6">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>

            {/* Section Summary Skeleton */}
            <div className="rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            {/* Suggestion Cards Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="pt-2 border-t">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    </div>
  );
}

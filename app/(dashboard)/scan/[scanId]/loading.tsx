import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

/**
 * Loading State for Scan Results Page
 *
 * Displays skeleton placeholders while analysis is processing.
 * Shows progress message and estimated time.
 *
 * @see Story 4.7: Analysis Results Page - Task 2 (AC: 2)
 */

export default function ScanResultsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Progress Message */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">
                Analysis in progress...
              </p>
              <p className="text-sm text-blue-700">
                This usually takes 10-20 seconds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Card Skeleton */}
      <Card className="border-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center">
              <Skeleton className="w-48 h-48 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Breakdown Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Keywords Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Format Issues Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

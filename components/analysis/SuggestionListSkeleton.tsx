/**
 * SuggestionListSkeleton - Loading state for SuggestionList
 * Shows animated placeholder while suggestions are being fetched
 */

import { Skeleton } from "@/components/ui/skeleton";

export function SuggestionListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-gray-50 p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Filter Skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Sections Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

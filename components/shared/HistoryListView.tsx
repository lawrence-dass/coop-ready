'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Briefcase, TrendingUp, Trash2 } from 'lucide-react';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import { getOptimizationHistory } from '@/actions/history/get-optimization-history';
import { DeleteSessionDialog } from '@/components/shared/DeleteSessionDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { HistorySession } from '@/types/history';

/**
 * HistoryListView Component
 *
 * Displays the last 10 optimization sessions for the authenticated user.
 * Shows metadata like resume name, job title, date, and ATS score.
 *
 * Story 10.1: Implement History List View
 *
 * **Features:**
 * - Responsive card layout
 * - Loading skeleton during fetch
 * - Empty state for no history
 * - Formatted dates (e.g., "Jan 24, 2:30 PM")
 * - Mobile-friendly design
 *
 * @example
 * ```tsx
 * // In a page component
 * <HistoryListView />
 * ```
 */
export function HistoryListView() {
  const router = useRouter();
  const historyItems = useOptimizationStore((state) => state.historyItems);
  const isLoadingHistory = useOptimizationStore((state) => state.isLoadingHistory);
  const setHistoryItems = useOptimizationStore((state) => state.setHistoryItems);
  const setLoadingHistory = useOptimizationStore((state) => state.setLoadingHistory);

  // Fetch history on component mount
  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setLoadingHistory(true);

      const { data, error } = await getOptimizationHistory();

      if (cancelled) return;

      if (error) {
        toast.error(error.message);
        setLoadingHistory(false);
        return;
      }

      setHistoryItems(data);
      setLoadingHistory(false);
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [setHistoryItems, setLoadingHistory]);

  // Show loading skeleton
  if (isLoadingHistory) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show empty state
  if (historyItems.length === 0) {
    return (
      <Card className="shadow-sm border-dashed">
        <CardContent className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No optimization history yet
          </h3>
          <p className="text-sm text-gray-500">
            Your past optimizations will appear here after you analyze a resume with a job description.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show history list
  return (
    <div className="space-y-4" data-testid="history-list">
      {historyItems.map((session) => (
        <HistorySessionCard
          key={session.id}
          session={session}
          onClick={() => router.push(`/history/${session.id}`)}
        />
      ))}
    </div>
  );
}

/**
 * HistorySessionCard Component
 *
 * Displays a single optimization session in the history list.
 * Shows metadata and visual indicators for the session.
 *
 * Story 10.3: Added delete button and confirmation dialog
 */
interface HistorySessionCardProps {
  session: HistorySession;
  onClick: () => void;
}

function HistorySessionCard({ session, onClick }: HistorySessionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const removeHistoryItem = useOptimizationStore((state) => state.removeHistoryItem);

  // Format date for display (e.g., "Jan 24, 2:30 PM")
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(session.createdAt);

  const handleDeleteSuccess = () => {
    // Remove from store (optimistic update)
    removeHistoryItem(session.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent card click event from firing
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-testid="history-session-card" onClick={onClick}>
      <CardContent className="p-6">
        {/* Header: Resume Name + Delete Button + ATS Score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {session.resumeName || 'Untitled Resume'}
            </h3>
            {session.jobTitle && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span>{session.jobTitle}</span>
              </div>
            )}
            {session.companyName && (
              <div className="text-sm text-gray-500 mt-1">
                at {session.companyName}
              </div>
            )}
          </div>

          {/* Delete Button + ATS Score Badge */}
          <div className="flex items-center gap-3 ml-4">
            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Delete session"
              data-testid="delete-session-button"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* ATS Score Badge */}
            {session.atsScore !== null && session.atsScore !== undefined && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <Badge
                variant="default"
                className={cn(
                  'text-sm font-semibold',
                  session.atsScore >= 80
                    ? 'bg-green-600'
                    : session.atsScore >= 60
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                )}
              >
                  {session.atsScore}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Preview Text */}
        {session.jdPreview && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {session.jdPreview}...
          </p>
        )}

        {/* Footer: Date + Suggestion Count */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>

          {session.suggestionCount !== null && session.suggestionCount !== undefined && session.suggestionCount > 0 && (
            <div className="text-xs text-gray-500">
              {session.suggestionCount} {session.suggestionCount === 1 ? 'suggestion' : 'suggestions'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteSessionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        sessionId={session.id}
        sessionDate={session.createdAt}
        resumeName={session.resumeName}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
}

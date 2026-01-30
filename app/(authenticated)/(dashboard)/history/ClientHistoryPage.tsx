/**
 * Client History Page Component
 * Story 16.6: Migrate History and Settings
 *
 * Renders history list with interactive elements (click, delete).
 * Receives sessions as props from server component.
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Briefcase, TrendingUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeleteSessionDialog } from '@/components/shared/DeleteSessionDialog';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import type { HistorySession } from '@/types/history';
import type { ApiError } from '@/types';
import { useState } from 'react';

interface ClientHistoryPageProps {
  sessions: HistorySession[];
  error: ApiError | null;
}

export function ClientHistoryPage({ sessions, error }: ClientHistoryPageProps) {
  const router = useRouter();

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          errorCode={error.code}
          message={error.message}
          onRetry={() => router.refresh()}
        />
      </div>
    );
  }

  // Show empty state
  if (sessions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-sm border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No optimization history yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Your past optimizations will appear here after you analyze a resume with a job description.
            </p>
            <Button onClick={() => router.push(ROUTES.APP.SCAN.NEW)}>
              Start New Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show history list
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Optimization History</h1>
        <p className="text-gray-600 mt-2">View and manage your past resume optimizations</p>
      </div>

      <div className="space-y-4" data-testid="history-list">
        {sessions.map((session) => (
          <HistorySessionCard
            key={session.id}
            session={session}
            onClick={() => router.push(ROUTES.APP.SCAN.SESSION(session.id))}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * HistorySessionCard Component
 *
 * Displays a single optimization session in the history list.
 * Navigation goes to /scan/[sessionId].
 */
interface HistorySessionCardProps {
  session: HistorySession;
  onClick: () => void;
}

function HistorySessionCard({ session, onClick }: HistorySessionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  // Format date for display (e.g., "Jan 24, 2:30 PM")
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(session.createdAt);

  const handleDeleteSuccess = () => {
    // Refresh the page to reload sessions
    router.refresh();
    toast.success('Session deleted successfully');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent card click event from firing
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card
        className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        data-testid={`history-session-${session.id}`}
        data-session-id={session.id}
        onClick={onClick}
      >
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
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete session from ${formattedDate}`}
                data-testid={`delete-session-${session.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* ATS Score Badge */}
              {session.atsScore !== null && session.atsScore !== undefined && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <Badge
                    variant="default"
                    className={cn(
                      'text-sm font-semibold',
                      session.atsScore >= 80
                        ? 'bg-success'
                        : session.atsScore >= 60
                          ? 'bg-warning'
                          : 'bg-destructive'
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

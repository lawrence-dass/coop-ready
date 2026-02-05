/**
 * RecentScansCard Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Displays user's most recent optimization sessions (up to 5)
 * Shows date, job title, company name, ATS score with improvement
 * Includes delete option and link to full history
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Briefcase, FileText, Trash2, ArrowRight, History } from 'lucide-react';
import { DeleteSessionDialog } from '@/components/shared/DeleteSessionDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { HistorySession } from '@/types/history';
import { ROUTES } from '@/lib/constants/routes';

interface RecentScansCardProps {
  sessions: HistorySession[];
}

/**
 * Returns Tailwind classes for improvement delta badge
 */
function getImprovementColorClass(delta: number): string {
  if (delta > 0) return 'text-green-600 bg-green-50';
  if (delta < 0) return 'text-amber-600 bg-amber-50';
  return 'text-gray-500 bg-gray-50';
}

/**
 * Formats delta with + prefix for positive values
 */
function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * Format date as relative time (e.g., "2 days ago") or absolute date
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  // Fallback to formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RecentScansCard({ sessions }: RecentScansCardProps) {
  const router = useRouter();
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteSessionDate, setDeleteSessionDate] = useState<Date | null>(null);
  const [deleteResumeName, setDeleteResumeName] = useState<string | null>(null);

  // Handle empty state
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No recent scans yet. Get started with your first scan!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display up to 5 sessions
  const displaySessions = sessions.slice(0, 5);

  const handleDeleteClick = (e: React.MouseEvent, session: HistorySession) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteSessionId(session.id);
    setDeleteSessionDate(session.createdAt);
    setDeleteResumeName(session.resumeName);
  };

  const handleDeleteSuccess = () => {
    router.refresh();
    toast.success('Session deleted successfully');
  };

  const handleComparisonClick = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Opening comparison details...');
    router.push(ROUTES.APP.SCAN.COMPARISON(sessionId));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displaySessions.map((session) => (
            <Link
              key={session.id}
              href={ROUTES.APP.SCAN.SESSION(session.id)}
              className="block p-3 rounded-lg border hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Job title and company */}
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium truncate">
                      {session.jobTitle || 'Untitled Scan'}
                    </p>
                  </div>

                  {session.companyName && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {session.companyName}
                    </p>
                  )}

                  {/* Resume name */}
                  {session.resumeName && (
                    <div className="flex items-center gap-2 mt-1.5 ml-6">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {session.resumeName}
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(session.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right side: Delete + ATS Score */}
                <div className="flex items-start gap-2">
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteClick(e, session)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {/* ATS Score (if available) */}
                  {session.atsScore !== null && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold text-primary">
                        {session.atsScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">ATS Score</p>

                      {/* Improvement display (if comparison exists) */}
                      {session.comparedAtsScore !== null && (
                        <button
                          onClick={(e) => handleComparisonClick(e, session.id)}
                          className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-accent/50 transition-colors"
                          title="Click to view comparison"
                        >
                          <Badge variant="outline" className="text-xs font-medium text-gray-600 px-1">
                            {session.atsScore}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <Badge
                            variant="default"
                            className={cn(
                              'text-xs font-semibold px-1',
                              session.comparedAtsScore >= 80
                                ? 'bg-success'
                                : session.comparedAtsScore >= 60
                                  ? 'bg-warning'
                                  : 'bg-destructive'
                            )}
                          >
                            {session.comparedAtsScore}
                          </Badge>
                          <span
                            className={cn(
                              'text-xs font-medium px-1 py-0.5 rounded-full',
                              getImprovementColorClass(session.comparedAtsScore - session.atsScore)
                            )}
                          >
                            {formatDelta(session.comparedAtsScore - session.atsScore)}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {/* View All Scans Button */}
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(ROUTES.APP.HISTORY)}
            >
              <History className="h-4 w-4 mr-2" />
              View All Scans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteSessionId && (
        <DeleteSessionDialog
          open={!!deleteSessionId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteSessionId(null);
              setDeleteSessionDate(null);
              setDeleteResumeName(null);
            }
          }}
          sessionId={deleteSessionId}
          sessionDate={deleteSessionDate || new Date()}
          resumeName={deleteResumeName}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}

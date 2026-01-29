/**
 * RecentScansCard Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Displays user's most recent optimization sessions (up to 5)
 * Shows date, job title, company name when available
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, Briefcase } from 'lucide-react';
import type { HistorySession } from '@/types/history';
import { ROUTES } from '@/lib/constants/routes';

interface RecentScansCardProps {
  sessions: HistorySession[];
}

export function RecentScansCard({ sessions }: RecentScansCardProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Scans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displaySessions.map((session) => (
          <Link
            key={session.id}
            href={ROUTES.APP.SCAN.SESSION(session.id)}
            className="block p-3 rounded-lg border hover:bg-accent hover:shadow-sm transition-all"
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

                {/* Date */}
                <div className="flex items-center gap-2 mt-2 ml-6">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(session.createdAt)}
                  </p>
                </div>
              </div>

              {/* ATS Score (if available) */}
              {session.atsScore !== null && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-primary">
                    {session.atsScore}%
                  </div>
                  <p className="text-xs text-muted-foreground">ATS Score</p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
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

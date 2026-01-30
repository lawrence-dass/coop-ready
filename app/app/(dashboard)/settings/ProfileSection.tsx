/**
 * ProfileSection Component
 * Story 16.6: Migrate History and Settings - Task 3
 *
 * Displays user profile information (email, account creation date, user ID).
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, Hash } from 'lucide-react';

interface ProfileSectionProps {
  email: string;
  createdAt: string;
  userId: string;
}

export function ProfileSection({ email, createdAt, userId }: ProfileSectionProps) {
  // Format date: "Member since Jan 24, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Address */}
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900">{email}</p>
          </div>
        </div>

        {/* Account Creation Date */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Member since</p>
            <p className="text-sm text-gray-900">{formattedDate}</p>
          </div>
        </div>

        {/* User ID (optional, for debugging) */}
        <div className="flex items-start gap-3">
          <Hash className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">User ID</p>
            <p className="text-xs font-mono text-gray-500 break-all">{userId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

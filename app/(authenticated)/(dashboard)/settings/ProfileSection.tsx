/**
 * ProfileSection Component
 *
 * Displays user profile information (name, email).
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail } from 'lucide-react';

interface ProfileSectionProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export function ProfileSection({
  email,
  firstName,
  lastName,
}: ProfileSectionProps) {
  // Build display name
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Name</p>
            <p className="text-sm text-gray-900">
              {displayName || <span className="text-gray-400 italic">Not provided</span>}
            </p>
          </div>
        </div>

        {/* Email Address */}
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900">{email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

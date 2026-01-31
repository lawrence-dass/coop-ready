/**
 * ProfileSection Component
 *
 * Displays user profile information (name, email, verification status).
 */

'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendVerificationEmail } from '@/actions/auth/send-verification-email';

interface ProfileSectionProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
}

export function ProfileSection({
  email,
  firstName,
  lastName,
  emailVerified,
}: ProfileSectionProps) {
  const [isSending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  // Build display name
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || null;

  const handleResendVerification = () => {
    startTransition(async () => {
      const { data, error } = await sendVerificationEmail();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.sent) {
        setEmailSent(true);
        toast.success('Verification email sent!');
      }
    });
  };

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
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700">Email</p>
              {emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  <AlertCircle className="h-3 w-3" />
                  Not verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-900">{email}</p>

            {/* Resend verification button for unverified users */}
            {!emailVerified && (
              <div className="mt-2">
                {emailSent ? (
                  <p className="text-sm text-green-600">
                    Verification email sent! Check your inbox.
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

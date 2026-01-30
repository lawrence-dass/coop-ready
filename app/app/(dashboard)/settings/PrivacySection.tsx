/**
 * PrivacySection Component
 * Story 16.6: Migrate History and Settings - Task 5
 *
 * Displays privacy consent status and related actions.
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, XCircle, Download, ExternalLink } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';

interface PrivacySectionProps {
  consent: {
    accepted: boolean;
    acceptedAt: string | null;
  };
}

export function PrivacySection({ consent }: PrivacySectionProps) {
  // Format consent date
  const formattedDate = consent.acceptedAt
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(consent.acceptedAt))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Privacy Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Consent Status */}
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Privacy Consent</p>
            <div className="flex items-center gap-2 mt-1">
              {consent.accepted ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-gray-900">
                    Accepted {formattedDate && `on ${formattedDate}`}
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-gray-900">Not accepted</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            asChild
          >
            <Link
              href={ROUTES.PRIVACY_POLICY}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Review Privacy Policy
            </Link>
          </Button>
        </div>

        {/* Download My Data (GDPR compliance placeholder) */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            disabled
            className="w-full sm:w-auto"
            title="Coming soon - contact support to request your data"
          >
            <Download className="h-4 w-4 mr-2" />
            Download My Data
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Coming soon - contact support to request your data
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

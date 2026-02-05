/**
 * Privacy Report Badge
 *
 * Displays PII redaction statistics to build user trust through transparency.
 * Shows what sensitive information was protected during optimization.
 */

import { Shield, Info } from 'lucide-react';
import type { OptimizationPrivacyReport } from '@/types/privacy';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PrivacyReportBadgeProps {
  report: OptimizationPrivacyReport;
  className?: string;
}

export function PrivacyReportBadge({
  report,
  className = '',
}: PrivacyReportBadgeProps) {
  const { totalItemsRedacted, breakdown } = report;

  // Build readable breakdown text
  const parts: string[] = [];
  if (breakdown.names && breakdown.names > 0) {
    parts.push('name');
  }
  if (breakdown.emails > 0) {
    parts.push(
      `${breakdown.emails} email${breakdown.emails > 1 ? 's' : ''}`
    );
  }
  if (breakdown.phones > 0) {
    parts.push(
      `${breakdown.phones} phone${breakdown.phones > 1 ? 's' : ''}`
    );
  }
  if (breakdown.urls > 0) {
    parts.push(
      `${breakdown.urls} profile${breakdown.urls > 1 ? 's' : ''}`
    );
  }
  if (breakdown.addresses > 0) {
    parts.push(
      `${breakdown.addresses} address${breakdown.addresses > 1 ? 'es' : ''}`
    );
  }

  const breakdownText =
    parts.length > 0 ? parts.join(' • ') : 'No sensitive information';

  // If no PII detected, show a subtle message
  if (totalItemsRedacted === 0) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
      >
        <Shield className="h-4 w-4" />
        <span>Privacy check complete - no contact information detected</span>
      </div>
    );
  }

  // Show privacy protection badge
  return (
    <TooltipProvider>
      <div
        className={`flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 ${className}`}
      >
        <Shield className="h-5 w-5 flex-shrink-0 text-green-600" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-900">
              Privacy Protected
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-green-700 hover:text-green-900"
                  aria-label="Learn about privacy protection"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  We redacted this information before sending to AI for
                  analysis, then restored it in your suggestions. Your privacy
                  is our priority.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-xs text-green-700 mt-1">
            {breakdownText} redacted before AI analysis
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact version for smaller spaces (e.g., headers, cards)
 */
export function PrivacyReportBadgeCompact({
  report,
  className = '',
}: PrivacyReportBadgeProps) {
  const { totalItemsRedacted } = report;

  if (totalItemsRedacted === 0) {
    return null; // Don't show anything if no PII
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ${className}`}
          >
            <Shield className="h-3 w-3" />
            <span>
              {totalItemsRedacted} item{totalItemsRedacted > 1 ? 's' : ''}{' '}
              protected
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {totalItemsRedacted} piece{totalItemsRedacted > 1 ? 's' : ''} of
            sensitive information redacted before AI analysis
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

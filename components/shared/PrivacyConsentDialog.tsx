/**
 * PrivacyConsentDialog Component
 *
 * Modal dialog for privacy disclosure before first upload.
 * Ensures users understand how their data will be handled.
 *
 * Story 15.2: Create Privacy Consent Dialog
 *
 * **Features:**
 * - Clear explanation of data handling (4 key points)
 * - Links to Privacy Policy and Terms of Service
 * - Checkbox to confirm understanding
 * - "I Agree" button disabled until checkbox is checked
 * - "Cancel" button to dismiss dialog
 * - Full accessibility support (ARIA, focus management, keyboard)
 *
 * @example
 * ```tsx
 * <PrivacyConsentDialog
 *   open={showConsent}
 *   onOpenChange={setShowConsent}
 *   onAccept={handleAcceptConsent}
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Lock, Shield, Database, Trash2 } from 'lucide-react';

interface PrivacyConsentDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Called when user clicks "I Agree" (with checkbox checked) */
  onAccept: () => void;
}

/**
 * Data handling point component for consistent styling
 */
function DataPoint({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function PrivacyConsentDialog({
  open,
  onOpenChange,
  onAccept,
}: PrivacyConsentDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Reset checkbox state when dialog opens to ensure fresh consent each time
  useEffect(() => {
    if (open) {
      setAcknowledged(false);
    }
  }, [open]);

  const handleAccept = () => {
    if (acknowledged) {
      onAccept();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy & Data Handling
          </DialogTitle>
          <DialogDescription>
            Before uploading your resume, please review how we handle your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data handling points (AC #1) */}
          <div className="space-y-3">
            <DataPoint
              icon={Shield}
              title="Processed with AI Services"
              description="Your resume is processed using Anthropic's Claude API to generate optimization suggestions."
            />
            <DataPoint
              icon={Database}
              title="Stored Securely in Your Account"
              description="Your data is stored securely in your account and is only accessible to you."
            />
            <DataPoint
              icon={Lock}
              title="Not Used to Train AI Models"
              description="Your resume content is never used to train AI models or shared with third parties."
            />
            <DataPoint
              icon={Trash2}
              title="You Can Delete Your Data Anytime"
              description="You have full control over your data and can delete it permanently at any time."
            />
          </div>

          {/* Links to policies (AC #2) */}
          <div className="flex gap-4 text-sm border-t pt-4">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Terms of Service
            </a>
          </div>

          {/* Checkbox (AC #3) */}
          <div className="flex items-start gap-2 border-t pt-4">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) =>
                setAcknowledged(checked === true)
              }
            />
            <Label
              htmlFor="acknowledge"
              className="cursor-pointer leading-relaxed text-sm"
            >
              I understand how my data will be handled
            </Label>
          </div>
        </div>

        {/* Action buttons (AC #4) */}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleAccept} disabled={!acknowledged}>
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

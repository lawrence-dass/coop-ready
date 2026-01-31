'use client';

/**
 * Email Verification Modal
 *
 * Shown when unverified users try to access protected features (like scanning).
 * Provides option to resend verification email or check status.
 */

import { useState, useTransition } from 'react';
import { Mail, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  sendVerificationEmail,
  checkEmailVerified,
} from '@/actions/auth/send-verification-email';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  email: string;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  onVerified,
  email,
}: EmailVerificationModalProps) {
  const [isSending, startSending] = useTransition();
  const [isChecking, startChecking] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  function handleResendEmail() {
    startSending(async () => {
      const { data, error } = await sendVerificationEmail();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.sent) {
        setEmailSent(true);
        toast.success(`Verification email sent to ${data.email}`);
      }
    });
  }

  function handleCheckStatus() {
    startChecking(async () => {
      const { data, error } = await checkEmailVerified();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.verified) {
        toast.success('Email verified! You can now scan your resume.');
        onVerified();
      } else {
        toast.info('Email not yet verified. Please check your inbox and click the verification link.');
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Verify Your Email</DialogTitle>
          <DialogDescription className="text-center">
            Please verify your email address to start scanning resumes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            We sent a verification link to:
          </p>
          <p className="text-center font-medium">{email}</p>

          {emailSent && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Verification email sent!</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCheckStatus}
              disabled={isChecking || isSending}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  I've verified my email
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isSending || isChecking}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Can't find the email? Check your spam folder or request a new one.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * DeleteSessionDialog Component
 *
 * Confirmation dialog for deleting optimization sessions from history.
 *
 * Story 10.3: Implement History Deletion
 *
 * **Features:**
 * - Shows confirmation message with warning
 * - Displays session details (date, resume name) for context
 * - Has "Cancel" and "Delete" buttons
 * - Handles deletion and error states
 * - Closes on cancel or successful delete
 *
 * @example
 * ```tsx
 * <DeleteSessionDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   sessionId="session-123"
 *   sessionDate={new Date()}
 *   resumeName="John Doe Resume"
 *   onDeleteSuccess={() => console.log('Deleted')}
 * />
 * ```
 */

'use client';

import { useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { deleteOptimizationSession } from '@/actions/history/delete-optimization-session';
import { toast } from 'sonner';

interface DeleteSessionDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Session ID to delete */
  sessionId: string;

  /** Session creation date */
  sessionDate: Date;

  /** Resume name for display context */
  resumeName: string | null;

  /** Called after successful deletion */
  onDeleteSuccess: () => void;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  sessionId,
  sessionDate,
  resumeName,
  onDeleteSuccess,
}: DeleteSessionDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Format date for display
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(sessionDate);

  const handleDelete = () => {
    startTransition(async () => {
      const { data, error } = await deleteOptimizationSession(sessionId);

      if (error) {
        console.error('[DeleteSessionDialog] Deletion failed:', error.code, error.message);
        toast.error(error.message);
        return;
      }

      // Success
      toast.success('Session deleted successfully');
      onDeleteSuccess();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      // Prevent closing dialog while deletion is in-flight
      if (isPending) return;
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <DialogTitle>Delete Session</DialogTitle>
              <DialogDescription className="mt-2">
                Are you sure? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Session details for context */}
        <div className="py-4 space-y-2 border-t border-gray-100">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Session:</span>
            <span className="ml-2 text-gray-600">
              {resumeName || 'Untitled Resume'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Date:</span>
            <span className="ml-2 text-gray-600">{formattedDate}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

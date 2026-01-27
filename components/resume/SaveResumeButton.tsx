/**
 * Save Resume Button Component
 *
 * Button that opens a dialog for saving the current resume to the user's library.
 * Only visible when user is authenticated and has resume content.
 * Enforces 3-resume limit.
 */

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveResume } from '@/actions/resume/save-resume';

interface SaveResumeButtonProps {
  resumeContent: string | null;
  isAuthenticated: boolean;
  fileName?: string;
  disabled?: boolean;
}

export function SaveResumeButton({
  resumeContent,
  isAuthenticated,
  fileName,
  disabled = false,
}: SaveResumeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [isPending, startTransition] = useTransition();

  // Don't render if not authenticated or no resume
  if (!isAuthenticated || !resumeContent) {
    return null;
  }

  const handleSave = () => {
    if (!resumeName.trim()) {
      toast.error('Please enter a name for your resume.');
      return;
    }

    startTransition(async () => {
      const { data, error } = await saveResume(resumeContent, resumeName, fileName);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Success
      toast.success(`Resume "${data.name}" saved to your library!`);
      setIsOpen(false);
      setResumeName(''); // Reset for next use
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setResumeName(''); // Reset when closing
    }
  };

  const isSubmitDisabled = !resumeName.trim() || isPending || disabled;
  const nameLength = resumeName.length;
  const isNameTooLong = nameLength > 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          data-testid="save-resume-button"
        >
          <Save className="mr-2 h-4 w-4" />
          Save to Library
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="save-resume-dialog">
        <DialogHeader>
          <DialogTitle>Save Resume to Library</DialogTitle>
          <DialogDescription>
            Give your resume a name so you can easily find it later. You can
            save up to 3 resumes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input
              id="resume-name"
              placeholder="e.g., Software Engineer Resume"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              disabled={isPending}
              maxLength={101} // Allow typing 1 char over to show error
              data-testid="resume-name-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitDisabled) {
                  handleSave();
                }
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={isNameTooLong ? 'text-destructive' : ''}>
                {nameLength}/100 characters
              </span>
              {isNameTooLong && (
                <span className="text-destructive">Name too long</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitDisabled || isNameTooLong}
            data-testid="save-button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Resume'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

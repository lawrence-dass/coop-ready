'use client';

/**
 * Save Resume Dialog Component
 *
 * Controlled dialog for saving resumes to the library.
 * Extracted from SaveResumeButton to enable external triggering (e.g., from success banner).
 *
 * Epic 9: Save Resume After Extraction + Settings Page + Default Resume
 * Phase 3.10: Save After Extraction Components
 */

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveResume } from '@/actions/resume/save-resume';

interface SaveResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeContent: string | null;
  fileName?: string;
  showSetDefaultCheckbox?: boolean;
}

export function SaveResumeDialog({
  open,
  onOpenChange,
  resumeContent,
  fileName,
  showSetDefaultCheckbox = false,
}: SaveResumeDialogProps) {
  const [resumeName, setResumeName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    // Validation
    if (!resumeContent?.trim()) {
      toast.error('No resume content to save');
      return;
    }

    const trimmedName = resumeName.trim();
    if (!trimmedName) {
      toast.error('Please enter a name for your resume');
      return;
    }

    if (trimmedName.length > 100) {
      toast.error('Resume name cannot exceed 100 characters');
      return;
    }

    startTransition(async () => {
      const { data, error } = await saveResume(
        resumeContent,
        trimmedName,
        fileName,
        isDefault
      );

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(
        isDefault
          ? `Resume "${data.name}" saved as default!`
          : `Resume "${data.name}" saved to library!`
      );

      // Reset form and close dialog
      onOpenChange(false);
      setResumeName('');
      setIsDefault(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Resume to Library</DialogTitle>
          <DialogDescription>
            Give your resume a name so you can easily find it later.
            {showSetDefaultCheckbox &&
              ' You can also set it as your default resume.'}
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
              maxLength={101}
              data-testid="resume-name-input"
            />
            <div className="text-xs text-muted-foreground">
              {resumeName.length}/100 characters
            </div>
          </div>

          {/* Set as default checkbox */}
          {showSetDefaultCheckbox && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="set-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
                disabled={isPending}
                data-testid="set-default-checkbox"
              />
              <Label
                htmlFor="set-default"
                className="text-sm font-normal cursor-pointer"
              >
                Set as default resume (auto-loads on new scan)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !resumeName.trim() || isPending || resumeName.length > 100
            }
            data-testid="save-resume-button"
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

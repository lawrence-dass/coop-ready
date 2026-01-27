/**
 * Select Resume Button Component
 *
 * Button that opens a dialog for selecting a resume from the user's library.
 * Only visible when user is authenticated.
 * Displays list of saved resumes with dates, allows selection, and loads content into session.
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LibraryBig, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserResumes } from '@/actions/resume/get-user-resumes';
import { getResumeContent } from '@/actions/resume/get-resume-content';
import { useOptimizationStore } from '@/store';
import type { UserResumeOption } from '@/types';

interface SelectResumeButtonProps {
  isAuthenticated: boolean;
  disabled?: boolean;
  onResumeSelected?: (resumeId: string, resumeName: string) => void;
}

export function SelectResumeButton({
  isAuthenticated,
  disabled = false,
  onResumeSelected,
}: SelectResumeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resumes, setResumes] = useState<UserResumeOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setResumeContent = useOptimizationStore((state) => state.setResumeContent);

  // Fetch resumes every time the dialog opens (ensures fresh data)
  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const fetchResumes = async () => {
    setIsFetchingList(true);
    const { data, error } = await getUserResumes();

    if (error) {
      toast.error(error.message);
      setIsFetchingList(false);
      return;
    }

    setResumes(data);
    setIsFetchingList(false);
  };

  const handleSelect = () => {
    if (!selectedId) {
      toast.error('Please select a resume.');
      return;
    }

    startTransition(async () => {
      const { data, error } = await getResumeContent(selectedId);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Load content into Zustand store as Resume object
      if (data.resumeContent) {
        setResumeContent({
          rawText: data.resumeContent,
          filename: data.name,
        });
        toast.success(`Resume "${data.name}" loaded successfully!`);
        setIsOpen(false);

        // Notify parent component if callback provided
        if (onResumeSelected && data.id && data.name) {
          onResumeSelected(data.id, data.name);
        }
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedId(''); // Reset selection when closing
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const isSelectDisabled = !selectedId || isPending || disabled;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          data-testid="select-resume-button"
        >
          <LibraryBig className="mr-2 h-4 w-4" />
          Select from Library
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="select-resume-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Resume from Library</DialogTitle>
          <DialogDescription>
            Choose a saved resume to use for optimization.
          </DialogDescription>
        </DialogHeader>

        {isFetchingList ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading resumes...
            </span>
          </div>
        ) : resumes.length === 0 ? (
          <div className="py-8 text-center" data-testid="empty-state">
            <p className="text-sm text-muted-foreground">
              No resumes saved yet. Save one first to see it here.
            </p>
          </div>
        ) : (
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              You have {resumes.length} saved resume{resumes.length !== 1 ? 's' : ''}
            </p>
            <RadioGroup
              value={selectedId}
              onValueChange={setSelectedId}
              data-testid="resume-list"
            >
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  data-testid={`resume-option-${resume.id}`}
                >
                  <RadioGroupItem
                    value={resume.id}
                    id={resume.id}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={resume.id}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <p className="font-medium leading-none">{resume.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDate(resume.created_at)}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

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
            onClick={handleSelect}
            disabled={isSelectDisabled}
            data-testid="select-button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Select Resume'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

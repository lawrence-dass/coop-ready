'use client';

/**
 * Resume Management Section
 *
 * Settings page section for managing saved resumes:
 * - View up to 3 saved resumes
 * - Set default resume (radio buttons)
 * - Delete resumes with confirmation
 * - Visual "Default" badge
 *
 * Epic 9: Save Resume After Extraction + Settings Page + Default Resume
 * Phase 2.7: Settings Page Components
 */

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { setDefaultResume } from '@/actions/resume/set-default-resume';
import { deleteResume } from '@/actions/resume/delete-resume';
import type { UserResumeOption } from '@/types';

interface ResumeManagementSectionProps {
  initialResumes: UserResumeOption[];
}

export function ResumeManagementSection({
  initialResumes,
}: ResumeManagementSectionProps) {
  const [resumes, setResumes] = useState<UserResumeOption[]>(initialResumes);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const defaultResume = resumes.find((r) => r.is_default);

  const handleSetDefault = (resumeId: string) => {
    startTransition(async () => {
      const { error } = await setDefaultResume(resumeId);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Update local state - unset all defaults, set new one
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          is_default: r.id === resumeId,
        }))
      );

      toast.success('Default resume updated');
    });
  };

  const handleDelete = (resumeId: string, resumeName: string) => {
    // Confirm deletion
    if (!confirm(`Delete "${resumeName}"? This cannot be undone.`)) {
      return;
    }

    const wasDefault = resumes.find((r) => r.id === resumeId)?.is_default;

    setDeletingId(resumeId);
    startTransition(async () => {
      const { error } = await deleteResume(resumeId);

      if (error) {
        toast.error(error.message);
        setDeletingId(null);
        return;
      }

      // Remove from local state
      const updated = resumes.filter((r) => r.id !== resumeId);
      setResumes(updated);

      // If deleted default and other resumes exist, prompt to set new default
      if (wasDefault && updated.length > 0) {
        toast.info('Select a new default resume', {
          description:
            'Your default resume was deleted. Please select a new one below.',
        });
      }

      toast.success('Resume deleted');
      setDeletingId(null);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Resumes</CardTitle>
        <CardDescription>
          Manage your saved resumes. You can save up to 3 resumes. The default
          resume auto-loads when you start a new scan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resumes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No saved resumes yet.</p>
            <p className="text-xs mt-1">
              Upload and save a resume from the scan page to see it here.
            </p>
          </div>
        ) : (
          <RadioGroup
            value={defaultResume?.id || ''}
            onValueChange={handleSetDefault}
            disabled={isPending}
          >
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors group"
                  data-testid={`resume-card-${resume.id}`}
                >
                  <RadioGroupItem
                    value={resume.id}
                    id={resume.id}
                    className="mt-1"
                    disabled={isPending}
                  />
                  <Label
                    htmlFor={resume.id}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{resume.name}</p>
                      {resume.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(resume.created_at)}
                    </p>
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resume.id, resume.name)}
                    disabled={isPending || deletingId === resume.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`delete-resume-${resume.id}`}
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          {resumes.length}/3 resumes saved
        </p>
      </CardContent>
    </Card>
  );
}

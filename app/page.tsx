'use client';

/**
 * Home Page - Resume Optimization Interface
 *
 * Main page where users upload resumes and get optimization suggestions.
 */

import { ResumeUploader, FileValidationError } from '@/components/shared';
import { useOptimizationStore, selectPendingFile, selectFileError } from '@/store';
import { toast } from 'sonner';

export default function Home() {
  const pendingFile = useOptimizationStore(selectPendingFile);
  const fileError = useOptimizationStore(selectFileError);
  const setPendingFile = useOptimizationStore((state) => state.setPendingFile);
  const setFileError = useOptimizationStore((state) => state.setFileError);

  const handleFileError = (error: { code: string; message: string }) => {
    setFileError(error);
    toast.error(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex w-full max-w-3xl flex-col gap-8 p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            SubmitSmart
          </h1>
          <p className="text-muted-foreground mt-2">
            Optimize your resume for ATS systems
          </p>
        </div>

        {/* Resume Upload Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Upload Resume</h2>
          <ResumeUploader
            onFileSelect={(file) => {
              setPendingFile(file);
              setFileError(null); // Clear error on valid file
            }}
            onFileRemove={() => setPendingFile(null)}
            onError={handleFileError}
            selectedFile={
              pendingFile
                ? { name: pendingFile.name, size: pendingFile.size }
                : null
            }
          />
          {fileError && (
            <FileValidationError
              code={fileError.code}
              message={fileError.message}
              onDismiss={() => setFileError(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

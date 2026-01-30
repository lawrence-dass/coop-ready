/**
 * New Scan Page
 *
 * Story 16.3 - Dedicated page to start a new resume optimization
 *
 * **Features:**
 * - Resume Upload section (ResumeUploader component)
 * - Job Description Input section
 * - Configuration Options (Job Type, Modification Level)
 * - Analyze button
 * - Redirects to /scan/[sessionId] after successful analysis
 *
 * **Layout:**
 * - Mobile: Single column, cards stack
 * - Tablet/Desktop: Two columns (upload section + JD + prefs)
 */

import { NewScanClient } from '@/components/scan/NewScanClient';

export default function NewScanPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 sm:px-8 lg:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Resume Scan</h1>
        <p className="text-muted-foreground mt-2">
          Upload your resume and enter the job description to get started
        </p>
      </div>

      <NewScanClient />
    </div>
  );
}

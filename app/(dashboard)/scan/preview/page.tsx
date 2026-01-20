import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResumePreview } from '@/components/analysis/ResumePreview'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

/**
 * Resume Preview Page
 *
 * Displays parsed resume content in a dedicated preview view.
 * Can be accessed directly via /scan/preview?resumeId=X
 *
 * @see Story 3.4: Resume Preview Display
 */

interface PreviewPageProps {
  searchParams: {
    resumeId?: string
  }
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const { resumeId } = searchParams

  if (!resumeId) {
    redirect('/scan/new')
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Fetch resume data
  const { data: resume, error: fetchError } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !resume) {
    redirect('/scan/new')
  }

  // Transform snake_case to camelCase at boundary
  const resumeData = {
    id: resume.id,
    fileName: resume.file_name,
    extractionStatus: resume.extraction_status as 'completed' | 'failed' | 'pending',
    extractionError: resume.extraction_error,
    parsingStatus: resume.parsing_status as 'completed' | 'failed' | 'pending',
    parsingError: resume.parsing_error,
    parsedSections: resume.parsed_sections,
  }

  const canProceed =
    resumeData.extractionStatus === 'completed' &&
    resumeData.parsingStatus === 'completed' &&
    resumeData.parsedSections !== null

  return (
    <div className="space-y-6" data-testid="preview-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Resume Preview</h1>
        {canProceed && (
          <Link href={`/scan/job-description?resumeId=${resumeId}`}>
            <Button size="lg" data-testid="proceed-button">
              Proceed to Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      <div data-testid="resume-preview-container">
        <ResumePreview
          resume={resumeData}
          isLoading={false}
          reuploadHref="/scan/new"
        />
      </div>
    </div>
  )
}

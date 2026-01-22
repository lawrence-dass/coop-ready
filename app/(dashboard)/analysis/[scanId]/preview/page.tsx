import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResumeContent } from './_components/ResumeContent'
import { PreviewHeader } from './_components/PreviewHeader'
import { PreviewFooter } from './_components/PreviewFooter'
import { mergeAcceptedSuggestions } from '@/lib/utils/resume-merging'
import type { StoredResume } from '@/lib/types/resume'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface PageProps {
  params: {
    scanId: string
  }
}

/**
 * Resume Preview Page with Applied Suggestions
 *
 * Displays the resume with all accepted suggestions applied and highlighted.
 * Allows users to review changes before downloading.
 *
 * @see Story 5.8: Optimized Resume Preview
 */
export default async function PreviewPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch scan data
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('id, user_id, parsed_resume, job_description, created_at')
    .eq('id', params.scanId)
    .eq('user_id', user.id)
    .single()

  if (scanError || !scan) {
    console.error('[preview]', 'Scan not found:', scanError)
    notFound()
  }

  const resumeData: StoredResume = scan.parsed_resume || {}

  // Fetch all suggestions for this scan
  const { data: suggestions, error: suggestionsError } = await supabase
    .from('suggestions')
    .select(
      'id, section, item_index, original_text, suggested_text, suggestion_type, reasoning, status'
    )
    .eq('scan_id', params.scanId)
    .eq('user_id', user.id)
    .order('section, item_index')

  if (suggestionsError) {
    console.error('[preview]', suggestionsError)
    notFound()
  }

  // Transform DB snake_case to camelCase
  const transformedSuggestions = (suggestions || []).map((s) => ({
    id: s.id,
    section: s.section,
    itemIndex: s.item_index,
    originalText: s.original_text,
    suggestedText: s.suggested_text,
    suggestionType: s.suggestion_type,
    reasoning: s.reasoning,
    status: s.status,
  }))

  // Merge accepted suggestions into resume
  const mergedContent = mergeAcceptedSuggestions(resumeData, transformedSuggestions)

  // Count suggestions by status
  const stats = {
    total: transformedSuggestions.length,
    accepted: transformedSuggestions.filter((s) => s.status === 'accepted').length,
    rejected: transformedSuggestions.filter((s) => s.status === 'rejected').length,
    pending: transformedSuggestions.filter((s) => s.status === 'pending').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-gray-500 mb-6"
        >
          <Link
            href="/dashboard"
            className="hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/scan/${params.scanId}`}
            className="hover:text-gray-700 transition-colors"
          >
            Analysis
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/analysis/${params.scanId}/suggestions`}
            className="hover:text-gray-700 transition-colors"
          >
            Suggestions
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Preview</span>
        </nav>

        {/* Header */}
        <PreviewHeader
          stats={stats}
          hasChanges={stats.accepted > 0}
        />

        {/* Main Preview Content */}
        <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
          {stats.accepted === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No changes accepted
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't accepted any suggestions yet. You can go back and review them if you'd like to optimize your resume.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href={`/analysis/${params.scanId}/suggestions`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Back to Review
                </Link>
                <Link
                  href={`/analysis/${params.scanId}/download`}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Download Anyway
                </Link>
              </div>
            </div>
          ) : (
            <ResumeContent
              mergedContent={mergedContent}
              scanId={params.scanId}
              suggestions={transformedSuggestions}
            />
          )}
        </div>

        {/* Footer with actions */}
        <PreviewFooter
          scanId={params.scanId}
          hasChanges={stats.accepted > 0}
        />
      </div>
    </div>
  )
}

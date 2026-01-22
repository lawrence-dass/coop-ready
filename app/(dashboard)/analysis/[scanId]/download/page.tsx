import { redirect } from 'next/navigation'
import { validateDownloadAccess } from '@/actions/download'
import { DownloadContainer } from '@/components/download/DownloadContainer'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    scanId: string
  }
}

export const metadata = {
  title: 'Download Resume | CoopReady',
  description: 'Download your optimized resume in PDF or DOCX format',
}

/**
 * Download Page
 *
 * Provides format selection (PDF/DOCX) and handles download flow.
 * Shows warning if no suggestions have been accepted.
 *
 * @see Story 10.2: Fix Download Resume Error
 */
export default async function DownloadPage({ params }: PageProps) {
  // Validate access and get suggestion stats
  const validation = await validateDownloadAccess({ scanId: params.scanId })

  if (validation.error) {
    // Redirect to dashboard if unauthorized or scan not found
    redirect('/dashboard')
  }

  const { hasAcceptedSuggestions } = validation.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/dashboard" className="hover:text-gray-700">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
          <Link href={`/scan/${params.scanId}`} className="hover:text-gray-700">
            Analysis
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
          <Link href={`/analysis/${params.scanId}/suggestions`} className="hover:text-gray-700">
            Suggestions
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
          <Link href={`/analysis/${params.scanId}/preview`} className="hover:text-gray-700">
            Preview
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
          <span className="text-gray-900 font-medium">Download</span>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Download Your Resume
          </h1>
          <p className="text-gray-600">
            Choose your preferred format and download your optimized resume.
          </p>
        </div>

        {/* Download Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <DownloadContainer
            scanId={params.scanId}
            hasAcceptedSuggestions={hasAcceptedSuggestions}
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            PDF format is best for submitting to ATS systems.
            DOCX format allows you to make additional edits.
          </p>
        </div>
      </div>
    </div>
  )
}

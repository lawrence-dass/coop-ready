'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'

interface PreviewFooterProps {
  scanId: string
  hasChanges: boolean
}

export function PreviewFooter({ scanId, hasChanges }: PreviewFooterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDownload = () => {
    startTransition(() => {
      router.push(`/analysis/${scanId}/download`)
    })
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="mt-12 flex items-center justify-between gap-4 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Review
      </button>

      <button
        onClick={handleDownload}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            Continue to Download
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  )
}

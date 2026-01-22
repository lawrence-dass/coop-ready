'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'

interface PreviewHeaderProps {
  stats: {
    total: number
    accepted: number
    rejected: number
    pending: number
  }
  hasChanges: boolean
}

export function PreviewHeader({ stats, hasChanges }: PreviewHeaderProps) {
  const percentageAccepted =
    stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Resume Preview</h1>
        <span className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg">
          Step 3 of 3
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Suggestions</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
          <p className="text-sm text-green-700 mb-1">Accepted</p>
          <p className="text-2xl font-bold text-green-900">{stats.accepted}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-700 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Completion</p>
          <p className="text-2xl font-bold text-gray-900">{percentageAccepted}%</p>
        </div>
      </div>

      {/* Status message */}
      {hasChanges ? (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">
              {stats.accepted} suggestion{stats.accepted !== 1 ? 's' : ''} applied
            </p>
            <p className="text-sm text-green-700">
              Below is your resume with all accepted changes integrated and highlighted.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-700">Ready to review</p>
            <p className="text-sm text-gray-600">
              Review your options below to continue.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

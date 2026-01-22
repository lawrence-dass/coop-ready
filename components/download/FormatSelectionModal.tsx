'use client'

/**
 * FormatSelectionModal Component
 * Displays PDF and DOCX format options with descriptions
 * Story 6.4: Download UI & Format Selection - AC2
 */

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2 } from 'lucide-react'

export interface FormatSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (format: 'pdf' | 'docx') => void
  isLoading: boolean
}

/**
 * Modal for selecting resume download format
 */
export function FormatSelectionModal({
  isOpen,
  onClose,
  onSelect,
  isLoading,
}: FormatSelectionModalProps): React.ReactElement {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="sm:max-w-md sm:mx-auto"
        aria-label="Select download format"
      >
        <SheetHeader>
          <SheetTitle>Choose Download Format</SheetTitle>
          <SheetDescription>
            Select your preferred file format for the optimized resume
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-6">
          {/* PDF Option */}
          <button
            onClick={() => onSelect('pdf')}
            disabled={isLoading}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left group"
            aria-label="Download as PDF"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <FileText className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">PDF</h3>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Professional, read-only format. Best for job applications and ATS systems.
                </p>
              </div>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
              )}
            </div>
          </button>

          {/* DOCX Option */}
          <button
            onClick={() => onSelect('docx')}
            disabled={isLoading}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left group"
            aria-label="Download as DOCX"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Download className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">DOCX</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Editable in Microsoft Word. Make further changes if needed.
                </p>
              </div>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
              )}
            </div>
          </button>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full"
            aria-label="Cancel download"
          >
            Cancel
          </Button>
        </div>

        {/* Loading State Message */}
        {isLoading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 text-center">
              Generating your resume...
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

'use client'

/**
 * DownloadButton Component
 * Primary button to initiate resume download flow
 * Story 6.4: Download UI & Format Selection - AC1
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

export interface DownloadButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/**
 * Button component for initiating resume download
 */
export function DownloadButton({
  onClick,
  isLoading,
  disabled = false,
  variant = 'default',
  size = 'lg',
  className,
}: DownloadButtonProps): React.ReactElement {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
      aria-label={isLoading ? 'Generating resume...' : 'Download resume'}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="mr-2 h-5 w-5" aria-hidden="true" />
          <span>Download Resume</span>
        </>
      )}
    </Button>
  )
}

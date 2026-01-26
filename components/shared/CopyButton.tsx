'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;

  /** Button label (default: "Copy") */
  label?: string;

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';

  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /** Show text label (default: true) */
  showLabel?: boolean;

  /** How long to show "Copied!" state in milliseconds (default: 2000) */
  successDuration?: number;

  /** Callback after copy attempt */
  onCopy?: (success: boolean) => void;

  /** Additional className */
  className?: string;
}

/**
 * CopyButton Component
 *
 * Reusable button that copies text to clipboard with visual feedback.
 * Shows toast notification and changes button state after successful copy.
 *
 * Story 6.6: Implement Copy to Clipboard
 */
export function CopyButton({
  text,
  label = 'Copy',
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
  successDuration = 2000,
  onCopy,
  className,
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) {
      toast.error('Nothing to copy');
      onCopy?.(false);
      return;
    }

    try {
      // Use modern Clipboard API
      await navigator.clipboard.writeText(text);

      // Success state
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      onCopy?.(true);

      // Reset after specified duration
      setTimeout(() => {
        setIsCopied(false);
      }, successDuration);
    } catch (error) {
      // Handle clipboard API failure
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
      onCopy?.(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={isCopied}
      aria-label={isCopied ? 'Copied!' : label}
      className={cn('gap-2', className)}
    >
      {isCopied ? (
        <Check className="w-4 h-4" data-testid="check-icon" />
      ) : (
        <Copy className="w-4 h-4" data-testid="copy-icon" />
      )}
      {showLabel && (isCopied ? 'Copied!' : label)}
    </Button>
  );
}

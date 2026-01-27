/**
 * Unit tests for CopyButton component
 * Story 6.6: Implement Copy to Clipboard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CopyButton } from '@/components/shared/CopyButton';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CopyButton', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe('Rendering', () => {
    it('should render with default label "Copy"', () => {
      render(<CopyButton text="Test text" />);
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(<CopyButton text="Test text" label="Copy suggestion" />);
      expect(screen.getByRole('button', { name: /copy suggestion/i })).toBeInTheDocument();
    });

    it('should show Copy icon by default', () => {
      render(<CopyButton text="Test text" />);
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    });
  });

  describe('Clipboard API success', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(() => Promise.resolve()),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should copy text to clipboard on click', async () => {
      const testText = 'Test suggestion text';
      render(<CopyButton text={testText} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
    });

    it('should show success toast after copying', async () => {
      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });

    it('should change button state to "Copied!" with checkmark', async () => {
      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should reset button state after successDuration', async () => {
      render(<CopyButton text="Test text" successDuration={2000} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      // Verify copied state
      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
      expect(button).toBeDisabled();

      // Advance past successDuration
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Verify reset back to Copy state
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).not.toBeDisabled();
    });

    it('should accept custom successDuration prop', async () => {
      render(<CopyButton text="Test text" successDuration={500} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
      expect(button).toBeDisabled();

      // Advance past custom duration
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Should have reset
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should disable button during copied state', async () => {
      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(button).toBeDisabled();
    });

    it('should call onCopy callback with true on success', async () => {
      const onCopy = vi.fn();
      render(<CopyButton text="Test text" onCopy={onCopy} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(onCopy).toHaveBeenCalledWith(true);
    });
  });

  describe('Clipboard API failure', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(() => Promise.reject(new Error('Permission denied'))),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should show error toast on clipboard failure', async () => {
      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('should not change button state on error', async () => {
      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(toast.error).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      expect(screen.queryByText(/copied!/i)).not.toBeInTheDocument();
    });

    it('should call onCopy callback with false on failure', async () => {
      const onCopy = vi.fn();
      render(<CopyButton text="Test text" onCopy={onCopy} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(onCopy).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(() => Promise.resolve()),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should have proper aria-label', () => {
      render(<CopyButton text="Test text" label="Copy suggestion" />);
      const button = screen.getByRole('button', { name: /copy suggestion/i });
      expect(button).toBeInTheDocument();
    });

    it('should update aria-label to Copied! after copy', async () => {
      render(<CopyButton text="Test text" label="Copy suggestion" />);

      const button = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    });

    it('should be a button element supporting native keyboard activation', () => {
      render(<CopyButton text="Test text" />);
      const button = screen.getByRole('button', { name: /copy/i });
      // Native <button> elements support Enter and Space keyboard activation
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(() => Promise.resolve()),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should complete copy operation in under 100ms', async () => {
      vi.useRealTimers();
      const startTime = Date.now();

      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100);

      vi.useFakeTimers();
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(() => Promise.resolve()),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should show error toast for empty text and not call clipboard API', async () => {
      const onCopy = vi.fn();
      render(<CopyButton text="" onCopy={onCopy} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Nothing to copy');
      expect(onCopy).toHaveBeenCalledWith(false);
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(5000);
      render(<CopyButton text={longText} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longText);
    });

    it('should handle text with special characters', async () => {
      const specialText = 'Test\nwith\ttabs and\nnewlines & symbols!';
      render(<CopyButton text={specialText} />);

      const button = screen.getByRole('button', { name: /copy/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialText);
    });

    it('should prevent rapid double-clicks', async () => {
      render(<CopyButton text="Test text" />);

      const button = screen.getByRole('button', { name: /copy/i });

      // First click
      await act(async () => {
        fireEvent.click(button);
      });

      // Button should now be disabled, second click ignored
      fireEvent.click(button);

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });
});

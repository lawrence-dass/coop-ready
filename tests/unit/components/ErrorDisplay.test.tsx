/**
 * Unit Tests: ErrorDisplay Component
 *
 * Tests the generalized error display component that shows user-friendly
 * error messages across the application.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

describe('ErrorDisplay', () => {
  describe('rendering', () => {
    it('renders with required props', () => {
      render(<ErrorDisplay errorCode="LLM_TIMEOUT" />);

      // Should display error title
      expect(screen.getByText('Optimization Took Too Long')).toBeInTheDocument();

      // Should display error message
      expect(screen.getByText(/exceeded the 60-second time limit/i)).toBeInTheDocument();

      // Should display recovery action
      expect(screen.getByText(/Please try again/i)).toBeInTheDocument();

      // Should display error code with prefix
      expect(screen.getByText('Error code: LLM_TIMEOUT')).toBeInTheDocument();
    });

    it('renders with custom message override', () => {
      const customMessage = 'This is a custom error message';
      render(
        <ErrorDisplay
          errorCode="LLM_ERROR"
          message={customMessage}
        />
      );

      // Should use custom message instead of default
      expect(screen.getByText(customMessage)).toBeInTheDocument();

      // Should still show title and recovery action from mapping
      expect(screen.getByText('Optimization Failed')).toBeInTheDocument();
      expect(screen.getByText(/try again in a few moments/i)).toBeInTheDocument();
    });

    it('renders all standard error codes correctly', () => {
      const errorCodes = [
        'INVALID_FILE_TYPE',
        'FILE_TOO_LARGE',
        'PARSE_ERROR',
        'LLM_TIMEOUT',
        'LLM_ERROR',
        'RATE_LIMITED',
        'VALIDATION_ERROR',
      ];

      errorCodes.forEach((code) => {
        const { unmount } = render(<ErrorDisplay errorCode={code} />);

        // Each error should display its code with prefix
        expect(screen.getByText(`Error code: ${code}`)).toBeInTheDocument();

        // Each error should have title, message, and recovery action
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/.+/); // Has content

        unmount();
      });
    });

    it('renders dismiss button when onDismiss provided', () => {
      const handleDismiss = vi.fn();
      render(
        <ErrorDisplay
          errorCode="LLM_TIMEOUT"
          onDismiss={handleDismiss}
        />
      );

      const dismissButton = screen.getByLabelText(/close error/i);
      expect(dismissButton).toBeInTheDocument();
    });

    it('does not render dismiss button when onDismiss not provided', () => {
      render(<ErrorDisplay errorCode="LLM_TIMEOUT" />);

      const dismissButton = screen.queryByLabelText(/close error/i);
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ErrorDisplay
          errorCode="LLM_TIMEOUT"
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="alert" attribute', () => {
      render(<ErrorDisplay errorCode="LLM_TIMEOUT" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live="polite" attribute', () => {
      render(<ErrorDisplay errorCode="LLM_TIMEOUT" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('dismiss button has accessible label', () => {
      const handleDismiss = vi.fn();
      render(
        <ErrorDisplay
          errorCode="LLM_TIMEOUT"
          onDismiss={handleDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Close error');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onDismiss when dismiss button clicked', () => {
      const handleDismiss = vi.fn();

      render(
        <ErrorDisplay
          errorCode="LLM_TIMEOUT"
          onDismiss={handleDismiss}
        />
      );

      const dismissButton = screen.getByLabelText(/close error/i);
      fireEvent.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('allows multiple dismiss clicks', () => {
      const handleDismiss = vi.fn();

      render(
        <ErrorDisplay
          errorCode="LLM_TIMEOUT"
          onDismiss={handleDismiss}
        />
      );

      const dismissButton = screen.getByLabelText(/close error/i);

      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalledTimes(2);
    });
  });

  describe('error code handling', () => {
    it('handles unknown error codes gracefully', () => {
      render(<ErrorDisplay errorCode="UNKNOWN_ERROR_CODE" />);

      // Should show default error message
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();

      // Should still display the unknown error code with prefix
      expect(screen.getByText('Error code: UNKNOWN_ERROR_CODE')).toBeInTheDocument();
    });
  });

  describe('visual structure', () => {
    it('displays error icon', () => {
      const { container } = render(<ErrorDisplay errorCode="LLM_TIMEOUT" />);

      // AlertCircle icon should be present (lucide-react renders SVG)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('displays all content sections in correct order', () => {
      render(
        <ErrorDisplay
          errorCode="LLM_TIMEOUT"
          onDismiss={vi.fn()}
        />
      );

      const alert = screen.getByRole('alert');
      const text = alert.textContent || '';

      // Title should come before message
      const titleIndex = text.indexOf('Optimization Took Too Long');
      const messageIndex = text.indexOf('exceeded the 60-second');
      expect(titleIndex).toBeLessThan(messageIndex);

      // Message should come before recovery action
      const recoveryIndex = text.indexOf('Please try again');
      expect(messageIndex).toBeLessThan(recoveryIndex);

      // Recovery action should come before error code
      const codeIndex = text.indexOf('LLM_TIMEOUT');
      expect(recoveryIndex).toBeLessThan(codeIndex);
    });
  });
});

/**
 * PrivacyConsentDialog Component Tests
 *
 * Story 15.2: Create Privacy Consent Dialog
 *
 * Tests all acceptance criteria:
 * - AC #1: Data handling disclosure visible
 * - AC #2: Privacy Policy and Terms of Service links
 * - AC #3: Checkbox interaction with button enable/disable
 * - AC #4: "I Agree" and "Cancel" button actions
 * - AC #5: Accessibility features (focus, ARIA, keyboard)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyConsentDialog } from '@/components/shared/PrivacyConsentDialog';

describe('PrivacyConsentDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnAccept = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: Data handling disclosure', () => {
    it('renders all 4 data handling points when dialog is open', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      // Check for all 4 required data handling points
      // Point 1: AI processing (check the full description)
      expect(
        screen.getByText(
          /Your resume is processed using Anthropic.*Claude API.*optimization suggestions/i
        )
      ).toBeInTheDocument();

      // Point 2: Secure storage (check the full description)
      expect(
        screen.getByText(/Your data is stored securely.*only accessible to you/i)
      ).toBeInTheDocument();

      // Point 3: Not used for training (check the full description)
      expect(
        screen.getByText(/resume content is never used to train AI models or shared with third parties/i)
      ).toBeInTheDocument();

      // Point 4: User can delete (check the full description)
      expect(
        screen.getByText(/full control.*delete it permanently at any time/i)
      ).toBeInTheDocument();
    });

    it('shows title "Privacy & Data Handling"', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(
        screen.getByRole('heading', { name: /Privacy & Data Handling/i })
      ).toBeInTheDocument();
    });

    it('shows description about data handling', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(
        screen.getByText(/before uploading.*review.*data/i)
      ).toBeInTheDocument();
    });
  });

  describe('AC #2: Privacy Policy and Terms of Service links', () => {
    it('renders Privacy Policy link', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const privacyLink = screen.getByRole('link', {
        name: /Privacy Policy/i,
      });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });

    it('renders Terms of Service link', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const termsLink = screen.getByRole('link', {
        name: /Terms of Service/i,
      });
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('target', '_blank');
    });

    it('has rel="noopener noreferrer" on external links for security', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const privacyLink = screen.getByRole('link', {
        name: /Privacy Policy/i,
      });
      const termsLink = screen.getByRole('link', {
        name: /Terms of Service/i,
      });

      // Security: prevent tabnabbing attacks
      expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('AC #3: Checkbox interaction with button state', () => {
    it('disables "I Agree" button when checkbox is unchecked', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const agreeButton = screen.getByRole('button', { name: /I Agree/i });
      expect(agreeButton).toBeDisabled();
    });

    it('enables "I Agree" button when checkbox is checked', async () => {
      const user = userEvent.setup();

      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const checkbox = screen.getByRole('checkbox', {
        name: /I understand how my data will be handled/i,
      });
      const agreeButton = screen.getByRole('button', { name: /I Agree/i });

      // Initially disabled
      expect(agreeButton).toBeDisabled();

      // Check the checkbox
      await user.click(checkbox);

      // Button should now be enabled
      expect(agreeButton).toBeEnabled();
    });

    it('renders checkbox with correct label', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const checkbox = screen.getByRole('checkbox', {
        name: /I understand how my data will be handled/i,
      });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('AC #4: Button actions', () => {
    it('calls onAccept and closes dialog when "I Agree" is clicked with checkbox checked', async () => {
      const user = userEvent.setup();

      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      const agreeButton = screen.getByRole('button', { name: /I Agree/i });

      // Check the checkbox
      await user.click(checkbox);

      // Click "I Agree"
      await user.click(agreeButton);

      // Both callbacks should be called
      expect(mockOnAccept).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call onAccept when checkbox is unchecked', async () => {
      const user = userEvent.setup();

      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const agreeButton = screen.getByRole('button', { name: /I Agree/i });

      // Button is disabled, so click should not trigger action
      expect(agreeButton).toBeDisabled();
      expect(mockOnAccept).not.toHaveBeenCalled();
    });

    it('calls onOpenChange with false when "Cancel" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('renders both "I Agree" and "Cancel" buttons', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(
        screen.getByRole('button', { name: /I Agree/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
    });
  });

  describe('AC #5: Accessibility features', () => {
    it('has role="dialog" on the dialog container', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has correct ARIA attributes on the dialog', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const dialog = screen.getByRole('dialog');
      // Dialog has accessible description and label
      expect(dialog).toHaveAttribute('aria-describedby');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('checkbox has associated label for accessibility', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      const checkbox = screen.getByRole('checkbox', {
        name: /I understand how my data will be handled/i,
      });
      expect(checkbox).toBeInTheDocument();
    });

    it('buttons have accessible names', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(
        screen.getByRole('button', { name: /I Agree/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
    });
  });

  describe('Dialog visibility', () => {
    it('does not render when open=false', () => {
      render(
        <PrivacyConsentDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when open=true', () => {
      render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Checkbox state reset on dialog reopen', () => {
    it('resets checkbox to unchecked when dialog is reopened', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      // Check the checkbox
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      // Close the dialog by changing open to false
      rerender(
        <PrivacyConsentDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      // Reopen the dialog
      rerender(
        <PrivacyConsentDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAccept={mockOnAccept}
        />
      );

      // Checkbox should be unchecked (reset state)
      const reopenedCheckbox = screen.getByRole('checkbox');
      expect(reopenedCheckbox).not.toBeChecked();

      // And the "I Agree" button should be disabled again
      const agreeButton = screen.getByRole('button', { name: /I Agree/i });
      expect(agreeButton).toBeDisabled();
    });
  });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientSettingsPage } from '@/app/(authenticated)/(dashboard)/settings/ClientSettingsPage';
import { updateUserPreferences } from '@/actions/settings/update-user-preferences';
import { signOut } from '@/actions/auth/sign-out';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: Settings Page Integration Tests
 *
 * Tests the settings page rendering all sections and interactions.
 *
 * Priority Distribution:
 * - P0: 6 tests (renders all sections, preferences save, sign out, profile display, privacy display, error handling)
 * - P1: 2 tests (form validation, mobile responsive)
 */

// Mock actions
vi.mock('@/actions/settings/update-user-preferences', () => ({
  updateUserPreferences: vi.fn(),
}));

vi.mock('@/actions/auth/sign-out', () => ({
  signOut: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('Story 16.6: Settings Page Integration', () => {
  const mockUser = {
    email: 'test@example.com',
    createdAt: '2026-01-24T10:00:00Z',
    id: 'user-123',
  };

  const mockPreferences = {
    jobType: 'Full-time' as const,
    modLevel: 'Moderate' as const,
    industry: 'Technology',
    keywords: 'React, TypeScript',
  };

  const mockPrivacyConsent = {
    accepted: true,
    acceptedAt: '2026-01-24T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 16.6-SETTINGS-001: should render all settings sections', () => {
    // WHEN: Rendering ClientSettingsPage
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    // THEN: Should display all four sections
    expect(screen.getByText(/Profile Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimization Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Account Actions/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-SETTINGS-002: should display user profile information correctly', () => {
    // WHEN: Rendering settings page
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    // THEN: Should show user email and account creation date
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    // Use getAllByText since date appears in both Profile and Privacy sections
    const dates = screen.getAllByText(/Jan 24, 2026/i);
    expect(dates.length).toBeGreaterThan(0);
    expect(screen.getByText('user-123')).toBeInTheDocument();
  });

  test('[P0] 16.6-SETTINGS-003: should save preferences successfully', async () => {
    // GIVEN: Mock successful preference save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: { ...mockPreferences, industry: 'Healthcare' },
      error: null,
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');

    // WHEN: User updates and saves preferences
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'Healthcare');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await user.click(saveButton);

    // THEN: Should call update action and show success (no userId - gets from auth context)
    await waitFor(() => {
      expect(updateUserPreferences).toHaveBeenCalledWith(expect.objectContaining({
        industry: 'Healthcare',
      }));
      expect(toast.success).toHaveBeenCalledWith('Preferences saved successfully');
    });
  });

  test('[P0] 16.6-SETTINGS-004: should sign out successfully', async () => {
    // GIVEN: Mock successful sign out
    vi.mocked(signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');

    // WHEN: User clicks sign out
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutButton);

    // THEN: Should call signOut and show success
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test('[P0] 16.6-SETTINGS-005: should display privacy consent status correctly', () => {
    // WHEN: Rendering with accepted consent
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    // THEN: Should show accepted status with date
    expect(screen.getByText(/Accepted on/i)).toBeInTheDocument();
    expect(screen.getByText(/Review Privacy Policy/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-SETTINGS-006: should handle preference save error gracefully', async () => {
    // GIVEN: Mock failed save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: null,
      error: { message: 'Failed to save preferences', code: 'VALIDATION_ERROR' },
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');

    // WHEN: User tries to save preferences
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'New Industry');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await user.click(saveButton);

    // THEN: Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save preferences');
    });
  });

  test('[P1] 16.6-SETTINGS-007: should have delete account button disabled', () => {
    // WHEN: Rendering settings page
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    // THEN: Delete account button should be disabled
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    expect(deleteButton).toBeDisabled();
  });

  test('[P1] 16.6-SETTINGS-008: should display privacy policy link', () => {
    // WHEN: Rendering settings page
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    // THEN: Privacy policy link should be present (opens in new tab)
    const link = screen.getByRole('link', { name: /Review Privacy Policy/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('[P1] 16.6-SETTINGS-009: should organize sections with visual separation', () => {
    // WHEN: Rendering settings page
    const { container } = render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={mockPrivacyConsent}
      />
    );

    // THEN: Should use card components for separation
    const cards = container.querySelectorAll('[class*="card"]');
    expect(cards.length).toBeGreaterThanOrEqual(4); // One for each section
  });

  test('[P1] 16.6-SETTINGS-010: should handle not accepted privacy consent', () => {
    // GIVEN: Not accepted consent
    const notAcceptedConsent = {
      accepted: false,
      acceptedAt: null,
    };

    // WHEN: Rendering settings page
    render(
      <ClientSettingsPage
        user={mockUser}
        preferences={mockPreferences}
        privacyConsent={notAcceptedConsent}
      />
    );

    // THEN: Should show "Not accepted" status
    expect(screen.getByText(/Not accepted/i)).toBeInTheDocument();
  });
});

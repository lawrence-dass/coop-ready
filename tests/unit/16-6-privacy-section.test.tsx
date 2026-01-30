import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacySection } from '@/app/app/(dashboard)/settings/PrivacySection';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: PrivacySection Component Unit Tests
 *
 * Tests the PrivacySection component displaying consent status correctly.
 *
 * Priority Distribution:
 * - P0: 4 tests (renders section, accepted status, not accepted status, privacy link)
 * - P1: 2 tests (download button, date formatting)
 */

describe('Story 16.6: PrivacySection Component', () => {
  test('[P0] 16.6-PRIVACY-001: should render privacy section with all elements', () => {
    // GIVEN: Accepted consent
    const consent = {
      accepted: true,
      acceptedAt: '2026-01-24T10:00:00Z',
    };

    // WHEN: Rendering PrivacySection
    render(<PrivacySection consent={consent} />);

    // THEN: Should display all privacy elements
    expect(screen.getByText(/Privacy Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy consent/i)).toBeInTheDocument();
    expect(screen.getByText(/Review Privacy Policy/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-PRIVACY-002: should display accepted consent status with date', () => {
    // GIVEN: Accepted consent with date
    const consent = {
      accepted: true,
      acceptedAt: '2026-01-24T10:00:00Z',
    };

    // WHEN: Rendering PrivacySection
    render(<PrivacySection consent={consent} />);

    // THEN: Should show "Accepted on [date]"
    expect(screen.getByText(/Accepted on/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 24, 2026/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-PRIVACY-003: should display not accepted status', () => {
    // GIVEN: Not accepted consent
    const consent = {
      accepted: false,
      acceptedAt: null,
    };

    // WHEN: Rendering PrivacySection
    render(<PrivacySection consent={consent} />);

    // THEN: Should show "Not accepted"
    expect(screen.getByText(/Not accepted/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-PRIVACY-004: should have privacy policy button', () => {
    // GIVEN: Any consent status
    const consent = {
      accepted: true,
      acceptedAt: '2026-01-24T10:00:00Z',
    };

    // Mock window.open
    const mockOpen = vi.fn();
    global.window.open = mockOpen;

    // WHEN: Rendering PrivacySection
    render(<PrivacySection consent={consent} />);

    // THEN: Should have button to open privacy policy
    const button = screen.getByRole('button', { name: /Review Privacy Policy/i });
    expect(button).toBeInTheDocument();
  });

  test('[P1] 16.6-PRIVACY-005: should show download data button as disabled', () => {
    // GIVEN: Any consent status
    const consent = {
      accepted: true,
      acceptedAt: '2026-01-24T10:00:00Z',
    };

    // WHEN: Rendering PrivacySection
    render(<PrivacySection consent={consent} />);

    // THEN: Should have disabled download button
    const downloadButton = screen.getByText(/Download My Data/i);
    expect(downloadButton).toBeInTheDocument();
    const button = downloadButton.closest('button');
    expect(button).toBeDisabled();
  });

  test('[P1] 16.6-PRIVACY-006: should format different consent dates correctly', () => {
    // GIVEN: Different date format
    const consent = {
      accepted: true,
      acceptedAt: '2026-12-31T23:59:59Z',
    };

    // WHEN: Rendering PrivacySection
    render(<PrivacySection consent={consent} />);

    // THEN: Should format date correctly
    expect(screen.getByText(/Dec 31, 2026/i)).toBeInTheDocument();
  });

  test('[P1] 16.6-PRIVACY-007: should use card layout for visual separation', () => {
    // GIVEN: Any consent status
    const consent = {
      accepted: true,
      acceptedAt: '2026-01-24T10:00:00Z',
    };

    // WHEN: Rendering PrivacySection
    const { container } = render(<PrivacySection consent={consent} />);

    // THEN: Should have card structure
    const card = container.querySelector('[class*="card"]');
    expect(card).toBeTruthy();
  });
});

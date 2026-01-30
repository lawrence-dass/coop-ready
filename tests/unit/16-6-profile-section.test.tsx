import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileSection } from '@/app/app/(dashboard)/settings/ProfileSection';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: ProfileSection Component Unit Tests
 *
 * Tests the ProfileSection component rendering user information correctly.
 *
 * Priority Distribution:
 * - P0: 4 tests (renders all fields, displays email, formats date, shows userId)
 */

describe('Story 16.6: ProfileSection Component', () => {
  const mockUser = {
    email: 'user@example.com',
    createdAt: '2026-01-24T10:30:00Z',
    userId: 'user-123-abc',
  };

  test('[P0] 16.6-UI-001: should render profile section with all fields', () => {
    // WHEN: Rendering ProfileSection with user data
    render(<ProfileSection {...mockUser} />);

    // THEN: Should display all profile fields
    expect(screen.getByText(/Profile Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Member Since/i)).toBeInTheDocument();
    expect(screen.getByText(/User ID/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-UI-002: should display user email correctly', () => {
    // WHEN: Rendering ProfileSection with user email
    render(<ProfileSection {...mockUser} />);

    // THEN: Should show the exact email address
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  test('[P0] 16.6-UI-003: should format account creation date correctly', () => {
    // WHEN: Rendering ProfileSection with creation date
    render(<ProfileSection {...mockUser} />);

    // THEN: Should format date as "Member since [formatted date]"
    expect(screen.getByText(/Jan 24, 2026/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-UI-004: should display user ID for debugging', () => {
    // WHEN: Rendering ProfileSection with userId
    render(<ProfileSection {...mockUser} />);

    // THEN: Should show userId value
    expect(screen.getByText('user-123-abc')).toBeInTheDocument();
  });

  test('[P1] 16.6-UI-005: should handle different date formats', () => {
    // GIVEN: Different date format
    const differentDateUser = {
      ...mockUser,
      createdAt: '2026-12-31T23:59:59Z',
    };

    // WHEN: Rendering ProfileSection
    render(<ProfileSection {...differentDateUser} />);

    // THEN: Should format date correctly
    expect(screen.getByText(/Dec 31, 2026/i)).toBeInTheDocument();
  });

  test('[P1] 16.6-UI-006: should use card layout for visual separation', () => {
    // WHEN: Rendering ProfileSection
    const { container } = render(<ProfileSection {...mockUser} />);

    // THEN: Should have card structure (check for card-related classes)
    const card = container.querySelector('[class*="card"]');
    expect(card).toBeTruthy();
  });
});

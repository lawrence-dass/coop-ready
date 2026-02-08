import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileSection } from '@/app/(authenticated)/(dashboard)/settings/ProfileSection';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: ProfileSection Component Unit Tests
 *
 * Tests the ProfileSection component rendering user information correctly.
 * ProfileSection now accepts { email, firstName, lastName } props.
 * Shows "Profile" card title, "Name", and "Email".
 *
 * Priority Distribution:
 * - P0: 4 tests (renders all fields, displays email, shows name, handles null name)
 */

describe('Story 16.6: ProfileSection Component', () => {
  const mockUser = {
    email: 'user@example.com',
    firstName: 'John' as string | null,
    lastName: 'Doe' as string | null,
  };

  test('[P0] 16.6-UI-001: should render profile section with all fields', () => {
    // WHEN: Rendering ProfileSection with user data
    render(<ProfileSection {...mockUser} />);

    // THEN: Should display profile title, name, and email fields
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  test('[P0] 16.6-UI-002: should display user email correctly', () => {
    // WHEN: Rendering ProfileSection with user email
    render(<ProfileSection {...mockUser} />);

    // THEN: Should show the exact email address
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  test('[P0] 16.6-UI-003: should display user full name correctly', () => {
    // WHEN: Rendering ProfileSection with firstName and lastName
    render(<ProfileSection {...mockUser} />);

    // THEN: Should show the full name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('[P0] 16.6-UI-004: should handle null name gracefully', () => {
    // GIVEN: User with null firstName and lastName
    const nullNameUser = {
      email: 'user@example.com',
      firstName: null,
      lastName: null,
    };

    // WHEN: Rendering ProfileSection
    render(<ProfileSection {...nullNameUser} />);

    // THEN: Should show "Not provided" placeholder
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  test('[P1] 16.6-UI-005: should handle partial name (only firstName)', () => {
    // GIVEN: User with only firstName
    const partialNameUser = {
      email: 'user@example.com',
      firstName: 'Jane' as string | null,
      lastName: null,
    };

    // WHEN: Rendering ProfileSection
    render(<ProfileSection {...partialNameUser} />);

    // THEN: Should show just the firstName
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  test('[P1] 16.6-UI-006: should use card layout for visual separation', () => {
    // WHEN: Rendering ProfileSection
    const { container } = render(<ProfileSection {...mockUser} />);

    // THEN: Should have card structure (check for card-related classes)
    const card = container.querySelector('[class*="card"]');
    expect(card).toBeTruthy();
  });
});

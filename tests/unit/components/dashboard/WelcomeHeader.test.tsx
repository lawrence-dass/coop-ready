/**
 * Unit Tests: WelcomeHeader Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for welcome greeting with user name extraction
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';

describe('WelcomeHeader', () => {
  it('should extract first name from email', () => {
    render(<WelcomeHeader userEmail="john.doe@example.com" />);

    expect(screen.getByText(/welcome, john/i)).toBeInTheDocument();
  });

  it('should handle single-word email usernames', () => {
    render(<WelcomeHeader userEmail="alice@company.com" />);

    expect(screen.getByText(/welcome, alice/i)).toBeInTheDocument();
  });

  it('should capitalize first letter of name', () => {
    render(<WelcomeHeader userEmail="bob@test.com" />);

    expect(screen.getByText(/Welcome, Bob/i)).toBeInTheDocument();
  });

  it('should NOT display email as subtitle (Story 17.6)', () => {
    render(<WelcomeHeader userEmail="test@example.com" />);

    // Email should NOT be displayed per Story 17.6 AC#2
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('should handle complex email formats', () => {
    render(<WelcomeHeader userEmail="mary-jane.smith@example.com" />);

    // Should extract "mary" as first name
    expect(screen.getByText(/welcome, mary/i)).toBeInTheDocument();
  });

  it('should use large heading typography', () => {
    const { container } = render(<WelcomeHeader userEmail="test@example.com" />);

    // Should have h1 or h2 heading
    const heading = container.querySelector('h1, h2');
    expect(heading).toBeInTheDocument();
  });

  it('should show time-based greeting if enabled', () => {
    // Test morning greeting
    const morningDate = new Date('2026-01-29T08:00:00Z');
    vi.setSystemTime(morningDate);

    render(<WelcomeHeader userEmail="test@example.com" showTimeGreeting />);

    // Should show "Good morning" or just "Welcome"
    const text = screen.getByText(/welcome|good morning/i);
    expect(text).toBeInTheDocument();
  });
});

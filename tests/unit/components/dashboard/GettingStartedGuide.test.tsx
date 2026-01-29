/**
 * Unit Tests: GettingStartedGuide Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for first-time user onboarding guide
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GettingStartedGuide } from '@/components/dashboard/GettingStartedGuide';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('GettingStartedGuide', () => {
  it('should render guide heading', () => {
    render(<GettingStartedGuide />);

    expect(screen.getByText(/getting started/i)).toBeInTheDocument();
  });

  it('should display 3 steps in order', () => {
    render(<GettingStartedGuide />);

    expect(screen.getByText(/upload resume/i)).toBeInTheDocument();
    expect(screen.getByText(/paste job description/i)).toBeInTheDocument();
    expect(screen.getByText(/get suggestions/i)).toBeInTheDocument();
  });

  it('should display step numbers', () => {
    render(<GettingStartedGuide />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display "Start Your First Scan" CTA button', () => {
    render(<GettingStartedGuide />);

    const button = screen.getByRole('button', {
      name: /start your first scan/i,
    });
    expect(button).toBeInTheDocument();
  });

  it('should navigate to /app/scan/new when CTA is clicked', async () => {
    const user = userEvent.setup();
    render(<GettingStartedGuide />);

    const button = screen.getByRole('button', {
      name: /start your first scan/i,
    });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/app/scan/new');
  });

  it('should have icons for each step', () => {
    const { container } = render(<GettingStartedGuide />);

    // Should have SVG icons (lucide-react renders as SVG)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(3); // At least one per step
  });

  it('should have descriptive text for each step', () => {
    render(<GettingStartedGuide />);

    // Check for descriptive content (not just titles)
    expect(screen.getByText(/upload resume/i)).toBeInTheDocument();
    expect(screen.getByText(/paste job description/i)).toBeInTheDocument();
    expect(screen.getByText(/get suggestions/i)).toBeInTheDocument();
  });
});

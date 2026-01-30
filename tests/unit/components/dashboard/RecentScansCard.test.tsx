/**
 * Unit Tests: RecentScansCard Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for displaying recent optimization sessions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentScansCard } from '@/components/dashboard/RecentScansCard';
import type { HistorySession } from '@/types/history';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('RecentScansCard', () => {
  const mockSessions: HistorySession[] = [
    {
      id: 'session-1',
      createdAt: new Date('2026-01-27T10:00:00Z'),
      resumeName: 'Resume',
      jobTitle: 'Software Engineer',
      companyName: 'TechCorp',
      jdPreview: 'We are looking for a software engineer...',
      atsScore: 85,
      suggestionCount: 5,
    },
    {
      id: 'session-2',
      createdAt: new Date('2026-01-25T14:30:00Z'),
      resumeName: 'Resume',
      jobTitle: 'Product Manager',
      companyName: null,
      jdPreview: 'Product manager role...',
      atsScore: 72,
      suggestionCount: 8,
    },
    {
      id: 'session-3',
      createdAt: new Date('2026-01-20T09:15:00Z'),
      resumeName: 'Resume',
      jobTitle: null,
      companyName: null,
      jdPreview: null,
      atsScore: null,
      suggestionCount: 0,
    },
  ];

  it('should render section heading', () => {
    render(<RecentScansCard sessions={mockSessions} />);

    expect(screen.getByText('Recent Scans')).toBeInTheDocument();
  });

  it('should display all sessions up to 5', () => {
    render(<RecentScansCard sessions={mockSessions} />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
  });

  it('should show company name when available', () => {
    render(<RecentScansCard sessions={mockSessions} />);

    expect(screen.getByText(/TechCorp/i)).toBeInTheDocument();
  });

  it('should show date in human-readable format', () => {
    render(<RecentScansCard sessions={mockSessions} />);

    // Should show relative dates like "2 days ago" or actual dates
    // We'll verify date elements are rendered
    const dates = screen.getAllByText(/ago|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('should handle missing job title gracefully', () => {
    const sessions = [mockSessions[2]]; // Session without job title
    render(<RecentScansCard sessions={sessions} />);

    // Should show placeholder or skip job title display
    expect(screen.getByText(/ago|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)).toBeInTheDocument();
  });

  it('should be clickable and navigate to session', () => {
    const { container } = render(<RecentScansCard sessions={mockSessions} />);

    // Should have clickable cards with links
    const links = container.querySelectorAll('a[href^="/scan/"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should show empty state when no sessions', () => {
    render(<RecentScansCard sessions={[]} />);

    expect(
      screen.getByText(/no recent scans|get started/i)
    ).toBeInTheDocument();
  });

  it('should limit display to 5 sessions', () => {
    const manySessions: HistorySession[] = Array.from({ length: 10 }, (_, i) => ({
      id: `session-${i}`,
      createdAt: new Date(),
      resumeName: 'Resume',
      jobTitle: `Job ${i}`,
      companyName: null,
      jdPreview: null,
      atsScore: null,
      suggestionCount: 0,
    }));

    const { container } = render(<RecentScansCard sessions={manySessions} />);

    const links = container.querySelectorAll('a[href^="/scan/"]');
    expect(links.length).toBeLessThanOrEqual(5);
  });
});

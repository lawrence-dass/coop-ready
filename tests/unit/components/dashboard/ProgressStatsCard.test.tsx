/**
 * Unit Tests: ProgressStatsCard Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for placeholder progress statistics display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressStatsCard } from '@/components/dashboard/ProgressStatsCard';

describe('ProgressStatsCard', () => {
  it('should render "Your Progress" heading', () => {
    render(<ProgressStatsCard />);

    expect(screen.getByText('Your Progress')).toBeInTheDocument();
  });

  it('should display Total Scans stat with default value', () => {
    render(<ProgressStatsCard />);

    expect(screen.getByText(/total scans/i)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should display Total Scans stat with provided value', () => {
    render(<ProgressStatsCard totalScans={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display Average ATS Score stat with TBD', () => {
    render(<ProgressStatsCard />);

    expect(screen.getByText(/average.*score/i)).toBeInTheDocument();
    const tbdValues = screen.getAllByText(/--/);
    expect(tbdValues.length).toBeGreaterThan(0);
  });

  it('should display Improvement Rate stat with TBD', () => {
    render(<ProgressStatsCard />);

    expect(screen.getByText(/improvement/i)).toBeInTheDocument();
  });

  it('should show icons for each stat', () => {
    const { container } = render(<ProgressStatsCard />);

    // Should have SVG icons
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });

  it('should use muted text for TBD values', () => {
    const { container } = render(<ProgressStatsCard />);

    // TBD values should have muted classes
    const mutedElements = container.querySelectorAll('[class*="muted"]');
    expect(mutedElements.length).toBeGreaterThan(0);
  });

  it('should use grid layout for responsive design', () => {
    const { container } = render(<ProgressStatsCard />);

    // Should have grid container
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeInTheDocument();
  });
});

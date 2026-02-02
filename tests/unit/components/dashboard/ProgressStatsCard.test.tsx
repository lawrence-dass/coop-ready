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

  // ============================================================================
  // Story 17.5: Improvement Rate Display Tests
  // ============================================================================

  it('[P0] 17.5-CARD-001: Displays improvement rate with positive value', () => {
    render(
      <ProgressStatsCard
        totalScans={5}
        averageAtsScore={78}
        improvementRate={7.5}
      />
    );

    expect(screen.getByText('+8 pts')).toBeInTheDocument(); // Math.round(7.5)
    expect(screen.getByText(/improvement rate/i)).toBeInTheDocument();
  });

  it('[P0] 17.5-CARD-002: Displays improvement rate with negative value', () => {
    render(
      <ProgressStatsCard
        totalScans={5}
        averageAtsScore={78}
        improvementRate={-2.3}
      />
    );

    expect(screen.getByText('-2 pts')).toBeInTheDocument();
  });

  it('[P0] 17.5-CARD-003: Displays improvement rate with zero value', () => {
    render(
      <ProgressStatsCard
        totalScans={5}
        averageAtsScore={78}
        improvementRate={0}
      />
    );

    expect(screen.getByText('0 pts')).toBeInTheDocument();
  });

  it('[P0] 17.5-CARD-004: Displays -- when improvementRate is null', () => {
    render(
      <ProgressStatsCard
        totalScans={5}
        averageAtsScore={78}
        improvementRate={null}
      />
    );

    // Should have multiple "--" (Average ATS Score also shows -- if null)
    const dashMarkers = screen.getAllByText('--');
    expect(dashMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it('[P0] 17.5-CARD-005: Shows muted styling for TBD improvement rate', () => {
    const { container } = render(
      <ProgressStatsCard
        totalScans={5}
        averageAtsScore={78}
        improvementRate={null}
      />
    );

    // Find the stat card containing "Improvement Rate"
    const improvementCard = screen.getByText(/improvement rate/i).closest('div');
    expect(improvementCard).toBeTruthy();

    // The "--" value should have muted styling
    const mutedValue = improvementCard?.querySelector('[class*="muted-foreground"]');
    expect(mutedValue).toBeTruthy();
  });

  it('[P1] 17.5-CARD-006: Displays large positive improvement correctly', () => {
    render(
      <ProgressStatsCard
        totalScans={10}
        averageAtsScore={85}
        improvementRate={25.7}
      />
    );

    expect(screen.getByText('+26 pts')).toBeInTheDocument();
  });

  it('[P1] 17.5-CARD-007: Displays all three stats together correctly', () => {
    render(
      <ProgressStatsCard
        totalScans={12}
        averageAtsScore={72.5}
        improvementRate={8.2}
      />
    );

    expect(screen.getByText('12')).toBeInTheDocument(); // Total Scans
    expect(screen.getByText('73%')).toBeInTheDocument(); // Average ATS Score (rounded)
    expect(screen.getByText('+8 pts')).toBeInTheDocument(); // Improvement Rate
  });
});

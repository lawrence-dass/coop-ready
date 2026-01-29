/**
 * Unit Tests: QuickActionCard Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for reusable quick action CTA cards
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { ScanLine } from 'lucide-react';

describe('QuickActionCard', () => {
  const mockOnClick = vi.fn();

  it('should render card with title and description', () => {
    render(
      <QuickActionCard
        title="New Scan"
        description="Start a new resume optimization"
        icon={ScanLine}
        onClick={mockOnClick}
        ctaText="Get Started"
      />
    );

    expect(screen.getByText('New Scan')).toBeInTheDocument();
    expect(screen.getByText('Start a new resume optimization')).toBeInTheDocument();
  });

  it('should render CTA button with custom text', () => {
    render(
      <QuickActionCard
        title="New Scan"
        description="Start a new resume optimization"
        icon={ScanLine}
        onClick={mockOnClick}
        ctaText="Begin Scan"
      />
    );

    const button = screen.getByRole('button', { name: 'Begin Scan' });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick handler when CTA button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionCard
        title="New Scan"
        description="Start a new resume optimization"
        icon={ScanLine}
        onClick={mockOnClick}
        ctaText="Get Started"
      />
    );

    const button = screen.getByRole('button', { name: 'Get Started' });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render icon', () => {
    const { container } = render(
      <QuickActionCard
        title="New Scan"
        description="Start a new resume optimization"
        icon={ScanLine}
        onClick={mockOnClick}
        ctaText="Get Started"
      />
    );

    // Icon renders as SVG
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should apply hover effects', () => {
    const { container } = render(
      <QuickActionCard
        title="New Scan"
        description="Start a new resume optimization"
        icon={ScanLine}
        onClick={mockOnClick}
        ctaText="Get Started"
      />
    );

    // Card should have hover classes (shadow, etc.)
    const card = container.querySelector('[class*="hover"]');
    expect(card).toBeInTheDocument();
  });
});

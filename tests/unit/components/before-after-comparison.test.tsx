/**
 * Component Tests for Before/After Comparison
 *
 * Tests the BeforeAfterComparison, ComparisonCard, and TextDiff components.
 * Ensures correct rendering, diff highlighting, navigation, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BeforeAfterComparison } from '@/components/shared/BeforeAfterComparison';
import { ComparisonCard } from '@/components/shared/ComparisonCard';
import { TextDiff, SideBySideDiff } from '@/components/shared/TextDiff';
import type { ComparisonSection } from '@/components/shared/BeforeAfterComparison';

describe('TextDiff Component', () => {
  it('should render with valid texts', () => {
    render(
      <TextDiff
        originalText="Hello world"
        suggestedText="Hello beautiful world"
      />
    );

    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/beautiful/)).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
  });

  it('should show "No changes" message for identical texts', () => {
    render(
      <TextDiff originalText="Same text" suggestedText="Same text" />
    );

    expect(screen.getByText(/No changes suggested/i)).toBeInTheDocument();
  });

  it('should handle empty texts gracefully', () => {
    render(<TextDiff originalText="" suggestedText="" />);

    expect(screen.getByText(/No text to compare/i)).toBeInTheDocument();
  });

  it('should apply insertion styling', () => {
    const { container } = render(
      <TextDiff originalText="Hello" suggestedText="Hello world" />
    );

    // Check for green background (insertion style)
    const insertions = container.querySelectorAll('.bg-green-100');
    expect(insertions.length).toBeGreaterThan(0);
  });

  it('should apply deletion styling', () => {
    const { container } = render(
      <TextDiff originalText="Hello world" suggestedText="Hello" />
    );

    // Check for red background with strikethrough (deletion style)
    const deletions = container.querySelectorAll('.bg-red-100');
    expect(deletions.length).toBeGreaterThan(0);

    const strikethrough = container.querySelectorAll('.line-through');
    expect(strikethrough.length).toBeGreaterThan(0);
  });

  it('should have ARIA labels for accessibility', () => {
    const { container } = render(
      <TextDiff originalText="Hello" suggestedText="Hello world" />
    );

    // Uses semantic <ins> element for insertions
    const insElement = container.querySelector('ins');
    expect(insElement).toBeInTheDocument();
    expect(insElement).toHaveAttribute('aria-label', 'Added text');
  });
});

describe('SideBySideDiff Component', () => {
  it('should render both original and suggested sections', () => {
    render(
      <SideBySideDiff
        originalText="My unique original text"
        suggestedText="My unique suggested text"
      />
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Suggested')).toBeInTheDocument();
    expect(screen.getByText('My unique original text')).toBeInTheDocument();
  });

  it('should display labels with "Before" and "After" badges', () => {
    render(
      <SideBySideDiff
        originalText="Original text"
        suggestedText="Suggested text"
      />
    );

    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('should show unique original text', () => {
    render(
      <SideBySideDiff
        originalText="Unique text left side"
        suggestedText="Different text right side"
      />
    );

    expect(screen.getByText('Unique text left side')).toBeInTheDocument();
  });
});

describe('ComparisonCard Component', () => {
  it('should render section title', () => {
    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Original summary"
        suggestedText="Suggested summary"
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('should display change statistics', () => {
    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Led the team"
        suggestedText="Led a team of 5"
      />
    );

    // Should show word changes
    expect(screen.getByText(/added/i)).toBeInTheDocument();
  });

  it('should show "No changes" when texts are identical', () => {
    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Same text"
        suggestedText="Same text"
      />
    );

    const noChangesElements = screen.getAllByText(/No changes/i);
    expect(noChangesElements.length).toBeGreaterThan(0);
  });

  it('should render navigation controls when multiple suggestions', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Original"
        suggestedText="Suggested"
        index={1}
        total={3}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    );

    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous suggestion')).toBeInTheDocument();
    expect(screen.getByLabelText('Next suggestion')).toBeInTheDocument();
  });

  it('should call onPrevious when previous button clicked', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Original"
        suggestedText="Suggested"
        index={2}
        total={3}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    );

    const prevButton = screen.getByLabelText('Previous suggestion');
    fireEvent.click(prevButton);

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('should call onNext when next button clicked', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Original"
        suggestedText="Suggested"
        index={1}
        total={3}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    );

    const nextButton = screen.getByLabelText('Next suggestion');
    fireEvent.click(nextButton);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('should disable previous button at first suggestion', () => {
    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Original"
        suggestedText="Suggested"
        index={1}
        total={3}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />
    );

    const prevButton = screen.getByLabelText('Previous suggestion');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button at last suggestion', () => {
    render(
      <ComparisonCard
        sectionTitle="Summary"
        originalText="Original"
        suggestedText="Suggested"
        index={3}
        total={3}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />
    );

    const nextButton = screen.getByLabelText('Next suggestion');
    expect(nextButton).toBeDisabled();
  });
});

describe('BeforeAfterComparison Container', () => {
  beforeEach(() => {
    // Clear localStorage to avoid state leaking between tests
    localStorage.removeItem('submitSmart:comparisonCollapsed');
  });

  const mockSections: ComparisonSection[] = [
    {
      title: 'Summary',
      original: 'Original summary text',
      suggestions: [{ text: 'Suggested summary text' }],
    },
    {
      title: 'Skills',
      original: 'JavaScript, Python',
      suggestions: [{ text: 'JavaScript, TypeScript, Python, React' }],
    },
  ];

  it('should render with multiple sections', () => {
    render(<BeforeAfterComparison sections={mockSections} />);

    expect(screen.getByText('Before & After Comparison')).toBeInTheDocument();
  });

  it('should collapse when collapse button clicked', () => {
    render(<BeforeAfterComparison sections={mockSections} />);

    const collapseButton = screen.getByText('Hide Comparison');
    fireEvent.click(collapseButton);

    expect(screen.getByText('Show Comparison')).toBeInTheDocument();
  });

  it('should expand when expand button clicked', () => {
    render(
      <BeforeAfterComparison sections={mockSections} initialCollapsed={true} />
    );

    const expandButton = screen.getByText('Show Comparison');
    fireEvent.click(expandButton);

    expect(screen.getByText('Hide Comparison')).toBeInTheDocument();
  });

  it('should show section count when collapsed', () => {
    render(
      <BeforeAfterComparison sections={mockSections} initialCollapsed={true} />
    );

    expect(screen.getByText('2 sections with changes')).toBeInTheDocument();
  });

  it('should render tabs for multiple sections', () => {
    render(<BeforeAfterComparison sections={mockSections} />);

    expect(screen.getByRole('tab', { name: /Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Skills/i })).toBeInTheDocument();
  });

  it('should render single section without tabs', () => {
    const singleSection: ComparisonSection[] = [
      {
        title: 'Summary',
        original: 'The only original section text',
        suggestions: [{ text: 'The only suggested section text' }],
      },
    ];

    render(<BeforeAfterComparison sections={singleSection} />);

    // Should render directly without tabs
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('should handle sections with no suggestions', () => {
    const emptySections: ComparisonSection[] = [];

    const { container } = render(
      <BeforeAfterComparison sections={emptySections} />
    );

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it('should navigate between suggestions in a section', () => {
    const sectionsWithMultiple: ComparisonSection[] = [
      {
        title: 'Summary',
        original: 'Multiple suggestions original text',
        suggestions: [
          { text: 'First suggestion' },
          { text: 'Second suggestion' },
          { text: 'Third suggestion' },
        ],
      },
    ];

    render(<BeforeAfterComparison sections={sectionsWithMultiple} />);

    // Should show first suggestion by default
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText(/First suggestion/)).toBeInTheDocument();

    // Click next
    const nextButton = screen.getByLabelText('Next suggestion');
    fireEvent.click(nextButton);

    // Should now show second suggestion
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it('should have accessible collapse/expand controls', () => {
    render(<BeforeAfterComparison sections={mockSections} />);

    const button = screen.getByRole('button', { name: /Collapse comparison/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

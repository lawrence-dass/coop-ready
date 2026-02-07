import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StructuralSuggestionsBanner } from '@/components/shared/StructuralSuggestionsBanner';
import type { StructuralSuggestion } from '@/types/suggestions';

function createSuggestion(overrides?: Partial<StructuralSuggestion>): StructuralSuggestion {
  return {
    id: 'rule-test-default',
    priority: 'high',
    category: 'section_order',
    message: 'Move Education before Experience',
    currentState: 'Experience appears before Education',
    recommendedAction: 'Reorder sections: Education → Projects → Experience',
    ...overrides,
  };
}

describe('StructuralSuggestionsBanner', () => {
  it('[P1] renders nothing when suggestions array is empty', () => {
    const { container } = render(<StructuralSuggestionsBanner suggestions={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('[P1] renders nothing when suggestions is null-like', () => {
    const { container } = render(
      <StructuralSuggestionsBanner suggestions={undefined as unknown as StructuralSuggestion[]} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('[P0] renders banner with title and suggestions', () => {
    const suggestions = [createSuggestion()];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    expect(screen.getByText('Resume Structure Recommendations')).toBeDefined();
    expect(screen.getByText('Move Education before Experience')).toBeDefined();
    expect(screen.getByText(/Reorder sections/)).toBeDefined();
  });

  it('[P0] displays priority badges with correct text', () => {
    const suggestions = [
      createSuggestion({ id: 'r1', priority: 'critical', message: 'Critical issue' }),
      createSuggestion({ id: 'r2', priority: 'high', message: 'High issue' }),
      createSuggestion({ id: 'r3', priority: 'moderate', message: 'Moderate issue' }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    expect(screen.getByText('CRITICAL')).toBeDefined();
    expect(screen.getByText('HIGH')).toBeDefined();
    expect(screen.getByText('MODERATE')).toBeDefined();
  });

  it('[P0] sorts by priority: critical first, moderate last', () => {
    const suggestions = [
      createSuggestion({ id: 'r1', priority: 'moderate', message: 'Moderate first in input' }),
      createSuggestion({ id: 'r2', priority: 'critical', message: 'Critical second in input' }),
      createSuggestion({ id: 'r3', priority: 'high', message: 'High third in input' }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    const badges = screen.getAllByText(/CRITICAL|HIGH|MODERATE/);
    expect(badges[0].textContent).toBe('CRITICAL');
    expect(badges[1].textContent).toBe('HIGH');
    expect(badges[2].textContent).toBe('MODERATE');
  });

  it('[P0] displays category labels', () => {
    const suggestions = [
      createSuggestion({ category: 'section_order' }),
      createSuggestion({ id: 'r2', category: 'section_heading', message: 'Heading issue' }),
      createSuggestion({ id: 'r3', category: 'section_presence', message: 'Presence issue' }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    expect(screen.getByText('Section Order')).toBeDefined();
    expect(screen.getByText('Section Heading')).toBeDefined();
    expect(screen.getByText('Section Presence')).toBeDefined();
  });

  it('[P0] shows all items when 3 or fewer', () => {
    const suggestions = [
      createSuggestion({ id: 'r1', message: 'First' }),
      createSuggestion({ id: 'r2', message: 'Second' }),
      createSuggestion({ id: 'r3', message: 'Third' }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
    expect(screen.getByText('Third')).toBeDefined();
    // No expand button when exactly 3
    expect(screen.queryByText(/Show.*More/)).toBeNull();
  });

  it('[P0] collapses to 3 items when more than 3, shows expand button', () => {
    const suggestions = [
      createSuggestion({ id: 'r1', priority: 'critical', message: 'First' }),
      createSuggestion({ id: 'r2', priority: 'high', message: 'Second' }),
      createSuggestion({ id: 'r3', priority: 'high', message: 'Third' }),
      createSuggestion({ id: 'r4', priority: 'moderate', message: 'Fourth' }),
      createSuggestion({ id: 'r5', priority: 'moderate', message: 'Fifth' }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    // First 3 visible
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
    expect(screen.getByText('Third')).toBeDefined();

    // 4th and 5th hidden initially
    expect(screen.queryByText('Fourth')).toBeNull();
    expect(screen.queryByText('Fifth')).toBeNull();

    // Expand button shows count
    expect(screen.getByText('Show 2 More')).toBeDefined();
  });

  it('[P0] expands and collapses when button is clicked', () => {
    const suggestions = [
      createSuggestion({ id: 'r1', priority: 'critical', message: 'First' }),
      createSuggestion({ id: 'r2', priority: 'high', message: 'Second' }),
      createSuggestion({ id: 'r3', priority: 'high', message: 'Third' }),
      createSuggestion({ id: 'r4', priority: 'moderate', message: 'Fourth' }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    // Initially collapsed
    expect(screen.queryByText('Fourth')).toBeNull();

    // Expand
    fireEvent.click(screen.getByText('Show 1 More'));
    expect(screen.getByText('Fourth')).toBeDefined();
    expect(screen.getByText('Show Less')).toBeDefined();

    // Collapse
    fireEvent.click(screen.getByText('Show Less'));
    expect(screen.queryByText('Fourth')).toBeNull();
  });

  it('[P1] renders currentState and recommendedAction', () => {
    const suggestions = [
      createSuggestion({
        currentState: 'Experience is before Education',
        recommendedAction: 'Move Education section above Experience',
      }),
    ];
    render(<StructuralSuggestionsBanner suggestions={suggestions} />);

    expect(screen.getByText(/Experience is before Education/)).toBeDefined();
    expect(screen.getByText(/Move Education section above Experience/)).toBeDefined();
  });
});

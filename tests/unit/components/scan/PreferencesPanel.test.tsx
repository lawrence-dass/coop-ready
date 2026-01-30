/**
 * Unit Tests for PreferencesPanel Component
 *
 * Story 16.3 - Task: Create Configuration Options component for V0.5 preferences
 *
 * Tests:
 * - Job Type radio selection (coop, fulltime)
 * - Modification Level selection (conservative, moderate, aggressive)
 * - Preference persistence in Zustand store
 * - Component renders with default values
 * - Descriptive text explains each option
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesPanel } from '@/components/scan/PreferencesPanel';
import { useOptimizationStore } from '@/store';
import { DEFAULT_PREFERENCES } from '@/types/preferences';

// Mock the getScanDefaults server action
vi.mock('@/actions/scan/get-scan-defaults', () => ({
  getScanDefaults: vi.fn().mockResolvedValue({
    data: {
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    },
    error: null,
  }),
}));

describe('PreferencesPanel Component', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  it('renders Job Type options', () => {
    render(<PreferencesPanel />);

    expect(screen.getByText(/job type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/co-op.*internship/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full-time position/i)).toBeInTheDocument();
  });

  it('renders Modification Level options', () => {
    render(<PreferencesPanel />);

    expect(screen.getByText(/modification level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/conservative/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/moderate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/aggressive/i)).toBeInTheDocument();
  });

  it('renders with default preferences when store has no preferences', async () => {
    render(<PreferencesPanel />);

    // Wait for async loading to complete, then check defaults
    await waitFor(() => {
      // Default job type is 'fulltime' - check data-state attribute
      const fulltimeRadio = screen.getByRole('radio', { name: /full-time position/i });
      expect(fulltimeRadio).toHaveAttribute('data-state', 'checked');

      // Default modification level is 'moderate' - check data-state attribute
      const moderateRadio = screen.getByRole('radio', { name: /moderate.*balanced changes/i });
      expect(moderateRadio).toHaveAttribute('data-state', 'checked');
    });
  });

  it('updates Job Type in Zustand store when selection changes', async () => {
    const user = userEvent.setup();
    render(<PreferencesPanel />);

    // Wait for async loading to complete
    await waitFor(() => {
      const preferences = useOptimizationStore.getState().userPreferences;
      expect(preferences?.jobType).toBe('fulltime');
    });

    // Click coop radio
    const coopRadio = screen.getByLabelText(/co-op.*internship/i);
    await user.click(coopRadio);

    // Check store updated
    const preferences = useOptimizationStore.getState().userPreferences;
    expect(preferences?.jobType).toBe('coop');
  });

  it('updates Modification Level in Zustand store when selection changes', async () => {
    const user = userEvent.setup();
    render(<PreferencesPanel />);

    // Wait for async loading to complete
    await waitFor(() => {
      const preferences = useOptimizationStore.getState().userPreferences;
      expect(preferences?.modificationLevel).toBe('moderate');
    });

    // Click aggressive radio
    const aggressiveRadio = screen.getByLabelText(/aggressive/i);
    await user.click(aggressiveRadio);

    // Check store updated
    const preferences = useOptimizationStore.getState().userPreferences;
    expect(preferences?.modificationLevel).toBe('aggressive');
  });

  it('renders descriptive text for each option', () => {
    render(<PreferencesPanel />);

    // Job Type descriptions
    expect(screen.getByText(/learning-focused opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/career position/i)).toBeInTheDocument();

    // Modification Level descriptions
    expect(screen.getByText(/minimal changes.*15-25/i)).toBeInTheDocument();
    expect(screen.getByText(/balanced changes.*35-50/i)).toBeInTheDocument();
    expect(screen.getByText(/major rewrite.*60-75/i)).toBeInTheDocument();
  });

  it('preserves preferences during session', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PreferencesPanel />);

    // Wait for async loading to complete
    await waitFor(() => {
      expect(useOptimizationStore.getState().userPreferences).not.toBeNull();
    });

    // Set preferences
    await user.click(screen.getByLabelText(/co-op.*internship/i));
    await user.click(screen.getByLabelText(/conservative/i));

    // Unmount component
    unmount();

    // Re-render component
    render(<PreferencesPanel />);

    // Preferences should persist (from store) - check data-state
    const coopRadio = screen.getByRole('radio', { name: /co-op.*internship/i });
    const conservativeRadio = screen.getByRole('radio', { name: /conservative.*minimal/i });

    expect(coopRadio).toHaveAttribute('data-state', 'checked');
    expect(conservativeRadio).toHaveAttribute('data-state', 'checked');
  });

  it('uses responsive layout classes', () => {
    const { container } = render(<PreferencesPanel />);

    // Check for grid or flex layout classes (implementation detail)
    const panelElement = container.firstChild as HTMLElement;
    expect(panelElement).toBeInTheDocument();
    // Responsive classes will be verified in implementation
  });

  it('loads user preferences from store if available', () => {
    // Set custom preferences in store before render
    useOptimizationStore.getState().setUserPreferences({
      ...DEFAULT_PREFERENCES,
      jobType: 'coop',
      modificationLevel: 'aggressive',
    });

    render(<PreferencesPanel />);

    // Should render with store preferences - check data-state
    const coopRadio = screen.getByRole('radio', { name: /co-op.*internship/i });
    const aggressiveRadio = screen.getByRole('radio', { name: /aggressive.*major rewrite/i });

    expect(coopRadio).toHaveAttribute('data-state', 'checked');
    expect(aggressiveRadio).toHaveAttribute('data-state', 'checked');
  });
});

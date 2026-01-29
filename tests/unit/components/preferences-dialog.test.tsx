/**
 * PreferencesDialog Component Tests
 * Story 11.2: Implement Optimization Preferences
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreferencesDialog } from '@/components/shared/PreferencesDialog';
import { DEFAULT_PREFERENCES } from '@/types';
import * as preferencesActions from '@/actions/preferences';

// Mock the actions
vi.mock('@/actions/preferences', () => ({
  savePreferences: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PreferencesDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSaveSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(
        <PreferencesDialog
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByText('Optimization Preferences')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Optimization Preferences')).toBeInTheDocument();
    });

    it('should render all 5 original preference sections (Job Type and Modification Level added in Story 13.3)', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Tone')).toBeInTheDocument();
      expect(screen.getByText('Verbosity')).toBeInTheDocument();
      expect(screen.getByText('Emphasis')).toBeInTheDocument();
      expect(screen.getByText('Industry Focus')).toBeInTheDocument();
      expect(screen.getByText('Experience Level')).toBeInTheDocument();
    });

    it('should render Reset to Defaults button', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    });

    it('should render Save Preferences button', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should initialize with DEFAULT_PREFERENCES when no initialPreferences provided', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Check that default radio buttons are selected
      const professionalRadio = screen.getByLabelText('Professional');
      const detailedRadio = screen.getByLabelText('Detailed');
      const impactRadio = screen.getByLabelText('Impact');
      const genericRadio = screen.getByLabelText('Generic');
      const midRadio = screen.getByLabelText('Mid-Level');

      expect(professionalRadio).toBeChecked();
      expect(detailedRadio).toBeChecked();
      expect(impactRadio).toBeChecked();
      expect(genericRadio).toBeChecked();
      expect(midRadio).toBeChecked();
    });

    it('should initialize with initialPreferences when provided', () => {
      const customPrefs = {
        ...DEFAULT_PREFERENCES,
        tone: 'technical' as const,
        emphasis: 'keywords' as const,
      };

      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          initialPreferences={customPrefs}
        />
      );

      const technicalRadio = screen.getByLabelText('Technical');
      const keywordsRadio = screen.getByLabelText('Keywords');

      expect(technicalRadio).toBeChecked();
      expect(keywordsRadio).toBeChecked();
    });
  });

  describe('Preference Selection', () => {
    it('should allow changing tone preference', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const technicalRadio = screen.getByLabelText('Technical');
      fireEvent.click(technicalRadio);

      expect(technicalRadio).toBeChecked();
    });

    it('should allow changing verbosity preference', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const conciseRadio = screen.getByLabelText('Concise');
      fireEvent.click(conciseRadio);

      expect(conciseRadio).toBeChecked();
    });

    it('should allow changing emphasis preference', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const skillsRadio = screen.getByLabelText('Skills');
      fireEvent.click(skillsRadio);

      expect(skillsRadio).toBeChecked();
    });

    it('should allow changing industry preference', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const techRadio = screen.getByLabelText('Technology');
      fireEvent.click(techRadio);

      expect(techRadio).toBeChecked();
    });

    it('should allow changing experience level preference', () => {
      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const seniorRadio = screen.getByLabelText('Senior');
      fireEvent.click(seniorRadio);

      expect(seniorRadio).toBeChecked();
    });
  });

  describe('Reset to Defaults', () => {
    it('should reset preferences to defaults when Reset button clicked', async () => {
      const customPrefs = {
        tone: 'technical' as const,
        verbosity: 'concise' as const,
        emphasis: 'keywords' as const,
        industry: 'tech' as const,
        experienceLevel: 'senior' as const,
        jobType: 'coop' as const,
        modificationLevel: 'aggressive' as const,
      };

      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          initialPreferences={customPrefs}
        />
      );

      // Verify custom preferences are selected
      expect(screen.getByLabelText('Technical')).toBeChecked();
      expect(screen.getByLabelText('Concise')).toBeChecked();

      // Click Reset to Defaults
      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      // Verify defaults are now selected
      await waitFor(() => {
        expect(screen.getByLabelText('Professional')).toBeChecked();
        expect(screen.getByLabelText('Detailed')).toBeChecked();
        expect(screen.getByLabelText('Impact')).toBeChecked();
        expect(screen.getByLabelText('Generic')).toBeChecked();
        expect(screen.getByLabelText('Mid-Level')).toBeChecked();
      });
    });
  });

  describe('Save Preferences', () => {
    it('should call savePreferences action when Save button clicked', async () => {
      const mockSave = vi.mocked(preferencesActions.savePreferences);
      mockSave.mockResolvedValue({
        data: DEFAULT_PREFERENCES,
        error: null,
      });

      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      );

      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(DEFAULT_PREFERENCES);
      });
    });

    it('should call onSaveSuccess callback on successful save', async () => {
      const mockSave = vi.mocked(preferencesActions.savePreferences);
      mockSave.mockResolvedValue({
        data: DEFAULT_PREFERENCES,
        error: null,
      });

      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      );

      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalledWith(DEFAULT_PREFERENCES);
      });
    });

    it('should close dialog after successful save', async () => {
      const mockSave = vi.mocked(preferencesActions.savePreferences);
      mockSave.mockResolvedValue({
        data: DEFAULT_PREFERENCES,
        error: null,
      });

      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      );

      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should not close dialog on save error', async () => {
      const mockSave = vi.mocked(preferencesActions.savePreferences);
      mockSave.mockResolvedValue({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User must be authenticated',
        },
      });

      render(
        <PreferencesDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      );

      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Should not close on error
      expect(mockOnOpenChange).not.toHaveBeenCalled();
      expect(mockOnSaveSuccess).not.toHaveBeenCalled();
    });
  });
});

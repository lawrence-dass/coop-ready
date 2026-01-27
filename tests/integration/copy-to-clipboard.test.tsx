/**
 * Integration tests for copy-to-clipboard functionality
 * Story 6.6: Implement Copy to Clipboard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SuggestionCard } from '@/components/shared/SuggestionCard';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the store
vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('Copy to Clipboard Integration', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(() => Promise.resolve()),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original clipboard to prevent mock leakage
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe('SuggestionCard with CopyButton', () => {
    const mockSuggestion = {
      suggestionId: 'sug_experience_0',
      original: 'Managed team projects.',
      suggested: 'Led cross-functional team of 8 engineers to deliver 3 major product releases, increasing customer satisfaction by 25%.',
      points: 15,
      keywords: ['cross-functional', 'product releases'],
      metrics: ['8 engineers', '3 releases', '25% increase'],
      sectionType: 'experience' as const,
    };

    it('should render copy button in SuggestionCard', () => {
      render(<SuggestionCard {...mockSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should copy suggested text (not original) when copy button clicked', async () => {
      render(<SuggestionCard {...mockSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Should copy ONLY the suggested text
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSuggestion.suggested);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(mockSuggestion.original);
    });

    it('should show success toast when copying from suggestion card', async () => {
      render(<SuggestionCard {...mockSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });

    it('should copy suggestion without keywords or metrics in the text', async () => {
      render(<SuggestionCard {...mockSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Verify the copied text is pure suggested text
      const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Should not contain keyword badge text
      expect(copiedText).not.toContain('Keywords:');
      expect(copiedText).not.toContain('Metrics:');

      // Should be exactly the suggested text
      expect(copiedText).toBe(mockSuggestion.suggested);
    });

    it('should work for summary section suggestions', async () => {
      const summarySuggestion = {
        suggestionId: 'sug_summary_0',
        original: 'Software engineer with experience.',
        suggested: 'Results-driven Senior Software Engineer with 7+ years of experience building scalable web applications.',
        sectionType: 'summary' as const,
      };

      render(<SuggestionCard {...summarySuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(summarySuggestion.suggested);
    });

    it('should work for skills section suggestions', async () => {
      const skillsSuggestion = {
        suggestionId: 'sug_skills_0',
        original: 'JavaScript, React',
        suggested: 'JavaScript (ES6+), React.js, TypeScript, Node.js, PostgreSQL, AWS',
        sectionType: 'skills' as const,
      };

      render(<SuggestionCard {...skillsSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(skillsSuggestion.suggested);
    });

    it('should be visible on both desktop and mobile layouts', () => {
      render(<SuggestionCard {...mockSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });

      // Button should be visible regardless of screen size
      expect(copyButton).toBeVisible();
    });

    it('should show error toast for empty suggestions', async () => {
      const emptySuggestion = {
        suggestionId: 'sug_summary_1',
        original: '',
        suggested: '',
        sectionType: 'summary' as const,
      };

      render(<SuggestionCard {...emptySuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Should not call clipboard API for empty text
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Nothing to copy');
    });

    it('should handle very long suggestions', async () => {
      const longSuggestion = {
        suggestionId: 'sug_experience_1',
        original: 'Did some work.',
        suggested: 'A'.repeat(1000), // 1000 character suggestion
        sectionType: 'experience' as const,
      };

      render(<SuggestionCard {...longSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longSuggestion.suggested);
    });

    it('should handle suggestions with special characters', async () => {
      const specialSuggestion = {
        suggestionId: 'sug_experience_2',
        original: 'Basic text',
        suggested: 'Led R&D initiatives\nAchieved 50% reduction in costs\tDeveloped new APIs',
        sectionType: 'experience' as const,
      };

      render(<SuggestionCard {...specialSuggestion} />);

      const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialSuggestion.suggested);
    });
  });

  describe('Multiple suggestion cards', () => {
    it('should handle copying from multiple cards independently', async () => {
      const suggestion1 = {
        suggestionId: 'sug_summary_2',
        original: 'Original 1',
        suggested: 'Suggested text 1',
        sectionType: 'summary' as const,
      };

      const suggestion2 = {
        suggestionId: 'sug_skills_1',
        original: 'Original 2',
        suggested: 'Suggested text 2',
        sectionType: 'skills' as const,
      };

      render(
        <div>
          <SuggestionCard {...suggestion1} />
          <SuggestionCard {...suggestion2} />
        </div>
      );

      const copyButtons = screen.getAllByRole('button', { name: /copy suggestion/i });
      expect(copyButtons).toHaveLength(2);

      // Click first button
      await act(async () => {
        fireEvent.click(copyButtons[0]);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Suggested text 1');

      // Click second button
      await act(async () => {
        fireEvent.click(copyButtons[1]);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Suggested text 2');

      // Should have been called twice
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });
});

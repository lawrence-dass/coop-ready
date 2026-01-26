/**
 * Unit tests for FeedbackButtons component
 *
 * Story 7.4: Implement Suggestion Feedback
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FeedbackButtons } from '@/components/shared/FeedbackButtons';

describe('FeedbackButtons', () => {
  it('renders thumbs up and thumbs down buttons', () => {
    const onFeedback = vi.fn();
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        onFeedback={onFeedback}
      />
    );

    expect(screen.getByLabelText('Mark as helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark as not helpful')).toBeInTheDocument();
  });

  it('calls onFeedback(true) when thumbs up clicked', async () => {
    const onFeedback = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        onFeedback={onFeedback}
      />
    );

    const thumbsUp = screen.getByLabelText('Mark as helpful');
    await act(async () => {
      fireEvent.click(thumbsUp);
    });

    expect(onFeedback).toHaveBeenCalledWith(true);
  });

  it('calls onFeedback(false) when thumbs down clicked', async () => {
    const onFeedback = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        onFeedback={onFeedback}
      />
    );

    const thumbsDown = screen.getByLabelText('Mark as not helpful');
    await act(async () => {
      fireEvent.click(thumbsDown);
    });

    expect(onFeedback).toHaveBeenCalledWith(false);
  });

  it('highlights selected button with primary color', () => {
    const onFeedback = vi.fn();
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        currentFeedback={true}
        onFeedback={onFeedback}
      />
    );

    const thumbsUp = screen.getByLabelText('Mark as helpful');
    expect(thumbsUp).toHaveClass('text-indigo-600');
  });

  it('shows unselected state when currentFeedback is null', () => {
    const onFeedback = vi.fn();
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        currentFeedback={null}
        onFeedback={onFeedback}
      />
    );

    const thumbsUp = screen.getByLabelText('Mark as helpful');
    const thumbsDown = screen.getByLabelText('Mark as not helpful');

    expect(thumbsUp).toHaveClass('text-gray-400');
    expect(thumbsDown).toHaveClass('text-gray-400');
  });

  it('has correct ARIA labels', () => {
    const onFeedback = vi.fn();
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        onFeedback={onFeedback}
      />
    );

    expect(screen.getByLabelText('Mark as helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark as not helpful')).toBeInTheDocument();
  });

  it('supports keyboard navigation (Tab, Enter)', async () => {
    const onFeedback = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        onFeedback={onFeedback}
      />
    );

    const thumbsUp = screen.getByLabelText('Mark as helpful');

    // Tab to focus (browser behavior, we just check it's focusable)
    expect(thumbsUp).toHaveAttribute('tabIndex', '0');

    // Enter to select
    await act(async () => {
      fireEvent.keyDown(thumbsUp, { key: 'Enter', code: 'Enter' });
    });
    expect(onFeedback).toHaveBeenCalledWith(true);
  });

  it('disables buttons when disabled prop is true', () => {
    const onFeedback = vi.fn();
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        onFeedback={onFeedback}
        disabled={true}
      />
    );

    const thumbsUp = screen.getByLabelText('Mark as helpful');
    const thumbsDown = screen.getByLabelText('Mark as not helpful');

    expect(thumbsUp).toHaveAttribute('disabled');
    expect(thumbsDown).toHaveAttribute('disabled');
  });

  it('toggles feedback when same button clicked twice', async () => {
    const onFeedback = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        currentFeedback={null}
        onFeedback={onFeedback}
      />
    );

    const thumbsUp = screen.getByLabelText('Mark as helpful');

    // First click - select
    fireEvent.click(thumbsUp);
    await waitFor(() => {
      expect(onFeedback).toHaveBeenNthCalledWith(1, true);
    });

    // Re-render with feedback = true (simulating state update from parent)
    rerender(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        currentFeedback={true}
        onFeedback={onFeedback}
      />
    );

    // Second click - toggle off
    fireEvent.click(thumbsUp);
    await waitFor(() => {
      expect(onFeedback).toHaveBeenNthCalledWith(2, null);
    });
  });

  it('changes selection when different button clicked', async () => {
    const onFeedback = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackButtons
        suggestionId="sug_summary_0"
        sectionType="summary"
        currentFeedback={true}
        onFeedback={onFeedback}
      />
    );

    const thumbsDown = screen.getByLabelText('Mark as not helpful');

    // Click opposite button
    await act(async () => {
      fireEvent.click(thumbsDown);
    });
    expect(onFeedback).toHaveBeenCalledWith(false);
  });
});

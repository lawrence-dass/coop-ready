/**
 * Unit Tests: Clear Button in JobDescriptionInput
 *
 * Tests for Story 4.3 - Clear button functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';

describe('JobDescriptionInput - Clear Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CLEAR BUTTON VISIBILITY
  // ============================================================================

  it('should hide clear button when JD is empty', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.queryByRole('button', { name: /clear job description/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should show clear button when JD has content', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="Software Engineer position"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should hide clear button for whitespace-only content', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="   "
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Clear button should hide (isEmpty checks trim())
    const clearButton = screen.queryByRole('button', { name: /clear job description/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  // ============================================================================
  // CLEAR BUTTON INTERACTION
  // ============================================================================

  it('should call onClear callback when clear button clicked', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="Test job description"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
    expect(mockOnChange).not.toHaveBeenCalled(); // onClear, not onChange
  });

  it('should not call onChange when clear button is clicked', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="Content to clear"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  // ============================================================================
  // DISABLED STATE
  // ============================================================================

  it('should disable clear button when component is disabled', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="Job description content"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isDisabled={true}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    expect(clearButton).toBeDisabled();
  });

  it('should not fire onClear when disabled button is clicked', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="Content"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isDisabled={true}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    // Disabled button doesn't fire events
    expect(mockOnClear).not.toHaveBeenCalled();
  });

  // ============================================================================
  // RAPID CLICKS
  // ============================================================================

  it('should handle rapid clear button clicks', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <JobDescriptionInput
        value="Test content"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });

    // Rapid clicks
    fireEvent.click(clearButton);
    fireEvent.click(clearButton);
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(3);
  });

  // ============================================================================
  // OPTIONAL ONCLEAR CALLBACK
  // ============================================================================

  it('should render without onClear callback', () => {
    const mockOnChange = vi.fn();

    render(
      <JobDescriptionInput
        value="Content"
        onChange={mockOnChange}
        // onClear is optional
      />
    );

    // Component should render without error
    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    expect(textarea).toBeInTheDocument();
  });

  // ============================================================================
  // CHARACTER COUNT AFTER CLEAR
  // ============================================================================

  it('should update character count when value changes to empty', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    const { rerender } = render(
      <JobDescriptionInput
        value="Initial content"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText(/15 characters/i)).toBeInTheDocument();

    // Simulate clear by changing value to empty
    rerender(
      <JobDescriptionInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText(/0 characters/i)).toBeInTheDocument();
  });

  // ============================================================================
  // VALIDATION STATE AFTER CLEAR
  // ============================================================================

  it('should show "required" state after clearing valid JD', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    const { rerender } = render(
      <JobDescriptionInput
        value={'a'.repeat(50)} // Valid (50 chars)
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Valid state
    expect(screen.getByText('50 characters')).toBeInTheDocument();
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();

    // Simulate clear
    rerender(
      <JobDescriptionInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Required state
    expect(screen.getByText(/0 characters \(required\)/i)).toBeInTheDocument();
  });
});

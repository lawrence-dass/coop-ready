/**
 * Unit Tests: JobDescriptionInput Component
 *
 * Tests for Story 4.1 - Job Description Input Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';

describe('JobDescriptionInput Component', () => {
  it('should render with placeholder text', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    expect(textarea).toBeInTheDocument();
  });

  it('should display character count', () => {
    const mockOnChange = vi.fn();
    const testValue = 'This is a test job description';
    render(<JobDescriptionInput value={testValue} onChange={mockOnChange} />);

    expect(screen.getByText(`${testValue.length} characters (minimum 50 required)`)).toBeInTheDocument();
  });

  it('should call onChange when user types', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    fireEvent.change(textarea, { target: { value: 'New text' } });

    expect(mockOnChange).toHaveBeenCalledWith('New text');
  });

  it('should show validation error for text under 50 characters', () => {
    const mockOnChange = vi.fn();
    const shortText = 'Too short';
    render(<JobDescriptionInput value={shortText} onChange={mockOnChange} />);

    expect(screen.getByText(/minimum 50 required/i)).toBeInTheDocument();
  });

  it('should show valid state for text 50+ characters', () => {
    const mockOnChange = vi.fn();
    const validText = 'a'.repeat(50); // Exactly 50 characters
    render(<JobDescriptionInput value={validText} onChange={mockOnChange} />);

    // Should show character count without error message
    expect(screen.getByText(`50 characters`)).toBeInTheDocument();
    expect(screen.queryByText(/minimum 50 required/i)).not.toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();
    render(
      <JobDescriptionInput
        value="Some text"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should not show clear button when value is empty', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();
    render(
      <JobDescriptionInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.queryByRole('button', { name: /clear job description/i })).not.toBeInTheDocument();
  });

  it('should not show clear button when value is only whitespace', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();
    render(
      <JobDescriptionInput
        value="   "
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Whitespace-only values are treated as empty (trimmed)
    expect(screen.queryByRole('button', { name: /clear job description/i })).not.toBeInTheDocument();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('should respect disabled state', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="" onChange={mockOnChange} isDisabled={true} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    expect(textarea).toBeDisabled();
  });

  it('should disable clear button when isDisabled is true', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();
    render(
      <JobDescriptionInput
        value="Some text"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isDisabled={true}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear job description/i });
    expect(clearButton).toBeDisabled();
  });

  it('should show required message when value is empty', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="" onChange={mockOnChange} />);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});

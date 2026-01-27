/**
 * Unit Tests: Job Description Edit Behavior
 *
 * Tests for Story 4.2 - Verify editing functionality works correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobDescriptionInput } from '@/components/shared/JobDescriptionInput';

describe('JobDescriptionInput - Edit Behavior', () => {
  it('should allow text editing via onChange callback', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="Initial text" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Edit the text
    fireEvent.change(textarea, { target: { value: 'Edited text' } });

    expect(mockOnChange).toHaveBeenCalledWith('Edited text');
  });

  it('should support cursor positioning and text selection', () => {
    const mockOnChange = vi.fn();
    const { container } = render(
      <JobDescriptionInput value="Test content" onChange={mockOnChange} />
    );

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    // Test cursor positioning
    textarea.setSelectionRange(5, 5); // Position cursor after "Test "
    expect(textarea.selectionStart).toBe(5);
    expect(textarea.selectionEnd).toBe(5);

    // Test text selection
    textarea.setSelectionRange(0, 4); // Select "Test"
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(4);
  });

  it('should handle character deletion correctly', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="Delete me" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Simulate backspace deletion
    fireEvent.change(textarea, { target: { value: 'Delete m' } });

    expect(mockOnChange).toHaveBeenCalledWith('Delete m');
  });

  it('should handle rapid successive edits', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Simulate rapid typing
    fireEvent.change(textarea, { target: { value: 'a' } });
    fireEvent.change(textarea, { target: { value: 'ab' } });
    fireEvent.change(textarea, { target: { value: 'abc' } });
    fireEvent.change(textarea, { target: { value: 'abcd' } });

    expect(mockOnChange).toHaveBeenCalledTimes(4);
    expect(mockOnChange).toHaveBeenLastCalledWith('abcd');
  });

  it('should update validation status during editing', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <JobDescriptionInput value="Short" onChange={mockOnChange} />
    );

    // Initial state - invalid (too short)
    expect(screen.getByText(/minimum 50 required/i)).toBeInTheDocument();

    // Edit to valid length
    const validText = 'a'.repeat(50);
    rerender(<JobDescriptionInput value={validText} onChange={mockOnChange} />);

    // Should now be valid
    expect(screen.queryByText(/minimum 50 required/i)).not.toBeInTheDocument();
    expect(screen.getByText('50 characters')).toBeInTheDocument();
  });

  it('should update character count during editing', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <JobDescriptionInput value="Test" onChange={mockOnChange} />
    );

    expect(screen.getByText('4 characters (minimum 50 required)')).toBeInTheDocument();

    // Edit text
    rerender(<JobDescriptionInput value="Test edit" onChange={mockOnChange} />);

    expect(screen.getByText('9 characters (minimum 50 required)')).toBeInTheDocument();
  });

  it('should handle paste events', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Simulate paste
    const pastedText = 'Pasted job description content';
    fireEvent.change(textarea, { target: { value: pastedText } });

    expect(mockOnChange).toHaveBeenCalledWith(pastedText);
  });

  it('should allow editing after paste', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <JobDescriptionInput value="Pasted text" onChange={mockOnChange} />
    );

    expect(screen.getByDisplayValue('Pasted text')).toBeInTheDocument();

    // Edit after paste
    rerender(
      <JobDescriptionInput value="Pasted text edited" onChange={mockOnChange} />
    );

    expect(screen.getByDisplayValue('Pasted text edited')).toBeInTheDocument();
  });

  it('should not lose focus during edits', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <JobDescriptionInput value="Test" onChange={mockOnChange} />
    );

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Focus textarea
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    // Edit while focused
    rerender(<JobDescriptionInput value="Test edit" onChange={mockOnChange} />);

    // Should still be focused (controlled component maintains focus)
    expect(document.activeElement).toBe(textarea);
  });

  it('should handle empty string edits (clear all text)', () => {
    const mockOnChange = vi.fn();
    render(<JobDescriptionInput value="Clear this" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    // Clear all text
    fireEvent.change(textarea, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should handle multi-line text editing', () => {
    const mockOnChange = vi.fn();
    const multiLineText = 'Line 1\nLine 2\nLine 3';

    render(<JobDescriptionInput value="" onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Paste the job description here...');

    fireEvent.change(textarea, { target: { value: multiLineText } });

    expect(mockOnChange).toHaveBeenCalledWith(multiLineText);
  });
});
